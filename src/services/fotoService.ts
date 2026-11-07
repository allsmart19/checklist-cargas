import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import type { Foto, EtapaFoto, TipoFoto } from '@/types'

// Configurações de compressão
const compressionOptions = {
  maxSizeMB: 1, // Máximo 1MB
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg',
}

// ============================================
// UPLOAD DE FOTO
// ============================================
export async function uploadFoto(
  arquivo: File,
  cargaId: string,
  etapa: EtapaFoto,
  usuarioId: string,
  tipo: TipoFoto = 'geral_carga',
  avariaId?: string | null
) {
  try {
    if (!arquivo.type.startsWith('image/')) {
      throw new Error('Arquivo não é uma imagem válida.')
    }

    const arquivoComprimido = await imageCompression(arquivo, compressionOptions)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const nomeArquivo = `${timestamp}-${random}.jpg`
    const caminho = `${cargaId}/${etapa}/${nomeArquivo}`

    console.log('📤 Iniciando upload:', { caminho, tamanho: arquivoComprimido.size })

    const { error: erroUpload } = await supabase.storage
      .from('cargas-fotos')
      .upload(caminho, arquivoComprimido, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      })

    if (erroUpload) {
      console.error('❌ Erro no upload:', erroUpload)
      throw new Error(`Falha no upload: ${erroUpload.message}`)
    }

    console.log('✅ Upload concluído, gerando URL...')

    const { data: dataUrl, error: erroUrl } = await supabase.storage
      .from('cargas-fotos')
      .createSignedUrl(caminho, 3600 * 24 * 365)

    if (erroUrl) {
      console.error(' Erro ao gerar URL:', erroUrl)
      throw new Error(`Falha ao gerar URL: ${erroUrl.message}`)
    }

    console.log('🔗 URL gerada:', dataUrl.signedUrl)

    const { data: foto, error: erroBanco } = await supabase
      .from('fotos')
      .insert({
        carga_id: cargaId,
        avaria_id: avariaId || null,
        etapa: etapa,
        tipo: tipo,
        nome_arquivo: nomeArquivo,
        caminho_storage: caminho,
        url: dataUrl.signedUrl,
        usuario_id: usuarioId
      })
      .select()
      .single()

    if (erroBanco) {
      console.error('❌ Erro ao salvar no banco:', erroBanco)
      throw new Error(`Falha ao salvar: ${erroBanco.message}`)
    }

    console.log('💾 Foto registrada no banco:', foto.id)
    return { foto: foto as Foto, error: null }
  } catch (error: any) {
    console.error('💥 Erro completo:', error)
    return { 
      foto: null, 
      error: error.message || 'Erro desconhecido ao enviar foto.' 
    }
  }
}

// ============================================
// BUSCAR FOTOS POR ETAPA
// ============================================
export async function buscarFotosPorEtapa(cargaId: string, etapa: EtapaFoto) {
  const { data, error } = await supabase
    .from('fotos')
    .select('*')
    .eq('carga_id', cargaId)
    .eq('etapa', etapa)
    .order('criado_em', { ascending: true })

  return { data: data as Foto[] | null, error }
}

// ============================================
// BUSCAR FOTOS DE UMA CARGA (TODAS AS ETAPAS)
// ============================================
export async function buscarFotosDaCarga(cargaId: string) {
  const { data, error } = await supabase
    .from('fotos')
    .select('*')
    .eq('carga_id', cargaId)
    .order('criado_em', { ascending: true })

  return { data: data as Foto[] | null, error }
}

// ============================================
// BUSCAR FOTOS VINCULADAS A UMA AVARIA
// ============================================
export async function buscarFotosDaAvaria(avariaId: string) {
  const { data, error } = await supabase
    .from('fotos')
    .select('*')
    .eq('avaria_id', avariaId)
    .order('criado_em', { ascending: true })

  return { data: data as Foto[] | null, error }
}

// ============================================
// EXCLUIR FOTO
// ============================================
export async function excluirFoto(foto: Foto) {
  try {
    const { error: erroStorage } = await supabase.storage
      .from('cargas-fotos')
      .remove([foto.caminho_storage])

    if (erroStorage) {
      console.warn('⚠️ Erro ao remover do storage:', erroStorage)
    }

    const { error: erroBanco } = await supabase
      .from('fotos')
      .delete()
      .eq('id', foto.id)

    if (erroBanco) throw erroBanco

    return { error: null }
  } catch (error: any) {
    console.error('❌ Erro ao excluir foto:', error)
    return { error: error.message }
  }
}