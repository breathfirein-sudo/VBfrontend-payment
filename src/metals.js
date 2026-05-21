/** Periodic metals shown on About Us — each maps to a tradeable asset id. */
export const metals = [
  { no: 1, symbol: 'Au', name: 'Gold', type: 'Precious Metal', group: 'gold', assetId: 'gold' },
  { no: 2, symbol: 'Ti', name: 'Titanium', type: 'Transition Metal', group: 'silver', assetId: 'titanium', priceFactor: 0.062 },
  { no: 3, symbol: 'Ag', name: 'Silver', type: 'Precious Metal', group: 'silver', assetId: 'silver' },
  { no: 4, symbol: 'Cr', name: 'Chromium', type: 'Transition Metal', group: 'dark', assetId: 'chromium', priceFactor: 0.009 },
  { no: 5, symbol: 'Mn', name: 'Manganese', type: 'Transition Metal', group: 'dark', assetId: 'manganese', priceFactor: 0.007 },
  { no: 6, symbol: 'Fe', name: 'Iron', type: 'Transition Metal', group: 'dark', assetId: 'iron' },
  { no: 7, symbol: 'Co', name: 'Cobalt', type: 'Transition Metal', group: 'blue', assetId: 'cobalt', priceFactor: 0.055 },
  { no: 8, symbol: 'Ni', name: 'Nickel', type: 'Transition Metal', group: 'cyan', assetId: 'nickel', priceFactor: 0.028 },
  { no: 9, symbol: 'Cu', name: 'Copper', type: 'Transition Metal', group: 'bronze', assetId: 'copper', priceFactor: 0.015 },
  { no: 10, symbol: 'Zn', name: 'Zinc', type: 'Transition Metal', group: 'dark', assetId: 'zinc', priceFactor: 0.006 },
  { no: 11, symbol: 'Y', name: 'Yttrium', type: 'Transition Metal', group: 'dark', assetId: 'yttrium', priceFactor: 0.12 },
  { no: 12, symbol: 'Zr', name: 'Zirconium', type: 'Transition Metal', group: 'silver', assetId: 'zirconium', priceFactor: 0.045 },
  { no: 13, symbol: 'Nb', name: 'Niobium', type: 'Transition Metal', group: 'cyan', assetId: 'niobium', priceFactor: 0.18 },
  { no: 14, symbol: 'Mo', name: 'Molybdenum', type: 'Transition Metal', group: 'dark', assetId: 'molybdenum', priceFactor: 0.085 },
  { no: 15, symbol: 'Tc', name: 'Technetium', type: 'Transition Metal', group: 'green', assetId: 'technetium', priceFactor: 1.85 },
  { no: 16, symbol: 'Ru', name: 'Ruthenium', type: 'Precious Metal', group: 'dark', assetId: 'ruthenium', priceFactor: 0.95 },
  { no: 17, symbol: 'Rh', name: 'Rhodium', type: 'Precious Metal', group: 'bronze', assetId: 'rhodium', priceFactor: 3.2 },
  { no: 18, symbol: 'Pd', name: 'Palladium', type: 'Precious Metal', group: 'bronze', assetId: 'palladium', priceFactor: 0.72 },
  { no: 19, symbol: 'V', name: 'Vanadium', type: 'Transition Metal', group: 'silver', assetId: 'vanadium', priceFactor: 0.032 },
  { no: 20, symbol: 'Cd', name: 'Cadmium', type: 'Transition Metal', group: 'dark', assetId: 'cadmium', priceFactor: 0.004 },
  { no: 21, symbol: 'Hf', name: 'Hafnium', type: 'Transition Metal', group: 'dark', assetId: 'hafnium', priceFactor: 0.22 },
  { no: 22, symbol: 'Ta', name: 'Tantalum', type: 'Transition Metal', group: 'dark', assetId: 'tantalum', priceFactor: 0.15 },
  { no: 23, symbol: 'W', name: 'Tungsten', type: 'Transition Metal', group: 'dark', assetId: 'tungsten', priceFactor: 0.065 },
  { no: 24, symbol: 'Re', name: 'Rhenium', type: 'Transition Metal', group: 'dark', assetId: 'rhenium', priceFactor: 0.42 },
  { no: 25, symbol: 'Os', name: 'Osmium', type: 'Transition Metal', group: 'dark', assetId: 'osmium', priceFactor: 1.1 },
  { no: 26, symbol: 'Ir', name: 'Iridium', type: 'Transition Metal', group: 'silver', assetId: 'iridium', priceFactor: 0.88 },
  { no: 27, symbol: 'Pt', name: 'Platinum', type: 'Precious Metal', group: 'bronze', assetId: 'platinum' },
  { no: 28, symbol: 'Sc', name: 'Scandium', type: 'Transition Metal', group: 'silver', assetId: 'scandium', priceFactor: 0.14 },
  { no: 29, symbol: 'Hg', name: 'Mercury', type: 'Transition Metal', group: 'liquid', assetId: 'mercury', priceFactor: 0.011 },
];

const CORE_ASSETS = ['gold', 'silver'];

export function createAllMetalRates(baseRates) {
  const rates = { ...baseRates };
  metals.forEach((metal) => {
    if (rates[metal.assetId]) return;
    const refPrice = baseRates.gold?.price ?? 6143.57;
    const factor = metal.priceFactor ?? 0.05;
    rates[metal.assetId] = {
      price: parseFloat((refPrice * factor).toFixed(2)),
      change: 0,
      pct: 0,
    };
  });
  return rates;
}

export function createInitialHoldings(seed = {}) {
  const holdings = { ...seed };
  metals.forEach((metal) => {
    if (holdings[metal.assetId] === undefined) {
      holdings[metal.assetId] = 0;
    }
  });
  return holdings;
}

export function getMetalByAssetId(assetId) {
  return metals.find((m) => m.assetId === assetId);
}

export function getMetalLabel(assetId) {
  return getMetalByAssetId(assetId)?.name ?? assetId.charAt(0).toUpperCase() + assetId.slice(1);
}

export function getAllRateAssetIds(rates) {
  return Object.keys(rates);
}

export function pickRandomRateAsset(rates) {
  const ids = getAllRateAssetIds(rates);
  return ids[Math.floor(Math.random() * ids.length)];
}

/** Gold & Silver only — customer, admin, and home trade UIs */
export const PORTAL_TRADE_ASSETS = ['gold', 'silver'];

/** @deprecated Use PORTAL_TRADE_ASSETS */
export const HOME_TRADE_ASSETS = PORTAL_TRADE_ASSETS;

export function pickRandomPortalAsset(rates) {
  const ids = PORTAL_TRADE_ASSETS.filter((id) => rates[id]);
  return ids[Math.floor(Math.random() * ids.length)] || 'gold';
}

export { CORE_ASSETS };
