import { useState, useEffect, useRef } from 'react';
import { Tick } from '@/utils/predictions';

const DERIV_WS_URL = 'wss://ws.derivws.com/websockets/v3?app_id=1089';
const SYMBOLS = [
  // Standard volatility indices
  'R_10', 'R_25', 'R_50', 'R_75', 'R_100',
  // 1-second volatility indices
  '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'
];
const MAX_TICKS = 1000;

interface SymbolData {
  ticks: Tick[];
  isConnected: boolean;
}

export const useDerivWebSocket = () => {
  const [tickData, setTickData] = useState<Record<string, SymbolData>>(() => {
    const initial: Record<string, SymbolData> = {};
    SYMBOLS.forEach(symbol => {
      initial[symbol] = { ticks: [], isConnected: false };
    });
    return initial;
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      try {
        const ws = new WebSocket(DERIV_WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('Connected to Deriv WebSocket');
          setIsConnected(true);
          
          // First fetch historical ticks, then subscribe to live updates
          SYMBOLS.forEach(symbol => {
            // Fetch historical ticks (1000 ticks)
            ws.send(JSON.stringify({
              ticks_history: symbol,
              count: MAX_TICKS,
              end: 'latest',
              style: 'ticks'
            }));
            
            // Subscribe to live ticks
            ws.send(JSON.stringify({
              ticks: symbol,
              subscribe: 1
            }));
          });
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle historical ticks response
            if (data.history) {
              const symbol = data.echo_req?.ticks_history;
              if (symbol && data.history.prices && data.history.times) {
                const historicalTicks: Tick[] = data.history.prices.map((price: number, index: number) => ({
                  epoch: data.history.times[index],
                  quote: price,
                  symbol
                }));
                
                setTickData(prev => ({
                  ...prev,
                  [symbol]: {
                    ticks: historicalTicks.slice(-MAX_TICKS),
                    isConnected: true
                  }
                }));
                
                console.log(`Loaded ${historicalTicks.length} historical ticks for ${symbol}`);
              }
            }
            
            // Handle live tick updates
            if (data.tick) {
              const { symbol, quote, epoch } = data.tick;
              
              setTickData(prev => {
                const symbolData = prev[symbol] || { ticks: [], isConnected: false };
                const newTicks = [...symbolData.ticks, { epoch, quote, symbol }];
                
                // Keep only last MAX_TICKS
                if (newTicks.length > MAX_TICKS) {
                  newTicks.shift();
                }
                
                return {
                  ...prev,
                  [symbol]: {
                    ticks: newTicks,
                    isConnected: true
                  }
                };
              });
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket closed');
          setIsConnected(false);
          
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        };
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    };

    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      setIsConnected(false);
    };
  }, []);

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const reconnect = () => {
    disconnect();
    // Effect will auto-reconnect is not ideal here, so we trigger manually
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      const ws = new WebSocket(DERIV_WS_URL);
      wsRef.current = ws;
      // Re-setup handlers would be needed - for now just rely on page refresh
    }
  };

  return {
    tickData,
    isConnected,
    symbols: SYMBOLS,
    connect: reconnect,
    disconnect
  };
};
