// Dados mock do perfil (somente apresentação).

export const profile = {
  memberSince: "Obrigado por usar Leittura",
};

export type Stat = { value: string; label: string };

export const stats: Stat[] = [
  { value: "0", label: "Livros lidos" },
  { value: "0", label: "Dias seguidos" },
  { value: "0", label: "Páginas" },
];

// Meta anual de leitura.
export const goal = {
  read: 0,
  target: 60,
  label: "Meta de 2026",
};

export type MenuItem = {
  id: string;
  label: string;
  hint?: string;
  icon: "bell" | "trash" | "info";
};

// Notificações ficam preparadas para uma versão futura, sem expor uma ação
// ainda indisponível na interface atual.
const SHOW_NOTIFICATIONS_ITEM = false;
const notificationsItem: MenuItem = {
  id: "m1",
  label: "Notificações",
  hint: "Lembretes de leitura",
  icon: "bell",
};

export const menu: MenuItem[] = [
  ...(SHOW_NOTIFICATIONS_ITEM ? [notificationsItem] : []),
  {
    id: "m2",
    label: "Limpar estatísticas",
    hint: "Zera contadores de leitura",
    icon: "trash",
  },
  { id: "m3", label: "Sobre o Leittura", icon: "info" },
];
