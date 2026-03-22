import React, { useState } from 'react';
import classNames from 'classnames';
import AnalysisTool from '@/components/analysis-tool/AnalysisTool';
import { usePasswordProtection } from '@/hooks/usePasswordProtection';
import { useStore } from '@/hooks/useStore';
import { useDevice } from '@deriv-com/ui';
import { PasswordProtection } from './PasswordProtection';

export const ProtectedAnalysisTool: React.FC = () => {
    const { isAuthenticated, authenticate } = usePasswordProtection();
    const { run_panel, dashboard } = useStore();
    const { is_drawer_open } = run_panel;
    const { is_chart_modal_visible } = dashboard;
    const { isDesktop } = useDevice();
    const [analysisToolUrl, setAnalysisToolUrl] = useState('ai');

    if (!isAuthenticated) {
        return (
            <PasswordProtection
                onAuthenticate={authenticate}
                title='Analysis Tool Access'
                subtitle='Enter password to access Advanced Analysis Tools'
            />
        );
    }

    const toggleAnalysisTool = (url: string) => setAnalysisToolUrl(url);

    return (
        <div
            className={classNames('dashboard__chart-wrapper', {
                'dashboard__chart-wrapper--expanded': is_drawer_open && isDesktop,
                'dashboard__chart-wrapper--modal': is_chart_modal_visible && isDesktop,
            })}
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #7d1f3d 0%, #9f2a4f 100%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    flexShrink: 0,
                }}
            >
                <button
                    onClick={() => toggleAnalysisTool('internal')}
                    style={{
                        flex: 1,
                        backgroundColor: analysisToolUrl === 'internal' ? '#0d9488' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        padding: '12px 20px',
                        border:
                            analysisToolUrl === 'internal' ? '2px solid #ffd700' : '2px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxShadow: analysisToolUrl === 'internal' ? '0 4px 12px rgba(13,148,136,0.3)' : 'none',
                    }}
                    onMouseEnter={e => {
                        if (analysisToolUrl !== 'internal') {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                    }}
                    onMouseLeave={e => {
                        if (analysisToolUrl !== 'internal') {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }
                    }}
                >
                    📊 Advanced Analysis
                </button>
                <button
                    onClick={() => toggleAnalysisTool('ai')}
                    style={{
                        flex: 1,
                        backgroundColor: analysisToolUrl === 'ai' ? '#0d9488' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        padding: '12px 20px',
                        border: analysisToolUrl === 'ai' ? '2px solid #ffd700' : '2px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxShadow: analysisToolUrl === 'ai' ? '0 4px 12px rgba(13,148,136,0.3)' : 'none',
                    }}
                    onMouseEnter={e => {
                        if (analysisToolUrl !== 'ai') {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                    }}
                    onMouseLeave={e => {
                        if (analysisToolUrl !== 'ai') {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }
                    }}
                >
                    🤖 Zeus AI Tool
                </button>
                <button
                    onClick={() => toggleAnalysisTool('ldpanalyzer')}
                    style={{
                        flex: 1,
                        backgroundColor: analysisToolUrl === 'ldpanalyzer' ? '#0d9488' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        padding: '12px 20px',
                        border:
                            analysisToolUrl === 'ldpanalyzer' ? '2px solid #ffd700' : '2px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxShadow: analysisToolUrl === 'ldpanalyzer' ? '0 4px 12px rgba(13,148,136,0.3)' : 'none',
                    }}
                    onMouseEnter={e => {
                        if (analysisToolUrl !== 'ldpanalyzer') {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                    }}
                    onMouseLeave={e => {
                        if (analysisToolUrl !== 'ldpanalyzer') {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }
                    }}
                >
                    📈 LDP Analyzer
                </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {analysisToolUrl === 'internal' ? (
                    <AnalysisTool />
                ) : (
                    <iframe
                        src={analysisToolUrl}
                        width='100%'
                        style={{
                            border: 'none',
                            display: 'block',
                            height: '100%',
                            background: '#f8fafc',
                        }}
                        scrolling='yes'
                    />
                )}
            </div>
        </div>
    );
};
