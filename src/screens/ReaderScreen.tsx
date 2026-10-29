// Tela de leitura — transforma o PDF em texto reflowável dentro de um WebView.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon, CheckIcon } from '../components/icons';
import type { Book, BookHighlight } from '../data/books';
import { readerHtml } from '../reader/readerHtml';
import { READER_THEMES, useReader, type ReaderTheme } from '../reader';
import { useBooks } from '../books';
import { useStats } from '../stats';
import { colors, fonts, spacing } from '../theme';

type Props = {
  book: Book;
  onClose: () => void;
};

export type ControleLeitor = {
  fechar: () => void;
};

type ReaderStatus = 'loading-file' | 'loading-pdf' | 'ready' | 'empty' | 'error';

type RecursosPdfJs = {
  moduloBase64: string;
  workerBase64: string;
};

const moduloPdfJsLocal = require('../../assets/pdfjs/pdf.min.pdfjs');
const workerPdfJsLocal = require('../../assets/pdfjs/pdf.worker.min.pdfjs');
let promessaRecursosPdfJs: Promise<RecursosPdfJs> | null = null;

// O motor é lido uma única vez por sessão. Os arquivos fazem parte do binário,
// então a leitura não depende de internet nem envia o PDF para terceiros.
function carregarRecursosPdfJs(): Promise<RecursosPdfJs> {
  if (!promessaRecursosPdfJs) {
    promessaRecursosPdfJs = (async () => {
      const [modulo, worker] = await Asset.loadAsync([moduloPdfJsLocal, workerPdfJsLocal]);

      if (!modulo.localUri || !worker.localUri) {
        throw new Error('Não foi possível carregar o motor PDF local.');
      }

      const [moduloBase64, workerBase64] = await Promise.all([
        new File(modulo.localUri).base64(),
        new File(worker.localUri).base64(),
      ]);

      return { moduloBase64, workerBase64 };
    })().catch((error) => {
      promessaRecursosPdfJs = null;
      throw error;
    });
  }

  return promessaRecursosPdfJs;
}

