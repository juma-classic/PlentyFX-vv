/**
 * Centralized API Configuration for Zeus Trading Hub
 * 
 * This file manages all Deriv API credentials and endpoints.
 * Update these values with your own app_id from https://api.deriv.com/app-registration
 */

export const API_CONFIG = {
    // Default App ID - Replace with your own from https://api.deriv.com/app-registration
    APP_ID: process.env.DERIV_APP_ID || '110800',
    
    // WebSocket Endpoints
    WEBSOCKET_ENDPOINTS: {
        production: 'wss://ws.derivws.com/websockets/v3',
        binary: 'wss://ws.binaryws.com/websockets/v3',
    },
    
    // Default endpoint to use
    DEFAULT_ENDPOINT: 'production' as keyof typeof API_CONFIG.WEBSOCKET_ENDPOINTS,
    
    // API Version
    API_VERSION: 'v3',
} as const;

/**
 * Get the WebSocket URL with app_id and optional parameters
 */
export const getWebSocketURL = (
    endpoint?: keyof typeof API_CONFIG.WEBSOCKET_ENDPOINTS,
    options?: {
        language?: string;
        brand?: string;
        app_id?: string;
    }
): string => {
    // Check localStorage for user's preferred endpoint
    const storedEndpoint = typeof window !== 'undefined' 
        ? localStorage.getItem('deriv_server_endpoint') 
        : null;
    
    const selectedEndpoint = (storedEndpoint as keyof typeof API_CONFIG.WEBSOCKET_ENDPOINTS) 
        || endpoint 
        || API_CONFIG.DEFAULT_ENDPOINT;
    
    const baseUrl = API_CONFIG.WEBSOCKET_ENDPOINTS[selectedEndpoint];
    const appId = options?.app_id || API_CONFIG.APP_ID;
    
    const params = new URLSearchParams({
        app_id: appId,
    });
    
    if (options?.language) {
        params.append('l', options.language);
    }
    
    if (options?.brand) {
        params.append('brand', options.brand.toLowerCase());
    }
    
    return `${baseUrl}?${params.toString()}`;
};

/**
 * Available server endpoints for user selection
 */
export const SERVER_OPTIONS = [
    { value: 'production', label: 'Deriv WebSocket (Production)', url: API_CONFIG.WEBSOCKET_ENDPOINTS.production },
    { value: 'binary', label: 'Binary WebSocket (Legacy)', url: API_CONFIG.WEBSOCKET_ENDPOINTS.binary },
] as const;

