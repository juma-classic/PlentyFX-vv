import { useState, useEffect, useCallback } from 'react';

interface TickerSettings {
    isVisible: boolean;
    position: 'left' | 'right';
    autoScroll: boolean;
    scrollSpeed: number;
    symbols: string[];
}

const DEFAULT_SETTINGS: TickerSettings = {
    isVisible: true,
    position: 'right',
    autoScroll: true,
    scrollSpeed: 50,
    symbols: [
        'R_10', 'R_25', 'R_50', 'R_75', 'R_100',
        '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V',
        'BOOM1000', 'CRASH1000', 'BOOM500', 'CRASH500'
    ]
};

const STORAGE_KEY = 'fast-lane-ticker-settings';

export const useMarketTicker = () => {
    const [settings, setSettings] = useState<TickerSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(STORAGE_KEY);
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });
            }
        } catch (error) {
            console.warn('Failed to load ticker settings:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        if (!isLoading) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            } catch (error) {
                console.warn('Failed to save ticker settings:', error);
            }
        }
    }, [settings, isLoading]);

    // Update individual setting
    const updateSetting = useCallback(<K extends keyof TickerSettings>(
        key: K,
        value: TickerSettings[K]
    ) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    // Toggle visibility
    const toggleVisibility = useCallback(() => {
        updateSetting('isVisible', !settings.isVisible);
    }, [settings.isVisible, updateSetting]);

    // Toggle position
    const togglePosition = useCallback(() => {
        updateSetting('position', settings.position === 'left' ? 'right' : 'left');
    }, [settings.position, updateSetting]);

    // Toggle auto scroll
    const toggleAutoScroll = useCallback(() => {
        updateSetting('autoScroll', !settings.autoScroll);
    }, [settings.autoScroll, updateSetting]);

    // Update scroll speed
    const setScrollSpeed = useCallback((speed: number) => {
        const clampedSpeed = Math.max(10, Math.min(200, speed));
        updateSetting('scrollSpeed', clampedSpeed);
    }, [updateSetting]);

    // Add symbol
    const addSymbol = useCallback((symbol: string) => {
        if (!settings.symbols.includes(symbol)) {
            updateSetting('symbols', [...settings.symbols, symbol]);
        }
    }, [settings.symbols, updateSetting]);

    // Remove symbol
    const removeSymbol = useCallback((symbol: string) => {
        updateSetting('symbols', settings.symbols.filter(s => s !== symbol));
    }, [settings.symbols, updateSetting]);

    // Reset to defaults
    const resetToDefaults = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
    }, []);

    // Get available symbols for selection
    const getAvailableSymbols = useCallback(() => {
        return [
            // Volatility Indices
            'R_10', 'R_25', 'R_50', 'R_75', 'R_100',
            // 1-Second Volatility
            '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V',
            // Crash/Boom
            'BOOM1000', 'CRASH1000', 'BOOM500', 'CRASH500',
            // Jump Indices
            'JD10', 'JD25', 'JD50', 'JD75', 'JD100',
            // Step Indices
            'STPIDX', 'WLDIDX',
            // Bear/Bull Markets
            'BEAR', 'BULL'
        ];
    }, []);

    // Get symbol display name
    const getSymbolDisplayName = useCallback((symbol: string): string => {
        const displayNames: Record<string, string> = {
            'R_10': 'Volatility 10',
            'R_25': 'Volatility 25',
            'R_50': 'Volatility 50',
            'R_75': 'Volatility 75',
            'R_100': 'Volatility 100',
            '1HZ10V': '1s Vol 10',
            '1HZ25V': '1s Vol 25',
            '1HZ50V': '1s Vol 50',
            '1HZ75V': '1s Vol 75',
            '1HZ100V': '1s Vol 100',
            'BOOM1000': 'Boom 1000',
            'CRASH1000': 'Crash 1000',
            'BOOM500': 'Boom 500',
            'CRASH500': 'Crash 500',
            'JD10': 'Jump 10',
            'JD25': 'Jump 25',
            'JD50': 'Jump 50',
            'JD75': 'Jump 75',
            'JD100': 'Jump 100',
            'STPIDX': 'Step Index',
            'WLDIDX': 'World Index',
            'BEAR': 'Bear Market',
            'BULL': 'Bull Market'
        };
        
        return displayNames[symbol] || symbol;
    }, []);

    return {
        settings,
        isLoading,
        updateSetting,
        toggleVisibility,
        togglePosition,
        toggleAutoScroll,
        setScrollSpeed,
        addSymbol,
        removeSymbol,
        resetToDefaults,
        getAvailableSymbols,
        getSymbolDisplayName
    };
};