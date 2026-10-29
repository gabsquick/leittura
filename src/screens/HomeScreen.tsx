// Home — Opção A (Editorial), com biblioteca, busca e ações dos PDFs do usuário.
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  LayoutAnimation,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCover } from '../components/BookCover';
import {
  ArrowLeftIcon,
  BookmarkIcon,
  CheckIcon,
  CloseIcon,
  DocIcon,
  SearchIcon,
  ShelfIcon,
  TrashIcon,
} from '../components/icons';
import { getGreeting, type Book, type BookCategory } from '../data/books';
import { useUser } from '../user';
import { useBooks } from '../books';
import { colors, fonts, spacing } from '../theme';

type Props = {
  onOpenBook: (book: Book) => void;
};

export function HomeScreen({ onOpenBook }: Props) {
  const { name } = useUser();
  const {
    recentBooks,
    categories,
    assignBookToCategory,
    removeBook,
    removeCategory,
    toggleFavorite,
  } = useBooks();
  const insets = useSafeAreaInsets();
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  // Mantém a saudação correta quando o app continua aberto durante a troca de período do dia.
  useEffect(() => {
    const id = setInterval(() => setCurrentHour(new Date().getHours()), 60_000);
    return () => clearInterval(id);
  }, []);

  const greeting = getGreeting(currentHour);

  // Livro selecionado por long-press → abre o modal de ações.
  const [selected, setSelected] = useState<Book | null>(null);
  const [categoryTarget, setCategoryTarget] = useState<Book | null>(null);
  // Livros marcados como favoritos pelo usuário.
  const userFavorites = recentBooks.filter((b) => b.favorite);
  // Ao receber uma categoria personalizada, o livro deixa as prateleiras
  // automáticas para existir em apenas uma categoria principal por vez.
  const uncategorizedBooks = recentBooks.filter((book) => !book.categoryId);
  const readingBooks = uncategorizedBooks.filter((book) => !book.completedAt);
  const completedBooks = uncategorizedBooks.filter((book) => Boolean(book.completedAt));
  // base de 18 do design + altura da barra de navegação do sistema

  // Busca: a lupa vira um campo que desliza da direita para a esquerda.
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  // largura disponível da linha do cabeçalho (medida em runtime)
  const [rowWidth, setRowWidth] = useState(0);
  // 0 = só a lupa (38px) · 1 = campo expandido (largura total)
  const searchAnim = useRef(new Animated.Value(0)).current;

  const openSearch = () => {
    // leva o cabeçalho (onde fica o campo) de volta ao topo
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setSearchOpen(true);
    Animated.timing(searchAnim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => inputRef.current?.focus());
  };

  const closeSearch = () => {
    Keyboard.dismiss();
    Animated.timing(searchAnim, {
      toValue: 0,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setSearchOpen(false);
      setQuery('');
    });
  };

  // largura do campo: cresce da direita (lupa) até ocupar a linha toda
  const fieldWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [38, Math.max(rowWidth, 38)],
  });
  // a wordmark some conforme o campo abre
  const wordmarkOpacity = searchAnim.interpolate({
    inputRange: [0, 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // resultados: busca nos PDFs adicionados pelo usuário (título/autor/arquivo)
  const q = query.trim().toLowerCase();
  const results =
    q.length === 0
      ? recentBooks
      : recentBooks.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            (b.fileName ?? '').toLowerCase().includes(q)
        );

  // anima a transição entre conteúdo normal e resultados
  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 280,
      update: { type: LayoutAnimation.Types.easeOut },
      create: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
      delete: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
    });
  }, [searchOpen]);

  const scrollY = useRef(new Animated.Value(0)).current;
  // a barra compacta entra conforme a faixa cheia sai do topo
  const compactOpacity = scrollY.interpolate({
    inputRange: [80, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const compactTranslate = scrollY.interpolate({
    inputRange: [80, 150],
    outputRange: [-12, 0],
    extrapolate: 'clamp',
  });

  // a barra compacta só recebe toques quando já está visível (rolagem)
  const [compactVisible, setCompactVisible] = useState(false);
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      setCompactVisible((v) => (v ? value > 100 : value > 120));
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
      >
        {/* Faixa escura do cabeçalho */}
        <View style={styles.header}>
          <View
            style={styles.headerTop}
            onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
          >
            <Animated.Text style={[styles.wordmark, { opacity: wordmarkOpacity }]}>
              LEITTURA
            </Animated.Text>
            <Animated.View style={[styles.searchField, { width: fieldWidth }]}>
              {searchOpen ? (
                <View style={styles.searchInputRow}>
                  <Pressable hitSlop={8} onPress={closeSearch}>
                    <ArrowLeftIcon size={18} />
                  </Pressable>
                  <TextInput
                    ref={inputRef}
                    style={styles.searchInput}
                    placeholder="Buscar PDFs adicionados"
                    placeholderTextColor="rgba(232,223,208,0.5)"
                    value={query}
                    onChangeText={setQuery}
                    returnKeyType="search"
                    autoCorrect={false}
                  />
                  {query.length > 0 && (
                    <Pressable hitSlop={8} onPress={() => setQuery('')}>
                      <CloseIcon size={16} />
                    </Pressable>
                  )}
                </View>
              ) : (
                <Pressable style={styles.searchBtn} onPress={openSearch}>
                  <SearchIcon />
                </Pressable>
              )}
            </Animated.View>
          </View>
          <Text style={styles.greeting}>
            {greeting},{'\n'}
            {name}.
          </Text>
        </View>

        {/* Resultados da busca substituem as prateleiras enquanto o campo está aberto */}
        {searchOpen ? (
          <SearchResults
            results={results}
            query={query}
            onOpenBook={onOpenBook}
            onLongPress={(book) => setSelected(book)}
          />
        ) : recentBooks.length === 0 && categories.length === 0 ? (
          /* A Home só fica totalmente vazia quando não há PDFs nem categorias. */
          <View style={styles.emptyHome}>
            <Text style={styles.emptyHomeTitle}>Nada aqui.</Text>
            <Text style={styles.emptyHomeText}>Adicione PDF's ou categorias.</Text>
          </View>
        ) : (
        <>
        {/* Ao concluir, o livro deixa esta prateleira e passa para Finalizados. */}
        {readingBooks.length > 0 && (
          <Shelf
            label="Adicionado recentemente"
            books={readingBooks}
            onOpenBook={onOpenBook}
            onLongPress={(book) => setSelected(book)}
          />
        )}

        {completedBooks.length > 0 && (
          <Shelf
            label="Finalizados"
            books={completedBooks}
            onOpenBook={onOpenBook}
            onLongPress={(book) => setSelected(book)}
          />
        )}

        {/* Favoritos */}
        {userFavorites.length > 0 && (
          <Shelf
            label="Favoritos"
            books={userFavorites}
            onOpenBook={onOpenBook}
            onLongPress={(book) => setSelected(book)}
          />
        )}

        {/* Categorias personalizadas permanecem visíveis mesmo antes de receber PDFs. */}
        {categories.map((category) => {
          const categoryBooks = recentBooks.filter((book) => book.categoryId === category.id);
          return (
            <Shelf
              key={category.id}
              label={category.name}
              books={categoryBooks}
              onOpenBook={onOpenBook}
              onLongPress={(book) => setSelected(book)}
              onDelete={categoryBooks.length === 0 ? () => removeCategory(category.id) : undefined}
              emptyMessage="Nenhum PDF nesta categoria."
            />
          );
        })}
        </>
        )}

        <View style={{ height: 96 + insets.bottom }} />
      </Animated.ScrollView>

      {/* Barra compacta fixa (aparece ao rolar) */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.compactBar,
          {
            paddingTop: insets.top + 8,
            opacity: compactOpacity,
            transform: [{ translateY: compactTranslate }],
          },
        ]}
      >
        <View style={styles.compactRow}>
          <Text style={styles.wordmark}>LEITTURA</Text>
          <Pressable
            style={styles.searchBtn}
            pointerEvents={compactVisible ? 'auto' : 'none'}
            onPress={openSearch}
          >
            <SearchIcon />
          </Pressable>
        </View>
      </Animated.View>

      {/* Modal de ações do livro (long-press) */}
      <BookActionsSheet
        book={selected}
        onClose={() => setSelected(null)}
        onRemove={(id) => {
          removeBook(id);
          setSelected(null);
        }}
        onFavorite={(id) => {
          toggleFavorite(id);
          setSelected(null);
        }}
        onCategory={(book) => {
          // Fecha a folha de ações antes de apresentar o seletor, evitando
          // empilhar dois Modals nativos simultaneamente no iOS.
          setSelected(null);
          setCategoryTarget(book);
        }}
      />

      <CategoryPickerSheet
        book={categoryTarget}
        categories={categories}
        onClose={() => setCategoryTarget(null)}
        onSelect={(categoryId) => {
          if (!categoryTarget) return;
          assignBookToCategory(categoryTarget.id, categoryId);
          setCategoryTarget(null);
        }}
      />
    </View>
  );
}

