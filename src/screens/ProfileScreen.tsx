// Perfil — Opção A (Editorial).
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BellIcon,
  ChevronRightIcon,
  InfoIcon,
  PencilIcon,
  TrashIcon,
} from "../components/icons";
import { menu, profile, type MenuItem } from "../data/profile";
import { useUser } from "../user";
import { useStats } from "../stats";
import { useGoal } from "../goal";
import { colors, fonts, spacing } from "../theme";
import { versaoAplicativo } from "../app-version";

type Props = {
  onOpenAbout: () => void;
};

export function ProfileScreen({ onOpenAbout }: Props) {
  const { name, initials, setName } = useUser();
  const { stats, goalRead, cleared, clearStats } = useStats();
  const { goal } = useGoal();
  const insets = useSafeAreaInsets();

  const goalPct = goal.target > 0 ? Math.min(100, Math.round((goalRead / goal.target) * 100)) : 0;
  const goalLeft = Math.max(0, goal.target - goalRead);

  // Confirma antes de zerar os contadores de leitura.
  const onClearStats = () => {
    if (cleared) {
      Alert.alert("Estatísticas", "Suas estatísticas já estão zeradas.");
      return;
    }
    Alert.alert(
      "Limpar estatísticas",
      "Isso vai zerar seus contadores de leitura. Não dá para desfazer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpar", style: "destructive", onPress: clearStats },
      ]
    );
  };

  // Ação de cada item do menu de ajustes.
  const menuAction = (id: string) => {
    if (id === "m2") return onClearStats;
    if (id === "m3") return onOpenAbout;
    return undefined;
  };

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const openEditor = () => {
    setDraft(name);
    setEditing(true);
  };
  const save = () => {
    setName(draft);
    setEditing(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Faixa escura do cabeçalho */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.wordmark}>PERFIL</Text>
          </View>

          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <Pressable style={styles.nameRow} onPress={openEditor} hitSlop={8}>
              <Text style={styles.name}>{name}</Text>
              <View style={styles.editBtn}>
                <PencilIcon />
              </View>
            </Pressable>
            <View style={styles.memberRow}>
              <Text style={styles.member}>{profile.memberSince}</Text>
            </View>
          </View>
        </View>

        {/* Estatísticas */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Meta de leitura */}
        <View style={styles.section}>
          <SectionHeader label="Meta de leitura" />
          <View style={styles.goalCard}>
            <View style={styles.goalTop}>
              <Text style={styles.goalLabel}>Meta de {goal.year}</Text>
            </View>
            <View style={styles.goalCountRow}>
              <Text style={styles.goalRead}>{goalRead}</Text>
              <Text style={styles.goalTarget}> / {goal.target} livros</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${goalPct}%` }]} />
            </View>
            <View style={styles.goalFootRow}>
              <Text style={styles.goalPct}>{goalPct}% concluído</Text>
              <Text style={styles.goalLeft}>
                {goalLeft} restantes
              </Text>
            </View>
          </View>
        </View>

        {/* Ajustes */}
        <View style={styles.section}>
          <SectionHeader label="Ajustes" />
          <View style={styles.menuCard}>
            {menu.map((item, i) => (
              <View key={item.id}>
                {i > 0 && <View style={styles.menuDivider} />}
                <MenuRow item={item} onPress={menuAction(item.id)} />
              </View>
            ))}
          </View>

          <Text style={styles.version}>Leittura · versão {versaoAplicativo}</Text>
        </View>

        <View style={{ height: 96 + insets.bottom }} />
      </ScrollView>

      {/* Modal de edição do nome */}
      <Modal
        visible={editing}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setEditing(false)}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <Text style={styles.dialogTitle}>Seu nome</Text>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Como quer ser chamado?"
              placeholderTextColor={colors.inkMuted}
              autoFocus
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={save}
            />
            <View style={styles.dialogActions}>
              <Pressable
                style={[styles.dialogBtn, styles.dialogBtnGhost]}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.dialogBtnGhostText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogBtn, styles.dialogBtnPrimary]}
                onPress={save}
              >
                <Text style={styles.dialogBtnPrimaryText}>Salvar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({ item, onPress }: { item: MenuItem; onPress?: () => void }) {
  const Icon =
    item.icon === "bell"
      ? BellIcon
      : item.icon === "trash"
        ? TrashIcon
        : InfoIcon;
  return (
    <Pressable
      style={({ pressed }) => [styles.menuRow, pressed && onPress && styles.menuRowPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuIcon}>
        <Icon />
      </View>
      <View style={styles.menuTexts}>
        <Text style={styles.menuLabel}>{item.label}</Text>
        {item.hint && <Text style={styles.menuHint}>{item.hint}</Text>}
      </View>
      <ChevronRightIcon />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 8 },

  // Cabeçalho
  header: {
    backgroundColor: colors.headerBand,
    paddingTop: 58,
    paddingHorizontal: spacing.screenH,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wordmark: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    letterSpacing: 3,
    color: colors.onDarkWordmark,
  },

  // Identidade
  identity: { alignItems: "center", marginTop: 18 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(232,223,208,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontFamily: fonts.serif,
    fontSize: 34,
    color: colors.onDarkTitle,
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 16,
  },
  name: {
    fontFamily: fonts.serif,
    fontSize: 27,
    color: colors.onDarkTitle,
    letterSpacing: -0.2,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.onDarkSoft,
    marginTop: 4,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  memberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  member: {
    fontFamily: fonts.sansMedium,
    fontSize: 12.5,
    color: colors.onDarkSoft,
  },

  // Estatísticas
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    marginHorizontal: spacing.screenH,
    marginTop: 22,
    paddingVertical: 20,
  },
  statCell: { flex: 1, alignItems: "center", gap: 5 },
  statDivider: { width: 1, height: 34, backgroundColor: colors.cardBorder },
  statValue: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.inkMuted,
    letterSpacing: 0.2,
  },

  // Seções
  section: { paddingTop: 30, paddingHorizontal: spacing.screenH },
  sectionHeader: { marginBottom: 14 },
  sectionLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.ink,
    textTransform: "uppercase",
  },

  // Meta de leitura
  goalCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    padding: 20,
  },
  goalTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goalLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.inkSoft,
    textTransform: "uppercase",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(200,122,94,0.12)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  goalCountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 14,
    marginBottom: 14,
  },
  goalRead: {
    fontFamily: fonts.serif,
    fontSize: 40,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  goalTarget: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.progressTrack,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.progressFill,
    borderRadius: 2,
  },
  goalFootRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  goalPct: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11.5,
    color: colors.ink,
  },
  goalLeft: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.inkMuted },

  // Menu de ajustes
  menuCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 14,
  },
  menuRowPressed: { backgroundColor: colors.bg },
  menuDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginLeft: 56,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTexts: { flex: 1, gap: 2 },
  menuLabel: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  menuHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted },

  version: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: colors.inkMuted,
    textAlign: "center",
    marginTop: 18,
  },

  // Modal de edição do nome
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28,25,23,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.screenH,
  },
  dialog: {
    width: "100%",
    backgroundColor: colors.bg,
    borderRadius: 22,
    padding: 22,
  },
  dialogTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.ink,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  input: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.ink,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  dialogBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  dialogBtnGhost: { backgroundColor: "transparent" },
  dialogBtnGhostText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.inkSoft,
  },
  dialogBtnPrimary: { backgroundColor: colors.ink },
  dialogBtnPrimaryText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.bg,
  },
});
