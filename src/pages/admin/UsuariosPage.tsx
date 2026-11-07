import { useEffect, useState } from 'react'
import { Users, Plus, Edit2, Trash2, X, Save, Lock, Unlock, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  alternarStatusUsuario,
  excluirUsuario
} from '@/services/usuarioService'
import { formatarDataHora } from '@/utils/formatters'
import type { Usuario, PerfilUsuario } from '@/types'

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  // Form de criação
  const [novoNome, setNovoNome] = useState('')
  const [novoUsername, setNovoUsername] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [novoPerfil, setNovoPerfil] = useState<PerfilUsuario>('operador')

  // Form de edição
  const [editNome, setEditNome] = useState('')
  const [editPerfil, setEditPerfil] = useState<PerfilUsuario>('operador')

  useEffect(() => {
    carregarUsuarios()
  }, [])

  async function carregarUsuarios() {
    setCarregando(true)
    const { data, error } = await listarUsuarios()
    
    if (error) {
      console.error('Erro ao carregar usuários:', error)
      setErro('Erro ao carregar lista de usuários')
    } else {
      setUsuarios(data || [])
    }
    
    setCarregando(false)
  }

  function limparForm() {
    setNovoNome('')
    setNovoUsername('')
    setNovaSenha('')
    setNovoPerfil('operador')
    setMostrarForm(false)
    setErro(null)
    setSucesso(null)
  }

  // Gera email automático baseado no username
  function gerarEmailAutomatico(username: string): string {
    return `${username.toLowerCase().trim()}@checklist-cargas.app`
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    setProcessando(true)

    // Gera o email automaticamente
    const emailAutomatico = gerarEmailAutomatico(novoUsername)

    console.log('📝 Criando usuário:', { nome: novoNome, username: novoUsername, email: emailAutomatico })

    const { usuario, error } = await criarUsuario(
      novoNome,
      novoUsername,
      emailAutomatico,
      novaSenha,
      novoPerfil
    )

    setProcessando(false)

    if (error) {
      console.error('❌ Erro ao criar:', error)
      setErro(error)
      return
    }

    console.log('✅ Usuário criado:', usuario)
    setSucesso(`Usuário "${novoNome}" criado com sucesso!`)
    limparForm()
    await carregarUsuarios()
    
    // Limpa mensagem de sucesso após 3 segundos
    setTimeout(() => setSucesso(null), 3000)
  }

  async function handleEditar(usuarioId: string) {
    setErro(null)
    setProcessando(true)

    const { error } = await atualizarUsuario(usuarioId, {
      nome: editNome,
      perfil: editPerfil
    })

    setProcessando(false)

    if (error) {
      setErro(error.message || 'Erro ao atualizar usuário')
      return
    }

    setEditandoId(null)
    await carregarUsuarios()
  }

  async function handleAlternarStatus(usuario: Usuario) {
    if (!confirm(`Confirma ${usuario.ativo ? 'bloquear' : 'desbloquear'} o usuário ${usuario.nome}?`)) {
      return
    }

    const { error } = await alternarStatusUsuario(usuario.id, !usuario.ativo)
    if (error) {
      setErro(error.message || 'Erro ao alterar status')
      return
    }

    await carregarUsuarios()
  }

  async function handleExcluir(usuario: Usuario) {
    if (usuario.perfil === 'administrador') {
      setErro('Não é possível excluir usuários administradores.')
      return
    }

    if (!confirm(`Confirma excluir o usuário "${usuario.nome}"?\n\nEsta ação não pode ser desfeita.`)) {
      return
    }

    setProcessando(true)
    const { error } = await excluirUsuario(usuario.id)
    setProcessando(false)

    if (error) {
      setErro(error)
      return
    }

    await carregarUsuarios()
  }

  function abrirEdicao(usuario: Usuario) {
    setEditandoId(usuario.id)
    setEditNome(usuario.nome)
    setEditPerfil(usuario.perfil)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
            <p className="text-sm text-gray-500">
              {usuarios.length} usuário(s) cadastrado(s)
            </p>
          </div>
        </div>
        <Button onClick={() => setMostrarForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Mensagem de Erro */}
      {erro && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{erro}</p>
            <button onClick={() => setErro(null)} className="text-xs underline mt-1">Fechar</button>
          </div>
        </div>
      )}

      {/* Mensagem de Sucesso */}
      {sucesso && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{sucesso}</p>
        </div>
      )}

      {/* Formulário de Criação */}
      {mostrarForm && (
        <Card className="mb-6 border-blue-200 bg-blue-50/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Criar Novo Usuário</h2>
            <button onClick={limparForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCriar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome Completo *"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: João Silva"
                required
              />
              <Input
                label="Username *"
                value={novoUsername}
                onChange={(e) => setNovoUsername(e.target.value.toLowerCase())}
                placeholder="Ex: joao"
                required
              />
              <Input
                label="Senha Inicial *"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil *</label>
                <select
                  value={novoPerfil}
                  onChange={(e) => setNovoPerfil(e.target.value as PerfilUsuario)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="operador">Operador</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
            </div>

            {/* Preview do email automático */}
            {novoUsername.trim().length > 0 && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-1">Email gerado automaticamente (somente leitura)</p>
                <p className="text-sm text-gray-700 font-mono">{gerarEmailAutomatico(novoUsername)}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={limparForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={processando} className="flex items-center gap-2">
                {processando ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                {processando ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de Usuários */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Nome</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Username</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Perfil</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Criado em</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {editandoId === usuario.id ? (
                        <input
                          type="text"
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          className="w-full rounded border px-2 py-1 text-sm"
                        />
                      ) : (
                        usuario.nome
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{usuario.username}</td>
                    <td className="py-3 px-4">
                      {editandoId === usuario.id ? (
                        <select
                          value={editPerfil}
                          onChange={(e) => setEditPerfil(e.target.value as PerfilUsuario)}
                          className="rounded border px-2 py-1 text-sm"
                        >
                          <option value="operador">Operador</option>
                          <option value="administrador">Administrador</option>
                        </select>
                      ) : (
                        <Badge className={usuario.perfil === 'administrador' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                          {usuario.perfil === 'administrador' ? 'Admin' : 'Operador'}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {usuario.ativo ? 'Ativo' : 'Bloqueado'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatarDataHora(usuario.criado_em)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editandoId === usuario.id ? (
                          <>
                            <Button size="sm" onClick={() => handleEditar(usuario.id)} disabled={processando}>
                              Salvar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditandoId(null)}>
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <button
                            onClick={() => abrirEdicao(usuario)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleAlternarStatus(usuario)}
                          className={usuario.ativo ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}
                          title={usuario.ativo ? 'Bloquear' : 'Desbloquear'}
                        >
                          {usuario.ativo ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>

                        {usuario.perfil !== 'administrador' && (
                          <button
                            onClick={() => handleExcluir(usuario)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// Import necessário para o ícone de sucesso
import { CheckCircle } from 'lucide-react'