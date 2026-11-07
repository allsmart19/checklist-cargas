import { supabase } from '@/lib/supabase'
import type { ChecklistResposta, RespostaChecklist } from '@/types'

// Busca todas as respostas do checklist de uma carga
export async function buscarChecklist(cargaId: string) {
  const { data, error } = await supabase
    .from('checklist_respostas')
    .select('*')
    .eq('carga_id', cargaId)
    .order('criado_em', { ascending: true })

  return { data: data as ChecklistResposta[] | null, error }
}

// Atualiza a resposta de um item do checklist
export async function atualizarResposta(
  respostaId: string,
  resposta: RespostaChecklist,
  observacao: string | null,
  usuarioId: string
) {
  console.log('📝 atualizarResposta chamado:', { respostaId, resposta, observacao, usuarioId })

  // 1. Atualizar a resposta do checklist
  const { data, error } = await supabase
    .from('checklist_respostas')
    .update({
      resposta,
      observacao,
      usuario_id: usuarioId,
      atualizado_em: new Date().toISOString()
    })
    .eq('id', respostaId)
    .select()
    .single()

  console.log('✅ Resposta do checklist atualizada:', data)

  if (error || !data) {
    console.error('❌ Erro ao atualizar resposta:', error)
    return { data: data as ChecklistResposta | null, error }
  }

  // 2. ✅ CRIAR AVARIA AUTOMATICAMENTE quando "Carga sem avarias" for NÃO OK
  if (data.item === 'Carga sem avarias' && resposta === 'nao_ok') {
    console.log('🚨 Item "Carga sem avarias" marcado como NÃO OK - Verificando avarias existentes...')

    const descricaoAvaria = observacao || 'Avaria identificada durante conferência'

    try {
      // ✅ VERIFICAR se já existe uma avaria similar para esta carga (evita duplicatas)
      const { data: avariasExistentes } = await supabase
        .from('avarias')
        .select('id')
        .eq('carga_id', data.carga_id)
        .eq('tipo', 'avaria_geral')
        .limit(1)

      if (avariasExistentes && avariasExistentes.length > 0) {
        console.log('ℹ️ Avaria já existe para esta carga. Atualizando a existente em vez de criar duplicata.')
        
        // Atualiza a avaria existente com a nova observação
        const { error: erroAtualizacao } = await supabase
          .from('avarias')
          .update({
            descricao: descricaoAvaria,
            observacao: observacao,
            data_hora: new Date().toISOString()
          })
          .eq('carga_id', data.carga_id)
          .eq('tipo', 'avaria_geral')

        if (erroAtualizacao) {
          console.error('❌ Erro ao atualizar avaria existente:', erroAtualizacao)
        } else {
          console.log('✅ Avaria existente atualizada com sucesso')
        }
      } else {
        console.log('➕ Nenhuma avaria existente. Criando nova avaria...')

        // Inserir nova avaria
        const { data: avariaCriada, error: erroAvaria } = await supabase
          .from('avarias')
          .insert({
            carga_id: data.carga_id,
            tipo: 'avaria_geral',
            descricao: descricaoAvaria,
            observacao: observacao,
            data_hora: new Date().toISOString(),
            usuario_id: usuarioId
          })
          .select()
          .single()

        if (erroAvaria) {
          console.error('❌ Erro ao criar avaria:', erroAvaria)
        } else {
          console.log('✅ Avaria criada com sucesso:', avariaCriada)
        }
      }

      // Atualizar status da carga para "com_avaria"
      const { error: erroStatus } = await supabase
        .from('cargas')
        .update({ status: 'com_avaria' })
        .eq('id', data.carga_id)

      if (erroStatus) {
        console.error('⚠️ Erro ao atualizar status da carga:', erroStatus)
      } else {
        console.log('✅ Status da carga atualizado para "com_avaria"')
      }
    } catch (err) {
      console.error('⚠️ Erro inesperado ao processar avaria:', err)
    }
  } else {
    console.log('ℹ️ Item não é "Carga sem avarias" ou resposta não é NÃO OK.')
    console.log('   Item:', data.item, '| Resposta:', resposta)
  }

  return { data: data as ChecklistResposta | null, error: null }
}

// Retorna estatísticas do checklist (quantos OK, NÃO OK, etc)
export function calcularEstatisticas(checklist: ChecklistResposta[]) {
  const total = checklist.length
  const ok = checklist.filter(c => c.resposta === 'ok').length
  const naoOk = checklist.filter(c => c.resposta === 'nao_ok').length
  const naoVerificado = checklist.filter(c => c.resposta === 'nao_verificado').length
  const respondidos = ok + naoOk

  return {
    total,
    ok,
    naoOk,
    naoVerificado,
    respondidos,
    progresso: total > 0 ? Math.round((respondidos / total) * 100) : 0,
    concluido: naoVerificado === 0
  }
}