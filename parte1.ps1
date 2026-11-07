$root = "C:\Users\Administrador\checklist-cargas"

function W([string]$rel, [string]$txt) {
  $full = Join-Path $root $rel
  $dir = Split-Path $full -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [IO.File]::WriteAllText($full, $txt)
  Write-Host "OK  $rel" -ForegroundColor Green
}

W "tailwind.config.js" @'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
'@

W "postcss.config.js" @'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
'@

W "src\index.css" @'
@tailwind base;
@tailwind components;
@tailwind utilities;
'@

W "src\lib\supabase.ts" @'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variaveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY sao obrigatorias.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
'@

W "src\types\index.ts" @'
export type PerfilUsuario = 'administrador' | 'operador'

export type StatusCarga =
  | 'recebida'
  | 'conferencia'
  | 'descarga'
  | 'inspecao'
  | 'finalizada'
  | 'com_avaria'

export type EtapaCarga =
  | 'recebida'
  | 'conferencia'
  | 'descarga'
  | 'inspecao'
  | 'finalizacao'

export type RespostaChecklist = 'ok' | 'nao_ok' | 'nao_verificado'

export type TipoAvaria =
  | 'embalagem_danificada'
  | 'produto_quebrado'
  | 'amassado'
  | 'molhado'
  | 'rasgado'
  | 'falta_de_volume'
  | 'divergencia'
  | 'lacre_violado'
  | 'outro'

export type TipoFoto =
  | 'geral_carga'
  | 'lacre'
  | 'embalagem'
  | 'pallet'
  | 'identificacao'
  | 'descarga'
  | 'volume'
  | 'condicao_embalagem'
  | 'carga_descarregada'
  | 'conferencia_final'
  | 'local_armazenamento'
  | 'avaria'
  | 'volume_avariado'
  | 'outro'

export interface Usuario {
  id: string
  auth_user_id: string | null
  nome: string
  username: string
  perfil: PerfilUsuario
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface Cliente {
  id: string
  nome: string
  documento: string | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface Transportadora {
  id: string
  nome: string
  documento: string | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface Motorista {
  id: string
  nome: string
  documento: string | null
  telefone: string | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface Veiculo {
  id: string
  placa: string
  modelo: string | null
  marca: string | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface Carga {
  id: string
  numero_carga: string
  cliente_id: string | null
  nota_fiscal: string | null
  origem: string | null
  destino: string | null
  transportadora_id: string | null
  motorista_id: string | null
  veiculo_id: string | null
  data_hora_recebimento: string
  quantidade_containers: number
  quantidade_volumes: number
  tipo_carga: string | null
  observacoes: string | null
  status: StatusCarga
  criado_por: string | null
  criado_em: string
  atualizado_em: string
}

export interface CargaResumo extends Carga {
  cliente_nome: string | null
  transportadora_nome: string | null
  motorista_nome: string | null
  veiculo_placa: string | null
  veiculo_modelo: string | null
  quantidade_fotos: number
  quantidade_avarias: number
}

export interface Avaria {
  id: string
  carga_id: string
  tipo: TipoAvaria
  descricao: string
  observacao: string | null
  responsavel_id: string | null
  data_hora: string
  criado_em: string
  atualizado_em: string
}

export interface ChecklistResposta {
  id: string
  carga_id: string
  item: string
  resposta: RespostaChecklist
  observacao: string | null
  usuario_id: string | null
  criado_em: string
  atualizado_em: string
}

export interface Foto {
  id: string
  carga_id: string
  avaria_id: string | null
  etapa: string | null
  tipo: TipoFoto
  nome_arquivo: string | null
  caminho_storage: string
  url: string | null
  usuario_id: string | null
  criado_em: string
}

export interface HistoricoCarga {
  id: string
  carga_id: string
  tipo_evento: string
  descricao: string
  usuario_id: string | null
  data_hora: string
  dados_adicionais: Record<string, unknown> | null
}
'@

W "src\constants\status.ts" @'
import type { StatusCarga } from '@/types'

export const STATUS_CARGA_LABELS: Record<StatusCarga, string> = {
  recebida: 'Recebida',
  conferencia: 'Em Conferencia',
  descarga: 'Em Descarga',
  inspecao: 'Em Inspecao',
  finalizada: 'Finalizada',
  com_avaria: 'Com Avaria',
}

export const STATUS_CARGA_CORES: Record<StatusCarga, string> = {
  recebida: 'bg-yellow-100 text-yellow-800',
  conferencia: 'bg-blue-100 text-blue-800',
  descarga: 'bg-purple-100 text-purple-800',
  inspecao: 'bg-orange-100 text-orange-800',
  finalizada: 'bg-green-100 text-green-800',
  com_avaria: 'bg-red-100 text-red-800',
}
'@

W "src\constants\checklist.ts" @'
export const ITENS_CHECKLIST = [
  'Quantidade de volumes',
  'Embalagens em boas condicoes',
  'Lacre conferido',
  'Identificacao conferida',
  'Nota fiscal conferida',
  'Carga sem avarias',
] as const
'@

W "src\utils\formatters.ts" @'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatarDataHora(dataISO: string): string {
  try {
    return format(parseISO(dataISO), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
  } catch {
    return dataISO
  }
}

export function formatarData(dataISO: string): string {
  try {
    return format(parseISO(dataISO), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return dataISO
  }
}
'@

W "src\components\ui\Spinner.tsx" @'
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const tamanhos = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <svg className={`animate-spin ${tamanhos[size]} ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
'@

W "src\components\ui\Button.tsx" @'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const variantes = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
}

const tamanhos = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantes[variant]} ${tamanhos[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
)

Button.displayName = 'Button'
'@

W "src\components\ui\Input.tsx" @'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        ref={ref}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
)

Input.displayName = 'Input'
'@

W "src\components\ui\Select.tsx" @'
import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        ref={ref}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
)

Select.displayName = 'Select'
'@

W "src\components\ui\Card.tsx" @'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>{children}</div>
}
'@

W "src\components\ui\Badge.tsx" @'
import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  className?: string
}

export function Badge({ children, className = '' }: BadgeProps) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>
}
'@

Write-Host "`nPARTE 1 CONCLUIDA!" -ForegroundColor Green