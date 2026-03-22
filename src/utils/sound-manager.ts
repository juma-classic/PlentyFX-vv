/**
 * Sound Manager
 * Manages audio playback for alerts and notifications
 * Preloads sounds and handles volume control
 */

export type SoundType = 'entry' | 'warning' | 'critical' | 'win' | 'loss' | 'tick';

interface SoundConfig {
    path: string;
    volume: number;
}

class SoundManager {
    private static instance: SoundManager;
    private sounds: Map<SoundType, HTMLAudioElement> = new Map();
    private isMuted: boolean = false;
    private globalVolume: number = 0.7;

    private readonly soundConfigs: Record<SoundType, SoundConfig> = {
        entry: { path: '/sounds/entry-signal.mp3', volume: 0.8 },
        warning: { path: '/sounds/warning.mp3', volume: 0.7 },
        critical: { path: '/sounds/critical-alert.mp3', volume: 1.0 },
        win: { path: '/sounds/win.mp3', volume: 0.8 },
        loss: { path: '/sounds/loss.mp3', volume: 0.6 },
        tick: { path: '/sounds/tick.mp3', volume: 0.3 },
    };

    private constructor() {
        this.loadPreferences();
        this.preloadSounds();
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    /**
     * Preload all sounds
     */
    private preloadSounds(): void {
        Object.entries(this.soundConfigs).forEach(([type, config]) => {
            const audio = new Audio(config.path);
            audio.volume = config.volume * this.globalVolume;
            audio.preload = 'auto';
            this.sounds.set(type as SoundType, audio);
        });
    }

    /**
     * Play sound
     */
    public play(type: SoundType): void {
        if (this.isMuted) return;

        const sound = this.sounds.get(type);
        if (!sound) return;

        // Reset and play
        sound.currentTime = 0;
        sound.play().catch(error => {
            console.warn(`Failed to play sound ${type}:`, error);
        });
    }

    /**
     * Set global volume
     */
    public setVolume(volume: number): void {
        this.globalVolume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach((audio, type) => {
            audio.volume = this.soundConfigs[type].volume * this.globalVolume;
        });
        this.savePreferences();
    }

    /**
     * Get current volume
     */
    public getVolume(): number {
        return this.globalVolume;
    }

    /**
     * Mute all sounds
     */
    public mute(): void {
        this.isMuted = true;
        this.savePreferences();
    }

    /**
     * Unmute all sounds
     */
    public unmute(): void {
        this.isMuted = false;
        this.savePreferences();
    }

    /**
     * Toggle mute
     */
    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        this.savePreferences();
        return this.isMuted;
    }

    /**
     * Check if muted
     */
    public isSoundMuted(): boolean {
        return this.isMuted;
    }

    /**
     * Load preferences from localStorage
     */
    private loadPreferences(): void {
        try {
            const stored = localStorage.getItem('soundPreferences');
            if (stored) {
                const prefs = JSON.parse(stored);
                this.isMuted = prefs.isMuted ?? false;
                this.globalVolume = prefs.volume ?? 0.7;
            }
        } catch (e) {
            console.warn('Failed to load sound preferences:', e);
        }
    }

    /**
     * Save preferences to localStorage
     */
    private savePreferences(): void {
        try {
            localStorage.setItem(
                'soundPreferences',
                JSON.stringify({
                    isMuted: this.isMuted,
                    volume: this.globalVolume,
                })
            );
        } catch (e) {
            console.warn('Failed to save sound preferences:', e);
        }
    }
}

export const soundManager = SoundManager.getInstance();
