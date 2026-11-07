import { supabase } from '@/lib/supabase'
import type { HistoricoCarga } from '@/types'

export async function buscarHistorico(cargaId: string) {
  const { data, error } = await supabase
    .from('historico_carga')
    .select('*')
    .eq('carga_id', cargaId)
    .order('data_hora', { ascending: true })

  return { data: data as HistoricoCarga[] | null, error }
}