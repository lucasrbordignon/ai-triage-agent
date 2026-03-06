# AI Triage Agent

Sistema full-stack que implementa um **Agente de Triagem Inteligente com IA**, capaz de conversar com usuários, identificar a intenção do atendimento e encaminhar automaticamente para o setor correto.

---

## 🎯 Objetivo

Construir um sistema simples composto por:

* **Frontend** para interação via chat
* **Backend** em Node.js
* **Agente de IA** responsável por entender a intenção do usuário
* **Histórico de conversas**
* Encaminhamento automático para:

  * Vendas
  * Suporte
  * Financeiro

O agente atua como uma primeira camada de atendimento antes da transferência para um humano.

---

## 🏗️ Arquitetura do Projeto

O projeto foi estruturado como **monorepo**, permitindo compartilhamento de tipos e contratos entre frontend e backend.

```
ai-triage-agent/
│
├── apps/
│   ├── api/        → Backend (Node.js + Express)
│   └── web/        → Frontend (React + Vite)
│
├── packages/
│   └── shared/     → Tipos e contratos compartilhados
│
└── pnpm-workspace.yaml
```

---

## 🧠 Visão Arquitetural

Fluxo geral:

```
Usuário
   ↓
Frontend (React)
   ↓
API REST (Express)
   ↓
Chat Service
   ↓
AI Agent Service
   ↓
LLM (Ollama - local)
```

---

## 📦 Monorepo

Foi adotado **PNPM Workspaces** para:

* Compartilhar tipos entre frontend e backend
* Evitar duplicação de contratos
* Garantir tipagem consistente da API
* Simular estrutura usada em ambientes SaaS reais

Pacote compartilhado (`packages/shared`) contém:

* DTOs (`SendMessageDTO`, `AgentResponse`)
* Enums (`Department`, `ConversationStatus`, `MessageRole`)
* Entidades (`Conversation`, `Message`)

---

## ⚙️ Backend

Stack:

* Node.js + Express 5
* TypeScript
* libsql (SQLite via `@libsql/client`)
* Vitest (testes unitários)

### Estrutura de camadas

```
apps/api/src/
├── infra/
│   └── database/         → Conexão e migrations SQLite
├── modules/
│   └── chat/
│       ├── conversation/
│       │   └── repository/   → ConversationRepository
│       └── message/
│           └── repository/   → MessageRepository
├── app.ts
├── routes.ts
└── server.ts
```

### Banco de dados

Utiliza **SQLite** via `@libsql/client`. As tabelas são:

**conversations**

| Campo        | Tipo    | Descrição                              |
|--------------|---------|----------------------------------------|
| id           | TEXT    | UUID gerado no backend                 |
| status       | TEXT    | `ACTIVE`, `TRANSFERRED`, `CLOSED`      |
| department   | TEXT    | `VENDAS`, `SUPORTE`, `FINANCEIRO`      |
| created_at   | TEXT    | ISO timestamp                          |
| updated_at   | TEXT    | ISO timestamp                          |

**messages**

| Campo           | Tipo    | Descrição                        |
|-----------------|---------|----------------------------------|
| id              | INTEGER | Auto increment                   |
| conversation_id | TEXT    | FK → conversations.id            |
| role            | TEXT    | `user` ou `assistant`            |
| content         | TEXT    | Conteúdo da mensagem             |
| created_at      | TEXT    | ISO timestamp                    |

---

## 💻 Frontend

Stack:

* React 19
* Vite 7
* TypeScript
* Axios
* TanStack Query

### Comunicação com API

O frontend utiliza proxy do Vite:

```
/api → http://localhost:3000
```

Isso evita problemas de CORS e simula ambiente de produção.

---

## 🤖 Agente de IA (Design)

O agente segue o padrão **AI Agent Orchestration**, separado do controller HTTP.

Fluxo planejado:

