import { useState, useRef } from 'react'
import { AlertTriangle, Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TIPOS_AVARIA_LABELS } from '@/constants/tipos-avaria'
import { registrarAvaria } from '@/services/avariaService'
import { useAuth } from '@/contexts/AuthContext'
import type { TipoAvaria } from '@/types'

interface RegistrarAvariaProps {
  cargaId: string
  onSuccess: () => void
  onCancel: () => void
}

export function RegistrarAvaria({ cargaId, onSuccess, onCancel }: RegistrarAvariaProps) {
  const { usuario } = useAuth()
  const [tipo, setTipo] = useState<TipoAvaria>('embalagem_danificada')
  const [descricao, setDescricao] = useState('')
  const [observacao, setObservacao] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const opcoesTipo = Object.entries(TIPOS_AVARIA_LABELS).map(([value, label]) => ({
    value,
    label
  }))

  function handleFiles(files: FileList | null) {
    if (!files) return
    const novasFotos = Array.from(files).filter(f => f.type.startsWith('image/'))
    setFotos(prev => [...prev, ...novasFotos])
    if (inputRef.current) inputRef.current.value = ''
  }

  function removerFoto(index: number) {
    setFotos(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!usuario) return
    if (!descricao.trim()) {
      setErro('A descrição da avaria é obrigatória.')
      return
    }

    setEnviando(true)
    setErro(null)

    const { error } = await registrarAvaria(
      cargaId,
      tipo,
      descricao,
      observacao || null,
      usuario.id,
      fotos
    )

    setEnviando(false)

    if (error) {
      setErro(error)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg border border-red-200 shadow-sm">
      <h3 className="font-bold text-red-800 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Registrar Nova Avaria
      </h3>

      {erro && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          {erro}
        </div>
      )}

      <Select
        label="Tipo de Avaria *"
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoAvaria)}
        options={opcoesTipo}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
        <input
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Ex: Caixa amassada no canto superior direito"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
        <textarea
          rows={2}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Detalhes adicionais sobre o dano..."
        />
      </div>

      {/* Upload de Fotos da Avaria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fotos da Evidência</label>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={enviando}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center text-gray-500 hover:border-red-500 hover:text-red-500 transition-colors"
        >
          <Upload className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">Adicionar fotos da avaria</span>
        </button>

        {fotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {fotos.map((foto, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                <img src={URL.createObjectURL(foto)} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removerFoto(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" variant="danger" disabled={enviando} className="flex-1 flex items-center justify-center gap-2">
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
          {enviando ? 'Registrando...' : 'Registrar Avaria'}
        </Button>
      </div>
    </form>
  )
}