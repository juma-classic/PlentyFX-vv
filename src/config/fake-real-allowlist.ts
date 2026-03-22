/**
 * Fake Real Mode — Allowed Account IDs
 * Only accounts listed here can activate fake real mode.
 * Add CR or VRTC account IDs to grant access.
 */
export const FAKE_REAL_ALLOWED_IDS: string[] = [
    'CR8550193',
    'VRTC12720138',
    'CR7125309',
    'VRTC7528369'
    
];

/**
 * Returns true if the currently logged-in account is allowed to use fake real mode.
 */
export const isAllowedFakeRealAccount = (): boolean => {
    const activeLoginId = localStorage.getItem('active_loginid') ?? '';
    return FAKE_REAL_ALLOWED_IDS.includes(activeLoginId);
};
