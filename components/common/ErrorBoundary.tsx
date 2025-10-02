import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { PhosphorIcons } from '../icons/PhosphorIcons';

interface Props {
  children: ReactNode;
  scope?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const isDevelopment = process.env.NODE_ENV === 'development';

export class ErrorBoundary extends Component<Props, State> {
  // FIX: Reverted to class property syntax for state and arrow functions for methods.
  // This is a more modern and less error-prone way to define state and handlers in React class components,
  // and it resolves the type inference issues with `this.state` and `this.props`.
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(_: Error): Pick<State, 'hasError'> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const scope = this.props.scope ? `[${this.props.scope}] ` : '';
    console.error(`Uncaught error in scope: ${scope}`, error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };
  
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const scopeMessage = this.props.scope ? ` in ${this.props.scope}` : '';

      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
          <Card className="w-full max-w-3xl text-center animate-fade-in">
            <PhosphorIcons.WarningCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold font-display text-red-400">
              Oops! Something went wrong{scopeMessage}.
            </h1>
            <p className="text-slate-400 mt-2">
              An unexpected error occurred. Please try again or reload the page.
            </p>

            <div className="flex justify-center gap-4 mt-6">
              <Button onClick={this.handleReset} variant="primary">
                <PhosphorIcons.MagicWand className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="secondary">
                <PhosphorIcons.ArrowClockwise className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>

            {isDevelopment && this.state.error && (
              <div className="text-left mt-6 space-y-4">
                <Card className="bg-slate-800/50">
                  <h3 className="font-semibold text-red-300">Error Message</h3>
                  <pre className="mt-2 p-2 bg-slate-900 rounded-md text-red-400 text-sm overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </Card>
                {this.state.errorInfo && (
                  <Card className="bg-slate-800/50">
                    <h3 className="font-semibold text-slate-300">Component Stack</h3>
                    <pre className="mt-2 p-2 bg-slate-900 rounded-md text-slate-400 text-xs overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </Card>
                )}
              </div>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
