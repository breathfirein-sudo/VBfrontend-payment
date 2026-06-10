import { create } from 'zustand';

const useTradingStore = create((set) => ({
  wallet: {
    balance: 100000,
    locked: 0,
    totalPnL: 0,
    dailyPnL: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
  },
  market: {
    activeAsset: 'gold',
    assets: ['gold', 'silver', 'platinum', 'copper'],
    prices: {},
    candles: {},
    status: 'offline',
  },
  openTrades: [],
  closedTrades: [],
  transactions: [],
  connectionStatus: 'offline',
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setWallet: (wallet) => set({ wallet }),
  setMarket: (market) => set({ market }),
  updateMarketPrices: (prices) => set((state) => ({ market: { ...state.market, prices } })),
  mergeMarket: (patch) => set((state) => ({ market: { ...state.market, ...patch } })),
  appendCandle: (assetId, candle) =>
    set((state) => ({
      market: {
        ...state.market,
        candles: {
          ...state.market.candles,
          [assetId]: [...(state.market.candles[assetId] || []), candle].slice(-80),
        },
      },
    })),
  setOpenTrades: (openTrades) => set({ openTrades }),
  setClosedTrades: (closedTrades) => set({ closedTrades }),
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...(state.transactions || [])] })),
  addOpenTrade: (trade) =>
    set((state) => ({ openTrades: [trade, ...(state.openTrades || [])] })),
  addClosedTrade: (trade) =>
    set((state) => ({ closedTrades: [trade, ...(state.closedTrades || [])] })),
}));

export default useTradingStore;
