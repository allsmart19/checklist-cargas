import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, AlertCircle, Upload, Download } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { criarCarga, buscarCadastrosAuxiliares } from '@/services/cargaService'

type TipoOperacao = 'carregamento' | 'descarregamento'

interface NovaCargaPageProps {
  tipo: TipoOperacao
}

// ✅ Schema com campos "Número do Container", "Número do Processo" e "Rua / Local" como opcionais
const schema = z.object({
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  numero_carga: z.string().optional(), // ✅ OPCIONAL (antes era obrigatório)
  quantidade_volumes: z.coerce.number().min(1, 'Quantidade de itens é obrigatória'),
  nota_fiscal: z.string().optional(), // ✅ OPCIONAL (antes era obrigatório)
  destino: z.string().optional(), // ✅ OPCIONAL (antes era obrigatório)
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function NovaCargaPage({ tipo }: NovaCargaPageProps) {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantidade_volumes: 1,
      numero_carga: '',
      nota_fiscal: '',
      destino: '',
      observacoes: ''
    }
  })

  useEffect(() => {
    async function loadClientes() {
      const dados = await buscarCadastrosAuxiliares()
      setClientes(dados.clientes || [])
    }
    loadClientes()
  }, [])

  async function onSubmit(data: FormData) {
    if (!usuario) return
    setErro(null)
    setCarregando(true)

    // ✅ Garante que o tipo seja salvo exatamente como 'carregamento' ou 'descarregamento'
    const tipoNormalizado = tipo === 'carregamento' ? 'carregamento' : 'descarregamento'
    
    const dadosParaSalvar = {
      // ✅ Trata numero_carga como opcional (evita erro se estiver vazio)
      numero_carga: data.numero_carga ? data.numero_carga.toUpperCase() : null,
      cliente_id: data.cliente_id,
      quantidade_volumes: data.quantidade_volumes,
      nota_fiscal: data.nota_fiscal || null,
      destino: data.destino || null,
      observacoes: data.observacoes || null,
      origem: null,
      transportadora_id: null,
      motorista_id: null,
      veiculo_id: null,
      quantidade_containers: 0,
      tipo_carga: tipoNormalizado // ✅ CAMPO SALVO CORRETAMENTE
    }

    console.log('💾 Salvando carga com tipo_carga:', tipoNormalizado, dadosParaSalvar)

    const { error, carga } = await criarCarga(dadosParaSalvar, usuario.id)
    setCarregando(false)

    if (error) {
      setErro(error.message || 'Erro ao criar carga. Verifique se o número do container já existe.')
      return
    }

    console.log('✅ Carga criada com sucesso:', carga)
    navigate(`/operacao/carga/${carga.id}`)
  }

  const ehCarregamento = tipo === 'carregamento'
  const titulo = ehCarregamento ? 'Novo Carregamento' : 'Novo Descarregamento'
  const corIcone = ehCarregamento ? 'text-blue-600' : 'text-green-600'
  const corBotao = ehCarregamento ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
  // ✅ Correção do ícone: usar como componente JSX (com letra maiúscula)
  const IconeOperacao = ehCarregamento ? Upload : Download

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <IconeOperacao className={`w-8 h-8 ${corIcone}`} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
          <p className="text-sm text-gray-500">Preencha os dados para iniciar o registro</p>
        </div>
      </div>

      {erro && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{erro}</p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Select
            label="Cliente *"
            placeholder="Selecione o cliente"
            options={clientes.map(c => ({ value: c.id, label: c.nome }))}
            error={errors.cliente_id?.message}
            {...register('cliente_id')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              {/* ✅ Asterisco removido do label */}
              <label className="block text-sm font-medium text-gray-700 mb-1">Número do Container</label>
              <input
                className={`w-full rounded-lg border px-4 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.numero_carga ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: MSCU1234567"
                {...register('numero_carga')}
              />
              {errors.numero_carga && <p className="mt-1 text-xs text-red-500">{errors.numero_carga.message}</p>}
            </div>
            <Input
              label="Quantidade de Itens *"
              type="number"
              min="1"
              error={errors.quantidade_volumes?.message}
              {...register('quantidade_volumes')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* ✅ Asterisco removido do label */}
            <Input
              label="Número do Processo"
              placeholder="Ex: PROC-2024-001"
              error={errors.nota_fiscal?.message}
              {...register('nota_fiscal')}
            />
            {/* ✅ Asterisco removido do label */}
            <Input
              label="Rua / Local"
              placeholder="Ex: Rua 250, Setor B"
              error={errors.destino?.message}
              {...register('destino')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Informações adicionais sobre a carga..."
              {...register('observacoes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => navigate('/operacao')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={carregando} className={`flex items-center gap-2 ${corBotao} text-white`}>
              {carregando ? <Spinner size="sm" /> : <PlusCircle className="w-4 h-4" />}
              {carregando ? 'Salvando...' : `Iniciar ${ehCarregamento ? 'Carregamento' : 'Descarregamento'}`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}