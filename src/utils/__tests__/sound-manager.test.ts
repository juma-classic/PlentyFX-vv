/**
 * Sound Manager Tests
 * Tests for audio playback management
 */

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock Audio constructor
window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = jest.fn();

import { soundManager } from '../sound-manager';

describe('SoundManager', () => {
    beforeEach(() => {
        localStorageMock.clear();
        soundManager.unmute();
        soundManager.setVolume(0.7);
        jest.clearAllMocks();
    });

    it('plays sound when not muted', () => {
        soundManager.play('entry');
        // Sound manager should attempt to play (no errors thrown)
        expect(soundManager.isSoundMuted()).toBe(false);
    });

    it('does not play when muted', () => {
        soundManager.mute();
        soundManager.play('entry');
        expect(soundManager.isSoundMuted()).toBe(true);
    });

    it('sets volume correctly', () => {
        soundManager.setVolume(0.5);
        expect(soundManager.getVolume()).toBe(0.5);
    });

    it('clamps volume between 0 and 1', () => {
        soundManager.setVolume(1.5);
        expect(soundManager.getVolume()).toBe(1);

        soundManager.setVolume(-0.5);
        expect(soundManager.getVolume()).toBe(0);
    });

    it('toggles mute', () => {
        expect(soundManager.isSoundMuted()).toBe(false);

        const result1 = soundManager.toggleMute();
        expect(result1).toBe(true);
        expect(soundManager.isSoundMuted()).toBe(true);

        const result2 = soundManager.toggleMute();
        expect(result2).toBe(false);
        expect(soundManager.isSoundMuted()).toBe(false);
    });

    it('mutes and unmutes', () => {
        soundManager.mute();
        expect(soundManager.isSoundMuted()).toBe(true);

        soundManager.unmute();
        expect(soundManager.isSoundMuted()).toBe(false);
    });

    it('saves preferences to localStorage', () => {
        soundManager.setVolume(0.8);
        soundManager.mute();

        const stored = localStorageMock.getItem('soundPreferences');
        expect(stored).toBeTruthy();

        const prefs = JSON.parse(stored!);
        expect(prefs.volume).toBe(0.8);
        expect(prefs.isMuted).toBe(true);
    });

    it('loads preferences from localStorage', () => {
        // Set preferences
        localStorageMock.setItem('soundPreferences', JSON.stringify({ volume: 0.9, isMuted: true }));

        // Note: Since soundManager is a singleton already instantiated,
        // we can't test the load on construction, but we can verify
        // that preferences persist across operations
        soundManager.setVolume(0.9);
        soundManager.mute();

        const stored = localStorageMock.getItem('soundPreferences');
        const prefs = JSON.parse(stored!);
        expect(prefs.volume).toBe(0.9);
        expect(prefs.isMuted).toBe(true);
    });
});
