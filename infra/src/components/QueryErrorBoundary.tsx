import { Component, type ErrorInfo, type ReactNode } from "react";

interface QueryErrorBoundaryProps {
  children: ReactNode;
  /** Contexto humano do que falhou, ex.: "carregar os insumos". */
  action: string;
  /** Ação opcional de recuperação (ex.: tentar novamente recarregando). */
  onRetry?: () => void;
}

interface QueryErrorBoundaryState {
  error: Error | null;
}

/**
 * Captura erros lançados no render por queries do Convex (`useQuery` lança
 * em falha de rede/permissão) e mostra estado de erro legível com caminho
 * de recuperação — auditoria UX H9 (9.1): falhas de query nunca ficam
 * silenciosas nem derrubam a tela inteira.
 */
export class QueryErrorBoundary extends Component<QueryErrorBoundaryProps, QueryErrorBoundaryState> {
  state: QueryErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): QueryErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Registro no console preserva o detalhe técnico para depuração
    // sem expor jargão ao usuário (H9/9.4).
    console.error(`[QueryErrorBoundary] falha ao ${this.props.action}:`, error, info.componentStack);
  }

  render() {
    if (this.state.error !== null) {
      return (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-destructive"
        >
          <p className="font-semibold">Não foi possível {this.props.action}.</p>
          <p className="mt-1 text-sm">
            Verifique sua conexão e tente novamente. Se o problema persistir, recarregue a página.
          </p>
          {this.props.onRetry && (
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null });
                this.props.onRetry?.();
              }}
              className="mt-3 rounded-md border border-destructive/40 bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Tentar novamente
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
