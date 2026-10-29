import { StatusBar } from 'expo-status-bar';
import { useFonts, Newsreader_400Regular, Newsreader_500Medium, Newsreader_400Regular_Italic } from '@expo-google-fonts/newsreader';
import { Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold } from '@expo-google-fonts/archivo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBar } from './src/components/TabBar';
import { File } from 'expo-file-system';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AddBookScreen } from './src/screens/AddBookScreen';
import { ReaderScreen, type ControleLeitor } from './src/screens/ReaderScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { AboutLeitturaScreen } from './src/screens/about-leittura-screen';
import { UserProvider, useUser } from './src/user';
import { BooksProvider } from './src/books';
import { StatsProvider } from './src/stats';
import { GoalProvider } from './src/goal';
import { ReaderProvider } from './src/reader';
import type { Book } from './src/data/books';
import { colors, type Tab } from './src/theme';

// Decide entre a tela de boas-vindas (primeira configuração) e o app principal.
function Root() {
  const insets = useSafeAreaInsets();
  const { ready, onboarded } = useUser();
  const [tab, setTab] = useState<Tab>('home');
  const [pickedPdf, setPickedPdf] = useState<{ uri: string; name: string } | null>(null);
  const [reading, setReading] = useState<Book | null>(null);
  const controleLeitor = useRef<ControleLeitor>(null);
  const [showAbout, setShowAbout] = useState(false);

  const fecharLeitor = useCallback(() => setReading(null), []);

  const fecharSobre = useCallback(() => {
    setShowAbout(false);
    setTab('home');
  }, []);

  const tratarVoltarAndroid = useCallback(() => {
    // Como o app usa telas controladas por estado, o Android precisa receber
    // explicitamente a próxima tela; sem isso, aplica a ação padrão de sair.
    if (reading) {
      // O leitor solicita a posição final antes de desmontar, assim como
      // acontece ao tocar no botão de voltar da própria tela.
      controleLeitor.current?.fechar();
      return true;
    }

    if (pickedPdf) {
      setPickedPdf(null);
      return true;
    }

    if (showAbout) {
      fecharSobre();
      return true;
    }

    // Na Home, não há uma tela anterior interna: o Android pode encerrar o app.
    return false;
  }, [fecharSobre, pickedPdf, reading, showAbout]);

  useEffect(() => {
    const assinatura = BackHandler.addEventListener('hardwareBackPress', tratarVoltarAndroid);

    return () => assinatura.remove();
  }, [tratarVoltarAndroid]);

  // Seleciona o PDF primeiro; depois abre a tela para perguntar nome e autor.
  // Usa o seletor do expo-file-system (retorna um arquivo legível no sandbox,
  // ao contrário do cache do expo-document-picker, que falha no Expo Go).
  const onAddPress = useCallback(async () => {
    const res = await File.pickFileAsync({ mimeTypes: ['application/pdf'] } as any);
    if (!res.canceled && res.result) {
      const file = Array.isArray(res.result) ? res.result[0] : res.result;
      setPickedPdf({ uri: file.uri, name: file.name });
    }
  }, []);

  // Aguarda o AsyncStorage para não piscar a tela errada.
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (!onboarded) {
    return <WelcomeScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* faixa escura no topo → ícones claros */}
      <StatusBar style="light" />
      {showAbout ? (
        <AboutLeitturaScreen onClose={fecharSobre} />
      ) : tab === 'profile' ? (
        <ProfileScreen onOpenAbout={() => setShowAbout(true)} />
      ) : (
        <HomeScreen onOpenBook={setReading} />
      )}
      {/* Mantém a mesma barra entre as abas para a abertura ocorrer apenas na entrada do app. */}
      <TabBar
        active={tab}
        onTabPress={setTab}
        onAddPress={onAddPress}
        bottom={18 + insets.bottom}
        visivel={!showAbout}
      />
      {pickedPdf && (
        <AddBookScreen asset={pickedPdf} onClose={() => setPickedPdf(null)} />
      )}
      {reading && <ReaderScreen ref={controleLeitor} book={reading} onClose={fecharLeitor} />}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_400Regular_Italic,
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.headerBand }} />;
  }

  return (
    <SafeAreaProvider>
      <UserProvider>
        <BooksProvider>
          <GoalProvider>
            <StatsProvider>
              <ReaderProvider>
                <Root />
              </ReaderProvider>
            </StatsProvider>
          </GoalProvider>
        </BooksProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
