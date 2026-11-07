import type { PerfilUsuario } from '@/types'

export function ehAdmin(perfil: PerfilUsuario): boolean {
  return perfil === 'administrador'
}

export function ehOperador(perfil: PerfilUsuario): boolean {
  return perfil === 'operador'
}
