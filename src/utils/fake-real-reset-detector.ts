/**
 * Fake Real Balance Reset Detector
 * Mobile: Swipe left once, then swipe right once — then double-tap the USD flag icon
 * Desktop: Type "reset" then press Enter
 */

import { fakeRealBalanceTracker } from '@/services/fake-real-balance-tracker.service';

class FakeRealResetDetector {
    private swipedLeft = false;
    private swipedRight = false;
    private keySequence: string[] = [];
    private lastSwipeTime = 0;
    private lastKeyTime = 0;
    private readonly SWIPE_TIMEOUT = 4000;
    private readonly KEY_TIMEOUT = 2000;
    private readonly TARGET_SEQUENCE = 'reset';
    private touchStartX = 0;
    private touchStartY = 0;

    constructor() {
        this.init();
    }

    private init() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    private handleTouchStart(e: TouchEvent) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    private handleTouchEnd(e: TouchEvent) {
        if (!fakeRealBalanceTracker.isFakeRealModeActive()) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            const now = Date.now();

            // Reset sequence if too much time passed
            if (now - this.lastSwipeTime > this.SWIPE_TIMEOUT) {
                this.swipedLeft = false;
                this.swipedRight = false;
            }

            this.lastSwipeTime = now;

            if (deltaX < 0 && !this.swipedLeft) {
                // Step 1: swipe left
                this.swipedLeft = true;
                this.swipedRight = false;
                console.log('👈 Swipe left detected — now swipe right');
            } else if (deltaX > 0 && this.swipedLeft) {
                // Step 2: swipe right after left
                this.swipedRight = true;
                console.log('👉 Swipe right detected — now double-tap the USD icon');
            }
        }
    }

    /** Called by CurrencyIcon on double-tap */
    public handleIconDoubleTap() {
        if (!fakeRealBalanceTracker.isFakeRealModeActive()) return;
        if (this.swipedLeft && this.swipedRight) {
            console.log('🎉 Reset gesture complete!');
            this.swipedLeft = false;
            this.swipedRight = false;
            window.dispatchEvent(new CustomEvent('fake-real-open-reset-panel'));
        } else {
            console.log('⚠️ Double-tap ignored — complete swipe left then right first');
        }
    }

    private handleKeyDown(e: KeyboardEvent) {
        if (!fakeRealBalanceTracker.isFakeRealModeActive()) return;

        const now = Date.now();
        if (now - this.lastKeyTime > this.KEY_TIMEOUT) this.keySequence = [];
        this.lastKeyTime = now;

        if (e.key === 'Enter') {
            if (this.keySequence.join('').toLowerCase() === this.TARGET_SEQUENCE) {
                window.dispatchEvent(new CustomEvent('fake-real-open-reset-panel'));
            }
            this.keySequence = [];
        } else if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
            this.keySequence.push(e.key.toLowerCase());
            if (this.keySequence.length > this.TARGET_SEQUENCE.length) this.keySequence.shift();
        }
    }

    public destroy() {
        document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
}

let resetDetectorInstance: FakeRealResetDetector | null = null;

export const initFakeRealResetDetector = () => {
    if (!resetDetectorInstance) {
        resetDetectorInstance = new FakeRealResetDetector();
        console.log('🔄 Fake Real Reset Detector initialized');
    }
    return resetDetectorInstance;
};

export const destroyFakeRealResetDetector = () => {
    if (resetDetectorInstance) {
        resetDetectorInstance.destroy();
        resetDetectorInstance = null;
    }
};

export const getFakeRealResetDetector = () => resetDetectorInstance;
