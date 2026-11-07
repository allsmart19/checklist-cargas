import { supabase } from '@/lib/supabase'

export type TipoRegistro = 'carregamento' | 'descarregamento'

export interface RegistroOperacional {
  id: string
  tipo: TipoRegistro
  cliente: string
  numero_container: string
  quantidade_itens: number
  numero_processo: string | null
  rua: string | null
  criado_por: string | null
  criado_em: string
}

export async function listarRegistros(tipo: TipoRegistro) {
  const { data, error } = await supabase
    .from('registros_operacionais')
    .select('*')
    .eq('tipo', tipo)
    .order('criado_em', { ascending: false })

  return { data: data as RegistroOperacional[] | null, error }
}

export async function criarRegistro(
  dados: Omit<RegistroOperacional, 'id' | 'criado_por' | 'criado_em'>,
  usuarioId: string
) {
  const { data, error } = await supabase
    .from('registros_operacionais')
    .insert({ ...dados, criado_por: usuarioId })
    .select()
    .single()

  return { data: data as RegistroOperacional | null, error }
}

export async function excluirRegistro(id: string) {
  const { error } = await supabase
    .from('registros_operacionais')
    .delete()
    .eq('id', id)

  return { error }
}