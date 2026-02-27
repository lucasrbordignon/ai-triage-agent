export * from "./enums/department";
export * from "./dto/MessageDTO";
export * from "./dto/AgentResponse";

export type Intent =
  | "VENDAS"
  | "SUPORTE"
  | "FINANCEIRO"
  | "FORA_CONTEXTO";