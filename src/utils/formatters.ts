import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatarDataHora(dataISO: string): string {
  try {
    return format(parseISO(dataISO), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
  } catch {
    return dataISO
  }
}

export function formatarData(dataISO: string): string {
  try {
    return format(parseISO(dataISO), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return dataISO
  }
}