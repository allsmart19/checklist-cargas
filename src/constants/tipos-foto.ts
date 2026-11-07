import type { TipoFoto } from '@/types'

export const TIPOS_FOTO_LABELS: Record<TipoFoto, string> = {
  geral_carga: 'Foto Geral da Carga',
  lacre: 'Lacre',
  embalagem: 'Embalagens',
  pallet: 'Pallets',
  identificacao: 'Identificação',
  descarga: 'Descarga',
  volume: 'Volumes',
  condicao_embalagem: 'Condição da Embalagem',
  carga_descarregada: 'Carga Descarregada',
  conferencia_final: 'Conferência Final',
  local_armazenamento: 'Local de Armazenamento',
  avaria: 'Avaria',
  volume_avariado: 'Volume Avariado',
  outro: 'Outro',
}
