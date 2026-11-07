import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Mostra o prompt após 3 segundos do primeiro acesso
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('Usuário instalou o app')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (!showPrompt || !deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-900 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom">
      <div className="flex-1">
        <p className="font-bold text-sm">Instalar Aplicativo</p>
        <p className="text-xs text-blue-200 mt-0.5">
          Adicione à tela inicial para acesso rápido
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="flex items-center gap-1 bg-white text-blue-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Instalar
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-blue-200 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}