function BookActionsSheet({
  book,
  onClose,
  onRemove,
  onFavorite,
  onCategory,
}: {
  book: Book | null;
  onClose: () => void;
  onRemove: (id: string) => void;
  onFavorite: (id: string) => void;
  onCategory: (book: Book) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={book !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheetWrap, { paddingBottom: 14 + insets.bottom }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.grabber} />

          {/* Card principal: cabeçalho + ações */}
          <View style={styles.sheetCard}>
            {book && (
              <View style={styles.sheetHeader}>
                <View style={[styles.sheetCover, { backgroundColor: book.color }]}>
                  <Text style={styles.sheetCoverInitial}>{book.title.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.sheetBookTitle} numberOfLines={1}>
                    {book.title}
                  </Text>
                  {!!book.author && (
                    <Text style={styles.sheetBookAuthor} numberOfLines={1}>
                      {book.author}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
              onPress={() => book && onFavorite(book.id)}
            >
              <BookmarkIcon size={20} color={colors.ink} />
              <Text style={styles.sheetRowText}>
                {book?.favorite ? 'Desfavoritar' : 'Favoritar'}
              </Text>
            </Pressable>

            <View style={styles.sheetDivider} />

            <Pressable
              style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
              onPress={() => book && onCategory(book)}
            >
              <ShelfIcon size={20} color={colors.ink} />
              <Text style={styles.sheetRowText}>Adicionar à categoria</Text>
            </Pressable>

            <View style={styles.sheetDivider} />

            <Pressable
              style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
              onPress={() => book && onRemove(book.id)}
            >
              <TrashIcon size={20} color={colors.danger} />
              <Text style={[styles.sheetRowText, { color: colors.danger }]}>Remover</Text>
            </Pressable>
          </View>

          {/* Cancelar como botão separado */}
          <Pressable
            style={({ pressed }) => [styles.sheetCancelBtn, pressed && styles.sheetRowPressed]}
            onPress={onClose}
          >
            <Text style={styles.sheetCancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CategoryPickerSheet({
  book,
  categories,
  onClose,
  onSelect,
}: {
  book: Book | null;
  categories: BookCategory[];
  onClose: () => void;
  onSelect: (categoryId: string) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={book !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheetWrap, { paddingBottom: 14 + insets.bottom }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.grabber} />

          <View style={styles.sheetCard}>
            <View style={styles.categorySheetHeader}>
              <Text style={styles.categorySheetTitle}>Adicionar à categoria</Text>
              <Text style={styles.categorySheetSubtitle} numberOfLines={1}>
                {book?.title}
              </Text>
            </View>

            {categories.length === 0 ? (
              <View style={styles.categoryEmptyState}>
                <ShelfIcon size={24} color={colors.inkMuted} />
                <Text style={styles.categoryEmptyText}>
                  Crie uma categoria pelo botão + para adicioná-la aqui.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
                {categories.map((category, index) => {
                  const selectedCategory = book?.categoryId === category.id;
                  return (
                    <React.Fragment key={category.id}>
                      {index > 0 && <View style={styles.sheetDivider} />}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: selectedCategory }}
                        style={({ pressed }) => [
                          styles.categoryRow,
                          pressed && styles.sheetRowPressed,
                        ]}
                        onPress={() => onSelect(category.id)}
                      >
                        <View style={styles.categoryRowIcon}>
                          <ShelfIcon size={18} color={colors.inkSoft} />
                        </View>
                        <Text style={styles.categoryRowText} numberOfLines={1}>
                          {category.name}
                        </Text>
                        {selectedCategory && <CheckIcon size={14} color={colors.ink} />}
                      </Pressable>
                    </React.Fragment>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [styles.sheetCancelBtn, pressed && styles.sheetRowPressed]}
            onPress={onClose}
          >
            <Text style={styles.sheetCancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SearchResults({
  results,
  query,
  onOpenBook,
  onLongPress,
}: {
  results: Book[];
  query: string;
  onOpenBook: (book: Book) => void;
  onLongPress: (book: Book) => void;
}) {
  const hasQuery = query.trim().length > 0;
  return (
    <View style={styles.resultsSection}>
      <Text style={styles.resultsCount}>
        {hasQuery
          ? `${results.length} resultado${results.length === 1 ? '' : 's'}`
          : 'Seus PDFs adicionados'}
      </Text>

      {results.length === 0 ? (
        <View style={styles.emptyState}>
          <DocIcon size={26} color={colors.inkMuted} />
          <Text style={styles.emptyText}>
            {hasQuery
              ? `Nenhum PDF encontrado para “${query.trim()}”.`
              : 'Você ainda não adicionou nenhum PDF.'}
          </Text>
        </View>
      ) : (
        <View style={styles.resultsList}>
          {results.map((book) => (
            <Pressable
              key={book.id}
              style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
              onPress={() => onOpenBook(book)}
              onLongPress={() => onLongPress(book)}
              delayLongPress={300}
            >
              <View style={[styles.resultCover, { backgroundColor: book.color }]}>
                <Text style={styles.resultCoverInitial}>{book.title.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {book.title}
                </Text>
                <Text style={styles.resultMeta} numberOfLines={1}>
                  {book.author || book.fileName || 'PDF'}
                </Text>
                {(book.progress ?? 0) > 0 && (
                  <View style={styles.resultProgressTrack}>
                    <View style={[styles.resultProgressFill, { width: progressWidth(book.progress ?? 0) }]} />
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function Shelf({
  label,
  books,
  onOpenBook,
  onLongPress,
  onDelete,
  emptyMessage,
}: {
  label: string;
  books: Book[];
  onOpenBook: (book: Book) => void;
  onLongPress?: (book: Book) => void;
  onDelete?: () => void;
  emptyMessage?: string;
}) {
  return (
    <View style={styles.shelfSection}>
      <View style={styles.shelfHeader}>
        <View style={styles.shelfTitleRow}>
          <Text style={styles.sectionLabel}>{label}</Text>
          {onDelete && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Excluir categoria ${label}`}
              hitSlop={8}
              style={({ pressed }) => [
                styles.categoryDeleteButton,
                pressed && styles.categoryDeleteButtonPressed,
              ]}
              onPress={onDelete}
            >
              <TrashIcon size={14} color={colors.danger} />
            </Pressable>
          )}
        </View>
        <Text style={styles.sectionCount}>{books.length}</Text>
      </View>
      {books.length === 0 && emptyMessage ? (
        <View style={styles.emptyShelf}>
          <Text style={styles.emptyShelfText}>{emptyMessage}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelfRow}
        >
          {books.map((book) => (
            <Pressable
              key={book.id}
              style={styles.shelfItem}
              onPress={() => onOpenBook(book)}
              onLongPress={onLongPress ? () => onLongPress(book) : undefined}
              delayLongPress={300}
            >
              <BookCover title={book.title} author={book.author} color={book.color} size="sm" />
              <BookProgressBar progress={book.progress ?? 0} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function BookProgressBar({ progress }: { progress: number }) {
  const safeProgress = Math.min(100, Math.max(0, progress));

  if (safeProgress <= 0) {
    return <View style={styles.bookProgressSpacer} />;
  }

  return (
    <View style={styles.bookProgressWrap}>
      <View style={styles.bookProgressTrack}>
        <View style={[styles.bookProgressFill, { width: progressWidth(safeProgress) }]} />
      </View>
      <Text style={styles.bookProgressText}>{Math.round(safeProgress)}%</Text>
    </View>
  );
}

function progressWidth(progress: number): `${number}%` {
  return `${Math.min(100, Math.max(0, progress))}%` as `${number}%`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 8 },

  // Cabeçalho
  header: {
    backgroundColor: colors.headerBand,
    paddingTop: 58,
    paddingHorizontal: spacing.screenH,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    letterSpacing: 3,
    color: colors.onDarkWordmark,
  },
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // contêiner animado da busca (alinhado à direita, cresce para a esquerda)
  searchField: {
    height: 38,
    alignItems: 'flex-end',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.onDarkTitle,
  },
  greeting: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 32 * 1.08,
    color: colors.onDarkTitle,
    marginTop: 22,
    letterSpacing: -0.2,
  },

  // Barra compacta fixa
  compactBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.headerBand,
    paddingHorizontal: spacing.screenH,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Seções (rótulos maiúsculos)
  sectionLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.ink,
    textTransform: 'uppercase',
  },
  sectionCount: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.inkMuted },

  // Estado vazio da Home (nenhum PDF adicionado)
  emptyHome: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 96,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyHomeTitle: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  emptyHomeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.inkMuted,
  },

  // Prateleiras roláveis
  shelfSection: { paddingTop: 30 },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: spacing.screenH,
  },
  shelfTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  categoryDeleteButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDeleteButtonPressed: { backgroundColor: 'rgba(179,64,46,0.10)' },
  shelfRow: { gap: 16, paddingHorizontal: spacing.screenH, paddingTop: 4, paddingBottom: 8 },
  shelfItem: { position: 'relative' },
  emptyShelf: {
    marginHorizontal: spacing.screenH,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255,253,249,0.5)',
  },
  emptyShelfText: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  bookProgressSpacer: { height: 20 },
  bookProgressWrap: { gap: 5, marginTop: 10 },
  bookProgressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  bookProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.progressFill,
  },
  bookProgressText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.inkMuted,
  },

  // Resultados da busca
  resultsSection: { paddingTop: 24, paddingHorizontal: spacing.screenH },
  resultsCount: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  resultsList: { gap: 6 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  resultRowPressed: { backgroundColor: 'rgba(28,25,23,0.05)' },
  resultCover: {
    width: 40,
    height: 56,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCoverInitial: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: 'rgba(255,255,255,0.92)',
  },
  resultTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  resultMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  resultProgressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
    marginTop: 8,
  },
  resultProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.progressFill,
  },
  emptyState: { alignItems: 'center', gap: 14, paddingVertical: 48, paddingHorizontal: 24 },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal de ações (long-press)
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.45)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  sheetCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  sheetCover: {
    width: 38,
    height: 52,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCoverInitial: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: 'rgba(255,255,255,0.92)',
  },
  sheetBookTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  sheetBookAuthor: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 17,
    paddingHorizontal: 18,
  },
  sheetRowPressed: { backgroundColor: 'rgba(28,25,23,0.05)' },
  sheetRowText: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.ink },
  sheetDivider: { height: 1, backgroundColor: colors.cardBorder, marginLeft: 18 },
  sheetCancelBtn: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginTop: 8,
    paddingVertical: 17,
    alignItems: 'center',
  },
  sheetCancelText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.inkSoft },
  categorySheetHeader: {
    gap: 4,
    paddingVertical: 17,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  categorySheetTitle: { fontFamily: fonts.sansSemiBold, fontSize: 17, color: colors.ink },
  categorySheetSubtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  categoryList: { maxHeight: 300 },
  categoryRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  categoryRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  categoryRowText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.ink,
  },
  categoryEmptyState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 30,
    paddingHorizontal: 28,
  },
  categoryEmptyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.inkMuted,
  },
});
