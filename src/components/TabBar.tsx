// Barra de navegação flutuante compartilhada entre as telas.
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Movimento, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { PlusIcon, ProfileIcon, ShelfIcon } from './icons';
import { useBooks } from '../books';
import { colors, fonts, spacing, type Tab } from '../theme';

type Props = {
  active: Tab;
  onTabPress: (tab: Tab) => void;
  onAddPress: () => void;
  bottom: number;
  visivel?: boolean;
};

export function TabBar({ active, onTabPress, onAddPress, bottom, visivel = true }: Props) {
  const { categories, addCategory } = useBooks();
  const onProfile = active === 'profile';
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const menuProgress = useRef(new Animated.Value(0)).current;
  const [larguraBarra, definirLarguraBarra] = useState(0);
  const movimentoReduzido = useReducedMotion();
  const animacoesAbertura = useMemo(() => {
    if (movimentoReduzido) return {};

    const configuracao = {
      animationDuration: 250,
      animationTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
      animationFillMode: 'both' as const,
    };
    const deslocamento = Math.max(0, (larguraBarra - 28) / 3);
    const animarLateral = (origem: number) => ({
      ...configuracao,
      animationName: {
        from: { opacity: 0, transform: [{ translateX: origem }] },
        to: { opacity: 1, transform: [{ translateX: 0 }] },
      },
    });

    return {
      fundo: {
        ...configuracao,
        animationName: {
          from: { width: 44, opacity: 0 },
          '25%': { opacity: 1 },
          to: { width: larguraBarra, opacity: 1 },
        },
      },
      estante: animarLateral(deslocamento),
      perfil: animarLateral(-deslocamento),
    };
  }, [larguraBarra, movimentoReduzido]);
  const cleanCategoryName = categoryName.trim();
  const categoryExists = categories.some(
    (category) => category.name.toLocaleLowerCase() === cleanCategoryName.toLocaleLowerCase()
  );
  const canConfirmCategory = cleanCategoryName.length > 0 && !categoryExists;

  // O menu permanece montado para animar tanto a entrada quanto a saída sem
  // deslocar a barra inferior ou interferir no seletor nativo de arquivos.
  const setAddMenuOpen = (open: boolean) => {
    setMenuOpen(open);
    Animated.timing(menuProgress, {
      toValue: open ? 1 : 0,
      duration: open ? 180 : 140,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handlePdfPress = () => {
    setAddMenuOpen(false);
    onAddPress();
  };

  const handleCategoryPress = () => {
    setAddMenuOpen(false);
    setCategoryName('');
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setCategoryName('');
  };

  const confirmCategory = () => {
    if (!canConfirmCategory) return;
    addCategory(cleanCategoryName);
    closeCategoryModal();
  };

  return (
    <View
      style={[styles.wrap, { bottom }, !visivel && styles.oculta]}
      pointerEvents="box-none"
      onLayout={(evento) => {
        const largura = evento.nativeEvent.layout.width;
        if (largura > 0) definirLarguraBarra(largura);
      }}
    >
      <Animated.View
        pointerEvents={menuOpen ? 'auto' : 'none'}
        style={[
          styles.addMenu,
          {
            opacity: menuProgress,
            transform: [
              {
                translateY: menuProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
              {
                scale: menuProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.addMenuCard}>
          <Pressable
            accessibilityRole="menuitem"
            style={({ pressed }) => [styles.addMenuItem, pressed && styles.addMenuItemPressed]}
            onPress={handlePdfPress}
          >
            <Text style={styles.addMenuLabel}>PDF</Text>
          </Pressable>
          <View style={styles.addMenuDivider} />
          <Pressable
            accessibilityRole="menuitem"
            style={({ pressed }) => [styles.addMenuItem, pressed && styles.addMenuItemPressed]}
            onPress={handleCategoryPress}
          >
            <Text style={styles.addMenuLabel}>Nova Categoria</Text>
          </Pressable>
        </View>
        <View style={styles.addMenuPointer} />
      </Animated.View>

      {/* Só a máscara se alarga; o blur mantém tamanho fixo e o botão central
          permanece imóvel. Assim, ícones e cantos não ficam esticados. */}
      {larguraBarra > 0 && (
        <Movimento.View
          pointerEvents="none"
          style={[styles.fundoBarra, { width: larguraBarra }, animacoesAbertura.fundo]}
        >
          <BlurView
            intensity={28}
            tint="light"
            style={[styles.bar, { width: larguraBarra, left: '50%', marginLeft: -larguraBarra / 2 }]}
          />
        </Movimento.View>
      )}

      <View style={styles.conteudoBarra}>
        {larguraBarra > 0 && (
          <Movimento.View style={[styles.lateral, animacoesAbertura.estante]}>
            <Pressable
              style={styles.itemLateral}
              onPress={() => {
                setAddMenuOpen(false);
                onTabPress('home');
              }}
              hitSlop={8}
            >
              <ShelfIcon color={onProfile ? colors.inkMuted : colors.ink} />
              <Text style={onProfile ? styles.label : styles.labelActive}>Estante</Text>
            </Pressable>
          </Movimento.View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar"
          accessibilityState={{ expanded: menuOpen }}
          style={styles.item}
          onPress={() => setAddMenuOpen(!menuOpen)}
          hitSlop={8}
        >
          <Animated.View
            style={[
              styles.plusBtn,
              {
                transform: [
                  {
                    rotate: menuProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '45deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <PlusIcon />
          </Animated.View>
        </Pressable>

        {larguraBarra > 0 && (
          <Movimento.View style={[styles.lateral, animacoesAbertura.perfil]}>
            <Pressable
              style={styles.itemLateral}
              onPress={() => {
                setAddMenuOpen(false);
                onTabPress('profile');
              }}
              hitSlop={8}
            >
              <ProfileIcon color={onProfile ? colors.ink : colors.inkMuted} />
              <Text style={onProfile ? styles.labelActive : styles.label}>Perfil</Text>
            </Pressable>
          </Movimento.View>
        )}
      </View>

      <Modal
        visible={categoryModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeCategoryModal}
      >
        <KeyboardAvoidingView
          style={styles.categoryModalRoot}
          behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.categoryModalBackdrop} onPress={closeCategoryModal}>
            <Pressable
              accessibilityViewIsModal
              style={styles.categoryModalCard}
              onPress={(event) => event.stopPropagation()}
            >
              <Text style={styles.categoryModalTitle}>Nome da categoria</Text>
              <TextInput
                autoFocus
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Ex.: Ficção"
                placeholderTextColor={colors.inkMuted}
                selectionColor={colors.accent}
                returnKeyType="done"
                maxLength={40}
                style={styles.categoryInput}
                onSubmitEditing={confirmCategory}
              />
              {categoryExists && (
                <Text style={styles.categoryError}>Essa categoria já existe.</Text>
              )}
              <View style={styles.categoryModalActions}>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.categoryCancelButton,
                    pressed && styles.categoryButtonPressed,
                  ]}
                  onPress={closeCategoryModal}
                >
                  <Text style={styles.categoryCancelLabel}>Cancelar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!canConfirmCategory}
                  style={({ pressed }) => [
                    styles.categoryConfirmButton,
                    !canConfirmCategory && styles.categoryConfirmButtonDisabled,
                    pressed && canConfirmCategory && styles.categoryButtonPressed,
                  ]}
                  onPress={confirmCategory}
                >
                  <Text style={styles.categoryConfirmLabel}>Confirmar</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.screenH, right: spacing.screenH },
  oculta: { display: 'none' },
  fundoBarra: {
    position: 'absolute',
    top: 0,
    height: 60,
    alignSelf: 'center',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  conteudoBarra: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    zIndex: 1,
    elevation: 9,
  },
  lateral: { flex: 1 },
  itemLateral: { alignItems: 'center', gap: 4 },
  addMenu: {
    position: 'absolute',
    bottom: 70,
    left: '50%',
    width: 174,
    marginLeft: -87,
    zIndex: 2,
    alignItems: 'center',
  },
  addMenuCard: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 5,
    boxShadow: '0 8px 26px rgba(28, 25, 23, 0.18)',
  },
  addMenuItem: {
    height: 40,
    borderRadius: 11,
    borderCurve: 'continuous',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  addMenuItemPressed: { backgroundColor: 'rgba(28,25,23,0.07)' },
  addMenuLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  addMenuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.cardBorder, marginHorizontal: 8 },
  addMenuPointer: {
    width: 11,
    height: 11,
    marginTop: -6,
    transform: [{ rotate: '45deg' }],
    backgroundColor: colors.card,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.cardBorder,
  },
  bar: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.tabBar,
    borderWidth: 1,
    borderColor: colors.tabBarBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  item: { flex: 1, alignItems: 'center', gap: 4, zIndex: 1 },
  label: { fontFamily: fonts.sansMedium, fontSize: 9.5, color: colors.inkMuted },
  labelActive: { fontFamily: fonts.sansSemiBold, fontSize: 9.5, color: colors.ink },
  plusBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  categoryModalRoot: { flex: 1 },
  categoryModalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenH,
    backgroundColor: 'rgba(28,25,23,0.48)',
  },
  categoryModalCard: {
    width: '100%',
    maxWidth: 360,
    gap: 16,
    padding: 22,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: '0 18px 46px rgba(28, 25, 23, 0.24)',
  },
  categoryModalTitle: {
    fontFamily: fonts.serif,
    fontSize: 25,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  categoryInput: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.bg,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.ink,
  },
  categoryError: {
    marginTop: -8,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.danger,
  },
  categoryModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  categoryCancelButton: {
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: colors.bg,
  },
  categoryConfirmButton: {
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: colors.ink,
  },
  categoryConfirmButtonDisabled: { opacity: 0.38 },
  categoryButtonPressed: { opacity: 0.72 },
  categoryCancelLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.inkSoft },
  categoryConfirmLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.onDarkTitle },
});
