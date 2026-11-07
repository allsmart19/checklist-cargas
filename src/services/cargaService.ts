import { supabase } from '@/lib/supabase'
import type { CargaResumo, StatusCarga } from '@/types'

// Busca opções para os selects do formulário
export async function buscarCadastrosAuxiliares() {
  const [clientes, transportadoras, motoristas, veiculos] = await Promise.all([
    supabase.from('clientes').select('id, nome').eq('ativo', true).order('nome'),
    supabase.from('transportadoras').select('id, nome').eq('ativo', true).order('nome'),
    supabase.from('motoristas').select('id, nome').eq('ativo', true).order('nome'),
    supabase.from('veiculos').select('id, placa, modelo').eq('ativo', true).order('placa')
  ])

  return {
    clientes: clientes.data || [],
    transportadoras: transportadoras.data || [],
    motoristas: motoristas.data || [],
    veiculos: veiculos.data || []
  }
}

// Verifica se o número de carga já existe
export async function verificarNumeroCargaExistente(numeroCarga: string) {
  const { data, error } = await supabase
    .from('cargas')
    .select('id')
    .eq('numero_carga', numeroCarga)
    .single()

  return { existe: !!data, error }
}

// Cria uma nova carga + histórico + checklist padrão
export async function criarCarga(dados: any, usuarioId: string) {
  // 1. Verifica duplicidade antes de inserir
  const { existe, error: erroVerificacao } = await verificarNumeroCargaExistente(dados.numero_carga)
  if (erroVerificacao && erroVerificacao.code !== 'PGRST116') {
    // PGRST116 = não encontrado (o que queremos)
    return { error: { message: 'Erro ao verificar número da carga.' }, carga: null }
  }

  if (existe) {
    return { error: { message: `O número "${dados.numero_carga}" já está cadastrado. Use um número diferente.` }, carga: null }
  }

  // 2. Inserir a carga com status 'recebida'
  const { data: carga, error: erroCarga } = await supabase
    .from('cargas')
    .insert({
      ...dados,
      criado_por: usuarioId,
      status: 'recebida'
    })
    .select()
    .single()

  if (erroCarga || !carga) {
    // Trata erro de duplicidade caso ocorra (race condition)
    if (erroCarga?.code === '23505') {
      return { error: { message: `O número "${dados.numero_carga}" já está em uso. Tente outro.` }, carga: null }
    }
    return { error: erroCarga, carga: null }
  }

  // 3. Registra no histórico com descrição correta baseada no tipo
  const tipoOperacao = dados.tipo_carga === 'carregamento' ? 'Carregamento' : 'Descarregamento'
  await supabase.rpc('registrar_historico_carga', {
    p_carga_id: carga.id,
    p_tipo_evento: 'criacao',
    p_descricao: `${tipoOperacao} recebido e cadastrado no sistema`,
    p_usuario_id: usuarioId
  })

  // 4. Cria checklist padrão (6 itens)
  await supabase.rpc('criar_checklist_padrao', {
    p_carga_id: carga.id,
    p_usuario_id: usuarioId
  })

  return { error: null, carga }
}

// Lista cargas do operador (ou todas, se admin)
export async function listarCargas(usuarioId: string, perfil: string) {
  let query = supabase
    .from('vw_cargas_resumo')
    .select('*')
    .order('data_hora_recebimento', { ascending: false })

  if (perfil === 'operador') {
    query = query.eq('criado_por', usuarioId)
  }

  const { data, error } = await query
  return { data: data as CargaResumo[] | null, error }
}

// Busca as operações EM ANDAMENTO do usuário logado
export async function listarMinhasOperacoes(usuarioId: string) {
  const statusEmAndamento = ['recebida', 'conferencia', 'descarga', 'inspecao', 'com_avaria']
  const { data, error } = await supabase
    .from('vw_cargas_resumo')
    .select('*')
    .in('status', statusEmAndamento)
    .eq('criado_por', usuarioId)
    .order('data_hora_recebimento', { ascending: false })

  return { data: data as CargaResumo[] | null, error }
}

// Avança a etapa da carga
export async function avancarEtapa(
  cargaId: string,
  novoStatus: StatusCarga,
  usuarioId: string,
  descricao?: string
) {
  // 1. Buscar o tipo de carga para gerar descrição correta
  const { data: cargaData } = await supabase
    .from('cargas')
    .select('tipo_carga')
    .eq('id', cargaId)
    .single()

  const ehCarregamento = cargaData?.tipo_carga === 'carregamento'
  const tipoOperacao = ehCarregamento ? 'Carregamento' : 'Descarregamento'

  // 2. Gerar descrição automática baseada no tipo de operação e novo status
  let descricaoAutomatica = descricao
  if (!descricaoAutomatica) {
    const descricoes: Record<StatusCarga, string> = {
      recebida: `${tipoOperacao} recebida`,
      descarga: `Status alterado para ${ehCarregamento ? 'carregamento' : 'descarga'}`,
      inspecao: 'Iniciada inspeção',
      conferencia: 'Iniciada conferência',
      com_avaria: 'Avaria registrada',
      finalizada: `${tipoOperacao} finalizado`
    }
    descricaoAutomatica = descricoes[novoStatus] || `Status alterado para ${novoStatus}`
  }

  // 3. Executar a procedure de alteração de status
  const { error } = await supabase.rpc('alterar_status_carga', {
    p_carga_id: cargaId,
    p_novo_status: novoStatus,
    p_usuario_id: usuarioId,
    p_descricao: descricaoAutomatica
  })

  return { error }
}

// Busca detalhes de uma carga específica
export async function buscarCargaDetalhe(cargaId: string) {
  const { data, error } = await supabase
    .from('vw_cargas_resumo')
    .select('*')
    .eq('id', cargaId)
    .single()

  return { data: data as CargaResumo | null, error }
}

// Gera número de carga automático (ex: CARG-2026-0001)
export async function gerarNumeroCarga() {
  const ano = new Date().getFullYear()
  const { data, error } = await supabase
    .from('cargas')
    .select('numero_carga')
    .like('numero_carga', `CARG-${ano}-%`)
    .order('numero_carga', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) {
    return `CARG-${ano}-0001`
  }

  const ultimoNumero = parseInt(data[0].numero_carga.split('-')[2])
  const proximoNumero = String(ultimoNumero + 1).padStart(4, '0')
  return `CARG-${ano}-${proximoNumero}`
}

// Excluir carga e todos os dados relacionados (em cascata)
export async function excluirCarga(cargaId: string) {
  try {
    // 1. Buscar caminhos das fotos para deletar do Storage primeiro
    const { data: fotos } = await supabase
      .from('fotos')
      .select('caminho_storage')
      .eq('carga_id', cargaId)

    if (fotos && fotos.length > 0) {
      const caminhos = fotos.map(f => f.caminho_storage)
      await supabase.storage.from('cargas-fotos').remove(caminhos)
    }

    // 2. Deletar registros filhos (evita erro de Foreign Key)
    await supabase.from('fotos').delete().eq('carga_id', cargaId)
    await supabase.from('avarias').delete().eq('carga_id', cargaId)
    await supabase.from('checklist_respostas').delete().eq('carga_id', cargaId)
    await supabase.from('historico_carga').delete().eq('carga_id', cargaId)

    // 3. Por fim, deletar a carga principal
    const { error } = await supabase
      .from('cargas')
      .delete()
      .eq('id', cargaId)

    if (error) throw error

    return { error: null }
  } catch (error: any) {
    console.error('❌ Erro ao excluir carga:', error)
    return { error: error.message || 'Erro desconhecido ao excluir.' }
  }
}