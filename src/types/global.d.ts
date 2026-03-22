declare global {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let google: any;
    interface Window {
        sendRequestsStatistic: (is_running: boolean) => void;
        load_modal?: {
            loadStrategyToBuilder: (strategy: {
                id: string;
                name: string;
                save_type: string;
                timestamp: number;
                xml: string;
            }) => Promise<void>;
        };
        gtag?: (command: string, eventName: string, params?: Record<string, any>) => void;
    }
}

export {};
