import { supabase } from '@/lib/supabase'

export interface LogAuditoria {
  id: string
  usuario_id: string | null
  tabela: string
  registro_id: string | null
  acao: 'INSERT' | 'UPDATE' | 'DELETE'
  dados_anteriores: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  criado_em: string
  nome_usuario?: string
}

export async function buscarLogsAuditoria() {
  const { data, error } = await supabase
    .from('logs_auditoria')
    .select(`
      *,
      usuarios (nome)
    `)
    .order('criado_em', { ascending: false })
    .limit(100)

  if (error) return { data: null, error }

  // Formata os dados para incluir o nome do usuário
  const logsFormatados = (data || []).map((log: any) => ({
    ...log,
    nome_usuario: log.usuarios?.nome || 'Sistema'
  }))

  return { data: logsFormatados as LogAuditoria[], error: null }
}