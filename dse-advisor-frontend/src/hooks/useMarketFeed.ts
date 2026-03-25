"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";

export interface MarketTick {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePct: number;
  volume: number;
  high: number;
  low: number;
  bestBidPrice: number | null;
  bestAskPrice: number | null;
  marketCap: number | null;
  timestamp: string;
}

export function useMarketFeed(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, MarketTick>>({});
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const clientRef = useRef<Client | null>(null);
  const symbolsKey = symbols.join(",");

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "/ws";
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        setConnected(true);
        client.subscribe("/topic/market/snapshot", (msg: IMessage) => {
          const ticks: MarketTick[] = JSON.parse(msg.body);
          const map: Record<string, MarketTick> = {};
          ticks.forEach((t) => {
            map[t.symbol] = t;
          });
          setPrices(map);
          setLastUpdated(new Date());
        });
        symbols.forEach((symbol) => {
          client.subscribe(`/topic/market/${symbol}`, (msg: IMessage) => {
            const tick: MarketTick = JSON.parse(msg.body);
            setPrices((prev) => ({ ...prev, [symbol]: tick }));
            setLastUpdated(new Date());
          });
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      reconnectDelay: 5000,
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return { prices, connected, lastUpdated };
}
