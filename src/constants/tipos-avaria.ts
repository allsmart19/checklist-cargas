import type { TipoAvaria } from '@/types'

export const TIPOS_AVARIA_LABELS: Record<TipoAvaria, string> = {
  embalagem_danificada: 'Embalagem Danificada',
  produto_quebrado: 'Produto Quebrado',
  amassado: 'Amassado',
  molhado: 'Molhado',
  rasgado: 'Rasgado',
  falta_de_volume: 'Falta de Volume',
  divergencia: 'Divergência',
  lacre_violado: 'Lacre Violado',
  outro: 'Outro',
}
