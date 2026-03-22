/**
 * Fast Digit Click Handler
 * Handles rapid PATEL bot loading when digits are clicked
 */

import React, { useState, useCallback } from 'react';
import { patelBotLoaderService } from '../../services/patel-bot-loader.service';
import './FastDigitClickHandler.scss';

interface FastDigitClickHandlerProps {
    digit: number;
    market?: string;
    className?: string;
    children?: React.ReactNode;
    onLoadStart?: (digit: number) => void;
    onLoadComplete?: (digit: number) => void;
    onLoadError?: (digit: number, error: Error) => void;
}

export const FastDigitClickHandler: React.FC<FastDigitClickHandlerProps> = ({
    digit,
    market = 'R_50',
    className = '',
    children,
    onLoadStart,
    onLoadComplete,
    onLoadError
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [lastClickTime, setLastClickTime] = useState(0);

    const handleDigitClick = useCallback(async (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        // Prevent double-clicks (debounce)
        const now = Date.now();
        if (now - lastClickTime < 500) {
            return;
        }
        setLastClickTime(now);

        if (isLoading) {
            console.log(`🔄 Digit ${digit} already loading...`);
            return;
        }

        try {
            setIsLoading(true);
            onLoadStart?.(digit);

            console.log(`🎯 Fast loading PATEL bot for digit ${digit}...`);
            
            // Start loading with performance tracking
            const startTime = performance.now();
            
            await patelBotLoaderService.loadPatelBotForDigit(digit, market);
            
            const loadTime = performance.now() - startTime;
            console.log(`✅ PATEL bot loaded in ${loadTime.toFixed(0)}ms for digit ${digit}`);

            onLoadComplete?.(digit);

            // Show visual feedback
            showClickFeedback(event.currentTarget as HTMLElement, digit, loadTime);

        } catch (error) {
            console.error(`❌ Failed to load PATEL bot for digit ${digit}:`, error);
            onLoadError?.(digit, error as Error);
            showErrorFeedback(event.currentTarget as HTMLElement, digit);
        } finally {
            setIsLoading(false);
        }
    }, [digit, market, isLoading, lastClickTime, onLoadStart, onLoadComplete, onLoadError]);

    const showClickFeedback = (element: HTMLElement, digit: number, loadTime: number) => {
        // Add success animation class
        element.classList.add('digit-click-success');
        
        // Create floating feedback
        const feedback = document.createElement('div');
        feedback.className = 'digit-click-feedback success';
        feedback.innerHTML = `
            <div class="feedback-icon">🎯</div>
            <div class="feedback-text">
                <div class="feedback-title">PATEL Bot Ready!</div>
                <div class="feedback-subtitle">Digit ${digit} • ${loadTime.toFixed(0)}ms</div>
            </div>
        `;

        const rect = element.getBoundingClientRect();
        feedback.style.left = `${rect.left + rect.width / 2}px`;
        feedback.style.top = `${rect.top - 10}px`;

        document.body.appendChild(feedback);

        // Animate and remove
        setTimeout(() => {
            feedback.classList.add('animate-out');
            element.classList.remove('digit-click-success');
        }, 2000);

        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 2500);
    };

    const showErrorFeedback = (element: HTMLElement, digit: number) => {
        // Add error animation class
        element.classList.add('digit-click-error');
        
        // Create error feedback
        const feedback = document.createElement('div');
        feedback.className = 'digit-click-feedback error';
        feedback.innerHTML = `
            <div class="feedback-icon">❌</div>
            <div class="feedback-text">
                <div class="feedback-title">Loading Failed</div>
                <div class="feedback-subtitle">Digit ${digit}</div>
            </div>
        `;

        const rect = element.getBoundingClientRect();
        feedback.style.left = `${rect.left + rect.width / 2}px`;
        feedback.style.top = `${rect.top - 10}px`;

        document.body.appendChild(feedback);

        // Animate and remove
        setTimeout(() => {
            feedback.classList.add('animate-out');
            element.classList.remove('digit-click-error');
        }, 2000);

        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 2500);
    };

    return (
        <div
            className={`fast-digit-click-handler ${className} ${isLoading ? 'loading' : ''}`}
            onClick={handleDigitClick}
            style={{ cursor: isLoading ? 'wait' : 'pointer' }}
            title={`Click to load PATEL bot for digit ${digit}`}
        >
            {children}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                </div>
            )}
        </div>
    );
};

export default FastDigitClickHandler;