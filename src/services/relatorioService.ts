import type { CargaResumo, ChecklistResposta, Avaria, Foto, HistoricoCarga } from '@/types'
import { buscarCargaDetalhe } from './cargaService'
import { buscarChecklist } from './checklistService'
import { buscarAvariasDaCarga } from './avariaService'
import { buscarFotosDaCarga } from './fotoService'
import { buscarHistorico } from './historicoService'

export interface DadosRelatorio {
  carga: CargaResumo
  checklist: ChecklistResposta[]
  avarias: Avaria[]
  fotos: Foto[]
  historico: HistoricoCarga[]
}

export async function buscarDadosRelatorio(cargaId: string): Promise<DadosRelatorio | null> {
  try {
    const [resCarga, resCheck, resAvar, resFoto, resHist] = await Promise.all([
      buscarCargaDetalhe(cargaId),
      buscarChecklist(cargaId),
      buscarAvariasDaCarga(cargaId),
      buscarFotosDaCarga(cargaId),
      buscarHistorico(cargaId)
    ])

    if (!resCarga.data) return null

    return {
      carga: resCarga.data,
      checklist: resCheck.data || [],
      avarias: resAvar.data || [],
      fotos: resFoto.data || [],
      historico: resHist.data || []
    }
  } catch (error) {
    console.error('Erro ao buscar dados do relatório:', error)
    return null
  }
}

// Converte URL remota em Data URL (para embutir no PDF)
export async function urlParaDataURL(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Erro ao converter URL:', error)
    return null
  }
}