export const ReaderScreen = forwardRef<ControleLeitor, Props>(function ReaderScreen({ book, onClose }, ref) {
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView>(null);
  const startedReaderRef = useRef(false);
  const lastProgressSavedAt = useRef(0);
  const fechamentoPendente = useRef(false);
  const temporizadorFechamento = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimoProgresso = useRef<{ progress: number; position: number } | null>(null);
  const { prefs, setTheme, changeFontSize } = useReader();
  const { updateBookHighlights, updateBookProgress } = useBooks();
  const { recordReadingPage } = useStats();
  const [base64, setBase64] = useState<string | null>(null);
  const [recursosPdfJs, setRecursosPdfJs] = useState<RecursosPdfJs | null>(null);
  const [webReady, setWebReady] = useState(false);
  const [status, setStatus] = useState<ReaderStatus>('loading-file');
  const [progressLabel, setProgressLabel] = useState('Abrindo arquivo...');
  const [pageInfo, setPageInfo] = useState<{ index: number; total: number } | null>(null);

  const theme = READER_THEMES[prefs.theme];
  const canStartReader = Boolean(base64 && recursosPdfJs && webReady);

  const webPrefs = useMemo(
    () => ({
      bg: theme.bg,
      fg: theme.fg,
      fontSize: prefs.fontSize,
      topInset: insets.top,
      bottomInset: insets.bottom,
    }),
    [insets.bottom, insets.top, prefs.fontSize, theme.bg, theme.fg]
  );

  // O PDF fica salvo como arquivo local do app. A leitura em base64 mantém a
  // primeira versão 100% JavaScript, compatível com Expo Go e com dev build.
  useEffect(() => {
    let mounted = true;

    async function loadFile() {
      if (!book.fileUri) {
        setStatus('error');
        setProgressLabel('Arquivo não encontrado.');
        return;
      }

      try {
        const file = new File(book.fileUri);
        if (!file.exists) {
          setStatus('error');
          setProgressLabel('Arquivo não encontrado.');
          return;
        }

        const content = await file.base64();
        if (mounted) setBase64(content);
      } catch (error) {
        if (mounted) {
          setStatus('error');
          setProgressLabel(error instanceof Error ? error.message : 'Não foi possível abrir o PDF.');
        }
      }
    }

    loadFile();
    return () => {
      mounted = false;
    };
  }, [book.fileUri]);

  useEffect(() => {
    let mounted = true;

    carregarRecursosPdfJs()
      .then((recursos) => {
        if (mounted) setRecursosPdfJs(recursos);
      })
      .catch((error) => {
        if (mounted) {
          setStatus('error');
          setProgressLabel(error instanceof Error ? error.message : 'Não foi possível carregar o motor PDF.');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const inject = useCallback((script: string) => {
    webviewRef.current?.injectJavaScript(`${script}\ntrue;`);
  }, []);

  const finalizarFechamento = useCallback(() => {
    if (temporizadorFechamento.current !== null) {
      clearTimeout(temporizadorFechamento.current);
      temporizadorFechamento.current = null;
    }
    fechamentoPendente.current = false;
    onClose();
  }, [onClose]);

  const fecharLeitor = useCallback(() => {
    if (fechamentoPendente.current) return;
    if (status !== 'ready') {
      onClose();
      return;
    }

    fechamentoPendente.current = true;
    // A resposta final do WebView confirma a posição real, inclusive quando
    // o scroll ainda está dentro do intervalo normal de emissão/salvamento.
    temporizadorFechamento.current = setTimeout(() => {
      // Se o WebView deixar de responder, preserva a última posição recebida
      // e permite sair da tela em vez de prender o usuário no leitor.
      const progresso = ultimoProgresso.current;
      if (progresso) updateBookProgress(book.id, progresso.progress, progresso.position);
      finalizarFechamento();
    }, 1500);
    inject('window.flushReadingProgress?.()');
  }, [book.id, finalizarFechamento, inject, onClose, status, updateBookProgress]);

  useImperativeHandle(ref, () => ({ fechar: fecharLeitor }), [fecharLeitor]);

  useEffect(() => () => {
    if (temporizadorFechamento.current !== null) clearTimeout(temporizadorFechamento.current);
  }, []);

  // O WebView só começa a extrair depois que ambos os lados estão prontos:
  // arquivo carregado no RN e runtime JavaScript carregado dentro do WebView.
  useEffect(() => {
    if (!canStartReader) return;
    if (startedReaderRef.current) return;

    startedReaderRef.current = true;
    setStatus('loading-pdf');
    setProgressLabel('Extraindo texto do PDF...');
    inject(
      `window.configurarPdfJsLocal(${JSON.stringify(recursosPdfJs)});
      window.startReader(${JSON.stringify({
        base64,
        highlights: book.highlights ?? [],
        position: book.readerPosition ?? 0,
        prefs: webPrefs,
      })})`
    );
  }, [base64, book.highlights, book.readerPosition, canStartReader, inject, recursosPdfJs, webPrefs]);

  // Alterações de tema/tamanho são aplicadas sem recarregar o PDF, preservando
  // o texto já extraído e deixando o ajuste instantâneo.
  useEffect(() => {
    if (!webReady) return;
    inject(`window.applyPrefs(${JSON.stringify(webPrefs)})`);
  }, [inject, webPrefs, webReady]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type: string;
        pageNumber?: number;
        pageCount?: number;
        pageIndex?: number;
        pageTotal?: number;
        progress?: number;
        position?: number;
        forcarSalvamento?: boolean;
        highlights?: BookHighlight[];
        message?: string;
      };

      if (data.type === 'loaded') {
        setWebReady(true);
        return;
      }

      if (data.type === 'progress' && data.pageNumber && data.pageCount) {
        setProgressLabel(`Extraindo página ${data.pageNumber} de ${data.pageCount}...`);
        return;
      }

      if (data.type === 'ready') {
        setStatus('ready');
        return;
      }

      if (data.type === 'readingProgress' && typeof data.progress === 'number' && typeof data.position === 'number') {
        ultimoProgresso.current = { progress: data.progress, position: data.position };
        if (typeof data.pageIndex === 'number' && typeof data.pageTotal === 'number') {
          setPageInfo({ index: data.pageIndex, total: data.pageTotal });
          recordReadingPage(book.id, data.pageIndex);
        }
        const now = Date.now();
        if (data.forcarSalvamento || now - lastProgressSavedAt.current > 900 || data.progress === 100) {
          lastProgressSavedAt.current = now;
          updateBookProgress(book.id, data.progress, data.position);
        }
        if (data.forcarSalvamento && fechamentoPendente.current) finalizarFechamento();
        return;
      }

      if (data.type === 'highlightsChanged' && Array.isArray(data.highlights)) {
        updateBookHighlights(book.id, data.highlights);
        return;
      }

      if (data.type === 'empty') {
        setStatus('empty');
        return;
      }

      if (data.type === 'error') {
        setStatus('error');
        setProgressLabel(data.message || 'Não foi possível preparar este PDF.');
      }
    } catch {
      // Mensagens inesperadas do WebView não devem derrubar o leitor.
    }
  };

  const showError = status === 'error';
  const showLoading = status === 'loading-file' || status === 'loading-pdf';

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: readerHtml }}
        style={[styles.webview, { backgroundColor: theme.bg }]}
        onMessage={onMessage}
        javaScriptEnabled
        allowFileAccess
        onError={(event) => {
          setStatus('error');
          setProgressLabel(event.nativeEvent.description);
        }}
      />

      <View
        style={[styles.topBar, { paddingTop: insets.top + 10, backgroundColor: theme.bg }]}
      >
        <Pressable style={styles.iconBtn} onPress={fecharLeitor} hitSlop={8}>
          <ArrowLeftIcon size={20} color={theme.fg} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.fg }]} numberOfLines={1}>
            {book.title}
          </Text>
          {!!book.author && (
            <Text style={[styles.author, { color: theme.fg }]} numberOfLines={1}>
              {book.author}
            </Text>
          )}
        </View>
      </View>

      <View
        pointerEvents="none"
        style={[styles.bottomBar, { height: insets.bottom + 112, backgroundColor: theme.bg }]}
      />

      <View
        style={[styles.controls, { paddingBottom: insets.bottom + 12 }]}
      >
        <View style={styles.themeRow}>
          {(Object.keys(READER_THEMES) as ReaderTheme[]).map((key) => {
            const option = READER_THEMES[key];
            const selected = prefs.theme === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.swatch,
                  { backgroundColor: option.bg, borderColor: selected ? colors.accent : 'rgba(28,25,23,0.18)' },
                ]}
                accessibilityLabel={`Tema ${option.label}`}
                onPress={() => setTheme(key)}
              >
                {selected && <CheckIcon size={12} color={option.fg} />}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fontStepper}>
          <Pressable
            style={[styles.fontBtn, prefs.fontSize <= 15 && styles.fontBtnDisabled]}
            onPress={() => changeFontSize(-1)}
            disabled={prefs.fontSize <= 15}
          >
            <Text style={styles.fontBtnText}>A−</Text>
          </Pressable>
          <Text style={styles.fontValue}>{prefs.fontSize}</Text>
          <Pressable
            style={[styles.fontBtn, prefs.fontSize >= 30 && styles.fontBtnDisabled]}
            onPress={() => changeFontSize(1)}
            disabled={prefs.fontSize >= 30}
          >
            <Text style={styles.fontBtnText}>A+</Text>
          </Pressable>
        </View>
      </View>

      {pageInfo && status === 'ready' && (
        <View
          style={[styles.pageBadge, { bottom: insets.bottom + 68, backgroundColor: theme.fg }]}
        >
          <Text
            style={[styles.pageBadgeText, { color: theme.bg }]}
          >
            {pageInfo.index} de {pageInfo.total}
          </Text>
        </View>
      )}

      {(showLoading || showError) && (
        <View style={[styles.stateOverlay, { backgroundColor: theme.bg }]}>
          {showLoading && <ActivityIndicator color={theme.fg} />}
          <Text style={[styles.stateText, { color: theme.fg }]}>{progressLabel}</Text>
          {showError && (
            <Pressable
              style={styles.errorBtn}
              onPress={() => Alert.alert('Leitor', progressLabel)}
            >
              <Text style={styles.errorBtnText}>Ver detalhes</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webview: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.screenH,
    paddingBottom: 10,
    zIndex: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  titleWrap: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  author: { fontFamily: fonts.sans, fontSize: 12, opacity: 0.62, marginTop: 2 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  controls: {
    position: 'absolute',
    left: spacing.screenH,
    right: spacing.screenH,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    zIndex: 2,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  fontBtn: {
    minWidth: 38,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  fontBtnDisabled: { opacity: 0.45 },
  fontBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  fontValue: {
    width: 28,
    textAlign: 'center',
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.ink,
  },
  pageBadge: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 2,
  },
  pageBadgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    opacity: 0.82,
  },
  stateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: spacing.screenH,
    zIndex: 3,
  },
  stateText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    opacity: 0.72,
  },
  errorBtn: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: colors.ink,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  errorBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.onDarkTitle },
});
