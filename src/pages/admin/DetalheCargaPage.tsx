import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  ClipboardCheck,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  Loader2,
  Trash2,
  User,
  ZoomIn
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ImageModal } from '@/components/ui/ImageModal'
import { buscarCargaDetalhe, excluirCarga } from '@/services/cargaService'
import { buscarChecklist } from '@/services/checklistService'
import { buscarAvariasDaCarga } from '@/services/avariaService'
import { buscarHistorico } from '@/services/historicoService'
import { buscarFotosDaCarga } from '@/services/fotoService'
import { gerarRelatorioPDF } from '@/utils/gerarPDF'
import { buscarDadosRelatorio } from '@/services/relatorioService'
import { STATUS_CARGA_LABELS, STATUS_CARGA_CORES } from '@/constants/status'
import { TIPOS_AVARIA_LABELS } from '@/constants/tipos-avaria'
import { formatarDataHora } from '@/utils/formatters'
import { supabase } from '@/lib/supabase'
import type { CargaResumo, ChecklistResposta, Avaria, HistoricoCarga, Foto } from '@/types'

export function DetalheCargaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [excluindo, setExcluindo] = useState(false)
  const [gerandoPDF, setGerandoPDF] = useState(false)
  const [carga, setCarga] = useState<CargaResumo | null>(null)
  const [checklist, setChecklist] = useState<ChecklistResposta[]>([])
  const [avarias, setAvarias] = useState<Avaria[]>([])
  const [historico, setHistorico] = useState<HistoricoCarga[]>([])
  const [fotos, setFotos] = useState<Foto[]>([])
  const [nomeOperador, setNomeOperador] = useState<string>('—')
  const [fotoExpandida, setFotoExpandida] = useState<Foto | null>(null)

  useEffect(() => {
    async function carregar() {
      if (!id) return
      setCarregando(true)

      const [resCarga, resCheck, resAvar, resHist, resFoto] = await Promise.all([
        buscarCargaDetalhe(id),
        buscarChecklist(id),
        buscarAvariasDaCarga(id),
        buscarHistorico(id),
        buscarFotosDaCarga(id)
      ])

      setCarga(resCarga.data)
      setChecklist(resCheck.data || [])
      setAvarias(resAvar.data || [])
      setHistorico(resHist.data || [])
      setFotos(resFoto.data || [])

      // Buscar nome do operador
      // Prioridade 1: Campo criado_por da carga
      // Prioridade 2: Primeiro item do checklist com usuario_id
      // Prioridade 3: Primeiro evento do histórico com usuario_id
      let usuarioId = resCarga.data?.criado_por

      if (!usuarioId && resCheck.data && resCheck.data.length > 0) {
        const itemComUsuario = resCheck.data.find(item => item.usuario_id)
        if (itemComUsuario) {
          usuarioId = itemComUsuario.usuario_id
        }
      }

      if (!usuarioId && resHist.data && resHist.data.length > 0) {
        const eventoComUsuario = resHist.data.find(evento => evento.usuario_id)
        if (eventoComUsuario) {
          usuarioId = eventoComUsuario.usuario_id
        }
      }

      if (usuarioId) {
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('nome')
          .eq('id', usuarioId)
          .single()

        if (usuarioData) {
          setNomeOperador(usuarioData.nome)
        }
      }

      setCarregando(false)
    }
    carregar()
  }, [id])

  async function handleGerarPDF() {
    if (!id) return
    setGerandoPDF(true)

    const dados = await buscarDadosRelatorio(id)

    if (!dados) {
      alert('Erro ao carregar dados para o relatório.')
      setGerandoPDF(false)
      return
    }

    try {
      await gerarRelatorioPDF(dados)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar o PDF. Verifique o console.')
    } finally {
      setGerandoPDF(false)
    }
  }

  async function handleExcluir() {
    if (!carga) return

    if (!confirm(`⚠️ ATENÇÃO: Confirma excluir permanentemente esta operação?\n\nCarga: ${carga.numero_carga}\nTipo: ${carga.tipo_carga === 'carregamento' ? 'Carregamento' : 'Descarregamento'}\n\nEsta ação NÃO pode ser desfeita e excluirá:\n- Dados da carga\n- Checklist\n- Fotos\n- Histórico\n- Avarias`)) {
      return
    }

    setExcluindo(true)
    const { error } = await excluirCarga(carga.id)
    setExcluindo(false)

    if (error) {
      alert('Erro ao excluir carga: ' + error.message)
      return
    }

    alert('Operação excluída com sucesso!')
    navigate('/admin/cargas')
  }

  if (carregando) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!carga) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-red-600 mb-2">Carga não encontrada</h2>
        <p className="text-gray-500 mb-4">Não foi possível carregar os dados desta operação.</p>
        <Button onClick={() => navigate('/admin/cargas')}>Voltar para Operações</Button>
      </div>
    )
  }

  const ehCarregamento = carga.tipo_carga === 'carregamento'

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/admin/cargas')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para listagem
      </button>

      {/* Cabeçalho */}
      <Card className="mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              {ehCarregamento ? 'Carregamento' : 'Descarregamento'} {carga.numero_carga}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Recebida em {formatarDataHora(carga.data_hora_recebimento)}
            </p>
            {/* Nome do operador que realizou o checklist */}
            <div className="flex items-center gap-2 mt-1">
              <User className="w-3 h-3 text-gray-400" />
              <p className="text-sm text-gray-600">
                <span className="font-medium">Operador:</span> {nomeOperador}
              </p>
            </div>
            <Badge className={`mt-2 ${ehCarregamento ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
              {ehCarregamento ? 'Carregamento' : 'Descarregamento'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-sm px-3 py-1 ${STATUS_CARGA_CORES[carga.status]}`}>
              {STATUS_CARGA_LABELS[carga.status]}
            </Badge>
            <Button
              onClick={handleGerarPDF}
              disabled={gerandoPDF}
              size="sm"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {gerandoPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Gerar Relatório PDF
                </>
              )}
            </Button>
            <Button
              onClick={handleExcluir}
              disabled={excluindo}
              size="sm"
              variant="danger"
              className="flex items-center gap-2"
            >
              {excluindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>

        {/* CAMPOS SIMPLIFICADOS - Apenas os pertinentes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InfoCard
            icone={<Package className="w-4 h-4 text-blue-600" />}
            label="Cliente"
            value={carga.cliente_nome}
          />
          <InfoCard
            icone={<Package className="w-4 h-4 text-blue-600" />}
            label="Número do Container"
            value={carga.numero_carga}
            destaque
          />
          <InfoCard
            icone={<Package className="w-4 h-4 text-blue-600" />}
            label="Quantidade de Itens"
            value={String(carga.quantidade_volumes)}
          />
          <InfoCard
            icone={<Package className="w-4 h-4 text-blue-600" />}
            label="Número do Processo"
            value={carga.nota_fiscal}
          />
          <InfoCard
            icone={<Package className="w-4 h-4 text-blue-600" />}
            label="Rua / Local"
            value={carga.destino}
            full
          />
        </div>

        {carga.observacoes && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Observações</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{carga.observacoes}</p>
          </div>
        )}
      </Card>

      {/* Timeline / Histórico */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Timeline</h2>
        </div>
        {historico.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Nenhum evento registrado</p>
        ) : (
          <div className="relative pl-6 border-l-2 border-blue-200 space-y-4">
            {historico.map((evento) => (
              <div key={evento.id} className="relative">
                <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{evento.descricao}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatarDataHora(evento.data_hora)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Checklist */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Checklist de Conferência</h2>
        </div>
        {checklist.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Checklist não iniciado</p>
        ) : (
          <div className="space-y-2">
           {checklist
  .filter(item => !(ehCarregamento && item.item === 'Lacre conferido'))
  .map((item) => {
    const IconeComponent =
      item.resposta === 'ok' ? CheckCircle :
      item.resposta === 'nao_ok' ? XCircle : HelpCircle
    const cor =
      item.resposta === 'ok' ? 'text-green-600' :
      item.resposta === 'nao_ok' ? 'text-red-600' : 'text-gray-400'
    const label =
      item.resposta === 'ok' ? 'OK' :
      item.resposta === 'nao_ok' ? 'NÃO OK' : 'Não verificado'
    return (
      <div key={item.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{item.item}</p>
          {item.observacao && (
            <p className="text-xs text-gray-600 mt-1 italic">
              "{item.observacao}"
            </p>
          )}
        </div>
        <div className={`flex items-center gap-1 ${cor}`}>
          <IconeComponent className="w-4 h-4" />
          <span className="text-xs font-medium">{label}</span>
        </div>
      </div>
    )
  })}
          </div>
        )}
      </Card>

      {/* Avarias */}
      {avarias.length > 0 && (
        <Card className="mb-6 border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-red-900">
              Avarias Registradas ({avarias.length})
            </h2>
          </div>
          <div className="space-y-3">
            {avarias.map((avaria) => (
              <div key={avaria.id} className="p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-red-100 text-red-800">
                    {TIPOS_AVARIA_LABELS[avaria.tipo as keyof typeof TIPOS_AVARIA_LABELS] || avaria.tipo}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatarDataHora(avaria.data_hora)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{avaria.descricao}</p>
                {avaria.observacao && (
                  <p className="text-xs text-gray-600 mt-2 italic">
                    "{avaria.observacao}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ✅ Fotos com clique para expandir */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">
            Registro Fotográfico ({fotos.length})
          </h2>
        </div>
        {fotos.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Nenhuma foto registrada</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => setFotoExpandida(foto)}
              >
                <img
                  src={foto.url || ''}
                  alt={foto.tipo}
                  className="w-full h-full object-cover"
                />

                {/* Overlay ao passar o mouse */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Legenda inferior */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs truncate">
                    {foto.etapa || '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ✅ Modal de Imagem Expandida */}
      {fotoExpandida && (
        <ImageModal
          url={fotoExpandida.url}
          alt={`${fotoExpandida.tipo.replace('_', ' ')} - ${fotoExpandida.etapa || ''}`}
          onClose={() => setFotoExpandida(null)}
        />
      )}
    </div>
  )
}

// Componente de card de informação com ícone
function InfoCard({
  icone,
  label,
  value,
  destaque = false,
  full = false
}: {
  icone: React.ReactNode
  label: string
  value: string | null
  destaque?: boolean
  full?: boolean
}) {
  return (
    <div className={`${full ? 'md:col-span-2' : ''} flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100`}>
      <div className="flex-shrink-0 mt-0.5">
        {icone}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`font-medium mt-0.5 break-words ${
          destaque ? 'text-lg text-blue-700 font-bold' : 'text-gray-900'
        }`}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}