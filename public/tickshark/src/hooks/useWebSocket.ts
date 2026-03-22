import { useState, useEffect, useRef, useCallback } from 'react';

export interface TickData {
  symbol: string;
  tick: number;
  epoch: number;
  quote: number;
}

export interface WebSocketState {
  isConnected: boolean;
  lastTick: TickData | null;
  error: string | null;
}

export interface WebSocketControls {
  connect: () => void;
  disconnect: () => void;
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
  state: WebSocketState;
}

/**
 * WebSocket hook for Deriv API - READ-ONLY by default
 * Provides live tick data for analysis without execution coupling
 */
export function useWebSocket(appId: string = '1089'): WebSocketControls {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastTick: null,
    error: null,
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${appId}`);
      
      ws.onopen = () => {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.tick) {
            const tickData: TickData = {
              symbol: data.tick.symbol,
              tick: data.tick.tick,
              epoch: data.tick.epoch,
              quote: data.tick.quote,
            };
            
            setState(prev => ({ ...prev, lastTick: tickData }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, isConnected: false }));
        console.log('WebSocket disconnected');
      };

      ws.onerror = (error) => {
        setState(prev => ({ ...prev, error: 'WebSocket connection error' }));
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to create WebSocket connection' }));
    }
  }, [appId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    subscriptionsRef.current.clear();
  }, []);

  const subscribe = useCallback((symbol: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    if (subscriptionsRef.current.has(symbol)) return;

    const subscribeMsg = {
      ticks: symbol,
      subscribe: 1,
    };

    wsRef.current.send(JSON.stringify(subscribeMsg));
    subscriptionsRef.current.add(symbol);
  }, []);

  const unsubscribe = useCallback((symbol: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const unsubscribeMsg = {
      forget_all: 'ticks',
    };

    wsRef.current.send(JSON.stringify(unsubscribeMsg));
    subscriptionsRef.current.delete(symbol);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    state,
  };
}