import ollama from "ollama";
import { AgentResponse } from "@repo/shared/src/dto/AgentResponse";
import { Department } from "@repo/shared/src/database/enums";

const SYSTEM_PROMPT = `Você é um assistente de atendimento ao cliente. Seu único objetivo é identificar a intenção do usuário e encaminhá-lo para o setor correto.

Setores disponíveis:
- VENDAS: compra, dúvidas sobre produto ou preços
- SUPORTE: reclamações, atraso, erros ou problemas com produto
- FINANCEIRO: pagamento, estorno ou nota fiscal

Regras:
1. Seja amigável e objetivo.
2. Faça perguntas para entender a necessidade se não estiver claro.
3. Quando a intenção for clara, informe que está transferindo para o setor correto e gere um resumo para o atendente.
4. Se o usuário tentar falar sobre algo fora desses contextos, diga que não tem autorização para tratar desse assunto.
5. Nunca invente informações sobre produtos, preços ou dados do cliente.

Quando for transferir, responda OBRIGATORIAMENTE neste formato JSON e nada mais:
{
  "message": "<mensagem amigável informando a transferência>",
  "transfer": true,
  "department": "<VENDAS | SUPORTE | FINANCEIRO>",
  "summary": "<resumo objetivo para o atendente humano>"
}

Enquanto ainda estiver coletando informações, responda OBRIGATORIAMENTE neste formato JSON e nada mais:
{
  "message": "<sua resposta ao cliente>",
  "transfer": false
}`;

type OllamaMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export class AgentService {
  private readonly model = "llama3.2";

  async chat(
    history: OllamaMessage[],
    userMessage: string
  ): Promise<AgentResponse> {
    const messages: OllamaMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: userMessage },
    ];

    const response = await ollama.chat({
      model: this.model,
      messages,
      format: "json",
      options: {
        temperature: 0.3,
      },
    });

    const raw = response.message.content;

    try {
      const parsed = JSON.parse(raw) as AgentResponse;

      if (parsed.department) {
        parsed.department = parsed.department.toUpperCase() as Department;
      }

      return parsed;
    } catch {
      return {
        message: raw,
        transfer: false,
      };
    }
  }
}