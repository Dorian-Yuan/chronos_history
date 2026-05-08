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
          <div className="text-4xl">⚠️</div>
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            页面渲染出错
          </h2>
          <p className="text-sm text-text-tertiary max-w-md leading-relaxed">
            {this.state.error?.message || "未知错误"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.hash = "#/";
              window.location.reload();
            }}
            className="btn-primary mt-2"
          >
            返回首页
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
