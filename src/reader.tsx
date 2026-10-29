// Preferências do leitor de PDF, persistidas no dispositivo.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@leittura/readerPrefs';

export type ReaderTheme = 'paper' | 'sepia' | 'dark';

export type ReaderPrefs = {
  theme: ReaderTheme;
  fontSize: number;
};

export const READER_THEMES: Record<ReaderTheme, { label: string; bg: string; fg: string }> = {
  paper: { label: 'Claro', bg: '#f4f1ea', fg: '#1c1917' },
  sepia: { label: 'Sépia', bg: '#f1e7d0', fg: '#241c15' },
  dark: { label: 'Escuro', bg: '#211d1a', fg: '#faf6ef' },
};

const DEFAULT_PREFS: ReaderPrefs = { theme: 'paper', fontSize: 19 };

type ReaderContextValue = {
  prefs: ReaderPrefs;
  setTheme: (theme: ReaderTheme) => void;
  changeFontSize: (delta: number) => void;
};

const ReaderContext = createContext<ReaderContextValue | undefined>(undefined);

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULT_PREFS);

  // Carrega preferências uma única vez para que a tela de leitura já abra com
  // a aparência escolhida anteriormente pelo usuário.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        try {
          setPrefs({ ...DEFAULT_PREFS, ...(JSON.parse(saved) as ReaderPrefs) });
        } catch {
          // Preferências corrompidas não devem impedir a leitura.
        }
      }
    });
  }, []);

  const persist = useCallback((next: ReaderPrefs) => {
    setPrefs(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setTheme = useCallback(
    (theme: ReaderTheme) => {
      persist({ ...prefs, theme });
    },
    [persist, prefs]
  );

  const changeFontSize = useCallback(
    (delta: number) => {
      const fontSize = Math.min(30, Math.max(15, prefs.fontSize + delta));
      persist({ ...prefs, fontSize });
    },
    [persist, prefs]
  );

  return (
    <ReaderContext.Provider value={{ prefs, setTheme, changeFontSize }}>
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader(): ReaderContextValue {
  const ctx = useContext(ReaderContext);
  if (!ctx) throw new Error('useReader deve ser usado dentro de <ReaderProvider>');
  return ctx;
}
