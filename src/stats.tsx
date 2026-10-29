// Store das estatísticas de leitura, persistido no dispositivo.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { stats as baseStats, type Stat } from './data/profile';
import { useBooks } from './books';
import { useGoal } from './goal';

const CLEARED_KEY = '@leittura/statsCleared';
const READING_STATS_KEY = '@leittura/readingStats';

type ReadingStats = {
  pagesRead: number;
  readingDays: string[];
  furthestPageByBook: Record<string, number>;
};

type StatsContextValue = {
  stats: Stat[];
  goalRead: number;
  cleared: boolean;
  recordReadingPage: (bookId: string, pageIndex: number) => void;
  clearStats: () => void;
  resetStats: () => void;
};

const StatsContext = createContext<StatsContextValue | undefined>(undefined);
const emptyReadingStats: ReadingStats = {
  pagesRead: 0,
  readingDays: [],
  furthestPageByBook: {},
};

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayKeyToNumber(dayKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function getReadingStreak(readingDays: string[]) {
  const days = new Set(
    readingDays.map(dayKeyToNumber).filter((day): day is number => day !== null)
  );
  const today = dayKeyToNumber(getLocalDayKey());
  if (today === null) return 0;

  // A sequência continua válida durante o dia seguinte à última leitura. Ela
  // só zera quando o usuário passa um dia inteiro sem registrar atividade.
  let cursor = days.has(today) ? today : today - 1;
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

function parseReadingStats(saved: string | null): ReadingStats {
  if (!saved) return emptyReadingStats;

  try {
    const parsed = JSON.parse(saved) as Partial<ReadingStats>;
    const pagesRead = Number.isFinite(parsed.pagesRead)
      ? Math.max(0, Math.floor(parsed.pagesRead as number))
      : 0;
    const readingDays = Array.isArray(parsed.readingDays)
      ? [...new Set(parsed.readingDays.filter((day): day is string => dayKeyToNumber(day) !== null))]
      : [];
    const furthestPageByBook = Object.fromEntries(
      Object.entries(parsed.furthestPageByBook ?? {})
        .filter(([, page]) => Number.isFinite(page) && page > 0)
        .map(([bookId, page]) => [bookId, Math.floor(page)])
    );

    return { pagesRead, readingDays, furthestPageByBook };
  } catch {
    return emptyReadingStats;
  }
}

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const { recentBooks } = useBooks();
  const { goal } = useGoal();
  const [clearedAt, setClearedAt] = useState<number | null>(null);
  const [readingStats, setReadingStats] = useState<ReadingStats>(emptyReadingStats);
  const [readingStatsLoaded, setReadingStatsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CLEARED_KEY).then((saved) => {
      if (!saved) return;
      const timestamp = saved === 'true' ? Date.now() : Number(saved);
      if (Number.isFinite(timestamp)) {
        setClearedAt(timestamp);
        // Converte o formato booleano antigo para um marco temporal. Assim,
        // novas conclusões após a limpeza voltam a ser contabilizadas.
        if (saved === 'true') AsyncStorage.setItem(CLEARED_KEY, String(timestamp));
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(READING_STATS_KEY)
      .then((saved) => setReadingStats(parseReadingStats(saved)))
      .finally(() => setReadingStatsLoaded(true));
  }, []);

  useEffect(() => {
    if (!readingStatsLoaded) return;
    AsyncStorage.setItem(READING_STATS_KEY, JSON.stringify(readingStats));
  }, [readingStats, readingStatsLoaded]);

  const completedBooks = recentBooks.filter(
    (book) => book.completedAt && (clearedAt === null || book.completedAt > clearedAt)
  );
  const goalRead = completedBooks.filter(
    (book) => new Date(book.completedAt as number).getFullYear() === goal.year
  ).length;
  const readingStreak = getReadingStreak(readingStats.readingDays);
  const valuesByLabel: Record<string, number> = {
    'Livros lidos': completedBooks.length,
    'Dias seguidos': readingStreak,
    Páginas: readingStats.pagesRead,
  };
  const stats = baseStats.map((stat) => ({
    ...stat,
    value: String(valuesByLabel[stat.label] ?? 0),
  }));
  const cleared = clearedAt !== null
    && completedBooks.length === 0
    && readingStreak === 0
    && readingStats.pagesRead === 0;

  const recordReadingPage = useCallback((bookId: string, pageIndex: number) => {
    if (!readingStatsLoaded || !bookId || !Number.isFinite(pageIndex)) return;

    const normalizedPage = Math.max(1, Math.floor(pageIndex));
    const today = getLocalDayKey();
    setReadingStats((current) => {
      const previousPage = current.furthestPageByBook[bookId] ?? 0;
      const addedPages = Math.max(0, normalizedPage - previousPage);
      const alreadyReadToday = current.readingDays.includes(today);
      if (addedPages === 0 && alreadyReadToday) return current;

      // A maior página alcançada funciona como marca d'água: voltar no texto
      // ou reabrir o livro não infla o total de páginas lidas.
      return {
        pagesRead: current.pagesRead + addedPages,
        readingDays: alreadyReadToday ? current.readingDays : [...current.readingDays, today],
        furthestPageByBook: normalizedPage > previousPage
          ? { ...current.furthestPageByBook, [bookId]: normalizedPage }
          : current.furthestPageByBook,
      };
    });
  }, [readingStatsLoaded]);

  const clearStats = useCallback(() => {
    const timestamp = Date.now();
    setClearedAt(timestamp);
    setReadingStats((current) => ({
      ...current,
      pagesRead: 0,
      readingDays: [],
    }));
    AsyncStorage.setItem(CLEARED_KEY, String(timestamp));
  }, []);

  const resetStats = useCallback(() => {
    setClearedAt(null);
    setReadingStats(emptyReadingStats);
    AsyncStorage.removeItem(CLEARED_KEY);
    AsyncStorage.removeItem(READING_STATS_KEY);
  }, []);

  return (
    <StatsContext.Provider
      value={{ stats, goalRead, cleared, recordReadingPage, clearStats, resetStats }}
    >
      {children}
    </StatsContext.Provider>
  );
}

export function useStats(): StatsContextValue {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats deve ser usado dentro de <StatsProvider>');
  return ctx;
}
