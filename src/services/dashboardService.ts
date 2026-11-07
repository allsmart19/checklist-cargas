import { supabase } from '@/lib/supabase'

export interface DashboardIndicadores {
  total_cargas: number
  cargas_recebidas: number
  cargas_em_andamento: number
  cargas_finalizadas: number
  cargas_com_avaria: number
}

export interface AvariaPorTipo {
  tipo: string
  quantidade: number
}

export interface CargaPorCliente {
  cliente_id: string
  cliente: string
  quantidade_cargas: number
}

export interface CargaPorDia {
  data: string
  quantidade: number
}

// Busca os indicadores principais
export async function buscarIndicadores(): Promise<DashboardIndicadores | null> {
  const { data, error } = await supabase
    .from('vw_dashboard_cargas')
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao buscar indicadores:', error)
    return null
  }
  return data as DashboardIndicadores
}

// Busca avarias agrupadas por tipo
export async function buscarAvariasPorTipo(): Promise<AvariaPorTipo[]> {
  const { data, error } = await supabase
    .from('vw_avarias_por_tipo')
    .select('*')

  if (error) return []
  return (data as AvariaPorTipo[]) || []
}

// Busca cargas agrupadas por cliente
export async function buscarCargasPorCliente(): Promise<CargaPorCliente[]> {
  const { data, error } = await supabase
    .from('vw_cargas_por_cliente')
    .select('*')
    .limit(10)

  if (error) return []
  return (data as CargaPorCliente[]) || []
}

// Busca cargas agrupadas por dia (últimos 7 dias)
export async function buscarCargasPorDia(): Promise<CargaPorDia[]> {
  const { data, error } = await supabase
    .from('vw_cargas_por_dia')
    .select('*')
    .limit(7)

  if (error) return []
  return (data as CargaPorDia[]) || []
}

// Busca últimas cargas cadastradas
export async function buscarUltimasCargas(limit = 5) {
  const { data, error } = await supabase
    .from('vw_cargas_resumo')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(limit)

  return { data, error }
}