```
Mensagem do usuário
   ↓
Histórico da conversa (contexto)
   ↓
Classificação de intenção via LLM
   ↓
Geração de resposta ao cliente
   ↓
Resumo para o atendente humano
   ↓
Transferência de setor + encerramento
```

Intenções suportadas:

* `VENDAS` — compra, dúvidas sobre produto ou preços
* `SUPORTE` — reclamações, atraso, erros com produto
* `FINANCEIRO` — pagamento, estorno, nota fiscal
* `FORA_CONTEXTO` — bloqueado, IA responde que não tem autorização

### Contratos do Agente

```typescript
// Entrada
interface SendMessageDTO {
  conversationId: string;
  content: string;
}

// Saída
interface AgentResponse {
  message: string;
  transfer?: boolean;
  department?: Department;
  summary?: string;
  conversationId?: string;
}
```

---

## 🧪 Testes

Testes unitários com **Vitest**, isolando o banco de dados via mocks.

```bash
pnpm --filter api test
```

Cobertura atual:

* `ConversationRepository` — create, findById, updateStatus
* `MessageRepository` — create, listByConversation

O banco nunca é tocado nos testes — o módulo `infra/database` é mockado via `vi.mock`.

---

## 🚀 Como executar o projeto

### 1️⃣ Instalar dependências

```bash
pnpm install
```

### 2️⃣ Rodar backend

```bash
pnpm --filter api dev
```

API disponível em `http://localhost:3000`

### 3️⃣ Rodar frontend

```bash
pnpm --filter web dev
```

Frontend disponível em `http://localhost:5173`

---

## 📡 Rotas da API

| Método | Rota       | Descrição                              |
|--------|------------|----------------------------------------|
| GET    | /api/health | Health check                          |
| POST   | /messages  | Envia mensagem e recebe resposta da IA |
| GET    | /messages  | Retorna histórico de uma conversa      |

### POST /messages

```json
// Request
{
  "conversationId": "uuid-ou-null",
  "content": "Gostaria de pagar meu boleto"
}

// Response
{
  "message": "Com certeza! Você tem o CPF em mãos?",
  "transfer": false
}
```

### GET /messages?conversationId=xxx

```json
[
  { "id": 1, "role": "user", "content": "Olá", "created_at": "..." },
  { "id": 2, "role": "assistant", "content": "Olá! Como posso ajudar?", "created_at": "..." }
]
```

---

## 🧩 Decisões Técnicas

### Monorepo com PNPM Workspaces
Permite compartilhamento de contratos tipados entre aplicações sem duplicação.

### SQLite via libsql
Leve, sem dependência de servidor, ideal para o escopo do projeto. Fácil migração para Turso em produção.

### Repositórios isolados
Cada entidade tem seu próprio repository, sem acoplamento entre si. O service orquestra os dois.

### Proxy do Vite
Evita CORS em desenvolvimento e mantém URLs relativas independentes do ambiente.

### IA desacoplada
O `agent.service.ts` não depende da camada HTTP, permitindo futura integração com WebSocket, WhatsApp, filas ou workers.

### Testes com mock de banco
O banco nunca é instanciado nos testes unitários — garante velocidade e isolamento real.

---

## ✅ Status Atual

* [x] Monorepo configurado (PNPM Workspaces)
* [x] Backend Express funcional
* [x] Frontend React inicializado
* [x] Tipos e contratos compartilhados (`packages/shared`)
* [x] Banco de dados SQLite com migrations
* [x] `ConversationRepository` implementado e testado
* [x] `MessageRepository` implementado e testado
* [x] Testes unitários com Vitest (mock de banco)
* [x] `ChatService` — orquestração do fluxo
* [x] `AgentService` — integração com Ollama
* [x] Endpoints `POST /messages` e `GET /messages`
* [x] Classificação de intenção e transferência
* [ ] Ollama rodando (local ou VPS)
* [ ] Frontend com chat funcional
* [ ] Docker