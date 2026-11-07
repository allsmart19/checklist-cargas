import { useEffect, useState } from 'react'
import { Image as ImageIcon, Trash2, Loader2 } from 'lucide-react'
import { excluirFoto, buscarFotosPorEtapa } from '@/services/fotoService'
import type { Foto, EtapaFoto } from '@/types'
import { ImageModal } from '@/components/ui/ImageModal'

interface GaleriaFotosProps {
  cargaId: string
  etapa: EtapaFoto
}

export function GaleriaFotos({ cargaId, etapa }: GaleriaFotosProps) {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [fotoExpandida, setFotoExpandida] = useState<Foto | null>(null)

  useEffect(() => {
    async function load() {
      setCarregando(true)
      const { data } = await buscarFotosPorEtapa(cargaId, etapa)
      setFotos(data || [])
      setCarregando(false)
    }
    load()
  }, [cargaId, etapa])

  async function handleExcluir(foto: Foto) {
    if (!confirm('Confirma excluir esta foto?')) return

    setExcluindo(foto.id)
    const { error } = await excluirFoto(foto)
    setExcluindo(null)

    if (error) {
      alert('Erro ao excluir foto: ' + error.message)
      return
    }

    setFotos(prev => prev.filter(f => f.id !== foto.id))
  }

  if (carregando) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (fotos.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-400 italic">
        Nenhuma foto nesta etapa.
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
        {fotos.map((foto) => (
          <div
            key={foto.id}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setFotoExpandida(foto)}
          >
            <img
              src={foto.url || ''}
              alt={foto.tipo}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Overlay ao passar o mouse */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Botão Excluir */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleExcluir(foto)
              }}
              disabled={excluindo === foto.id}
              className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity disabled:opacity-50"
              title="Excluir foto"
            >
              {excluindo === foto.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </button>

            {/* Legenda inferior */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <p className="text-white text-xs truncate">
                {foto.tipo.replace('_', ' ')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Imagem Expandida */}
      {fotoExpandida && (
        <ImageModal
          url={fotoExpandida.url}
          alt={`${fotoExpandida.tipo.replace('_', ' ')} - ${fotoExpandida.etapa || ''}`}
          onClose={() => setFotoExpandida(null)}
        />
      )}
    </>
  )
}