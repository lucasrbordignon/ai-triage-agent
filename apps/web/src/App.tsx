import { useState, useRef, useEffect } from "react";
import { useChat } from "./hooks/useChat";

const DEPARTMENT_LABEL: Record<string, string> = {
  VENDAS: "Vendas",
  SUPORTE: "Suporte",
  FINANCEIRO: "Financeiro",
};

const DEPARTMENT_COLOR: Record<string, string> = {
  VENDAS: "text-emerald-400 border-emerald-500/30 bg-emerald-950/60",
  SUPORTE: "text-amber-400 border-amber-500/30 bg-amber-950/60",
  FINANCEIRO: "text-sky-400 border-sky-500/30 bg-sky-950/60",
};

export default function ChatApp() {
  const { messages, isLoading, isTransferred, sendMessage, reset } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && !isLoading) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 flex flex-col">
      <header className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/70 px-4 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-zinc-200 tracking-tight">
              Atendimento Inteligente
            </span>
          </div>
        </div>

        <button
          onClick={reset}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800/70 active:bg-zinc-700/70"
        >
          Nova conversa
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-950">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
            <div className="text-5xl sm:text-6xl opacity-90">👋</div>
            <div className="space-y-2">
              <h2 className="text-xl font-medium text-zinc-200">
                Olá! Sou seu atendente virtual
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-md mx-auto">
                Pode mandar sua dúvida, pedido ou reclamação que eu te ajudo rapidinho.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1.5 ${
              msg.role === "user" ? "items-end" : "items-start"
            } animate-fade-in`}
          >
            <span className="text-xs text-zinc-600 px-1">
              {msg.role === "user" ? "Você" : "Sofia"}
            </span>

            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-zinc-800/90 text-zinc-100 rounded-tr-none border border-zinc-700/50"
                  : "bg-zinc-900/80 text-zinc-100 border border-zinc-800/70 rounded-tl-none"
              }`}
            >
              {msg.content}
            </div>

            {msg.transfer && msg.department && (
              <div
                className={`mt-2 max-w-[85%] sm:max-w-[78%] rounded-xl border px-4 py-3.5 text-sm space-y-2 shadow-sm ${
                  DEPARTMENT_COLOR[msg.department] ??
                  "text-zinc-400 border-zinc-700 bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-lg">→</span>
                  <span>
                    Transferido para {DEPARTMENT_LABEL[msg.department] ?? msg.department}
                  </span>
                </div>
                {msg.summary && (
                  <p className="text-sm opacity-90 leading-relaxed">
                    <span className="font-medium">Resumo: </span>
                    {msg.summary}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="bg-zinc-900/80 border border-zinc-800/70 rounded-2xl rounded-tl-none px-5 py-3.5">
              <div className="flex gap-1.5 items-center h-5">
                <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:180ms]" />
                <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:360ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <footer className="bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800/70 px-4 py-4 safe-area-inset-bottom">
        {isTransferred ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-sm text-zinc-400">
              Conversa transferida. Aguarde o atendente humano.
            </p>
            <button
              onClick={reset}
              className="text-sm font-medium px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 rounded-xl transition-colors border border-zinc-700/60 whitespace-nowrap"
            >
              Iniciar nova conversa
            </button>
          </div>
        ) : (
          <div className="flex gap-3 items-center max-w-3xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              disabled={isLoading || isTransferred}
              autoFocus
              className="flex-1 bg-zinc-800/70 text-zinc-100 placeholder-zinc-500 text-[15px] rounded-full px-5 py-3.5 outline-none border border-zinc-700/60 focus:border-emerald-600/70 focus:ring-1 focus:ring-emerald-600/30 transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || isTransferred}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium px-6 py-3.5 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
            >
              Enviar
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.741 1.408a.75.75 0 0 1 .919-.053l17.25 9.75a.75.75 0 0 1 0 1.29l-17.25 9.75A.75.75 0 0 1 3 21.75V2.25a.75.75 0 0 1 .741-.842Z" />
              </svg>
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}