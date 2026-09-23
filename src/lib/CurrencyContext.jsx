import React, { createContext, useContext, useEffect, useState } from 'react';
import { getEntryTicket, saveEntryCurrency } from '@/lib/entryTicket';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState('EUR');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getEntryTicket()
      .then(({ currency: savedCurrency }) => {
        if (savedCurrency) setCurrencyState(savedCurrency);
      })
      .finally(() => setReady(true));
  }, []);

  const setCurrency = async (nextCurrency) => {
    setCurrencyState(nextCurrency);
    try {
      await saveEntryCurrency(nextCurrency);
    } catch {}
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, ready }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used inside CurrencyProvider');
  }
  return context;
}
