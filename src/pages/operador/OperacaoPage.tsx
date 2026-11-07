import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, ArrowRight, Upload, Download } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { listarCargas } from '@/services/cargaService'
import { STATUS_CARGA_LABELS, STATUS_CARGA_CORES } from '@/constants/status'
import { formatarDataHora } from '@/utils/formatters'
import type { CargaResumo } from '@/types'

export function OperacaoPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [cargas, setCargas] = useState<CargaResumo[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function load() {
      if (!usuario) return
      const { data } = await listarCargas(usuario.id, usuario.perfil)
      setCargas(data || [])
      setCarregando(false)
    }
    load()
  }, [usuario])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Cabeçalho simplificado - sem botão "Nova Carga" */}
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Operações</h1>
          <p className="text-sm text-gray-500">
            {cargas.length} {cargas.length === 1 ? 'operação registrada' : 'operações registradas'}
          </p>
        </div>
      </div>

      {carregando ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-blue-600" />
        </div>
      ) : cargas.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">Nenhuma operação registrada.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cargas.map((carga) => {
            const ehCarregamento = carga.tipo_carga === 'carregamento'
            const ehDescarregamento = carga.tipo_carga === 'descarregamento'
            
            const corTipo = ehCarregamento
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : ehDescarregamento
              ? 'bg-green-100 text-green-800 border-green-200'
              : 'bg-gray-100 text-gray-800 border-gray-200'
              
            const labelTipo = ehCarregamento
              ? 'Carregamento'
              : ehDescarregamento
              ? 'Descarregamento'
              : 'Operação'

            return (
              <Card
                key={carga.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <div
                  onClick={() => navigate(`/operacao/carga/${carga.id}`)}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{carga.numero_carga}</h3>
                      
                      {/* ✅ Badge de Tipo (Carregamento ou Descarregamento) com ícone JSX correto */}
                      <Badge className={`${corTipo} border flex items-center gap-1`}>
                        {ehCarregamento ? (
                          <Upload className="w-3 h-3" />
                        ) : ehDescarregamento ? (
                          <Download className="w-3 h-3" />
                        ) : null}
                        {labelTipo}
                      </Badge>
                      
                      <Badge className={STATUS_CARGA_CORES[carga.status]}>
                        {STATUS_CARGA_LABELS[carga.status]}
                      </Badge>
                      
                      {carga.quantidade_avarias > 0 && (
                        <Badge className="bg-red-100 text-red-800">
                          {carga.quantidade_avarias} avaria(s)
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Cliente:</strong> {carga.cliente_nome || '—'}</p>
                      <p><strong>Processo:</strong> {carga.nota_fiscal || '—'} · <strong>Itens:</strong> {carga.quantidade_volumes}</p>
                      <p className="text-xs text-gray-400">Recebida em {formatarDataHora(carga.data_hora_recebimento)}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 ml-4" />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}