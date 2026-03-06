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
ChatController (Zod validation)
   ↓
ChatService (orquestração)
   ↓
AgentService
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
* Zod (validação de entrada)
* Ollama (LLM local)
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
│       ├── message/
│       │   └── repository/   → MessageRepository
│       ├── controller/
│       │   └── chat.controller.ts
│       └── service/
│           ├── chat.service.ts
│           └── agent.service.ts
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
* Tailwind CSS

### Comunicação com API

O frontend utiliza proxy do Vite:

```
/api → http://localhost:3000
```

Isso evita problemas de CORS e simula ambiente de produção.

---

## 🤖 Agente de IA

O agente segue o padrão **AI Agent Orchestration**, separado do controller HTTP.

Fluxo:

```
Mensagem do usuário
   ↓
Histórico da conversa (contexto)
   ↓
Classificação de intenção via LLM (llama3.2)
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
  conversationId?: string | null;
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

Testes unitários com **Vitest**.

```bash
# rodar testes
pnpm --filter api test

# com cobertura
pnpm --filter api test:coverage
```

Cobertura atual:

* `ConversationRepository` — create, findById, updateStatus
* `MessageRepository` — create, listByConversation
* `ChatService` — sendMessage, getHistory, todos os erros e fluxo de transferência

Estratégia de isolamento:

* **Repositories** — banco mockado via `vi.mock` no módulo `infra/database`
* **ChatService** — dependências injetadas diretamente no construtor, sem `vi.mock`

O banco nunca é instanciado nos testes — garante velocidade e isolamento real.

---

## 🔐 Segurança

### Rate Limiting
As rotas `/messages` aceitam no máximo **10 requisições por minuto** por IP.
Excedido o limite, a API retorna `429 Too Many Requests`.

### API Key
Todas as rotas protegidas exigem o header `x-api-key`.
Sem a chave ou com chave inválida, a API retorna `401 Unauthorized`.

Configure no `.env` de `apps/api`:
```env
API_KEY=sua-chave-secreta-aqui
```

E no `.env` de `apps/web`:
```env
VITE_API_KEY=sua-chave-secreta-aqui
```

### Proteção contra Prompt Injection
Inputs do usuário são sanitizados antes de chegar ao agente,
removendo tags e instruções maliciosas como `[admin]`, `[system]` e similares.

---

## 🚀 Como executar o projeto

### 1️⃣ Instalar dependências

```bash
pnpm install
```

### 2️⃣ Instalar e iniciar o Ollama

```bash
# baixar o modelo
ollama pull llama3.2

# iniciar o servidor
ollama serve
```

### 3️⃣ Rodar backend

```bash
pnpm --filter api dev
```

API disponível em `http://localhost:3000`

### 4️⃣ Rodar frontend

```bash
pnpm --filter web dev
```

Frontend disponível em `http://localhost:5173`

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` em `apps/api`:

```env
PORT=3000
OLLAMA_HOST=http://localhost:11434
```

---

## 📡 Rotas da API

| Método | Rota            | Descrição                              |
|--------|-----------------|----------------------------------------|
| GET    | /api/health     | Health check                           |
| POST   | /messages       | Envia mensagem e recebe resposta da IA |
| GET    | /messages       | Retorna histórico de uma conversa      |

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
  "transfer": false,
  "conversationId": "3d1d9356-76e3-4254-9b4f-8864991c061c"
}
```

### GET /messages?conversationId=xxx

```json
[
  { "id": 1, "role": "user", "content": "Olá", "created_at": "..." },
  { "id": 2, "role": "assistant", "content": "Olá! Como posso ajudar?", "created_at": "..." }
]
```

### Erros

| Código | Situação                                  |
|--------|-------------------------------------------|
| 400    | Dados inválidos (Zod)                     |
| 401    | API key ausente ou inválida               |
| 404    | Conversa não encontrada                   |
| 409    | Conversa já transferida                   |
| 429    | Rate limit excedido                       |
| 500    | Erro interno ou agente indisponível       |

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

### Validação com Zod
Todas as entradas HTTP são validadas com esquemas Zod antes de chegar no service, retornando erros descritivos com status 400.

### Erros semânticos com ChatServiceError
Erros de negócio usam `ChatServiceError` com `code` identificável, permitindo respostas HTTP precisas (404, 409, 500) no controller.

### Injeção de dependência no ChatService
O `ChatService` recebe repositories e agente pelo construtor, facilitando testes sem necessidade de `vi.mock` nos módulos.

### Testes com mock de banco
O banco nunca é instanciado nos testes unitários — garante velocidade e isolamento real.

---

## ✅ Status Atual

* [x] Monorepo configurado (PNPM Workspaces)
* [x] Backend Express funcional
* [x] Frontend React com chat funcional
* [x] Tipos e contratos compartilhados (`packages/shared`)
* [x] Banco de dados SQLite com migrations
* [x] `ConversationRepository` implementado e testado
* [x] `MessageRepository` implementado e testado
* [x] `ChatService` implementado e testado
* [x] `AgentService` com Ollama (llama3.2)
* [x] Endpoints `POST /messages` e `GET /messages`
* [x] Validação de entrada com Zod
* [x] Tratamento de erros com códigos semânticos
* [x] Classificação de intenção e transferência automática
* [x] Testes unitários com Vitest (20 testes)
* [ ] Docker