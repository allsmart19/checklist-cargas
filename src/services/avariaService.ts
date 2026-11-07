import { supabase } from '@/lib/supabase'
import type { Avaria, TipoAvaria } from '@/types'
import { uploadFoto } from './fotoService'

export async function registrarAvaria(
  cargaId: string,
  tipo: TipoAvaria,
  descricao: string,
  observacao: string | null,
  usuarioId: string,
  fotos: File[]
) {
  try {
    // 1. Criar o registro da avaria
    const { data: avaria, error: erroAvaria } = await supabase
      .from('avarias')
      .insert({
        carga_id: cargaId,
        tipo,
        descricao,
        observacao,
        responsavel_id: usuarioId,
        status: 'registrada'
      })
      .select()
      .single()

    if (erroAvaria || !avaria) {
      throw new Error(erroAvaria?.message || 'Erro ao registrar avaria')
    }

    // 2. Alterar status da carga para 'com_avaria' (e registrar no histórico)
    await supabase.rpc('alterar_status_carga', {
      p_carga_id: cargaId,
      p_novo_status: 'com_avaria',
      p_usuario_id: usuarioId,
      p_descricao: `Avaria registrada: ${tipo.replace('_', ' ')}`
    })

    // 3. Fazer upload das fotos vinculadas a esta avaria
    if (fotos.length > 0) {
      for (const foto of fotos) {
        await uploadFoto(foto, cargaId, 'avarias', usuarioId, 'avaria', avaria.id)
      }
    }

    return { avaria, error: null }
  } catch (error: any) {
    console.error('Erro ao registrar avaria:', error)
    return { avaria: null, error: error.message }
  }
}

export async function buscarAvariasDaCarga(cargaId: string) {
  const { data, error } = await supabase
    .from('avarias')
    .select('*')
    .eq('carga_id', cargaId)
    .order('data_hora', { ascending: false })

  return { data: data as Avaria[] | null, error }
}