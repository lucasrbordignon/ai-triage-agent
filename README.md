# AI Triage Agent — ImóvelPrime

Sistema full-stack que implementa a **Sofia**, agente virtual de triagem inteligente da ImóvelPrime, capaz de conversar com clientes, identificar a intenção do atendimento e encaminhar automaticamente para o setor correto.

🔗 **Demo:** https://sofia.lrb.dev.br

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

A Sofia atua como uma primeira camada de atendimento antes da transferência para um humano.

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
ChatController (Zod validation + sanitização)
   ↓
ChatService (orquestração)
   ↓
AgentService
   ↓
LLM (Groq — llama-3.1-8b-instant)
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
* Groq SDK (LLM em nuvem)
* Vitest (testes unitários)

### Estrutura de camadas
```
apps/api/src/
├── infra/
│   ├── database/         → Conexão e migrations SQLite
│   └── middleware/       → API key authentication
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

## 🤖 Agente de IA — Sofia

A Sofia é o agente virtual da ImóvelPrime. Ela segue o padrão **AI Agent Orchestration**, separado do controller HTTP.

Fluxo:
```
Mensagem do cliente
   ↓
Sanitização de input (proteção contra prompt injection)
   ↓
Histórico da conversa (últimas 4 mensagens)
   ↓
Classificação de intenção via LLM (Groq — llama-3.1-8b-instant)
   ↓
Coleta de dados (nome + CPF/CNPJ)
   ↓
Resumo para o atendente humano
   ↓
Transferência de setor + encerramento
```

Intenções suportadas:

* `VENDAS` — compra, venda, aluguel de imóveis, financiamento, lançamentos
* `SUPORTE` — problemas com contrato, manutenção (elétrica, hidráulica, portão, chaves), vistoria, acesso ao portal
* `FINANCEIRO` — boleto, IPTU, condomínio, nota fiscal, reembolso, cobrança indevida
* `FORA_CONTEXTO` — assuntos não relacionados a imóveis são redirecionados com tom amigável

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
Inputs do usuário são sanitizados antes de chegar ao agente, removendo tags e instruções maliciosas como `[admin]`, `[system]` e similares. O system prompt da Sofia também instrui o modelo a ignorar tentativas de manipulação.

---

## 🚀 Como executar o projeto

### 1️⃣ Instalar dependências
```bash
pnpm install
```

### 2️⃣ Configurar variáveis de ambiente

Crie `apps/api/.env`:
```env
PORT=3000
GROQ_API_KEY=gsk_...
API_KEY=sua-chave-secreta-aqui
```

Crie `apps/web/.env`:
```env
VITE_API_KEY=sua-chave-secreta-aqui
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

## 🐳 Deploy com Docker

A aplicação é containerizada com **multi-stage builds** para API e frontend. O banco SQLite persiste em um volume Docker nomeado, sobrevivendo a restarts e rebuilds.

### Arquitetura dos containers
```
Nginx (host)
   ↓ proxy_pass
Container web (nginx:alpine) → porta 3001
   ↓ proxy /api
Container api (node:alpine) → porta 3000 (interna)
   ↓
Volume sqlite_data → /app/data/db.sqlite
```

### Pré-requisitos

* Docker e Docker Compose instalados
* Variáveis de ambiente configuradas

### 1️⃣ Configurar variáveis de ambiente
```bash
# API
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env

# Raiz — necessário para o build do Vite no Docker
echo "VITE_API_KEY=sua-chave-secreta-aqui" > .env
```

### 2️⃣ Subir os containers
```bash
docker compose up -d --build
```

### 3️⃣ Verificar
```bash
docker compose ps
curl http://localhost:3001/api/health
```

### Atualizar em produção
```bash
git pull
docker compose up -d --build
```

### Logs
```bash
docker compose logs -f api
docker compose logs -f web
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
  "message": "Claro! Vou te encaminhar para o Financeiro. Qual é o seu nome completo?",
  "transfer": false,
  "conversationId": "3d1d9356-76e3-4254-9b4f-8864991c061c"
}
```

### GET /messages?conversationId=xxx
```json
[
  { "id": 1, "role": "user", "content": "Olá", "created_at": "..." },
  { "id": 2, "role": "assistant", "content": "Olá! Sou a Sofia...", "created_at": "..." }
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

### Groq como provedor de LLM
O Groq oferece inferência extremamente rápida (< 1s) com modelos open-source como `llama-3.1-8b-instant`. Free tier generoso (30 RPM), sem necessidade de infraestrutura local. O `AgentService` é desacoplado do provedor — trocar para OpenAI, Gemini ou Ollama exige mudança apenas nessa classe.

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

### Contexto limitado a 4 mensagens
Modelos menores perdem coerência com histórico longo. O `formatHistory` envia apenas as últimas 4 mensagens ao agente, garantindo respostas consistentes sem alucinações.

### Docker multi-stage build
Builds separados por estágio (deps → builder → runner) reduzem o tamanho final da imagem, excluindo devDependencies e código fonte do artefato de produção.

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
* [x] `AgentService` com Groq (llama-3.1-8b-instant)
* [x] Endpoints `POST /messages` e `GET /messages`
* [x] Validação de entrada com Zod
* [x] Tratamento de erros com códigos semânticos
* [x] Classificação de intenção e transferência automática
* [x] Agente personalizado como Sofia — ImóvelPrime
* [x] Suporte a problemas de manutenção do imóvel (elétrica, hidráulica, portão etc.)
* [x] Testes unitários com Vitest (20 testes)
* [x] Rate limiting (10 req/min por IP)
* [x] Autenticação por API key
* [x] Proteção contra prompt injection
* [x] Docker