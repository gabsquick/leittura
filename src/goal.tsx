// Store da meta anual de leitura, persistido no dispositivo.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const STORAGE_KEY = '@leittura/goal';

export type Goal = {
  year: number;
  target: number; // livros no ano
};

function atualizarAnoMeta(meta: Goal): Goal {
  const anoAtual = new Date().getFullYear();
  return meta.year === anoAtual ? meta : { ...meta, year: anoAtual };
}

function criarMetaPadrao(): Goal {
  return { year: new Date().getFullYear(), target: 12 };
}

type GoalContextValue = {
  goal: Goal;
  setGoal: (goal: Goal) => void;
  resetGoal: () => void;
};

const GoalContext = createContext<GoalContextValue | undefined>(undefined);

export function GoalProvider({ children }: { children: React.ReactNode }) {
  const [goal, setGoalState] = useState<Goal>(criarMetaPadrao);
  const [metaCarregada, definirMetaCarregada] = useState(false);

  useEffect(() => {
    let ativo = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!ativo || !saved) return;
        const meta = JSON.parse(saved) as Goal;
        if (Number.isInteger(meta.target) && meta.target > 0) {
          setGoalState(atualizarAnoMeta(meta));
        }
      })
      .catch(() => {
        // Uma meta ausente ou corrompida não deve impedir o uso do app.
      })
      .finally(() => {
        if (ativo) definirMetaCarregada(true);
      });

    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (!metaCarregada) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goal)).catch(() => {
      console.warn('Não foi possível salvar a meta de leitura.');
    });
  }, [goal, metaCarregada]);

  useEffect(() => {
    if (!metaCarregada) return;
    let temporizador: ReturnType<typeof setTimeout>;

    // Renova apenas o ano, preservando a quantidade escolhida. A verificação
    // ao retomar cobre a virada com o app suspenso; o timer cobre o app aberto.
    const verificarAno = () => {
      setGoalState(atualizarAnoMeta);
      clearTimeout(temporizador);
      const agora = new Date();
      const proximaMeiaNoite = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
      temporizador = setTimeout(verificarAno, proximaMeiaNoite.getTime() - agora.getTime());
    };
    verificarAno();
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') verificarAno();
    });

    return () => {
      clearTimeout(temporizador);
      assinatura.remove();
    };
  }, [metaCarregada]);

  const setGoal = useCallback((next: Goal) => {
    setGoalState(atualizarAnoMeta(next));
  }, []);

  const resetGoal = useCallback(() => {
    setGoalState(criarMetaPadrao());
  }, []);

  return (
    <GoalContext.Provider value={{ goal, setGoal, resetGoal }}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoal(): GoalContextValue {
  const ctx = useContext(GoalContext);
  if (!ctx) throw new Error('useGoal deve ser usado dentro de <GoalProvider>');
  return ctx;
}
