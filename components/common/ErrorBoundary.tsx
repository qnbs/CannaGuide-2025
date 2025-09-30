import React, { Component, ErrorInfo, ReactNode } from 'react';

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
  // FIX: Reverted to class field declarations for state and arrow functions for methods.
  // The previous constructor-based approach was causing TypeScript errors related to 'this' context.
  // This is a more modern and standard way to write React class components.
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(_: Error): Pick<State, 'hasError'> {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const scope = this.props.scope ? `[${this.props.scope}] ` : '';
    console.error(`Uncaught error in scope: ${scope}`, error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };
  
  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const scopeMessage = this.props.scope ? ` in ${this.props.scope}` : '';

      if (isDevelopment) {
        // Detailed error view for developers
        return (
          <div style={{ padding: '2rem', color: '#cbd5e1', backgroundColor: '#0f172a', height: '100vh', overflowY: 'auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f87171' }}>An Error Occurred{scopeMessage}</h1>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button onClick={this.handleReset} style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Try Again</button>
              <button onClick={this.handleReload} style={{ padding: '0.5rem 1rem', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Reload Page</button>
            </div>
            <pre style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#fecaca', fontSize: '0.875rem' }}>
              <strong>{this.state.error?.toString()}</strong>
            </pre>
            <pre style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#94a3b8', fontSize: '0.875rem' }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>
        );
      }
      
      // Generic fallback UI for production
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1', backgroundColor: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f87171' }}>Oops! Something went wrong.</h1>
          <p style={{ marginTop: '1rem' }}>An unexpected error occurred{scopeMessage}. Please try again or reload the page.</p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
             <button onClick={this.handleReset} style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Try Again</button>
             <button onClick={this.handleReload} style={{ padding: '0.5rem 1rem', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Reload Page</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
