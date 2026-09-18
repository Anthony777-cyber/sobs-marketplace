export const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', decimals: 2 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimals: 2 },
  { code: 'NZD', symbol: 'NZ$', name: 'NZ Dollar', decimals: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2 },
];

const API_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@latest/latest/json/eur.json';

// Pulls current exchange rates relative to the Euro (EUR) base.
export async function fetchRates() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('currency fetch failed');
  const data = await res.json();
  const rates = data.eur || {};
  const upper = {};
  Object.keys(rates).forEach((k) => {
    upper[k.toUpperCase()] = rates[k];
  });
  return upper;
}

export function getCurrency(code) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

// Strict round-up constraint: always round UP to the next whole unit
// or next cent/penny increment (ceiling function).
export function roundUp(amount, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.ceil(amount * factor) / factor;
}

export function formatAmount(amount, currency) {
  const { symbol, decimals } = currency;
  const rounded = roundUp(amount, decimals);
  const str = decimals === 0 ? String(rounded) : rounded.toFixed(decimals);
  return `${symbol}${str}`;
}