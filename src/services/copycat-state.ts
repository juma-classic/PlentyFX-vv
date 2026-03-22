/**
 * CopyCat global state
 * Shared between CopyCatPage UI and Purchase.js trade engine.
 * Uses localStorage as the source of truth so state survives tab switches.
 */

const STORAGE_TOKENS = 'copycat_tokens';
const STORAGE_COPY_ACTIVE = 'copycat_copy_active';

export const copycatState = {
    isActive(): boolean {
        return localStorage.getItem(STORAGE_COPY_ACTIVE) === 'true';
    },

    getClientTokens(): string[] {
        try {
            const raw = localStorage.getItem(STORAGE_TOKENS);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter((t: unknown) => typeof t === 'string' && (t as string).length > 0) : [];
        } catch {
            return [];
        }
    },
};
