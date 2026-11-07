import { useEffect, useState } from 'react'
import { Building2, Plus, Edit2, Trash2, X, Save } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import {
  listarClientes,
  criarCliente,
  atualizarCliente,
  excluirCliente
} from '@/services/cadastrosService'
import { formatarDataHora } from '@/utils/formatters'
import type { Cliente } from '@/types'

export function CadastrosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [formNome, setFormNome] = useState('')
  const [formDocumento, setFormDocumento] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    carregarClientes()
  }, [])

  async function carregarClientes() {
    setCarregando(true)
    const { data } = await listarClientes()
    setClientes(data || [])
    setCarregando(false)
  }

  function limparForm() {
    setFormNome('')
    setFormDocumento('')
    setEditandoId(null)
    setMostrarForm(false)
    setErro(null)
  }

  function abrirFormCriar() {
    limparForm()
    setMostrarForm(true)
  }

  function abrirFormEditar(cliente: Cliente) {
    setFormNome(cliente.nome)
    setFormDocumento(cliente.documento || '')
    setEditandoId(cliente.id)
    setMostrarForm(true)
    setErro(null)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setProcessando(true)

    let resultado: { error: any } | null = null

    try {
      if (editandoId) {
        resultado = await atualizarCliente(editandoId, formNome, formDocumento)
      } else {
        resultado = await criarCliente(formNome, formDocumento)
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar cliente')
      setProcessando(false)
      return
    }

    setProcessando(false)

    if (resultado?.error) {
      setErro(resultado.error.message || 'Erro ao salvar cliente')
      return
    }

    limparForm()
    await carregarClientes()
  }

  async function handleExcluir(cliente: Cliente) {
    if (!confirm(`Confirma excluir o cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`)) return

    setProcessando(true)
    const { error } = await excluirCliente(cliente.id)
    setProcessando(false)

    if (error) {
      setErro(error.message || 'Erro ao excluir cliente')
      return
    }

    await carregarClientes()
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">Gerenciar clientes cadastrados no sistema</p>
        </div>
      </div>

      {erro && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro(null)} className="text-sm underline">Fechar</button>
        </div>
      )}

      {/* Formulário de Cadastro */}
      {mostrarForm && (
        <Card className="mb-6 border-blue-200 bg-blue-50/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {editandoId ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <button onClick={limparForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome / Razão Social *"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Nome do cliente ou razão social"
                required
              />
              <Input
                label="Documento (CPF/CNPJ)"
                value={formDocumento}
                onChange={(e) => setFormDocumento(e.target.value)}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={limparForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={processando} className="flex items-center gap-2">
                {processando ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                {processando ? 'Salvando...' : 'Salvar Cliente'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de Clientes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Clientes Cadastrados
            <Badge className="ml-2 bg-gray-100 text-gray-600">{clientes.length}</Badge>
          </h2>
          <Button onClick={abrirFormCriar} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </div>

        {carregando ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum cliente cadastrado</p>
            <p className="text-sm mt-1">Clique em "Novo Cliente" para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Nome</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Documento</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Criado em</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{cliente.nome}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{cliente.documento || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge className={cliente.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatarDataHora(cliente.criado_em)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirFormEditar(cliente)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Editar cliente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExcluir(cliente)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Excluir cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}