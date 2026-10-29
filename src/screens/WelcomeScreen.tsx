// Tela de boas-vindas — primeira configuração do app (define o nome do usuário).
import React, { useEffect, useRef, useState } from 'react';
import {
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
import { useUser } from '../user';
import { useGoal } from '../goal';
import { colors, fonts, spacing } from '../theme';

const YEAR = new Date().getFullYear();

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { finishOnboarding } = useUser();
  const { setGoal } = useGoal();
  const [name, setName] = useState('');
  const [target, setTarget] = useState(12);
  const inputRef = useRef<TextInput>(null);

  // autoFocus no Android costuma focar sem abrir o teclado; focar após a
  // montagem (próximo tick) dispara o teclado de software de forma confiável.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  const canStart = name.trim().length > 0;

  const start = () => {
    if (!canStart) return;
    setGoal({ year: YEAR, target });
    finishOnboarding(name);
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 64 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.wordmark}>Leittura</Text>
          <Text style={styles.heading}>Olá, seja bem-vindo</Text>
          <Text style={styles.subtitle}>
            Vamos começar. Como você gostaria de ser chamado?
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Seu nome</Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder=""
              placeholderTextColor={colors.inkMuted}
              returnKeyType="done"
              onSubmitEditing={start}
            />
          </View>

          {/* Meta de leitura */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Sua meta</Text>
            <Text style={styles.fieldHint}>Qual sua meta para {YEAR}?</Text>

            {/* Quantidade de livros no ano */}
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setTarget((t) => Math.max(1, t - 1))}
                disabled={target <= 1}
              >
                <Text style={[styles.stepperSign, target <= 1 && styles.stepperSignDisabled]}>−</Text>
              </Pressable>
              <View style={styles.stepperValue}>
                <Text style={styles.stepperNumber}>{target}</Text>
                <Text style={styles.stepperUnit}>
                  {target === 1 ? 'livro' : 'livros'}
                </Text>
              </View>
              <Pressable style={styles.stepperBtn} onPress={() => setTarget((t) => t + 1)}>
                <Text style={styles.stepperSign}>+</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
          <Pressable
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={start}
            disabled={!canStart}
          >
            <Text style={styles.startBtnText}>Começar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.screenH, paddingBottom: 24 },
  wordmark: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 2.4,
    color: colors.accent,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 34,
    color: colors.ink,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkSoft,
    marginBottom: 40,
  },
  field: { marginBottom: 22 },
  fieldLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.ink,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  fieldHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: -4,
    marginBottom: 12,
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

  // Stepper de quantidade
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSign: { fontFamily: fonts.sansSemiBold, fontSize: 24, color: colors.ink },
  stepperSignDisabled: { color: colors.inkMuted, opacity: 0.5 },
  stepperValue: { alignItems: 'center', gap: 1 },
  stepperNumber: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  stepperUnit: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.inkMuted },

  footer: { paddingHorizontal: spacing.screenH, paddingTop: 8 },
  startBtn: {
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnDisabled: { opacity: 0.4 },
  startBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.onDarkTitle },
});
