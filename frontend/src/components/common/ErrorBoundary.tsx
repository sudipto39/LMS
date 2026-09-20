import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Card, Btn } from "./UIPrimitives";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? ` - ${this.props.name}` : ""}] caught an error:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 sm:p-6 w-full flex items-center justify-center min-h-[280px]">
          <Card className="w-full max-w-xl p-6 border-red-500/20 bg-red-500/5 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/15 text-red-500 shrink-0">
                <AlertCircle size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[var(--t1)]">
                  {this.props.name ? `Error in ${this.props.name}` : "Something went wrong"}
                </h3>
                <p className="text-xs text-[var(--t2)] mt-1 leading-relaxed">
                  An unexpected error occurred while rendering this section. You can try recovering this view without reloading the entire page.
                </p>
                {this.state.error && (
                  <div className="mt-3 p-3 rounded-lg bg-black/40 border border-red-500/20 font-mono text-xs text-red-300 overflow-x-auto">
                    {this.state.error.message || "Unknown error"}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--bdr)]">
              <Btn onClick={this.handleReset} className="h-9 text-xs !px-4 flex items-center gap-1.5">
                <RotateCcw size={13} /> Try Again
              </Btn>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
