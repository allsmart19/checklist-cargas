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

// NOVO: Tipo específico para a etapa de armazenamento das fotos 
// (diferente da EtapaCarga do fluxo do processo)
export type EtapaFoto = 'antes' | 'durante' | 'depois' | 'avarias'

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
  // CORREÇÃO: Agora aceita EtapaFoto ou string, alinhado com a alteração da coluna para VARCHAR no banco
  etapa: EtapaFoto | string | null 
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