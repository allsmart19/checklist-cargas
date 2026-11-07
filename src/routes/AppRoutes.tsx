import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

// Layouts
import { AdminLayout } from '@/components/layout/AdminLayout'
import { OperadorLayout } from '@/components/layout/OperadorLayout'

// Páginas Auth
import { LoginPage } from '@/pages/auth/LoginPage'

// Páginas Admin
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { CargasPage } from '@/pages/admin/CargasPage'
import { DetalheCargaPage } from '@/pages/admin/DetalheCargaPage'
import { UsuariosPage } from '@/pages/admin/UsuariosPage'
import { CadastrosPage } from '@/pages/admin/CadastrosPage'
import { LogsPage } from '@/pages/admin/LogsPage'

// Páginas Operador
import { OperacaoPage } from '@/pages/operador/OperacaoPage'
import { NovaCargaPage } from '@/pages/operador/NovaCargaPage'
import { OperacaoCargaPage } from '@/pages/operador/OperacaoCargaPage'

function RotaProtegida({ perfil }: { perfil?: 'administrador' | 'operador' }) {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (perfil && usuario.perfil !== perfil) {
    return (
      <Navigate 
        to={usuario.perfil === 'administrador' ? '/admin' : '/operacao'} 
        replace 
      />
    )
  }

  return <Outlet />
}

export function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <Routes>
        {/* Rota Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas Protegidas: ADMINISTRADOR */}
        <Route element={<RotaProtegida perfil="administrador" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="cargas" element={<CargasPage />} />
            <Route path="cargas/:id" element={<DetalheCargaPage />} />
            <Route path="cadastros" element={<CadastrosPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="logs" element={<LogsPage />} />
          </Route>
        </Route>

        {/* Rotas Protegidas: OPERADOR */}
        <Route element={<RotaProtegida perfil="operador" />}>
          <Route path="/operacao" element={<OperadorLayout />}>
            <Route index element={<OperacaoPage />} />
            <Route path="nova-carga/carregamento" element={<NovaCargaPage tipo="carregamento" />} />
            <Route path="nova-carga/descarregamento" element={<NovaCargaPage tipo="descarregamento" />} />
            <Route path="carga/:id" element={<OperacaoCargaPage />} />
          </Route>
        </Route>

        {/* Redirecionamento de rota desconhecida */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}