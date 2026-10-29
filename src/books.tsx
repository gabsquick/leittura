// Store dos livros adicionados pelo usuário, persistido no dispositivo.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import { spineColorFor } from './theme';
import type { Book, BookCategory, BookHighlight } from './data/books';

const STORAGE_KEY = '@leittura/recentBooks';
const CATEGORIES_STORAGE_KEY = '@leittura/categories';

type AddBookInput = {
  title: string;
  author: string;
  fileUri: string;
  fileName: string;
};

type BooksContextValue = {
  recentBooks: Book[];
  categories: BookCategory[];
  addBook: (input: AddBookInput) => void;
  addCategory: (name: string) => void;
  removeCategory: (categoryId: string) => void;
  assignBookToCategory: (bookId: string, categoryId: string) => void;
  removeBook: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateBookProgress: (id: string, progress: number, readerPosition: number) => void;
  updateBookHighlights: (id: string, highlights: BookHighlight[]) => void;
  clearBooks: () => void;
};

const BooksContext = createContext<BooksContextValue | undefined>(undefined);

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);

  // Carrega livros e categorias separadamente para preservar os dados existentes
  // e permitir que uma categoria vazia continue visível após reiniciar o app.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        try {
          const storedBooks = JSON.parse(saved) as Book[];
          let migrated = false;
          const books = storedBooks.map((book) => {
            if ((book.progress ?? 0) < 100 || book.completedAt) return book;
            migrated = true;
            return { ...book, completedAt: Date.now() };
          });

          // Livros concluídos antes desta versão recebem a marca de conclusão
          // para aparecerem em Finalizados e entrarem na meta sem ação extra.
          if (migrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
          setRecentBooks(books);
        } catch {
          // ignora dados corrompidos
        }
      }
    });

    AsyncStorage.getItem(CATEGORIES_STORAGE_KEY).then((saved) => {
      if (!saved) return;
      try {
        setCategories(JSON.parse(saved) as BookCategory[]);
      } catch {
        // ignora categorias corrompidas sem afetar a biblioteca de PDFs
      }
    });
  }, []);

  const addBook = useCallback((input: AddBookInput) => {
    const book: Book = {
      id: Date.now().toString(),
      title: input.title.trim(),
      author: input.author.trim(),
      color: spineColorFor(input.title),
      fileUri: input.fileUri,
      fileName: input.fileName,
      addedAt: Date.now(),
    };
    setRecentBooks((prev) => {
      const next = [book, ...prev]; // mais recente primeiro
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); // persiste
      return next;
    });
  }, []);

  const addCategory = useCallback((name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    setCategories((prev) => {
      // Evita seções visualmente duplicadas, inclusive quando variam apenas em caixa.
      if (prev.some((category) => category.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase())) {
        return prev;
      }

      const category: BookCategory = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: cleanName,
        createdAt: Date.now(),
      };
      const next = [...prev, category];
      AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeCategory = useCallback(
    (categoryId: string) => {
      // A restrição vive no store, além da interface, para impedir exclusões
      // acidentais caso esta ação seja reutilizada em outra tela no futuro.
      if (recentBooks.some((book) => book.categoryId === categoryId)) return;

      setCategories((prev) => {
        const next = prev.filter((category) => category.id !== categoryId);
        if (next.length === prev.length) return prev;
        AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [recentBooks]
  );

  const persist = useCallback((next: Book[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const assignBookToCategory = useCallback(
    (bookId: string, categoryId: string) => {
      setRecentBooks((prev) => {
        // A categoria faz parte do próprio livro para que a associação sobreviva
        // à reinicialização e a Home possa derivar suas prateleiras sem duplicar dados.
        const next = prev.map((book) =>
          book.id === bookId ? { ...book, categoryId } : book
        );
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const removeBook = useCallback(
    (id: string) => {
      setRecentBooks((prev) => {
        const book = prev.find((b) => b.id === id);
        // tenta apagar o PDF copiado para o app (ignora se já não existir)
        if (book?.fileUri) {
          try {
            new File(book.fileUri).delete();
          } catch {
            // arquivo já removido ou inacessível
          }
        }
        const next = prev.filter((b) => b.id !== id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      setRecentBooks((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, favorite: !b.favorite } : b));
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateBookProgress = useCallback(
    (id: string, progress: number, readerPosition: number) => {
      setRecentBooks((prev) => {
        const cleanProgress = Math.min(100, Math.max(0, Math.round(progress)));
        const cleanPosition = Math.min(1, Math.max(0, readerPosition));
        const completionTime = cleanProgress === 100 ? Date.now() : undefined;

        // completedAt é gravado apenas na primeira chegada a 100%. Depois disso,
        // voltar páginas não retira o livro de Finalizados nem duplica a meta.
        const next = prev.map((book) => {
          if (book.id !== id) return book;
          const completedAt = book.completedAt ?? completionTime;
          const savedProgress = completedAt ? 100 : cleanProgress;
          return {
            ...book,
            progress: savedProgress,
            progressLabel: `${savedProgress}%`,
            readerPosition: cleanPosition,
            completedAt,
          };
        });
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateBookHighlights = useCallback(
    (id: string, highlights: BookHighlight[]) => {
      setRecentBooks((prev) => {
        // O WebView é quem conhece a seleção real; o store apenas guarda a
        // lista consolidada para reaplicar os grifos quando o livro reabrir.
        const next = prev.map((book) => (book.id === id ? { ...book, highlights } : book));
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearBooks = useCallback(() => {
    setRecentBooks((prev) => {
      // tenta apagar todos os PDFs copiados para o app
      for (const book of prev) {
        if (book.fileUri) {
          try {
            new File(book.fileUri).delete();
          } catch {
            // arquivo já removido ou inacessível
          }
        }
      }
      AsyncStorage.removeItem(STORAGE_KEY);
      return [];
    });
  }, []);

  return (
    <BooksContext.Provider
      value={{
        recentBooks,
        categories,
        addBook,
        addCategory,
        removeCategory,
        assignBookToCategory,
        removeBook,
        toggleFavorite,
        updateBookProgress,
        updateBookHighlights,
        clearBooks,
      }}
    >
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks(): BooksContextValue {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error('useBooks deve ser usado dentro de <BooksProvider>');
  return ctx;
}
