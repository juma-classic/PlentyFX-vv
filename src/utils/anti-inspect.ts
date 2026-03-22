/**
 * Anti-Inspection Protection
 * Prevents users from easily inspecting the site's source code
 * Note: Determined users can still bypass these measures, but it deters casual inspection
 */

class AntiInspect {
    private isDevToolsOpen = false;
    private devToolsCheckInterval: number | null = null;

    constructor() {
        this.init();
    }

    private init(): void {
        // Only enable in production
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔓 Anti-inspect disabled in development mode');
            return;
        }

        this.disableRightClick();
        this.disableKeyboardShortcuts();
        this.detectDevTools();
        this.disableTextSelection();
        this.disableDragDrop();
        this.clearConsole();

        console.log('🔒 Site protection enabled');
    }

    // Disable right-click context menu
    private disableRightClick(): void {
        document.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            this.showWarning();
            return false;
        });
    }

    // Disable keyboard shortcuts for dev tools
    private disableKeyboardShortcuts(): void {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                this.showWarning();
                return false;
            }

            // Ctrl+Shift+I (Dev Tools)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                this.showWarning();
                return false;
            }

            // Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                this.showWarning();
                return false;
            }

            // Ctrl+Shift+C (Element Inspector)
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.showWarning();
                return false;
            }

            // Ctrl+U (View Source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                this.showWarning();
                return false;
            }

            // Ctrl+S (Save Page)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                return false;
            }

            // Ctrl+Shift+K (Firefox Console)
            if (e.ctrlKey && e.shiftKey && e.key === 'K') {
                e.preventDefault();
                this.showWarning();
                return false;
            }

            // Cmd+Option+I (Mac Dev Tools)
            if (e.metaKey && e.altKey && e.key === 'i') {
                e.preventDefault();
                this.showWarning();
                return false;
            }

            // Cmd+Option+J (Mac Console)
            if (e.metaKey && e.altKey && e.key === 'j') {
                e.preventDefault();
                this.showWarning();
                return false;
            }

            // Cmd+Option+U (Mac View Source)
            if (e.metaKey && e.altKey && e.key === 'u') {
                e.preventDefault();
                this.showWarning();
                return false;
            }

            return true;
        });
    }

    // Detect if dev tools are open
    private detectDevTools(): void {
        const threshold = 160;

        const checkDevTools = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;

            if (widthThreshold || heightThreshold) {
                if (!this.isDevToolsOpen) {
                    this.isDevToolsOpen = true;
                    this.onDevToolsOpen();
                }
            } else {
                this.isDevToolsOpen = false;
            }
        };

        // Check periodically
        this.devToolsCheckInterval = window.setInterval(checkDevTools, 1000);

        // Also check on resize
        window.addEventListener('resize', checkDevTools);

        // Debugger detection
        const detectDebugger = () => {
            const start = performance.now();
            // eslint-disable-next-line no-debugger
            debugger;
            const end = performance.now();
            if (end - start > 100) {
                this.onDevToolsOpen();
            }
        };

        // Run debugger detection occasionally (not too frequently to avoid performance issues)
        setInterval(detectDebugger, 5000);
    }

    // Disable text selection
    private disableTextSelection(): void {
        document.addEventListener('selectstart', (e: Event) => {
            // Allow selection in input fields and textareas
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return true;
            }
            e.preventDefault();
            return false;
        });

        // Add CSS to disable selection
        const style = document.createElement('style');
        style.textContent = `
            body {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
            input, textarea, [contenteditable="true"] {
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                user-select: text;
            }
        `;
        document.head.appendChild(style);
    }

    // Disable drag and drop
    private disableDragDrop(): void {
        document.addEventListener('dragstart', (e: DragEvent) => {
            e.preventDefault();
            return false;
        });
    }

    // Clear console and add warning
    private clearConsole(): void {
        const warningStyle = 'color: red; font-size: 24px; font-weight: bold;';
        const infoStyle = 'color: #333; font-size: 14px;';

        console.clear();
        console.log('%c⚠️ STOP!', warningStyle);
        console.log('%cThis is a browser feature intended for developers.', infoStyle);
        console.log('%cIf someone told you to copy-paste something here, it is a scam.', infoStyle);
        console.log('%cTraders Den - Protected Content', 'color: #0d9488; font-size: 12px;');
    }

    // Show warning when inspection is attempted
    private showWarning(): void {
        // Create a subtle notification instead of an alert
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                animation: slideIn 0.3s ease-out;
                max-width: 300px;
            ">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">🔒</span>
                    <div>
                        <div style="font-weight: 700; font-size: 14px;">Protected Content</div>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                            Inspection is disabled on this site.
                        </div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Action when dev tools are detected as open
    private onDevToolsOpen(): void {
        this.clearConsole();
        // Optionally redirect or show warning
        // window.location.href = '/';
    }

    // Cleanup method
    public destroy(): void {
        if (this.devToolsCheckInterval) {
            clearInterval(this.devToolsCheckInterval);
        }
    }
}

// Create singleton instance
let antiInspectInstance: AntiInspect | null = null;

export const initAntiInspect = (): void => {
    if (!antiInspectInstance) {
        antiInspectInstance = new AntiInspect();
    }
};

export const destroyAntiInspect = (): void => {
    if (antiInspectInstance) {
        antiInspectInstance.destroy();
        antiInspectInstance = null;
    }
};

export default AntiInspect;
