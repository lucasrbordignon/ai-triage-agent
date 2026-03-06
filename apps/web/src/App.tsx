import { useState, useRef, useEffect } from "react";
import { useChat } from "./hooks/useChat";

const DEPARTMENT_LABEL: Record<string, string> = {
  VENDAS: "Vendas",
  SUPORTE: "Suporte",
  FINANCEIRO: "Financeiro",
};

const DEPARTMENT_COLOR: Record<string, string> = {
  VENDAS: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  SUPORTE: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  FINANCEIRO: "text-sky-400 border-sky-400/30 bg-sky-400/10",
};

export default function App() {
  const { messages, isLoading, isTransferred, sendMessage, reset } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-2xl flex flex-col h-[90vh] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300 text-sm tracking-wide">
                Atendimento Inteligente
              </span>
            </div>
          </div>
          <button
            onClick={reset}
            className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors px-2 py-1 rounded hover:bg-zinc-800"
          >
            nova conversa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-zinc-950 scrollbar-thin">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="text-4xl">🤖</div>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
                Olá! Sou o agente de triagem.
                <br />
                Como posso te ajudar hoje?
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <span className="text-zinc-600 text-xs px-1">
                {msg.role === "user" ? "você" : "agente"}
              </span>

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-zinc-800 text-zinc-100 rounded-tr-sm"
                    : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>

              {msg.transfer && msg.department && (
                <div
                  className={`mt-2 max-w-[80%] rounded-xl border px-4 py-3 text-xs space-y-2 ${
                    DEPARTMENT_COLOR[msg.department] ??
                    "text-zinc-400 border-zinc-700 bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span>⇢</span>
                    <span>
                      Transferido para {DEPARTMENT_LABEL[msg.department] ?? msg.department}
                    </span>
                  </div>
                  {msg.summary && (
                    <p className="opacity-80 leading-relaxed">
                      <span className="font-semibold">Resumo: </span>
                      {msg.summary}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-4 bg-zinc-900 border-t border-zinc-800">
          {isTransferred ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-zinc-500 text-xs">
                Conversa encerrada. Aguarde o atendente humano.
              </p>
              <button
                onClick={reset}
                className="text-xs text-zinc-300 border border-zinc-700 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap"
              >
                Nova conversa
              </button>
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1 bg-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-3 outline-none border border-zinc-700 focus:border-zinc-500 placeholder-zinc-600 transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-zinc-100 text-zinc-900 text-sm font-semibold px-4 py-3 rounded-xl hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Enviar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}