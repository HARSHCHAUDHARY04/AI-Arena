import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'component'}:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/5 text-center">
                    <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
                    <h3 className="font-semibold text-lg mb-2">Something went wrong</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {this.props.name ? `Error in ${this.props.name}` : 'An unexpected error occurred.'}
                    </p>
                    <div className="bg-background/50 p-2 rounded text-xs font-mono text-left mb-4 overflow-auto max-h-32">
                        {this.state.error?.message}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
