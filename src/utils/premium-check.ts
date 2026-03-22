/**
 * Premium Access Check Utility
 * Determines if the current user has premium bot access
 */

import premiumWhitelist from '../../config/premium-whitelist.json';

/**
 * Check if the current user has premium access
 * @returns true if user is whitelisted, false otherwise
 */
export const isPremiumUser = (): boolean => {
    try {
        const activeLoginId = localStorage.getItem('active_loginid');

        if (activeLoginId && premiumWhitelist.premiumUsers.includes(activeLoginId)) {
            return true;
        }

        // Check if any account matches premium identifiers
        const clientAccounts = localStorage.getItem('client.accounts');
        if (clientAccounts) {
            const accounts = JSON.parse(clientAccounts);
            const accountIds = Object.keys(accounts);

            for (const id of accountIds) {
                if (premiumWhitelist.premiumUsers.includes(id)) {
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking premium status:', error);
        return false;
    }
};

/**
 * Get current user's login ID
 * @returns login ID or null
 */
export const getCurrentLoginId = (): string | null => {
    try {
        return localStorage.getItem('active_loginid');
    } catch (error) {
        console.error('Error getting login ID:', error);
        return null;
    }
};

/**
 * Get all whitelisted premium users
 * @returns array of premium user IDs
 */
export const getPremiumWhitelist = (): string[] => {
    return premiumWhitelist.premiumUsers;
};
