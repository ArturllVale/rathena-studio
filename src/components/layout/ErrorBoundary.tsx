import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
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

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-neutral-950 text-neutral-200">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-lg p-6 flex flex-col items-center text-center space-y-4 shadow-xl">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">Application Error</h2>
              <p className="text-xs text-neutral-400 mt-1">
                A component encountered an unexpected error. The application remains running.
              </p>
            </div>
            {this.state.error && (
              <div className="w-full text-left bg-neutral-950 border border-neutral-800 rounded p-3 text-xs font-mono text-rose-300 overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <Button variant="ide" size="sm" onClick={this.handleReset} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Recover View
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
