import { useEffect, useState } from 'react'
import { ShieldAlert, Eye, Clock, User, Database, ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { buscarLogsAuditoria, type LogAuditoria } from '@/services/auditoriaService'
import { formatarDataHora } from '@/utils/formatters'

export function LogsPage() {
  const [logs, setLogs] = useState<LogAuditoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [logExpandido, setLogExpandido] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const { data } = await buscarLogsAuditoria()
      setLogs(data || [])
      setCarregando(false)
    }
    carregar()
  }, [])

  function getAcaoBadge(acao: string) {
    switch (acao) {
      case 'INSERT':
        return <Badge className="bg-green-100 text-green-800 border border-green-200">CRIADO</Badge>
      case 'UPDATE':
        return <Badge className="bg-blue-100 text-blue-800 border border-blue-200">ALTERADO</Badge>
      case 'DELETE':
        return <Badge className="bg-red-100 text-red-800 border border-red-200">EXCLUÍDO</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{acao}</Badge>
    }
  }

  function toggleLog(logId: string) {
    setLogExpandido(logExpandido === logId ? null : logId)
  }

  // Formata JSON para exibição organizada
  function formatarJSON(dados: Record<string, unknown> | null) {
    if (!dados) return null
    return JSON.stringify(dados, null, 2)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h1>
          <p className="text-sm text-gray-500">Rastreamento de ações no sistema</p>
        </div>
      </div>

      {carregando ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <Card className="text-center py-12">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Nenhum log de auditoria encontrado.</p>
            </Card>
          ) : (
            logs.map((log) => {
              const expandido = logExpandido === log.id
              const temDadosAnteriores = log.dados_anteriores && Object.keys(log.dados_anteriores).length > 0
              const temDadosNovos = log.dados_novos && Object.keys(log.dados_novos).length > 0

              return (
                <Card key={log.id} className="overflow-hidden">
                  {/* Cabeçalho do Log - Sempre visível */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleLog(log.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Ícone de expansão */}
                      {expandido ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}

                      {/* Data/Hora */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 flex-shrink-0">
                        <Clock className="w-4 h-4" />
                        <span>{formatarDataHora(log.criado_em)}</span>
                      </div>

                      {/* Usuário */}
                      <div className="flex items-center gap-2 text-sm text-gray-700 flex-shrink-0">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{log.nome_usuario}</span>
                      </div>

                      {/* Ação */}
                      {getAcaoBadge(log.acao)}

                      {/* Tabela */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 flex-shrink-0">
                        <Database className="w-4 h-4" />
                        <span className="capitalize">{log.tabela.replace('_', ' ')}</span>
                      </div>

                      {/* ID do Registro */}
                      {log.registro_id && (
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          {log.registro_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>

                    {/* Botão Ver Detalhes */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLog(log.id)
                      }}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      {expandido ? 'Ocultar' : 'Detalhes'}
                    </button>
                  </div>

                  {/* Conteúdo Expandido - Dados JSON */}
                  {expandido && (temDadosAnteriores || temDadosNovos) && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                      {/* Dados Anteriores (apenas em UPDATE e DELETE) */}
                      {temDadosAnteriores && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <h4 className="text-sm font-bold text-red-800 uppercase tracking-wide">
                              {log.acao === 'DELETE' ? 'Dados Excluídos' : 'Valores Anteriores'}
                            </h4>
                          </div>
                          <div className="bg-white border border-red-200 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-words">
                              {formatarJSON(log.dados_anteriores)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Dados Novos (apenas em INSERT e UPDATE) */}
                      {temDadosNovos && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <h4 className="text-sm font-bold text-green-800 uppercase tracking-wide">
                              {log.acao === 'INSERT' ? 'Dados Criados' : 'Novos Valores'}
                            </h4>
                          </div>
                          <div className="bg-white border border-green-200 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-words">
                              {formatarJSON(log.dados_novos)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Legenda de cores */}
                      {log.acao === 'UPDATE' && (
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>Valores antes da alteração</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>Valores após a alteração</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}