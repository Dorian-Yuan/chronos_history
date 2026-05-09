import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-4xl">\u26A0\uFE0F</div>
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            \u9875\u9762\u6E32\u67D3\u51FA\u9519
          </h2>
          <p className="text-sm text-text-tertiary max-w-md leading-relaxed">
            {this.state.error?.message || "\u672A\u77E5\u9519\u8BEF"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.hash = "#/";
              window.location.reload();
            }}
            className="btn-primary mt-2"
          >
            \u8FD4\u56DE\u9996\u9875
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
