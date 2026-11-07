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