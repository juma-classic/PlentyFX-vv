/**
 * Animation Controller
 * Manages flash animations, sound effects, and visual feedback
 * Prevents animation overlap and ensures smooth 60fps performance
 */

export type AnimationType = 'flash' | 'shake' | 'pulse' | 'confetti' | 'glow';
export type AnimationPriority = 'low' | 'medium' | 'high' | 'critical';

interface AnimationQueueItem {
    id: string;
    type: AnimationType;
    priority: AnimationPriority;
    duration: number;
    callback: () => void;
    timestamp: number;
}

class AnimationController {
    private static instance: AnimationController;
    private queue: AnimationQueueItem[] = [];
    private isAnimating: boolean = false;
    private currentAnimation: AnimationQueueItem | null = null;
    private animationFrame: number | null = null;

    private constructor() {}

    public static getInstance(): AnimationController {
        if (!AnimationController.instance) {
            AnimationController.instance = new AnimationController();
        }
        return AnimationController.instance;
    }

    /**
     * Add animation to queue
     */
    public addAnimation(
        type: AnimationType,
        priority: AnimationPriority,
        duration: number,
        callback: () => void
    ): string {
        const id = `${type}-${Date.now()}-${Math.random()}`;
        const animation: AnimationQueueItem = {
            id,
            type,
            priority,
            duration,
            callback,
            timestamp: Date.now(),
        };

        // Add to queue based on priority
        this.queue.push(animation);
        this.queue.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));

        // Start processing if not already animating
        if (!this.isAnimating) {
            this.processQueue();
        }

        return id;
    }

    /**
     * Cancel animation by ID
     */
    public cancelAnimation(id: string): void {
        this.queue = this.queue.filter(item => item.id !== id);

        if (this.currentAnimation?.id === id) {
            this.stopCurrentAnimation();
        }
    }

    /**
     * Clear all animations
     */
    public clearAll(): void {
        this.queue = [];
        this.stopCurrentAnimation();
    }

    /**
     * Process animation queue
     */
    private processQueue(): void {
        if (this.queue.length === 0) {
            this.isAnimating = false;
            return;
        }

        this.isAnimating = true;
        const animation = this.queue.shift()!;
        this.currentAnimation = animation;

        // Execute animation callback
        animation.callback();

        // Schedule next animation after duration
        setTimeout(() => {
            this.currentAnimation = null;
            this.processQueue();
        }, animation.duration);
    }

    /**
     * Stop current animation
     */
    private stopCurrentAnimation(): void {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.currentAnimation = null;
        this.isAnimating = false;
    }

    /**
     * Get priority value for sorting
     */
    private getPriorityValue(priority: AnimationPriority): number {
        switch (priority) {
            case 'critical':
                return 4;
            case 'high':
                return 3;
            case 'medium':
                return 2;
            case 'low':
                return 1;
            default:
                return 0;
        }
    }

    /**
     * Flash animation helper
     */
    public flash(color: string, duration: number = 500, priority: AnimationPriority = 'medium'): string {
        return this.addAnimation('flash', priority, duration, () => {
            const overlay = document.createElement('div');
            overlay.className = 'animation-flash-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: ${color};
                z-index: 9999;
                pointer-events: none;
                animation: flash-fade ${duration}ms ease-out forwards;
            `;
            document.body.appendChild(overlay);

            setTimeout(() => {
                overlay.remove();
            }, duration);
        });
    }

    /**
     * Shake animation helper
     */
    public shake(element: HTMLElement, intensity: number = 10, duration: number = 500): string {
        return this.addAnimation('shake', 'medium', duration, () => {
            element.style.animation = `shake ${duration}ms ease-in-out`;
            element.style.setProperty('--shake-intensity', `${intensity}px`);

            setTimeout(() => {
                element.style.animation = '';
            }, duration);
        });
    }

    /**
     * Confetti animation helper
     */
    public confetti(duration: number = 3000): string {
        return this.addAnimation('confetti', 'high', duration, () => {
            const container = document.createElement('div');
            container.className = 'animation-confetti-container';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 9998;
                pointer-events: none;
                overflow: hidden;
            `;
            document.body.appendChild(container);

            // Create confetti pieces
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
            const pieceCount = 50;

            for (let i = 0; i < pieceCount; i++) {
                const piece = document.createElement('div');
                const color = colors[Math.floor(Math.random() * colors.length)];
                const left = Math.random() * 100;
                const animationDuration = 2 + Math.random() * 2;
                const delay = Math.random() * 0.5;

                piece.style.cssText = `
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: ${color};
                    left: ${left}%;
                    top: -10px;
                    animation: confetti-fall ${animationDuration}s linear ${delay}s forwards;
                    transform: rotate(${Math.random() * 360}deg);
                `;
                container.appendChild(piece);
            }

            setTimeout(() => {
                container.remove();
            }, duration);
        });
    }

    /**
     * Glow animation helper
     */
    public glow(element: HTMLElement, color: string, duration: number = 1000): string {
        return this.addAnimation('glow', 'low', duration, () => {
            const originalBoxShadow = element.style.boxShadow;
            element.style.animation = `glow-pulse ${duration}ms ease-in-out`;
            element.style.setProperty('--glow-color', color);

            setTimeout(() => {
                element.style.animation = '';
                element.style.boxShadow = originalBoxShadow;
            }, duration);
        });
    }

    /**
     * Check if animations are supported
     */
    public isSupported(): boolean {
        return typeof window !== 'undefined' && 'requestAnimationFrame' in window;
    }

    /**
     * Get current queue length
     */
    public getQueueLength(): number {
        return this.queue.length;
    }

    /**
     * Check if currently animating
     */
    public isCurrentlyAnimating(): boolean {
        return this.isAnimating;
    }
}

// Export singleton instance
export const animationController = AnimationController.getInstance();

// Add global CSS animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes flash-fade {
            0% { opacity: 0.8; }
            100% { opacity: 0; }
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(calc(var(--shake-intensity, 10px) * -1)); }
            20%, 40%, 60%, 80% { transform: translateX(var(--shake-intensity, 10px)); }
        }

        @keyframes confetti-fall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }

        @keyframes glow-pulse {
            0%, 100% {
                box-shadow: 0 0 10px var(--glow-color, #3b82f6);
            }
            50% {
                box-shadow: 0 0 30px var(--glow-color, #3b82f6);
            }
        }
    `;
    document.head.appendChild(style);
}
