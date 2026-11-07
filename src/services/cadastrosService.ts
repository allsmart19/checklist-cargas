import { supabase } from '@/lib/supabase'
import type { Cliente, Transportadora, Motorista, Veiculo } from '@/types'

// ============ CLIENTES ============
export async function listarClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome')
  return { data: data as Cliente[] | null, error }
}

export async function criarCliente(nome: string, documento: string) {
  const { data, error } = await supabase
    .from('clientes')
    .insert({ nome, documento, ativo: true })
    .select()
    .single()
  return { data: data as Cliente | null, error }
}

export async function atualizarCliente(id: string, nome: string, documento: string) {
  const { data, error } = await supabase
    .from('clientes')
    .update({ nome, documento })
    .eq('id', id)
    .select()
    .single()
  return { data: data as Cliente | null, error }
}

export async function excluirCliente(id: string) {
  try {
    console.log('️ Tentando excluir cliente:', id)

    // 1. Verifica se existem cargas vinculadas a este cliente
    const { data: cargasVinculadas, error: erroVerificacao } = await supabase
      .from('cargas')
      .select('id, numero_carga')
      .eq('cliente_id', id)
      .limit(5)

    if (erroVerificacao) {
      console.error('Erro ao verificar cargas vinculadas:', erroVerificacao)
      return { error: erroVerificacao }
    }

    if (cargasVinculadas && cargasVinculadas.length > 0) {
      const mensagem = `Não é possível excluir este cliente pois existem ${cargasVinculadas.length} carga(s) vinculada(s). Exclua ou reatribua as cargas primeiro.`
      console.warn('⚠️', mensagem, cargasVinculadas)
      return { error: { message: mensagem } }
    }

    // 2. Tenta excluir o cliente
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Erro ao excluir cliente:', error)
      return { error }
    }

    console.log('✅ Cliente excluído com sucesso:', id)
    return { error: null }
  } catch (error: any) {
    console.error('💥 Erro inesperado ao excluir cliente:', error)
    return { error: error.message || 'Erro desconhecido ao excluir cliente.' }
  }
}

// ============ TRANSPORTADORAS ============
export async function listarTransportadoras() {
  const { data, error } = await supabase
    .from('transportadoras')
    .select('*')
    .order('nome')
  return { data: data as Transportadora[] | null, error }
}

export async function criarTransportadora(nome: string, documento: string) {
  const { data, error } = await supabase
    .from('transportadoras')
    .insert({ nome, documento, ativo: true })
    .select()
    .single()
  return { data: data as Transportadora | null, error }
}

export async function atualizarTransportadora(id: string, nome: string, documento: string) {
  const { data, error } = await supabase
    .from('transportadoras')
    .update({ nome, documento })
    .eq('id', id)
    .select()
    .single()
  return { data: data as Transportadora | null, error }
}

export async function excluirTransportadora(id: string) {
  const { error } = await supabase
    .from('transportadoras')
    .delete()
    .eq('id', id)
  return { error }
}

// ============ MOTORISTAS ============

export async function listarMotoristas() {
  const { data, error } = await supabase
    .from('motoristas')
    .select('*')
    .order('nome')
  return { data: data as Motorista[] | null, error }
}

export async function criarMotorista(nome: string, documento: string, telefone: string) {
  const { data, error } = await supabase
    .from('motoristas')
    .insert({ nome, documento, telefone, ativo: true })
    .select()
    .single()
  return { data: data as Motorista | null, error }
}

export async function atualizarMotorista(id: string, nome: string, documento: string, telefone: string) {
  const { data, error } = await supabase
    .from('motoristas')
    .update({ nome, documento, telefone })
    .eq('id', id)
    .select()
    .single()
  return { data: data as Motorista | null, error }
}

export async function excluirMotorista(id: string) {
  const { error } = await supabase
    .from('motoristas')
    .delete()
    .eq('id', id)
  return { error }
}

// ============ VEÍCULOS ============
export async function listarVeiculos() {
  const { data, error } = await supabase
    .from('veiculos')
    .select('*')
    .order('placa')
  return { data: data as Veiculo[] | null, error }
}

export async function criarVeiculo(placa: string, modelo: string, marca: string) {
  const { data, error } = await supabase
    .from('veiculos')
    .insert({ placa: placa.toUpperCase(), modelo, marca, ativo: true })
    .select()
    .single()
  return { data: data as Veiculo | null, error }
}

export async function atualizarVeiculo(id: string, placa: string, modelo: string, marca: string) {
  const { data, error } = await supabase
    .from('veiculos')
    .update({ placa: placa.toUpperCase(), modelo, marca })
    .eq('id', id)
    .select()
    .single()
  return { data: data as Veiculo | null, error }
}

export async function excluirVeiculo(id: string) {
  const { error } = await supabase
    .from('veiculos')
    .delete()
    .eq('id', id)
  return { error }
}