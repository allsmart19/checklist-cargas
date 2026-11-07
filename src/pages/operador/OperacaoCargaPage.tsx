import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Package,
  ClipboardCheck,
  Image as ImageIcon,
  Container,
  Hash,
  MapPin,
  Layers
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { buscarCargaDetalhe, avancarEtapa } from '@/services/cargaService'
import { buscarChecklist, atualizarResposta, calcularEstatisticas } from '@/services/checklistService'
import { ChecklistItem } from '@/components/checklist/ChecklistItem'
import { ChecklistProgresso } from '@/components/checklist/ChecklistProgresso'
import { FotoUploader } from '@/components/fotos/FotoUploader'
import { GaleriaFotos } from '@/components/fotos/GaleriaFotos'
import { STATUS_CARGA_LABELS, STATUS_CARGA_CORES } from '@/constants/status'
import { formatarDataHora } from '@/utils/formatters'
import type { CargaResumo, StatusCarga, ChecklistResposta, RespostaChecklist, TipoFoto } from '@/types'

// ============================================================
// CONFIGURAÇÃO DINÂMICA POR TIPO DE OPERAÇÃO
// NOVA ORDEM: Recebida → Descarga → Inspeção → Conferência → Finalizada
// ============================================================
type TipoOperacao = 'carregamento' | 'descarregamento'

interface TextosEtapa {
  proximo: StatusCarga
  label: string
  cor: string
}

const ETAPAS_POR_TIPO: Record<TipoOperacao, Record<StatusCarga, TextosEtapa | null>> = {
  carregamento: {
    recebida: { proximo: 'descarga', label: 'Iniciar Carregamento', cor: 'bg-blue-600 hover:bg-blue-700' },
    descarga: { proximo: 'inspecao', label: 'Iniciar Inspeção', cor: 'bg-purple-600 hover:bg-purple-700' },
    inspecao: { proximo: 'conferencia', label: 'Iniciar Conferência', cor: 'bg-orange-600 hover:bg-orange-700' },
    conferencia: { proximo: 'finalizada', label: 'Finalizar Carregamento', cor: 'bg-green-600 hover:bg-green-700' },
    finalizada: null,
    com_avaria: { proximo: 'conferencia', label: 'Prosseguir para Conferência', cor: 'bg-orange-600 hover:bg-orange-700' },
  },
  descarregamento: {
    recebida: { proximo: 'descarga', label: 'Iniciar Descarga', cor: 'bg-blue-600 hover:bg-blue-700' },
    descarga: { proximo: 'inspecao', label: 'Iniciar Inspeção', cor: 'bg-purple-600 hover:bg-purple-700' },
    inspecao: { proximo: 'conferencia', label: 'Iniciar Conferência', cor: 'bg-orange-600 hover:bg-orange-700' },
    conferencia: { proximo: 'finalizada', label: 'Finalizar Descarregamento', cor: 'bg-green-600 hover:bg-green-700' },
    finalizada: null,
    com_avaria: { proximo: 'conferencia', label: 'Prosseguir para Conferência', cor: 'bg-orange-600 hover:bg-orange-700' },
  }
}

const TEXTOS_FOTOS: Record<TipoOperacao, {
  titulo: string
  antes: { titulo: string; badge: string; tipoFoto: TipoFoto }
  durante: { titulo: string; badge: string; tipoFoto: TipoFoto }
  depois: { titulo: string; badge: string; tipoFoto: TipoFoto }
}> = {
  carregamento: {
    titulo: 'Registro Fotográfico - Carregamento',
    antes: { titulo: '📸 Antes do Carregamento', badge: 'Geral, Embalagem, Pallets', tipoFoto: 'geral_carga' },
    durante: { titulo: '📸 Durante o Carregamento', badge: 'Volumes, Embalagens, Processo', tipoFoto: 'descarga' },
    depois: { titulo: '📸 Depois / Conferência Final do Carregamento', badge: 'Carga carregada, Local', tipoFoto: 'carga_descarregada' }
  },
  descarregamento: {
    titulo: 'Registro Fotográfico - Descarregamento',
    antes: { titulo: '📸 Antes da Descarga', badge: 'Geral, Lacre, Embalagem, Pallets', tipoFoto: 'geral_carga' },
    durante: { titulo: '📸 Durante a Descarga', badge: 'Volumes, Embalagens, Processo', tipoFoto: 'descarga' },
    depois: { titulo: '📸 Depois / Conferência Final da Descarga', badge: 'Carga descarregada, Local', tipoFoto: 'carga_descarregada' }
  }
}

