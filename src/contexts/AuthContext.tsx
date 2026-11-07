import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Usuario } from '@/types'

interface AuthContextType {
  session: Session | null
  usuario: Usuario | null
  carregando: boolean
  login: (username: string, senha: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        buscarUsuario(session.user.id)
      } else {
        setCarregando(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        buscarUsuario(session.user.id)
      } else {
        setUsuario(null)
        setCarregando(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function buscarUsuario(authUserId: string) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()

      if (error || !data || !data.ativo) {
        await supabase.auth.signOut()
        setUsuario(null)
      } else {
        setUsuario(data as Usuario)
      }
    } catch {
      setUsuario(null)
    } finally {
      setCarregando(false)
    }
  }

  async function login(username: string, senha: string) {
    try {
      const usernameLimpo = username.toLowerCase().trim()
      const emailFicticio = `${usernameLimpo}@checklist-cargas.app`

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailFicticio,
        password: senha,
      })

      if (authError) return { error: 'Usuario ou senha invalidos.' }

      return { error: null }
    } catch {
      return { error: 'Erro de conexao. Verifique sua internet.' }
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUsuario(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}