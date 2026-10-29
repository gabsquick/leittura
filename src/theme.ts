// Design tokens — Leittura (Opção A — Editorial)
// Valores extraídos do handoff de design (alta fidelidade).

export const colors = {
  ink: '#1c1917', // texto/tinta principal
  inkSoft: '#57534e', // texto secundário
  inkMuted: '#a8a29e', // texto terciário / contadores
  bg: '#f4f1ea', // fundo claro (corpo Opção A)
  headerBand: '#211d1a', // faixa escura do cabeçalho
  onDarkTitle: '#faf6ef', // título sobre faixa escura
  onDarkWordmark: '#e8dfd0', // wordmark sobre faixa escura
  onDarkSoft: 'rgba(232,223,208,0.72)', // secundário sobre faixa escura
  accent: '#c87a5e', // ponto de destaque na linha de estatística
  danger: '#b3402e', // ação destrutiva (remover)
  card: '#fffdf9',
  cardBorder: 'rgba(28,25,23,0.10)',
  progressTrack: 'rgba(28,25,23,0.10)',
  progressFill: '#1c1917',
  tabBar: 'rgba(253,252,249,0.86)',
  tabBarBorder: 'rgba(28,25,23,0.08)',
} as const;

// Paleta de lombadas (cor sólida das capas geradas).
export const spineColors = [
  '#4f6275', // ardósia
  '#9e5a44', // terracota
  '#6e4d63', // ameixa
  '#9c7a3e', // ocre
  '#4a6354', // verde-musgo
  '#33373f', // tinta
  '#a35a3a', // ferrugem
  '#6d7a5c', // sálvia
  '#7a5a3f', // castanho
  '#516b74', // azul-petróleo
] as const;

// Cor de lombada determinística a partir do título.
export function spineColorFor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) | 0;
  }
  return spineColors[Math.abs(hash) % spineColors.length];
}

export const fonts = {
  serif: 'Newsreader_500Medium',
  serifRegular: 'Newsreader_400Regular',
  serifItalic: 'Newsreader_400Regular_Italic',
  sans: 'Archivo_400Regular',
  sansMedium: 'Archivo_500Medium',
  sansSemiBold: 'Archivo_600SemiBold',
  sansBold: 'Archivo_700Bold',
} as const;

export const spacing = {
  screenH: 24, // padding horizontal do conteúdo
} as const;

// Abas da navegação inferior.
export type Tab = 'home' | 'profile';
