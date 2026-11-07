import { useRef, useState } from 'react'
import { Upload, Camera, AlertCircle } from 'lucide-react'
import type { EtapaFoto, TipoFoto } from '@/types'
import { uploadFoto } from '@/services/fotoService'
import { useAuth } from '@/contexts/AuthContext'

interface FotoUploaderProps {
  cargaId: string
  etapa: EtapaFoto
  tipo?: TipoFoto
  onUploadSucesso: () => void
}

export function FotoUploader({ cargaId, etapa, tipo = 'geral_carga', onUploadSucesso }: FotoUploaderProps) {
  const { usuario } = useAuth()
  const inputArquivoRef = useRef<HTMLInputElement>(null)
  const inputCameraRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || !usuario) return
    
    setErro(null)
    setEnviando(true)
    setProgresso(0)
    
    const arquivos = Array.from(files).filter(f => f.type.startsWith('image/'))
    
    if (arquivos.length === 0) {
      setErro('Nenhuma imagem válida selecionada.')
      setEnviando(false)
      return
    }

    let sucesso = 0
    let falhas = 0

    for (let i = 0; i < arquivos.length; i++) {
      const arquivo = arquivos[i]
      setProgresso(Math.round(((i + 1) / arquivos.length) * 100))
      
      const { error } = await uploadFoto(arquivo, cargaId, etapa, usuario.id, tipo)
      
      if (error) {
        falhas++
        console.error(`Falha ao enviar ${arquivo.name}:`, error)
      } else {
        sucesso++
      }
    }

    setEnviando(false)
    setProgresso(100)
    
    // Limpa inputs
    if (inputArquivoRef.current) inputArquivoRef.current.value = ''
    if (inputCameraRef.current) inputCameraRef.current.value = ''

    if (falhas > 0) {
      setErro(`${falhas} arquivo(s) falharam. ${sucesso > 0 ? `${sucesso} enviado(s) com sucesso.` : ''}`)
    } else {
      onUploadSucesso()
    }
  }

  return (
    <div className="mt-4">
      {/* Inputs ocultos */}
      <input
        ref={inputArquivoRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={enviando}
      />
      <input
        ref={inputCameraRef}
        type="file"
        accept="image/*"
        capture="environment" // Abre a câmera traseira no mobile
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={enviando}
      />
      
      {/* Botões de ação */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => inputArquivoRef.current?.click()}
          disabled={enviando}
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-6 h-6" />
          <span className="text-sm font-medium">Galeria</span>
          <span className="text-xs text-gray-400">Selecionar arquivos</span>
        </button>

        <button
          type="button"
          onClick={() => inputCameraRef.current?.click()}
          disabled={enviando}
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="w-6 h-6" />
          <span className="text-sm font-medium">Câmera</span>
          <span className="text-xs text-gray-400">Tirar foto agora</span>
        </button>
      </div>

      {/* Barra de progresso */}
      {enviando && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Enviando...</span>
            <span className="text-sm text-gray-500">{progresso}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {erro && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{erro}</p>
            <button
              onClick={() => setErro(null)}
              className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}