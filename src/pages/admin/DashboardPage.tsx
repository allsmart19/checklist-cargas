import { useEffect, useState } from 'react'
//import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { TIPOS_AVARIA_LABELS } from '@/constants/tipos-avaria'

interface DashboardStats {
  total: number
  emAndamento: number
  finalizadas: number
  comAvaria: number
}

interface AvariaPorTipo {
  tipo: string
  quantidade: number
}

interface TopCliente {
  cliente_nome: string
  quantidade: number
}

// Mapeamento de tipos de avaria para exibição legível
const TIPOS_AVARIA_EXIBICAO: Record<string, { label: string; cor: string; icone: string }> = {
  avaria_geral: { label: 'Avaria Geral', cor: 'bg-red-100 text-red-800 border-red-200', icone: '⚠️' },
  amassado: { label: 'Amassado', cor: 'bg-orange-100 text-orange-800 border-orange-200', icone: '📦' },
  rasgado: { label: 'Rasgado', cor: 'bg-yellow-100 text-yellow-800 border-yellow-200', icone: '📄' },
  molhado: { label: 'Molhado', cor: 'bg-blue-100 text-blue-800 border-blue-200', icone: '💧' },
  quebrado: { label: 'Quebrado', cor: 'bg-purple-100 text-purple-800 border-purple-200', icone: '💔' },
  faltante: { label: 'Faltante', cor: 'bg-gray-100 text-gray-800 border-gray-200', icone: '❓' },
  outro: { label: 'Outro', cor: 'bg-indigo-100 text-indigo-800 border-indigo-200', icone: '📌' }
}

function obterInfoTipoAvaria(tipo: string) {
  // Tenta o label do sistema primeiro
  const labelSistema = TIPOS_AVARIA_LABELS[tipo as keyof typeof TIPOS_AVARIA_LABELS]
  // Tenta o label de exibição customizado
  const infoExibicao = TIPOS_AVARIA_EXIBICAO[tipo.toLowerCase()]
  
  return {
    label: labelSistema || infoExibicao?.label || tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    cor: infoExibicao?.cor || 'bg-gray-100 text-gray-800 border-gray-200',
    icone: infoExibicao?.icone || '📋'
  }
}

export function DashboardPage() {
  //const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    emAndamento: 0,
    finalizadas: 0,
    comAvaria: 0
  })
  const [avariasPorTipo, setAvariasPorTipo] = useState<AvariaPorTipo[]>([])
  const [topClientes, setTopClientes] = useState<TopCliente[]>([])
  const [totalAvarias, setTotalAvarias] = useState(0)

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true)

      try {
        // Buscar estatísticas gerais
        const { data: cargas, error: errorCargas } = await supabase
          .from('vw_cargas_resumo')
          .select('status, quantidade_avarias, cliente_nome')

        if (errorCargas) throw errorCargas

        const total = cargas?.length || 0
        const emAndamento = cargas?.filter(c => 
          ['recebida', 'conferencia', 'descarga', 'inspecao', 'com_avaria'].includes(c.status)
        ).length || 0
        const finalizadas = cargas?.filter(c => c.status === 'finalizada').length || 0
        const comAvaria = cargas?.filter(c => (c.quantidade_avarias || 0) > 0).length || 0

        setStats({ total, emAndamento, finalizadas, comAvaria })

        // Buscar TODAS as avarias do sistema
        const { data: avarias, error: errorAvarias } = await supabase
          .from('avarias')
          .select('tipo')

        if (errorAvarias) throw errorAvarias

        if (avarias && avarias.length > 0) {
          const agrupadas: Record<string, number> = {}
          
          avarias.forEach((avaria: any) => {
            const tipo = avaria.tipo?.toLowerCase() || 'outro'
            agrupadas[tipo] = (agrupadas[tipo] || 0) + 1
          })

          const avariasAgrupadas = Object.entries(agrupadas)
            .map(([tipo, quantidade]) => ({
              tipo,
              quantidade
            }))
            .sort((a, b) => b.quantidade - a.quantidade)

          setAvariasPorTipo(avariasAgrupadas)
          setTotalAvarias(avarias.length)
        } else {
          setAvariasPorTipo([])
          setTotalAvarias(0)
        }

        // Buscar top clientes
        if (cargas && cargas.length > 0) {
          const clientesMap: Record<string, number> = {}
          
          cargas.forEach(carga => {
            const cliente = carga.cliente_nome || 'Não informado'
            clientesMap[cliente] = (clientesMap[cliente] || 0) + 1
          })

          const topClientesList = Object.entries(clientesMap)
            .map(([cliente_nome, quantidade]) => ({
              cliente_nome,
              quantidade
            }))
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, 5)

          setTopClientes(topClientesList)
        }

      } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  if (carregando) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Visão geral das operações</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          titulo="Total de Cargas"
          valor={stats.total}
          icone={Package}
          cor="bg-blue-500"
        />
        <StatCard
          titulo="Em Andamento"
          valor={stats.emAndamento}
          icone={Clock}
          cor="bg-purple-500"
        />
        <StatCard
          titulo="Finalizadas"
          valor={stats.finalizadas}
          icone={CheckCircle}
          cor="bg-green-500"
        />
        <StatCard
          titulo="Com Avaria"
          valor={stats.comAvaria}
          icone={AlertTriangle}
          cor="bg-red-500"
        />
      </div>

      {/* Gráficos - ORDEM INVERTIDA: Top Clientes à esquerda, Avarias à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP CLIENTES - AGORA À ESQUERDA */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Top Clientes</h2>
          </div>
          {topClientes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma carga registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topClientes.map((cliente, index) => (
                <div key={cliente.cliente_nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{cliente.cliente_nome}</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {cliente.quantidade} {cliente.quantidade === 1 ? 'carga' : 'cargas'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* AVARIAS POR TIPO - AGORA À DIREITA */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-gray-900">Avarias por Tipo</h2>
            </div>
            {totalAvarias > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {totalAvarias} {totalAvarias === 1 ? 'ocorrência' : 'ocorrências'}
              </Badge>
            )}
          </div>
          {avariasPorTipo.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma avaria registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {avariasPorTipo.map((item) => {
                const info = obterInfoTipoAvaria(item.tipo)
                const porcentagem = totalAvarias > 0 ? Math.round((item.quantidade / totalAvarias) * 100) : 0
                
                return (
                  <div key={item.tipo} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{info.icone}</span>
                        <Badge className={`${info.cor} border text-xs font-medium`}>
                          {info.label}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">
                          {item.quantidade}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          {item.quantidade === 1 ? 'ocorrência' : 'ocorrências'}
                        </span>
                      </div>
                    </div>
                    {/* Barra de progresso visual */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${porcentagem}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{porcentagem}% do total</p>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// Componente de Card de Estatística
function StatCard({
  titulo,
  valor,
  icone: Icone,
  cor
}: {
  titulo: string
  valor: number
  icone: React.ComponentType<{ className?: string }>
  cor: string
}) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{titulo}</p>
        <p className="text-3xl font-bold text-gray-900">{valor}</p>
      </div>
      <div className={`${cor} p-3 rounded-lg`}>
        <Icone className="w-6 h-6 text-white" />
      </div>
    </Card>
  )
}