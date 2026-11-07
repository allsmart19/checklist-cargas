import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Eye } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { STATUS_CARGA_LABELS, STATUS_CARGA_CORES } from '@/constants/status'
import { formatarDataHora } from '@/utils/formatters'
import type { CargaResumo } from '@/types'

export function CargasPage() {
  const navigate = useNavigate()
  const [cargas, setCargas] = useState<CargaResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('')

  useEffect(() => {
    carregarCargas()
  }, [])

  async function carregarCargas() {
    setCarregando(true)
    const { data } = await supabase
      .from('vw_cargas_resumo')
      .select('*')
      .order('data_hora_recebimento', { ascending: false })

    setCargas(data || [])
    setCarregando(false)
  }

  // Filtragem client-side
  const cargasFiltradas = cargas.filter((c) => {
    const matchBusca =
      !busca ||
      c.numero_carga.toLowerCase().includes(busca.toLowerCase()) ||
      c.cliente_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      c.nota_fiscal?.toLowerCase().includes(busca.toLowerCase())

    const matchStatus = !filtroStatus || c.status === filtroStatus

    return matchBusca && matchStatus
  })

  const opcoesStatus = [
    { value: '', label: 'Todos os status' },
    { value: 'recebida', label: 'Recebida' },
    { value: 'conferencia', label: 'Em Conferência' },
    { value: 'descarga', label: 'Em Descarga' },
    { value: 'inspecao', label: 'Em Inspeção' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'com_avaria', label: 'Com Avaria' }
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cargas</h1>
          <p className="text-sm text-gray-500">
            {cargasFiltradas.length} de {cargas.length} carga(s)
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, cliente ou NF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {opcoesStatus.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        {carregando ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : cargasFiltradas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma carga encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Número</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Cliente</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Processo</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Volumes</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Avarias</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Recebida em</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cargasFiltradas.map((carga) => (
                  <tr key={carga.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {carga.numero_carga}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {carga.cliente_nome || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {carga.nota_fiscal || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {/* ✅ Usa o status REAL do banco de dados */}
                      <Badge className={STATUS_CARGA_CORES[carga.status]}>
                        {STATUS_CARGA_LABELS[carga.status]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {carga.quantidade_volumes}
                    </td>
                    <td className="py-3 px-4">
                      {carga.quantidade_avarias > 0 ? (
                        <Badge className="bg-red-100 text-red-800">
                          {carga.quantidade_avarias}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatarDataHora(carga.data_hora_recebimento)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/cargas/${carga.id}`)}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}