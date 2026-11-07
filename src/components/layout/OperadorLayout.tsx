import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { ClipboardList, Upload, Download, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const menuItems = [
  { path: '/operacao', label: 'Operações', icon: ClipboardList },
  { path: '/operacao/nova-carga/carregamento', label: 'Carregamento', icon: Upload },
  { path: '/operacao/nova-carga/descarregamento', label: 'Descarregamento', icon: Download },
]

export function OperadorLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function fecharMenu() {
    setMenuAberto(false)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Overlay escuro no mobile quando menu aberto */}
      {menuAberto && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={fecharMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-blue-900 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${menuAberto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-blue-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Checklist Cargas</h1>
            <p className="text-sm text-blue-300 mt-1">Operação</p>
          </div>
          <button
            onClick={fecharMenu}
            className="md:hidden text-blue-200 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const ativo = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={fecharMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  ativo
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-200 hover:bg-blue-800'
                }`}
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-blue-200 hover:bg-blue-800 w-full transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile */}
        <header className="md:hidden bg-blue-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setMenuAberto(true)}
            className="p-2 hover:bg-blue-800 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">Checklist Cargas</h1>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}