// Store do nome do usuário, persistido no dispositivo (sobrevive ao fechar o app).
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@leittura/userName';
const ONBOARDED_KEY = '@leittura/onboarded';
const DEFAULT_NAME = 'Marina';

type UserContextValue = {
  name: string;
  initials: string;
  setName: (name: string) => void;
  /** false até o AsyncStorage carregar (evita piscar a tela de boas-vindas). */
  ready: boolean;
  /** true quando o usuário já fez a configuração inicial. */
  onboarded: boolean;
  /** Conclui o onboarding salvando o nome escolhido. */
  finishOnboarding: (name: string) => void;
  /** Apaga nome e onboarding (volta o app ao estado inicial). */
  resetUser: () => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

// Iniciais a partir do nome (até duas letras maiúsculas).
export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [name, setNameState] = useState(DEFAULT_NAME);
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  // Carrega o nome salvo e o estado de onboarding na inicialização.
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(ONBOARDED_KEY),
    ]).then(([savedName, savedOnboarded]) => {
      if (savedName) setNameState(savedName);
      if (savedOnboarded === 'true') setOnboarded(true);
      setReady(true);
    });
  }, []);

  const setName = useCallback((next: string) => {
    const clean = next.trim() || DEFAULT_NAME;
    setNameState(clean);
    AsyncStorage.setItem(STORAGE_KEY, clean); // persiste
  }, []);

  const finishOnboarding = useCallback((next: string) => {
    setName(next);
    setOnboarded(true);
    AsyncStorage.setItem(ONBOARDED_KEY, 'true'); // persiste
  }, [setName]);

  const resetUser = useCallback(() => {
    setNameState(DEFAULT_NAME);
    setOnboarded(false);
    AsyncStorage.multiRemove([STORAGE_KEY, ONBOARDED_KEY]);
  }, []);

  return (
    <UserContext.Provider
      value={{ name, initials: initialsFrom(name), setName, ready, onboarded, finishOnboarding, resetUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser deve ser usado dentro de <UserProvider>');
  return ctx;
}
