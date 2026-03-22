import React, { useState } from 'react';
import { botLoadingTester } from '../../utils/bot-loading-tester';
import { botLoadingDebugger } from '../../utils/bot-loading-debugger';
import './BotLoadingDebugPanel.scss';

export const BotLoadingDebugPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [debugResults, setDebugResults] = useState<any>(null);

    const runFullTest = async () => {
        setIsRunning(true);
        try {
            await botLoadingTester.testBotLoading();
            const results = botLoadingDebugger.getDebugInfo();
            setDebugResults(results);
        } catch (error) {
            console.error('Test failed:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const runQuickDiagnostic = () => {
        botLoadingTester.runQuickDiagnostic();
    };

    const testBotFile = async () => {
        try {
            const response = await fetch('/CFX-EvenOdd.xml');
            if (response.ok) {
                const content = await response.text();
                console.log('✅ CFX-EvenOdd bot file test successful:', {
                    size: content.length,
                    preview: content.substring(0, 200) + '...',
                });
            } else {
                console.error('❌ CFX-EvenOdd bot file test failed:', response.status);
            }
        } catch (error) {
            console.error('❌ CFX-EvenOdd bot file test error:', error);
        }
    };

    const testWindowGlobals = () => {
        const windowGlobals = window as any;
        const results = {
            load_modal: !!windowGlobals.load_modal?.loadStrategyToBuilder,
            load_modal_store: !!windowGlobals.load_modal_store?.loadStrategyToBuilder,
            dashboard_store: !!windowGlobals.dashboard_store?.setActiveTab,
            Blockly: !!windowGlobals.Blockly?.getMainWorkspace,
        };

        console.log('🔍 Window Globals Test Results:', results);

        // Show in UI notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1f2937;
            color: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
            max-width: 300px;
        `;

        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">Window Globals Test</div>
            ${Object.entries(results)
                .map(([key, value]) => `<div>${value ? '✅' : '❌'} ${key}</div>`)
                .join('')}
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    };

    if (!isOpen) {
        return (
            <button className='debug-panel-toggle' onClick={() => setIsOpen(true)} title='Open Bot Loading Debug Panel'>
                🔧 Debug
            </button>
        );
    }

    return (
        <div className='bot-loading-debug-panel'>
            <div className='debug-panel-header'>
                <h3>🔧 Bot Loading Debug Panel</h3>
                <button onClick={() => setIsOpen(false)} className='close-btn'>
                    ×
                </button>
            </div>

            <div className='debug-panel-content'>
                <div className='debug-section'>
                    <h4>Quick Tests</h4>
                    <div className='debug-buttons'>
                        <button onClick={runQuickDiagnostic} className='debug-btn'>
                            ⚡ Quick Diagnostic
                        </button>
                        <button onClick={testBotFile} className='debug-btn'>
                            📄 Test Bot File
                        </button>
                        <button onClick={testWindowGlobals} className='debug-btn'>
                            🌐 Test Window Globals
                        </button>
                    </div>
                </div>

                <div className='debug-section'>
                    <h4>Full Test Suite</h4>
                    <button onClick={runFullTest} disabled={isRunning} className='debug-btn primary'>
                        {isRunning ? '🔄 Running Tests...' : '🧪 Run Full Test Suite'}
                    </button>
                </div>

                {debugResults && (
                    <div className='debug-section'>
                        <h4>Test Results</h4>
                        <div className='debug-results'>
                            <div className='result-summary'>
                                <span className={`status ${debugResults.success ? 'success' : 'error'}`}>
                                    {debugResults.success ? '✅ Success' : '❌ Failed'}
                                </span>
                                <span className='duration'>{debugResults.totalDuration}ms</span>
                                <span className='steps'>{debugResults.steps?.length || 0} steps</span>
                            </div>

                            {debugResults.steps && (
                                <div className='steps-list'>
                                    {debugResults.steps.map((step: any, index: number) => (
                                        <div key={index} className={`step ${step.status}`}>
                                            <span className='step-icon'>
                                                {step.status === 'success'
                                                    ? '✅'
                                                    : step.status === 'error'
                                                      ? '❌'
                                                      : step.status === 'warning'
                                                        ? '⚠️'
                                                        : '⏳'}
                                            </span>
                                            <span className='step-name'>{step.step}</span>
                                            <span className='step-message'>{step.message}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className='debug-section'>
                    <h4>Console Commands</h4>
                    <div className='console-commands'>
                        <code>botLoadingTester.testBotLoading()</code>
                        <code>botLoadingTester.runQuickDiagnostic()</code>
                        <code>botLoadingDebugger.getDebugInfo()</code>
                    </div>
                </div>

                <div className='debug-section'>
                    <h4>Bot Loading Process</h4>
                    <div className='process-steps'>
                        <div className='process-step'>
                            <span className='step-number'>1</span>
                            <span className='step-text'>Load public/CFX-EvenOdd.xml</span>
                        </div>
                        <div className='process-step'>
                            <span className='step-number'>2</span>
                            <span className='step-text'>Parse XML and configure parameters</span>
                        </div>
                        <div className='process-step'>
                            <span className='step-number'>3</span>
                            <span className='step-text'>Update market, stake, martingale settings</span>
                        </div>
                        <div className='process-step'>
                            <span className='step-number'>4</span>
                            <span className='step-text'>Inject into Deriv Bot Builder</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
