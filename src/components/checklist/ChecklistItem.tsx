import { useState } from 'react'
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import type { ChecklistResposta, RespostaChecklist } from '@/types'

interface ChecklistItemProps {
  item: ChecklistResposta
  // A assinatura agora exige o ID como primeiro parâmetro
  onSalvar: (id: string, resposta: RespostaChecklist, observacao: string) => void
  desabilitado?: boolean
}

const OPCOES: { valor: RespostaChecklist; label: string; cor: string; icone: any }[] = [
  { valor: 'ok', label: 'OK', cor: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200', icone: CheckCircle },
  { valor: 'nao_ok', label: 'NÃO OK', cor: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200', icone: XCircle },
  { valor: 'nao_verificado', label: 'Não verificado', cor: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200', icone: HelpCircle },
]

export function ChecklistItem({ item, onSalvar, desabilitado = false }: ChecklistItemProps) {
  const [observacao, setObservacao] = useState(item.observacao || '')
  const [editandoObs, setEditandoObs] = useState(false)

  const opcaoSelecionada = OPCOES.find(o => o.valor === item.resposta)

  function handleSelecionar(valor: RespostaChecklist) {
    if (desabilitado) return
    // CORREÇÃO: Passamos o item.id como primeiro argumento
    onSalvar(item.id, valor, observacao)
  }

  function handleSalvarObs() {
    // CORREÇÃO: Passamos o item.id como primeiro argumento
    onSalvar(item.id, item.resposta, observacao)
    setEditandoObs(false)
  }

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      item.resposta === 'ok' ? 'border-green-300 bg-green-50' :
      item.resposta === 'nao_ok' ? 'border-red-300 bg-red-50' :
      'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="font-medium text-gray-900 flex-1">{item.item}</h3>
        {opcaoSelecionada && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${opcaoSelecionada.cor}`}>
            <opcaoSelecionada.icone className="w-3 h-3" />
            {opcaoSelecionada.label}
          </span>
        )}
      </div>

      {/* Botões de resposta */}
      <div className="grid grid-cols-3 gap-2">
        {OPCOES.map((opcao) => {
          const selecionado = item.resposta === opcao.valor
          return (
            <button
              key={opcao.valor}
              type="button"
              disabled={desabilitado}
              onClick={() => handleSelecionar(opcao.valor)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                selecionado
                  ? `${opcao.cor} ring-2 ring-offset-1 ring-blue-500`
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              } ${desabilitado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <opcao.icone className="w-4 h-4" />
              {opcao.label}
            </button>
          )
        })}
      </div>

      {/* Campo de observação */}
      {(item.resposta === 'nao_ok' || editandoObs) && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Observação {item.resposta === 'nao_ok' && <span className="text-red-600">* obrigatória</span>}
          </label>
          <textarea
            rows={2}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            onBlur={handleSalvarObs}
            placeholder="Descreva o problema encontrado..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {item.resposta === 'ok' && !editandoObs && (
        <button
          type="button"
          onClick={() => setEditandoObs(true)}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
        >
          + Adicionar observação
        </button>
      )}
    </div>
  )
}