import type { StatusCarga } from '@/types'

export const STATUS_CARGA_LABELS: Record<StatusCarga, string> = {
  recebida: 'Recebida',
  conferencia: 'Em Conferencia',
  descarga: 'Em Descarga',
  inspecao: 'Em Inspecao',
  finalizada: 'Finalizada',
  com_avaria: 'Com Avaria',
}

export const STATUS_CARGA_CORES: Record<StatusCarga, string> = {
  recebida: 'bg-yellow-100 text-yellow-800',
  conferencia: 'bg-blue-100 text-blue-800',
  descarga: 'bg-purple-100 text-purple-800',
  inspecao: 'bg-orange-100 text-orange-800',
  finalizada: 'bg-green-100 text-green-800',
  com_avaria: 'bg-red-100 text-red-800',
}