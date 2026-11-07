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

      const { data: usuarioExiste } = await supabase
        .from('usuarios')
        .select('id, ativo')
        .eq('username', usernameLimpo)
        .single()

      if (!usuarioExiste) return { error: 'Usuario nao encontrado.' }
      if (!usuarioExiste.ativo) return { error: 'Usuario bloqueado. Contate o administrador.' }

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

W "src\components\layout\AdminLayout.tsx" @'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, Users, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/cargas', label: 'Cargas', icon: Package },
  { path: '/admin/usuarios', label: 'Usuarios', icon: Users },
]

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Checklist Cargas</h1>
          <p className="text-sm text-gray-400 mt-1">Painel Administrativo</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const ativo = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${ativo ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="mb-3 px-4">
            <p className="text-sm font-medium">{usuario?.nome}</p>
            <p className="text-xs text-gray-400">Administrador</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 w-full transition-colors">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
'@

W "src\components\layout\OperadorLayout.tsx" @'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { ClipboardList, PlusCircle, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const menuItems = [
  { path: '/operacao', label: 'Operacoes', icon: ClipboardList },
  { path: '/operacao/nova-carga', label: 'Nova Carga', icon: PlusCircle },
]

export function OperadorLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <h1 className="text-xl font-bold">Checklist Cargas</h1>
          <p className="text-sm text-blue-300 mt-1">Operacao</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const ativo = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${ativo ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-blue-800'}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-blue-800">
          <div className="mb-3 px-4">
            <p className="text-sm font-medium">{usuario?.nome}</p>
            <p className="text-xs text-blue-300">Operador</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-blue-200 hover:bg-blue-800 w-full transition-colors">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
'@

W "src\pages\auth\LoginPage.tsx" @'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

export function LoginPage() {
  const { login, usuario } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    const { error } = await login(username, senha)
    setCarregando(false)

    if (error) {
      setErro(error)
      return
    }

    // Aguarda o AuthContext carregar o usuario e redireciona
    setTimeout(() => {
      if (usuario?.perfil === 'administrador') navigate('/admin', { replace: true })
      else navigate('/operacao', { replace: true })
    }, 500)
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
          <Button type="submit" disabled={carregando} size="lg" className="w-full flex items-center justify-center gap-2">
            {carregando ? (
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

W "src\pages\admin\DashboardPage.tsx" @'
export function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <p className="text-gray-500">Dashboard em construcao.</p>
    </div>
  )
}
'@

W "src\pages\admin\CargasPage.tsx" @'
export function CargasPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Cargas</h1>
      <p className="text-gray-500">Listagem de cargas em construcao.</p>
    </div>
  )
}
'@

W "src\pages\admin\DetalheCargaPage.tsx" @'
export function DetalheCargaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Detalhe da Carga</h1>
      <p className="text-gray-500">Detalhamento em construcao.</p>
    </div>
  )
}
'@

W "src\pages\admin\UsuariosPage.tsx" @'
export function UsuariosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Usuarios</h1>
      <p className="text-gray-500">Gestao de usuarios em construcao.</p>
    </div>
  )
}
'@

W "src\pages\operador\OperacaoPage.tsx" @'
export function OperacaoPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Operacoes</h1>
      <p className="text-gray-500">Lista de operacoes em construcao.</p>
    </div>
  )
}
'@

W "src\pages\operador\NovaCargaPage.tsx" @'
export function NovaCargaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nova Carga</h1>
      <p className="text-gray-500">Formulario de nova carga em construcao.</p>
    </div>
  )
}
'@

W "src\pages\operador\OperacaoCargaPage.tsx" @'
export function OperacaoCargaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Operacao da Carga</h1>
      <p className="text-gray-500">Fluxo de operacao em construcao.</p>
    </div>
  )
}
'@

W "src\routes\AppRoutes.tsx" @'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { OperadorLayout } from '@/components/layout/OperadorLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { CargasPage } from '@/pages/admin/CargasPage'
import { DetalheCargaPage } from '@/pages/admin/DetalheCargaPage'
import { UsuariosPage } from '@/pages/admin/UsuariosPage'
import { OperacaoPage } from '@/pages/operador/OperacaoPage'
import { NovaCargaPage } from '@/pages/operador/NovaCargaPage'
import { OperacaoCargaPage } from '@/pages/operador/OperacaoCargaPage'

function RotaProtegida({ children, perfil }: { children: React.ReactNode; perfil?: 'administrador' | 'operador' }) {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" replace />

  if (perfil && usuario.perfil !== perfil) {
    return <Navigate to={usuario.perfil === 'administrador' ? '/admin' : '/operacao'} replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RotaProtegida perfil="administrador">
              <AdminLayout />
            </RotaProtegida>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="cargas" element={<CargasPage />} />
          <Route path="cargas/:id" element={<DetalheCargaPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
        </Route>
        <Route
          path="/operacao"
          element={
            <RotaProtegida perfil="operador">
              <OperadorLayout />
            </RotaProtegida>
          }
        >
          <Route index element={<OperacaoPage />} />
          <Route path="nova-carga" element={<NovaCargaPage />} />
          <Route path="carga/:id" element={<OperacaoCargaPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
'@

W "src\App.tsx" @'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
'@

W "src\main.tsx" @'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
'@

# Limpeza de arquivos inutilizados
Remove-Item (Join-Path $root "src\App.css") -ErrorAction SilentlyContinue
Get-ChildItem -Path $root -Recurse -Filter "Novo Documento de Texto.txt" | Remove-Item -Force

Write-Host "`nPARTE 2 CONCLUIDA! Execute: npm run dev" -ForegroundColor Green