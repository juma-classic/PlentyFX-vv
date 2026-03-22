/**
 * Secret Mode Detector
 * Desktop only: type "admin" then press Enter twice to toggle fake real mode.
 * Swipe gestures removed — keyboard only for reduced discoverability.
 * Access restricted to accounts listed in fake-real-allowlist.ts.
 */

import { isAllowedFakeRealAccount } from '@/config/fake-real-allowlist';

class SecretModeDetector {
    private keySequence: string[] = [];
    private enterPressCount = 0;
    private lastKeyTime = 0;
    private readonly KEY_TIMEOUT = 2000; // 2 seconds
    private readonly TARGET_SEQUENCE = 'admin';

    constructor() {
        this.init();
    }

    private init() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    private handleKeyDown(e: KeyboardEvent) {
        // Silently ignore if not an allowed account
        if (!isAllowedFakeRealAccount()) return;

        const currentTime = Date.now();

        // Reset if timeout exceeded
        if (currentTime - this.lastKeyTime > this.KEY_TIMEOUT) {
            this.keySequence = [];
            this.enterPressCount = 0;
        }

        this.lastKeyTime = currentTime;

        if (e.key === 'Enter') {
            const typedSequence = this.keySequence.join('').toLowerCase();

            if (typedSequence === this.TARGET_SEQUENCE) {
                this.enterPressCount++;

                if (this.enterPressCount === 2) {
                    this.activateFakeRealMode();
                    this.keySequence = [];
                    this.enterPressCount = 0;
                }
            } else {
                this.keySequence = [];
                this.enterPressCount = 0;
            }
        } else if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
            this.keySequence.push(e.key.toLowerCase());

            // Keep only the last N characters (length of target sequence)
            if (this.keySequence.length > this.TARGET_SEQUENCE.length) {
                this.keySequence.shift();
            }
        }
    }

    private activateFakeRealMode() {
        const currentMode = localStorage.getItem('demo_icon_us_flag') === 'true';

        // For allowed accounts, only allow activation — not deactivation via keyboard
        if (!currentMode) {
            localStorage.setItem('demo_icon_us_flag', 'true');
            localStorage.setItem('fake_real_mode_acknowledged', 'true');

            const activeLoginId = localStorage.getItem('active_loginid');
            if (activeLoginId && activeLoginId.startsWith('VR')) {
                const searchParams = new URLSearchParams(window.location.search);
                searchParams.set('account', 'USD');
                window.history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
            }
            window.location.reload();
        }
        // Deactivation via keyboard is blocked — use 10s long-press on demo icon instead
    }

    public destroy() {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
}

let detectorInstance: SecretModeDetector | null = null;

export const initSecretModeDetector = () => {
    if (!detectorInstance) {
        detectorInstance = new SecretModeDetector();
    }
    return detectorInstance;
};

export const destroySecretModeDetector = () => {
    if (detectorInstance) {
        detectorInstance.destroy();
        detectorInstance = null;
    }
};
