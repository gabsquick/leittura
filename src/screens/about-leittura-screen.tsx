import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from '../components/icons';
import { colors, fonts, spacing } from '../theme';
import { versaoAplicativo } from '../app-version';

type Props = {
  onClose: () => void;
};

const urlPoliticaPrivacidade = 'https://gabsquick.github.io/leittura-privacy-term/';

const arquivoLicencaPdfJs = require('../../assets/pdfjs/apache-2.0.pdfjs');
let promessaLicencaPdfJs: Promise<string> | null = null;

function carregarLicencaPdfJs(): Promise<string> {
  if (!promessaLicencaPdfJs) {
    promessaLicencaPdfJs = Asset.loadAsync(arquivoLicencaPdfJs).then(([asset]) => {
      if (!asset.localUri) throw new Error('Licença indisponível.');
      return new File(asset.localUri).text();
    });
  }

  return promessaLicencaPdfJs;
}

// ===== EDITE O CONTEÚDO DA TELA "SOBRE O LEITTURA" AQUI =====
// Troque os títulos e textos abaixo pelo conteúdo que você quiser. Para criar
// outro bloco, basta adicionar mais um objeto dentro de `sections`.
const aboutContent = {
  title: 'Leittura',
  subtitle: 'Um espaço feito para suas leituras.',
  sections: [
    {
      title: 'Sobre o aplicativo',
      text: 'App criado com o objetivo de visualizar textos ou livros em PDF, de simples utilização. Nao exibimos anuncios, Leittura e gratis.',
    },
    {
      title: 'Leitura offline',
      text: 'O leitor processa os PDFs no próprio dispositivo, sem enviar seus livros ou dados de leitura para serviços externos.',
    },
  ],
};
// ===== FIM DO CONTEÚDO EDITÁVEL =====

export function AboutLeitturaScreen({ onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [licencaAberta, setLicencaAberta] = useState(false);
  const [textoLicenca, setTextoLicenca] = useState('');

  const alternarLicenca = async () => {
    const deveAbrir = !licencaAberta;
    setLicencaAberta(deveAbrir);

    if (deveAbrir && !textoLicenca) {
      try {
        setTextoLicenca(await carregarLicencaPdfJs());
      } catch {
        setTextoLicenca('Não foi possível carregar o texto completo da licença.');
      }
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar para a Home"
          hitSlop={10}
          onPress={onClose}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <ArrowLeftIcon size={20} color={colors.onDarkWordmark} />
        </Pressable>
        <Text style={styles.headerTitle}>SOBRE O LEITTURA</Text>
        <View style={styles.headerBalance} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        <View style={styles.intro}>
          <Text style={styles.title}>{aboutContent.title}</Text>
          <Text style={styles.subtitle}>{aboutContent.subtitle}</Text>
        </View>

        <View style={styles.sections}>
          {aboutContent.sections.map((section, index) => (
            <View key={`${section.title}-${index}`} style={styles.card}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text selectable style={styles.sectionText}>{section.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.licenseCard}>
          <Text style={styles.licenseEyebrow}>LICENÇAS DE CÓDIGO ABERTO</Text>
          <Text selectable style={styles.licenseName}>PDF.js 4.10.38</Text>
          <Text selectable style={styles.licenseCopyright}>
            Copyright 2024 Mozilla Foundation
          </Text>
          <Text selectable style={styles.licenseType}>Apache License 2.0</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={licencaAberta ? 'Ocultar licença completa' : 'Ver licença completa'}
            onPress={alternarLicenca}
            style={({ pressed }) => [styles.licenseButton, pressed && styles.licenseButtonPressed]}
          >
            <Text style={styles.licenseButtonText}>
              {licencaAberta ? 'Ocultar licença completa' : 'Ver licença completa'}
            </Text>
          </Pressable>

          {licencaAberta && (
            <View style={styles.licenseFullTextWrap}>
              <Text selectable style={styles.licenseFullText}>
                {textoLicenca || 'Carregando licença...'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>PRIVACIDADE</Text>
          <Text selectable style={styles.privacyText}>
            Consulte a política de privacidade do Leittura para saber como seus dados e PDFs são tratados.
          </Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Abrir política de privacidade"
            onPress={() => Linking.openURL(urlPoliticaPrivacidade)}
            style={({ pressed }) => [styles.privacyButton, pressed && styles.licenseButtonPressed]}
          >
            <Text style={styles.privacyButtonText}>Abrir política de privacidade</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>Leittura · versão {versaoAplicativo}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    minHeight: 82,
    paddingHorizontal: spacing.screenH,
    paddingBottom: 16,
    backgroundColor: colors.headerBand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.onDarkWordmark,
  },
  headerBalance: {
    width: 38,
  },
  content: {
    paddingHorizontal: spacing.screenH,
    paddingTop: 38,
  },
  intro: {
    paddingTop: 22,
    gap: 8,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 38,
    lineHeight: 43,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  subtitle: {
    maxWidth: 320,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    color: colors.inkSoft,
  },
  sections: {
    paddingTop: 32,
    gap: 14,
  },
  card: {
    padding: 20,
    gap: 10,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  licenseCard: {
    marginTop: 14,
    padding: 20,
    gap: 8,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  licenseEyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.inkMuted,
  },
  licenseName: {
    paddingTop: 4,
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.ink,
  },
  licenseCopyright: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
  },
  licenseType: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkMuted,
  },
  licenseButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.headerBand,
  },
  licenseButtonPressed: {
    opacity: 0.78,
  },
  licenseButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.onDarkWordmark,
  },
  licenseFullTextWrap: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  licenseFullText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 17,
    color: colors.inkSoft,
  },
  privacyCard: {
    marginTop: 14,
    padding: 20,
    gap: 9,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  privacyTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.inkMuted,
  },
  privacyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkSoft,
  },
  privacyButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.headerBand,
  },
  privacyButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.onDarkWordmark,
  },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  sectionText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    color: colors.inkSoft,
  },
  version: {
    paddingTop: 26,
    fontFamily: fonts.sans,
    fontSize: 11.5,
    textAlign: 'center',
    color: colors.inkMuted,
  },
});
