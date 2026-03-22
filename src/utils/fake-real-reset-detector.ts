/**
 * Fake Real Balance Reset Detector
 * Detects swipe gesture to reset fake real balance back to $2,000
 * 
 * Mobile: Swipe left 2 times, then right 2 times
 * Desktop: Type "reset" then press Enter
 */

import { fakeRealBalanceTracker } from '@/services/fake-real-balance-tracker.service';

class FakeRealResetDetector {
    private swipeCount = { left: 0, right: 0 };
    private keySequence: string[] = [];
    private lastSwipeTime = 0;
    private lastKeyTime = 0;
    private readonly SWIPE_TIMEOUT = 3000; // 3 seconds
    private readonly KEY_TIMEOUT = 2000; // 2 seconds
    private readonly TARGET_SEQUENCE = 'reset';
    private touchStartX = 0;
    private touchStartY = 0;

    constructor() {
        this.init();
    }

    private init() {
        // Mobile touch events
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });

        // Desktop keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    private handleTouchStart(e: TouchEvent) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    private handleTouchEnd(e: TouchEvent) {
        // Only work in fake real mode
        if (!fakeRealBalanceTracker.isFakeRealModeActive()) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        
        // Check if it's a horizontal swipe (not vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            const currentTime = Date.now();
            
            // Reset if timeout exceeded
            if (currentTime - this.lastSwipeTime > this.SWIPE_TIMEOUT) {
                this.resetSwipes();
            }
            
            this.lastSwipeTime = currentTime;
            
            if (deltaX < 0) {
                // Swipe left
                this.handleSwipeLeft();
            } else {
                // Swipe right
                this.handleSwipeRight();
            }
        }
    }

    private handleSwipeLeft() {
        // Only count left swipes if we haven't started right swipes yet
        if (this.swipeCount.right === 0) {
            this.swipeCount.left++;
            console.log(`👈 Reset gesture - Swipe left: ${this.swipeCount.left}/2`);
            
            if (this.swipeCount.left === 2) {
                console.log('✅ Left swipes complete! Now swipe right 2 times...');
            }
        } else {
            // Reset if swiping left after starting right swipes
            console.log('❌ Wrong direction! Resetting...');
            this.resetSwipes();
        }
    }

    private handleSwipeRight() {
        // Only count right swipes if we've completed 2 left swipes
        if (this.swipeCount.left === 2) {
            this.swipeCount.right++;
            console.log(`👉 Reset gesture - Swipe right: ${this.swipeCount.right}/2`);
            
            if (this.swipeCount.right === 2) {
                console.log('🎉 Reset gesture detected!');
                this.resetFakeRealBalance();
                this.resetSwipes();
            }
        } else {
            // Reset if swiping right before completing left swipes
            console.log('❌ Complete left swipes first! Resetting...');
            this.resetSwipes();
        }
    }

    private resetSwipes() {
        this.swipeCount = { left: 0, right: 0 };
    }

    private handleKeyDown(e: KeyboardEvent) {
        // Only work in fake real mode
        if (!fakeRealBalanceTracker.isFakeRealModeActive()) return;

        const currentTime = Date.now();
        
        // Reset if timeout exceeded
        if (currentTime - this.lastKeyTime > this.KEY_TIMEOUT) {
            this.keySequence = [];
        }
        
        this.lastKeyTime = currentTime;
        
        if (e.key === 'Enter') {
            // Check if we've typed the correct sequence
            const typedSequence = this.keySequence.join('').toLowerCase();
            
            if (typedSequence === this.TARGET_SEQUENCE) {
                console.log('🎉 Reset keyboard sequence detected!');
                this.resetFakeRealBalance();
                this.keySequence = [];
            } else {
                // Wrong sequence, reset
                this.keySequence = [];
            }
        } else if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
            // Only add letter keys
            this.keySequence.push(e.key.toLowerCase());
            
            // Keep only the last 5 characters (length of "reset")
            if (this.keySequence.length > this.TARGET_SEQUENCE.length) {
                this.keySequence.shift();
            }
            
            const currentSequence = this.keySequence.join('');
            if (currentSequence === this.TARGET_SEQUENCE) {
                console.log('✅ Sequence "reset" typed! Press Enter to reset balance...');
            }
        }
    }

    private resetFakeRealBalance() {
        // Fire event to open the balance-set panel instead of resetting directly
        window.dispatchEvent(new CustomEvent('fake-real-open-reset-panel'));
    }

    public destroy() {
        document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
}

// Initialize the detector
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
        console.log('🔄 Fake Real Reset Detector destroyed');
    }
};
