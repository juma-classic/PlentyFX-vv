/**
 * Admin Check Utility
 * Determines if the current user has admin access
 */

// List of admin login IDs or emails
const ADMIN_IDENTIFIERS = [
    'CR5186289', // Add admin login IDs here
    'VRTC90460', // Virtual account for testing
    'admin@zeustradinghub.com',
    'elvis@zeustradinghub.com',
];

/**
 * Check if the current user is an admin
 * @returns true if user is admin, false otherwise
 */
export const isAdmin = (): boolean => {
    try {
        // Check localStorage for user info
        const clientAccounts = localStorage.getItem('client.accounts');
        const activeLoginId = localStorage.getItem('active_loginid');

        if (activeLoginId && ADMIN_IDENTIFIERS.includes(activeLoginId)) {
            return true;
        }

        // Check if any account matches admin identifiers
        if (clientAccounts) {
            const accounts = JSON.parse(clientAccounts);
            const accountIds = Object.keys(accounts);

            for (const id of accountIds) {
                if (ADMIN_IDENTIFIERS.includes(id)) {
                    return true;
                }

                // Check email
                const account = accounts[id];
                if (account?.email && ADMIN_IDENTIFIERS.includes(account.email)) {
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
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
