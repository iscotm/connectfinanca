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
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", backgroundColor: "#ffebeb", color: "#d8000c", fontFamily: "sans-serif", height: "100vh" }}>
          <h1 style={{ marginTop: 0 }}>Application Error</h1>
          <p>Ocorreu um erro inesperado no aplicativo. Por favor, tire um print desta tela e envie para o suporte.</p>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f8f8f8", padding: "10px", border: "1px solid #ccc" }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