export function OperacaoCargaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [carga, setCarga] = useState<CargaResumo | null>(null)
  const [checklist, setChecklist] = useState<ChecklistResposta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [salvandoItem, setSalvandoItem] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function load() {
      if (!id) return
      const { data } = await buscarCargaDetalhe(id)
      setCarga(data)

      if (data) {
        const { data: checklistData } = await buscarChecklist(data.id)
        setChecklist(checklistData || [])
      }
      setCarregando(false)
    }
    load()
  }, [id])

  // DETECÇÃO ROBUSTA DO TIPO
  const tipoOperacao: TipoOperacao = (() => {
    if (!carga?.tipo_carga) return 'carregamento'
    const tipo = carga.tipo_carga.toLowerCase().trim()
    return (tipo === 'descarregamento' || tipo === 'descarga') ? 'descarregamento' : 'carregamento'
  })()

  const etapas = ETAPAS_POR_TIPO[tipoOperacao]
  const textosFotos = TEXTOS_FOTOS[tipoOperacao]
  const statusAtual = carga?.status || 'recebida'
  const etapaAtual = etapas[statusAtual]

  // FILTRO DO CHECKLIST: Remove "Lacre conferido" se for carregamento
  const checklistFiltrado = useMemo(() => {
    if (tipoOperacao === 'carregamento') {
      return checklist.filter((c) => c.item !== 'Lacre conferido')
    }
    return checklist
  }, [checklist, tipoOperacao])

  const stats = calcularEstatisticas(checklistFiltrado)

  // ✅ Checklist aparece APENAS na etapa de conferência (e com_avaria que redireciona para ela)
  const mostrarChecklist = statusAtual === 'conferencia' || statusAtual === 'com_avaria'

  // ✅ Fotos: Antes (sempre), Durante (a partir de descarga), Depois (a partir de inspeção)
  const mostrarFotosDurante = ['descarga', 'inspecao', 'conferencia', 'finalizada', 'com_avaria'].includes(statusAtual)
  const mostrarFotosDepois = ['inspecao', 'conferencia', 'finalizada'].includes(statusAtual)

  async function handleAvancar() {
    if (!carga || !usuario || !etapaAtual) return

    // Validação do checklist apenas na etapa de conferência (agora é a última antes de finalizar)
    if (statusAtual === 'conferencia') {
      if (!stats.concluido) {
        if (!confirm(`O checklist ainda não foi concluído (${stats.respondidos}/${stats.total}). Deseja finalizar mesmo assim?`)) {
          return
        }
      }
    }

    if (!confirm(`Confirma avançar para "${etapaAtual.label}"?`)) return

    setProcessando(true)
    const { error } = await avancarEtapa(carga.id, etapaAtual.proximo, usuario.id)
    setProcessando(false)

    if (error) {
      alert('Erro ao avançar etapa: ' + error.message)
      return
    }

    const { data } = await buscarCargaDetalhe(carga.id)
    setCarga(data)
  }

  async function handleSalvarResposta(
    respostaId: string,
    resposta: RespostaChecklist,
    observacao: string
  ) {
    if (!usuario) return
    setSalvandoItem(respostaId)

    const { error } = await atualizarResposta(
      respostaId,
      resposta,
      observacao || null,
      usuario.id
    )

    setSalvandoItem(null)

    if (error) {
      alert('Erro ao salvar resposta: ' + error.message)
      return
    }

    if (carga) {
      const { data } = await buscarChecklist(carga.id)
      setChecklist(data || [])
    }
  }

  function handleUploadSucesso() {
    setRefreshKey(prev => prev + 1)
  }

  if (carregando) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  if (!carga) {
    return <div className="text-center py-12 text-gray-500">Carga não encontrada.</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/operacao')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar para operações
      </button>

      <Card className="mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Carga {carga.numero_carga}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Recebida em {formatarDataHora(carga.data_hora_recebimento)}
            </p>
            <Badge className={`mt-2 ${tipoOperacao === 'carregamento' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
              {tipoOperacao === 'carregamento' ? 'Carregamento' : 'Descarregamento'}
            </Badge>
          </div>
          <Badge className={`text-sm px-3 py-1 ${STATUS_CARGA_CORES[statusAtual]}`}>
            {STATUS_CARGA_LABELS[statusAtual]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InfoCard icone={<Package className="w-4 h-4 text-blue-600" />} label="Cliente" value={carga.cliente_nome} />
          <InfoCard icone={<Container className="w-4 h-4 text-blue-600" />} label="Número do Container" value={carga.numero_carga} destaque />
          <InfoCard icone={<Layers className="w-4 h-4 text-blue-600" />} label="Quantidade de Itens" value={String(carga.quantidade_volumes)} />
          <InfoCard icone={<Hash className="w-4 h-4 text-blue-600" />} label="Número do Processo" value={carga.nota_fiscal} />
          <InfoCard icone={<MapPin className="w-4 h-4 text-blue-600" />} label="Rua / Local" value={carga.destino} full />
        </div>

        {carga.observacoes && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Observações</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{carga.observacoes}</p>
          </div>
        )}
      </Card>

      {carga.quantidade_avarias > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-medium">Esta carga possui {carga.quantidade_avarias} avaria(s) registrada(s).</p>
              <p className="text-sm">O administrador poderá visualizar os detalhes no painel.</p>
            </div>
          </div>
        </Card>
      )}

      {/* SEÇÃO DE FOTOS */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <ImageIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">{textosFotos.titulo}</h2>
        </div>
        <div className="space-y-8">
          {/* FOTOS ANTES - Sempre visível */}
          <div className="border-b border-gray-100 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-gray-800">{textosFotos.antes.titulo}</h3>
              <Badge className="bg-blue-100 text-blue-800 text-xs">{textosFotos.antes.badge}</Badge>
            </div>
            <FotoUploader key={`uploader-antes-${refreshKey}`} cargaId={carga.id} etapa="antes" tipo={textosFotos.antes.tipoFoto} onUploadSucesso={handleUploadSucesso} />
            <GaleriaFotos key={`galeria-antes-${refreshKey}`} cargaId={carga.id} etapa="antes" />
          </div>

          {/* FOTOS DURANTE - Visível a partir da descarga */}
          {mostrarFotosDurante && (
            <div className="border-b border-gray-100 pb-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-gray-800">{textosFotos.durante.titulo}</h3>
                <Badge className="bg-purple-100 text-purple-800 text-xs">{textosFotos.durante.badge}</Badge>
              </div>
              <FotoUploader key={`uploader-durante-${refreshKey}`} cargaId={carga.id} etapa="durante" tipo={textosFotos.durante.tipoFoto} onUploadSucesso={handleUploadSucesso} />
              <GaleriaFotos key={`galeria-durante-${refreshKey}`} cargaId={carga.id} etapa="durante" />
            </div>
          )}

          {/* FOTOS DEPOIS - Visível a partir da inspeção */}
          {mostrarFotosDepois && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-gray-800">{textosFotos.depois.titulo}</h3>
                <Badge className="bg-green-100 text-green-800 text-xs">{textosFotos.depois.badge}</Badge>
              </div>
              <FotoUploader key={`uploader-depois-${refreshKey}`} cargaId={carga.id} etapa="depois" tipo={textosFotos.depois.tipoFoto} onUploadSucesso={handleUploadSucesso} />
              <GaleriaFotos key={`galeria-depois-${refreshKey}`} cargaId={carga.id} etapa="depois" />
            </div>
          )}
        </div>
      </Card>

      {/* SEÇÃO DO CHECKLIST - Agora aparece APENAS na etapa de Conferência */}
      {mostrarChecklist && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardCheck className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Checklist de Conferência</h2>
          </div>

          <ChecklistProgresso
            total={stats.total}
            respondidos={stats.respondidos}
            ok={stats.ok}
            naoOk={stats.naoOk}
            progresso={stats.progresso}
            concluido={stats.concluido}
          />

          <div className="mt-4 space-y-3">
            {checklistFiltrado.map((item) => (
              <div key={item.id} className="relative">
                {salvandoItem === item.id && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg z-10">
                    <Spinner size="sm" />
                  </div>
                )}
               <ChecklistItem item={item} onSalvar={handleSalvarResposta} desabilitado={false} />
               </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão de avançar etapa */}
      {etapaAtual && (
        <div className="flex justify-end">
          <Button
            onClick={handleAvancar}
            disabled={processando}
            size="lg"
            className={`${etapaAtual.cor} text-white flex items-center gap-2`}
          >
            {processando ? <Spinner size="sm" /> : <CheckCircle className="w-5 h-5" />}
            {etapaAtual.label}
          </Button>
        </div>
      )}

      {/* Card de finalização */}
      {!etapaAtual && statusAtual === 'finalizada' && (
        <Card className="bg-green-50 border-green-200 text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-green-800">
            {tipoOperacao === 'carregamento' ? 'Carregamento Finalizado' : 'Descarregamento Finalizado'}
          </h2>
          <p className="text-sm text-green-700 mt-1">A operação foi concluída com sucesso.</p>
        </Card>
      )}
    </div>
  )
}

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