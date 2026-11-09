'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProviderType } from '@/lib/anime';

interface ProviderContextType {
  provider: ProviderType;
  setProvider: (provider: ProviderType) => void;
  toggleProvider: () => void;
}

const ProviderContext = createContext<ProviderContextType>({
  provider: 'yomi',
  setProvider: () => {},
  toggleProvider: () => {}
});

export function ProviderContextProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProviderState] = useState<ProviderType>('yomi');

  useEffect(() => {
    const saved = localStorage.getItem('nexus_anime_provider');
    if (saved === 'yomi' || saved === 'animesalt') {
      setProviderState(saved);
    }
  }, []);

  const setProvider = (newProvider: ProviderType) => {
    setProviderState(newProvider);
    localStorage.setItem('nexus_anime_provider', newProvider);
  };

  const toggleProvider = () => {
    const next = provider === 'yomi' ? 'animesalt' : 'yomi';
    setProvider(next);
  };

  return (
    <ProviderContext.Provider value={{ provider, setProvider, toggleProvider }}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider() {
  return useContext(ProviderContext);
}
