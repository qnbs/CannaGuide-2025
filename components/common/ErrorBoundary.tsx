import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { PhosphorIcons } from '../icons/PhosphorIcons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  // FIX: Initialized state as a public class field. This correctly sets up the component's state and props without needing a constructor, resolving type errors.
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-300 p-4">
          <Card className="text-center max-w-lg">
            <PhosphorIcons.WarningCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-400 mb-2">Oops! Something went wrong.</h1>
            <p className="text-slate-400 mb-6">
              An unexpected error occurred. Please try reloading the page. If the problem persists, please report the issue.
            </p>
            <Button onClick={this.handleReload} variant="secondary">
              <PhosphorIcons.ArrowClockwise className="w-5 h-5 mr-2" />
              Reload Page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
