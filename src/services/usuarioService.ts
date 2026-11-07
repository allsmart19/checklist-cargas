import { supabase } from '@/lib/supabase'
import type { Usuario, PerfilUsuario } from '@/types'

// Lista todos os usuários
export async function listarUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('nome')

  return { data: data as Usuario[] | null, error }
}

// Cria novo usuário no Auth e vincula na tabela usuarios
export async function criarUsuario(
  nome: string,
  username: string,
  email: string,
  senha: string,
  perfil: PerfilUsuario = 'operador'
) {
  try {
    const usernameNormalizado = username.toLowerCase().trim()
    const emailNormalizado = email.toLowerCase().trim()

    console.log('📝 Iniciando criação de usuário:', { nome, username: usernameNormalizado, email: emailNormalizado, perfil })

    // 1. Verificar se o username já existe na tabela usuarios (Primeira linha de defesa)
    const { data: usuarioExistente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('username', usernameNormalizado)
      .single()

    if (usuarioExistente) {
      return { 
        usuario: null, 
        error: `O nome de usuário "${usernameNormalizado}" já está em uso. Por favor, escolha outro.` 
      }
    }

    // 2. Cria no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailNormalizado,
      password: senha,
      options: {
        data: {
          nome,
          username: usernameNormalizado
        }
      }
    })

    if (authError) {
      console.error('❌ Erro no Auth:', authError)
      
      // Tratamento específico para email já cadastrado
      if (authError.message.includes('User already registered')) {
        return { 
          usuario: null, 
          error: `O email gerado "${emailNormalizado}" já está cadastrado no sistema. Tente usar um nome de usuário diferente.` 
        }
      }
      
      throw new Error(`Erro ao criar autenticação: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Erro ao criar usuário no Auth: usuário não retornado')
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id)

    // 3. Vincula na tabela usuarios
    const { data: usuario, error: dbError } = await supabase
      .from('usuarios')
      .insert({
        auth_user_id: authData.user.id,
        nome,
        username: usernameNormalizado,
        perfil,
        ativo: true
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Erro ao inserir na tabela usuarios:', dbError)
      
      // Rollback: remove do Auth se falhou no banco
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
        console.log('🔄 Rollback: usuário removido do Auth')
      } catch (err) {
        console.warn('⚠️ Rollback do Auth falhou:', err)
      }
      
      throw new Error(dbError.message || 'Erro ao salvar usuário no banco de dados')
    }

    console.log('✅ Usuário criado com sucesso:', usuario)
    return { usuario, error: null }
  } catch (error: any) {
    console.error('💥 Erro completo ao criar usuário:', error)
    return { usuario: null, error: error.message || 'Erro desconhecido ao criar usuário' }
  }
}

// Atualiza dados do usuário (nome, perfil)
export async function atualizarUsuario(
  usuarioId: string,
  dados: { nome?: string; perfil?: PerfilUsuario }
) {
  const { data, error } = await supabase
    .from('usuarios')
    .update(dados)
    .eq('id', usuarioId)
    .select()
    .single()

  return { data: data as Usuario | null, error }
}

// Bloqueia/Desbloqueia usuário
export async function alternarStatusUsuario(usuarioId: string, ativo: boolean) {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ ativo })
    .eq('id', usuarioId)
    .select()
    .single()

  return { data: data as Usuario | null, error }
}

// Exclui usuário
export async function excluirUsuario(usuarioId: string) {
  try {
    const { data: usuario, error: erroBusca } = await supabase
      .from('usuarios')
      .select('auth_user_id, perfil')
      .eq('id', usuarioId)
      .single()

    if (erroBusca || !usuario) {
      throw new Error('Usuário não encontrado')
    }

    if (usuario.perfil === 'administrador') {
      throw new Error('Não é possível excluir usuários administradores')
    }

    if (usuario.auth_user_id) {
      try {
        await supabase.auth.admin.deleteUser(usuario.auth_user_id)
      } catch (err) {
        console.warn('⚠️ Não foi possível deletar do Auth:', err)
      }
    }

    const { error: dbError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', usuarioId)

    if (dbError) throw dbError

    return { error: null }
  } catch (error: any) {
    console.error('❌ Erro ao excluir usuário:', error)
    return { error: error.message }
  }
}