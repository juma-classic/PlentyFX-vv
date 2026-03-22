/**
 * Fake Real Balance Reset Detector
 * Mobile: Long-press the balance area for 3 seconds (handled in account-switcher.tsx)
 * Desktop: Type "reset" then press Enter
 */

import { fakeRealBalanceTracker } from '@/services/fake-real-balance-tracker.service';

class FakeRealResetDetector {
    private lastKeyTime = 0;
    private readonly KEY_TIMEOUT = 2000;
    private readonly TARGET_SEQUENCE = 'reset';
    private keySequence: string[] = [];

    constructor() {
        this.init();
    }

    private init() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
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
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
}

let resetDetectorInstance: FakeRealResetDetector | null = null;

export const initFakeRealResetDetector = () => {
    if (!resetDetectorInstance) {
        resetDetectorInstance = new FakeRealResetDetector();
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
