$root = "C:\Users\Administrador\checklist-cargas"

function W([string]$rel, [string]$txt) {
  $full = Join-Path $root $rel
  $dir = Split-Path $full -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [IO.File]::WriteAllText($full, $txt)
  Write-Host "OK  $rel" -ForegroundColor Green
}

W "src\contexts\AuthContext.tsx" @'
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
'@

W "src\pages\auth\LoginPage.tsx" @'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

export function LoginPage() {
  const { login, usuario, carregando } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregandoLogin, setCarregandoLogin] = useState(false)

  useEffect(() => {
    if (!carregando && usuario) {
      navigate(usuario.perfil === 'administrador' ? '/admin' : '/operacao', { replace: true })
    }
  }, [carregando, usuario, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregandoLogin(true)

    const { error } = await login(username, senha)
    setCarregandoLogin(false)

    if (error) setErro(error)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Checklist de Cargas</h1>
          <p className="text-sm text-gray-500 mt-1">Faca login para continuar</p>
        </div>

        {erro && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Usuario"
            placeholder="Digite seu usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <Button type="submit" disabled={carregandoLogin} size="lg" className="w-full flex items-center justify-center gap-2">
            {carregandoLogin ? (
              <>
                <Spinner size="sm" />
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
'@

Write-Host "`nCORRECAO APLICADA! Execute: npm run dev" -ForegroundColor Green