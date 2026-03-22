import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class PatelSignalsErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('PatelSignals Error Boundary caught an error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        padding: '2rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '2rem',
                            borderRadius: '12px',
                            maxWidth: '600px',
                            textAlign: 'center',
                        }}
                    >
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>🚨 Patel Signals Loading Error</h2>
                        <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
                            There was an error loading the Patel Signals component.
                        </p>

                        {this.state.error && (
                            <div
                                style={{
                                    background: 'rgba(255, 0, 0, 0.2)',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    textAlign: 'left',
                                    fontSize: '0.9rem',
                                    fontFamily: 'monospace',
                                }}
                            >
                                <strong>Error:</strong> {this.state.error.message}
                                {this.state.error.stack && (
                                    <pre
                                        style={{
                                            marginTop: '0.5rem',
                                            fontSize: '0.8rem',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {this.state.error.stack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                                window.location.reload();
                            }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                marginRight: '1rem',
                            }}
                        >
                            🔄 Reload Page
                        </button>

                        <button
                            onClick={() => window.history.back()}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                            }}
                        >
                            ← Go Back
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
