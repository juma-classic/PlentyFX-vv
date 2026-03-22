import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ZeusAnalysisErrorBoundary.scss';
import { error } from '@/external/bot-skeleton/services/tradeEngine/utils/broadcast';
import { error } from '@/external/bot-skeleton/services/tradeEngine/utils/broadcast';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for Zeus Analysis Tool
 * Catches and handles errors gracefully without crashing the entire application
 */
export class ZeusAnalysisErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(_error: Error, errorInfo: ErrorInfo): void {
        // Log error details for debugging
        console.error('Zeus Analysis Tool Error:', _error);
        console.error('Error Info:', errorInfo);
        
        // Log to external error tracking service if available
        if (window.TrackJS) {
            window.TrackJS.track(error);
        }
        
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="zeus-error-boundary">
                    <div className="zeus-error-container">
                        <div className="zeus-error-icon">⚠️</div>
                        <h2 className="zeus-error-title">Zeus Analysis Tool Error</h2>
                        <p className="zeus-error-message">
                            Something went wrong with the Zeus Analysis Tool. 
                            Please try refreshing or contact support if the problem persists.
                        </p>
                        
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="zeus-error-details">
                                <summary>Error Details (Development Only)</summary>
                                <pre className="zeus-error-stack">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                        
                        <div className="zeus-error-actions">
                            <button 
                                className="zeus-error-button zeus-error-button-primary"
                                onClick={this.handleReset}
                            >
                                Try Again
                            </button>
                            <button 
                                className="zeus-error-button zeus-error-button-secondary"
                                onClick={() => window.location.reload()}
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
