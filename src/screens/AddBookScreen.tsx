// Tela de adicionar livro — pergunta nome e autor do PDF já selecionado.
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import { DocIcon } from '../components/icons';
import { useBooks } from '../books';
import { colors, fonts, spacing } from '../theme';

type Props = {
  asset: { uri: string; name: string };
  onClose: () => void;
};

const LIMITE_TAMANHO_PDF_BYTES = 50 * 1024 * 1024;

// Remove a extensão .pdf do nome do arquivo para sugerir o título.
function stripExt(name: string): string {
  return name.replace(/\.pdf$/i, '').trim();
}

export function AddBookScreen({ asset, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { addBook } = useBooks();
  const [title, setTitle] = useState(stripExt(asset.name));
  const [author, setAuthor] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && !saving;

  const onAdd = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const src = new File(asset.uri);

      // Bloqueia PDFs grandes antes da cópia e evita consumir armazenamento e
      // memória com arquivos que podem travar a leitura em dispositivos móveis.
      if (src.size > LIMITE_TAMANHO_PDF_BYTES) {
        setSaving(false);
        Alert.alert(
          'PDF muito grande',
          'Este PDF é muito grande para ser processado com segurança. Escolha um arquivo de até 50 MB.'
        );
        return;
      }

      const id = Date.now().toString();
      const dest = new File(Paths.document, `${id}.pdf`);
      await src.copy(dest);
      addBook({ title, author, fileUri: dest.uri, fileName: asset.name });
      onClose();
    } catch (e) {
      setSaving(false);
      Alert.alert('Erro ao adicionar', String(e instanceof Error ? e.message : e));
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topRow}>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.cancel}>Cancelar</Text>
            </Pressable>
          </View>

          <Text style={styles.heading}>Adicionar livro</Text>

          {/* Arquivo selecionado */}
          <View style={styles.fileCard}>
            <View style={styles.fileIcon}>
              <DocIcon color={colors.accent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.fileLabel}>PDF selecionado</Text>
              <Text style={styles.fileName} numberOfLines={1}>
                {asset.name}
              </Text>
            </View>
          </View>

          {/* Campos */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nome do livro</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex.: A Biblioteca da Meia-Noite"
              placeholderTextColor={colors.inkMuted}
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Autor</Text>
            <TextInput
              style={styles.input}
              value={author}
              onChangeText={setAuthor}
              placeholder="Ex.: Matt Haig"
              placeholderTextColor={colors.inkMuted}
            />
          </View>
        </ScrollView>

        {/* Botão fixo */}
        <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
          <Pressable
            style={[styles.addBtn, !canSave && styles.addBtnDisabled]}
            onPress={onAdd}
            disabled={!canSave}
          >
            <Text style={styles.addBtnText}>{saving ? 'Adicionando…' : 'Adicionar'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
  },
  content: { paddingHorizontal: spacing.screenH, paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 18 },
  cancel: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.inkSoft },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 30,
    color: colors.ink,
    letterSpacing: -0.2,
    marginBottom: 24,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 28,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(200,122,94,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  fileName: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  field: { marginBottom: 22 },
  fieldLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.ink,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  footer: {
    paddingHorizontal: spacing.screenH,
    paddingTop: 8,
  },
  addBtn: {
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.onDarkTitle },
});
