import { useEffect,useState } from 'react';

interface UsePasswordProtectionProps {
    correctPassword: string;
    storageKey?: string;
    sessionTimeout?: number; // in milliseconds
}

export const usePasswordProtection = ({
    correctPassword,
    storageKey = 'signals_access_granted',
    sessionTimeout = 24 * 60 * 60 * 1000, // 24 hours default
}: UsePasswordProtectionProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user was previously authenticated
        const checkStoredAuth = () => {
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const authData = JSON.parse(stored);
                    const now = Date.now();

                    // Check if session hasn't expired
                    if (authData.timestamp && now - authData.timestamp < sessionTimeout) {
                        setIsAuthenticated(true);
                    } else {
                        // Session expired, remove stored data
                        localStorage.removeItem(storageKey);
                    }
                }
            } catch (error) {
                console.error('Error checking stored authentication:', error);
                localStorage.removeItem(storageKey);
            }
            setIsLoading(false);
        };

        checkStoredAuth();
    }, [storageKey, sessionTimeout]);

    const authenticate = (password: string): boolean => {
        if (password === correctPassword) {
            setIsAuthenticated(true);

            // Store authentication with timestamp
            const authData = {
                authenticated: true,
                timestamp: Date.now(),
            };
            localStorage.setItem(storageKey, JSON.stringify(authData));

            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem(storageKey);
    };

    return {
        isAuthenticated,
        isLoading,
        authenticate,
        logout,
    };
};
