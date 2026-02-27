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

Pacote compartilhado:

```
packages/shared
```

Contém:

* DTOs
* Enums
* Tipos de resposta do agente

---

## ⚙️ Backend

Stack:

* Node.js
* Express
* TypeScript

## 💻 Frontend

Stack:

* React
* Vite
* TypeScript
* Axios

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
Mensagem
   ↓
Classificação de intenção
   ↓
Geração de resposta
   ↓
Resumo para atendente
   ↓
Transferência de setor
```

Intenções suportadas:

* `VENDAS`
* `SUPORTE`
* `FINANCEIRO`
* `FORA_CONTEXTO`

---

## 🚀 Como executar o projeto

### 1️⃣ Instalar dependências

Na raiz:

```bash
pnpm install
```

---

### 2️⃣ Rodar backend

```bash
pnpm --filter api dev
```

API disponível em:

```
http://localhost:3000
```

---

### 3️⃣ Rodar frontend

```bash
pnpm --filter web dev
```

Frontend:

```
http://localhost:5173
```

---

## 📡 Health Check

```
GET /api/health
```

Resposta:

```json
{
  "status": "ok"
}
```

---

## 🧩 Decisões Técnicas

### Monorepo

Permite compartilhamento de contratos tipados entre aplicações.

### Proxy do Vite

Evita CORS e mantém URLs independentes do ambiente.

### IA desacoplada

O agente não depende da camada HTTP, permitindo futura integração com:

* WhatsApp
* WebSocket
* Filas
* Workers

---

## 🔮 Próximos Passos

* Integração com Ollama (LLM local)
* Classificador de intenção
* Persistência em banco (SQLite)
* Histórico de conversa
* Transferência automática
* Resumo para atendente humano

---


## ✅ Status Atual

* [x] Monorepo configurado
* [x] Backend Express funcional
* [x] Frontend React inicializado
* [x] Tipos compartilhados
* [ ] Endpoint de mensagens
* [ ] Integração com IA
* [ ] Classificação de intenção
* [ ] Persistência
