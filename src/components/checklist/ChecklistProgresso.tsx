import { CheckCircle, AlertCircle } from 'lucide-react'

interface ChecklistProgressoProps {
  total: number
  respondidos: number
  ok: number
  naoOk: number
  progresso: number
  concluido: boolean
}

export function ChecklistProgresso({
  total, respondidos, ok, naoOk, progresso, concluido
}: ChecklistProgressoProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">Progresso da Conferência</h3>
          <p className="text-sm text-gray-500">
            {respondidos} de {total} itens respondidos
          </p>
        </div>
        {concluido && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Concluído
          </span>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
        <div
          className={`h-2.5 rounded-full transition-all ${
            concluido ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progresso}%` }}
        />
      </div>

      {/* Legenda */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">OK: <strong>{ok}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">Não OK: <strong>{naoOk}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-gray-600">Pendentes: <strong>{total - respondidos}</strong></span>
        </div>
      </div>

      {naoOk > 0 && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <strong>Atenção:</strong> {naoOk} item(ns) com não conformidade. 
            Considere registrar uma avaria antes de prosseguir.
          </p>
        </div>
      )}
    </div>
  )
}