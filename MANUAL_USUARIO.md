# MANUAL DO USUÁRIO
## Sistema Checklist Cargas Portuárias

**Versão:** 1.0  
**Data:** Novembro/2026  
**URL do Sistema:** https://checklist-cargas.vercel.app **

---

## SUMÁRIO

1. [Acesso ao Sistema](#1-acesso-ao-sistema)
2. [Instalação no Celular](#2-instalação-no-celular)
3. [Perfil Administrador](#3-perfil-administrador)
4. [Perfil Operador](#4-perfil-operador)
5. [Fluxo de Trabalho](#5-fluxo-de-trabalho)
6. [Suporte Técnico](#6-suporte-técnico)

---

## 1. ACESSO AO SISTEMA

### 1.1 Pelo Computador

1. Abra o navegador (Chrome, Edge, Firefox)
2. Acesse: **https://checklist-cargas.vercel.app**
3. Digite seu **usuário** e **senha**
4. Clique em **"Entrar"**

### 1.2 Pelo Celular (App Instalado)

1. Toque no ícone **"Checklist Cargas"** na tela inicial
2. Digite seu **usuário** e **senha**
3. Clique em **"Entrar"**

---

## 2. INSTALAÇÃO NO CELULAR

### Android (Chrome)

1. Acesse o link do sistema no Chrome
2. Toque no menu (⋮) no canto superior direito
3. Selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**
4. Confirme a instalação
5. O ícone aparecerá na tela inicial

### iPhone (Safari)

1. Acesse o link do sistema no Safari
2. Toque no botão **Compartilhar** (quadrado com seta para cima)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Confirme o nome e toque em **"Adicionar"**
5. O ícone aparecerá na tela inicial

---

## 3. PERFIL ADMINISTRADOR

### 3.1 Dashboard

O Dashboard mostra:
- **Total de Cargas:** Quantidade total registrada
- **Em Andamento:** Cargas em processamento
- **Finalizadas:** Cargas concluídas
- **Com Avaria:** Cargas com problemas registrados
- **Top Clientes:** Ranking de clientes por volume
- **Avarias por Tipo:** Gráfico de tipos de avarias

### 3.2 Operações

#### Listar Cargas
- Visualize todas as cargas registradas
- Use os filtros para buscar por número, cliente ou status
- Clique em **"Detalhes"** para ver informações completas

#### Criar Nova Operação

**Carregamento:**
1. Menu lateral → **"Carregamento"**
2. Preencha os campos obrigatórios:
   - Número da Carga (ex: MNDKSJ76575675)
   - Cliente (selecione da lista)
   - Quantidade de Volumes
   - Número do Processo
   - Rua/Local
3. Clique em **"Criar Carga"**

**Descarregamento:**
1. Menu lateral → **"Descarregamento"**
2. Preencha os mesmos campos do carregamento
3. Clique em **"Criar Carga"**

### 3.3 Cadastros

Gerencie as listas de:
- **Clientes:** Adicione, edite ou desative clientes
- **Transportadoras:** Cadastre empresas de transporte
- **Motoristas:** Cadastre motoristas autorizados
- **Veículos:** Cadastre placas e modelos

### 3.4 Usuários

#### Criar Novo Usuário

1. Menu lateral → **"Usuários"**
2. Clique em **"Novo Usuário"**
3. Preencha:
   - Nome completo
   - Username (login)
   - Senha (mínimo 6 caracteres)
   - Perfil: **Administrador** ou **Operador**
4. Clique em **"Salvar"**

#### Editar/Desativar Usuário

1. Na lista de usuários, clique no ícone de edição (✏️)
2. Altere as informações necessárias
3. Para desativar: desmarque a opção **"Ativo"**
4. Clique em **"Salvar"**

### 3.5 Auditoria

Visualize o histórico completo de ações no sistema:
- Logins realizados
- Cargas criadas/modificadas/excluídas
- Alterações de status
- Usuários que realizaram cada ação

---

## 4. PERFIL OPERADOR

### 4.1 Minhas Operações

Lista apenas as cargas criadas pelo operador logado, filtradas por status:
- Recebida
- Em Conferência
- Em Descarga
- Em Inspeção
- Com Avaria

### 4.2 Avançar Etapas

1. Abra uma operação em andamento
2. Preencha o checklist de conferência
3. Clique em **"Avançar Etapa"** no final da página
4. O status será atualizado automaticamente

### 4.3 Checklist de Conferência

Para cada item do checklist, selecione:
- **SIM:** Item conferido e OK
- **NÃO:** Item com problema (obrigatório填写 observação)
- **Não verificado:** Item não conferido

**Itens do Checklist:**
1. Quantidade de volumes
2. Embalagens em boas condições
3. Lacre conferido (apenas descarregamento)
4. Identificação conferida
5. Nota fiscal conferida
6. Carga sem avarias

### 4.4 Registrar Avarias

Se marcar **"NÃO"** em "Carga sem avarias":

1. Uma caixa de observação aparecerá
2. Descreva o problema (ex: "Caixa amassada no canto superior direito")
3. O sistema criará automaticamente um registro de avaria
4. O status da carga mudará para **"Com Avaria"**

### 4.5 Adicionar Fotos

1. Na tela de detalhes da carga, role até **"Registro Fotográfico"**
2. Clique em **"Adicionar Foto"**
3. Escolha:
   - **Tirar foto:** Usa a câmera do celular
   - **Escolher da galeria:** Seleciona foto existente
4. Selecione a etapa (ex: "Recebimento", "Conferência")
5. Clique em **"Salvar"**

### 4.6 Gerar Relatório PDF

1. Na tela de detalhes da carga
2. Clique no botão **"Gerar Relatório PDF"**
3. O PDF será baixado automaticamente com:
   - Dados da operação
   - Checklist completo
   - Avarias registradas
   - Fotos tiradas
   - Histórico de etapas

---

## 5. FLUXO DE TRABALHO

### 5.1 Fluxo de Carregamento
