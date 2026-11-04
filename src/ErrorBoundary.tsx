import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in application:", error, errorInfo);
    
    // Auto-recuperação segura para descompasso de DOM causado por extensões de tradução
    const isDomMismatch = error?.message?.includes('removeChild') || 
                          error?.message?.includes('insertBefore') ||
                          error?.message?.includes('not a child of this node');
                          
    if (isDomMismatch) {
      console.warn("DOM mismatch detectado (extensão/tradução). Tentando recarregar aplicação suavemente...");
      const lastReload = sessionStorage.getItem('last_dom_auto_reload');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('last_dom_auto_reload', String(now));
        window.location.reload();
        return;
      }
    }

    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.toString() || "Erro desconhecido";
      const isDomMismatch = errorMsg.includes('removeChild') || errorMsg.includes('not a child of this node');

      return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/10">
              ⚠️
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {isDomMismatch ? "Interferência de Tradução do Navegador" : "Instabilidade Temporária"}
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isDomMismatch 
                  ? "Uma extensão do seu navegador (como o Google Tradutor) alterou o conteúdo da página. Desative a tradução automática para prosseguir sem erros."
                  : "Ocorreu uma instabilidade momentânea no carregamento da tela. Clique abaixo para recarregar o seu painel."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
              >
                Recarregar Página
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider border border-slate-700 transition-all cursor-pointer"
              >
                Ir para o Painel
              </button>
            </div>

            {/* Detalhes técnicos recolhíveis para suporte */}
            <details className="text-left bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-500">
              <summary className="cursor-pointer font-semibold text-slate-400 hover:text-slate-300 select-none">
                Ver detalhes técnicos do erro
              </summary>
              <pre className="mt-2 text-[11px] text-rose-400 font-mono whitespace-pre-wrap overflow-x-auto max-h-36 p-2 bg-slate-950 rounded">
                {errorMsg}
                {"\n"}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
