/**
 * Fake Real Balance Reset Detector
 * Mobile: Swipe left→right 4 times, then right→left once, then double-tap anywhere
 * Desktop: Type "reset" then press Enter
 */

import { fakeRealBalanceTracker } from '@/services/fake-real-balance-tracker.service';

class FakeRealResetDetector {
    private leftRightCount = 0;   // counts left→right swipes
    private rightLeftDone = false; // whether the right→left swipe happened
    private lastSwipeTime = 0;
    private lastTapTime = 0;
    private lastKeyTime = 0;
    private readonly SWIPE_TIMEOUT = 5000;
    private readonly KEY_TIMEOUT = 2000;
    private readonly TARGET_SEQUENCE = 'reset';
    private keySequence: string[] = [];
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
        const now = Date.now();

        // Detect double-tap (very small movement = tap)
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            if (now - this.lastTapTime < 350) {
                // Double-tap detected
                if (this.leftRightCount >= 4 && this.rightLeftDone) {
                    console.log('🎉 Reset gesture complete via double-tap!');
                    this.resetState();
                    window.dispatchEvent(new CustomEvent('fake-real-open-reset-panel'));
                }
            }
            this.lastTapTime = now;
            return;
        }

        // Must be a horizontal swipe
        if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) <= 50) return;

        // Reset sequence if too much time passed
        if (now - this.lastSwipeTime > this.SWIPE_TIMEOUT) {
            this.resetState();
        }
        this.lastSwipeTime = now;

        const isLeftToRight = deltaX > 0;
        const isRightToLeft = deltaX < 0;

        if (isLeftToRight && !this.rightLeftDone) {
            // Step 1: accumulate left→right swipes (need 4)
            this.leftRightCount++;
            console.log(`➡️ Left→right swipe: ${this.leftRightCount}/4`);
        } else if (isRightToLeft && this.leftRightCount >= 4 && !this.rightLeftDone) {
            // Step 2: one right→left swipe after 4 left→right
            this.rightLeftDone = true;
            console.log('⬅️ Right→left swipe done — now double-tap anywhere');
        } else {
            // Wrong order — reset
            console.log('❌ Wrong swipe order, resetting');
            this.resetState();
        }
    }

    private resetState() {
        this.leftRightCount = 0;
        this.rightLeftDone = false;
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
