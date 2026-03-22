// Authentication Configuration
export const AUTH_CONFIG = {
    // Signals Center Password Protection
    SIGNALS_PASSWORD: '777',

    // Signal Savvy & Patel Signals Password Protection
    PREMIUM_SIGNALS_PASSWORD: '6139',

    // Session timeout (24 hours in milliseconds)
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,

    // Storage keys
    SIGNALS_STORAGE_KEY: 'signals_access_granted',
    SIGNAL_SAVVY_STORAGE_KEY: 'signal_savvy_access_granted',
    PATEL_SIGNALS_STORAGE_KEY: 'patel_signals_access_granted',

    // Contact information for access
    CONTACT_INFO: 'Contact PlentyFX for access credentials',
} as const;
