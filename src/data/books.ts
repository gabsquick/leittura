// Tipo do livro (PDFs adicionados pelo usuário).

export type Book = {
  id: string;
  title: string;
  author: string;
  color: string;
  categoryId?: string; // categoria escolhida pelo usuário, quando houver
  progress?: number; // 0-100
  progressLabel?: string;
  readerPosition?: number; // posição normalizada do leitor reflowável (0-1)
  completedAt?: number; // primeira vez em que o livro chegou a 100%
  highlights?: BookHighlight[]; // grifos salvos no texto reflowável
  left?: string; // tempo restante
  fileUri?: string; // caminho do PDF copiado para o app
  fileName?: string; // nome original do arquivo
  addedAt?: number; // timestamp p/ ordenar "recentes"
  favorite?: boolean; // marcado como favorito pelo usuário
};

export type BookCategory = {
  id: string;
  name: string;
  createdAt: number;
};

export type BookHighlight = {
  id: string;
  color: 'red' | 'blue' | 'yellow';
  text: string;
  occurrence: number;
};

export function getGreeting(hour = new Date().getHours()): string {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour <= 18) return 'Boa tarde';
  return 'Boa noite';
}
