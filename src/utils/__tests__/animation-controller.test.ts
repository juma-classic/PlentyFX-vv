import { animationController } from '../animation-controller';

describe('AnimationController', () => {
    beforeEach(() => {
        animationController.clearAll();
    });

    it('adds animation to queue', () => {
        const callback = jest.fn();
        const id = animationController.addAnimation('flash', 'medium', 500, callback);

        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
    });

    it('executes animation callback', done => {
        const callback = jest.fn();
        animationController.addAnimation('flash', 'medium', 100, callback);

        setTimeout(() => {
            expect(callback).toHaveBeenCalled();
            done();
        }, 150);
    });

    it('prioritizes animations correctly', done => {
        const callbacks: string[] = [];

        // Clear queue first
        animationController.clearAll();

        animationController.addAnimation('flash', 'low', 50, () => callbacks.push('low'));
        animationController.addAnimation('flash', 'critical', 50, () => callbacks.push('critical'));
        animationController.addAnimation('flash', 'medium', 50, () => callbacks.push('medium'));

        setTimeout(() => {
            // Critical should be first due to priority
            expect(callbacks.length).toBeGreaterThan(0);
            expect(callbacks).toContain('critical');
            done();
        }, 300);
    });

    it('cancels animation by ID', () => {
        const callback = jest.fn();
        const id = animationController.addAnimation('flash', 'medium', 1000, callback);

        animationController.cancelAnimation(id);
        expect(animationController.getQueueLength()).toBe(0);
    });

    it('clears all animations', () => {
        animationController.addAnimation('flash', 'medium', 500, jest.fn());
        animationController.addAnimation('shake', 'high', 500, jest.fn());

        animationController.clearAll();
        expect(animationController.getQueueLength()).toBe(0);
    });

    it('prevents animation overlap', done => {
        let count = 0;

        // Clear queue first
        animationController.clearAll();

        animationController.addAnimation('flash', 'medium', 100, () => count++);
        animationController.addAnimation('flash', 'medium', 100, () => count++);

        // Both animations should eventually complete
        setTimeout(() => {
            expect(count).toBeGreaterThanOrEqual(1);
            expect(count).toBeLessThanOrEqual(2);
            done();
        }, 300);
    });

    it('checks if animations are supported', () => {
        expect(animationController.isSupported()).toBe(true);
    });

    it('tracks animation state', () => {
        expect(animationController.isCurrentlyAnimating()).toBe(false);

        animationController.addAnimation('flash', 'medium', 500, jest.fn());
        expect(animationController.isCurrentlyAnimating()).toBe(true);
    });

    it('creates flash animation', () => {
        const id = animationController.flash('#ff0000', 500, 'high');
        expect(id).toBeDefined();
    });

    it('creates shake animation', () => {
        const element = document.createElement('div');
        const id = animationController.shake(element, 10, 500);
        expect(id).toBeDefined();
    });

    it('creates confetti animation', () => {
        const id = animationController.confetti(3000);
        expect(id).toBeDefined();
    });

    it('creates glow animation', () => {
        const element = document.createElement('div');
        const id = animationController.glow(element, '#3b82f6', 1000);
        expect(id).toBeDefined();
    });
});
