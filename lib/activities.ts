export type FigureRound = {
  word: string;
  emoji: string;
  hint: string;
  choices: { name: string; emoji: string }[];
};
export const figures: FigureRound[] = [
  {
    word: "MAÇÃ",
    emoji: "🍎",
    hint: "Uma fruta vermelhinha.",
    choices: [
      { name: "PÃO", emoji: "🍞" },
      { name: "MAÇÃ", emoji: "🍎" },
      { name: "LEITE", emoji: "🥛" },
    ],
  },
  {
    word: "PÃO",
    emoji: "🍞",
    hint: "Pode fazer parte do café da manhã.",
    choices: [
      { name: "PÃO", emoji: "🍞" },
      { name: "LEITE", emoji: "🥛" },
      { name: "MAÇÃ", emoji: "🍎" },
    ],
  },
  {
    word: "LEITE",
    emoji: "🥛",
    hint: "Uma bebida que pode ir no copo.",
    choices: [
      { name: "MAÇÃ", emoji: "🍎" },
      { name: "PÃO", emoji: "🍞" },
      { name: "LEITE", emoji: "🥛" },
    ],
  },
];
export const associations = [
  {
    emoji: "🐶",
    prompt: "O cachorro está com fome. O que combina?",
    answer: "COMIDA",
    choices: [
      { name: "COMIDA", emoji: "🥣" },
      { name: "SAPATO", emoji: "👟" },
      { name: "LÁPIS", emoji: "✏️" },
    ],
  },
  {
    emoji: "🌧️",
    prompt: "Está chovendo! O que ajuda a se proteger?",
    answer: "GUARDA-CHUVA",
    choices: [
      { name: "BOLA", emoji: "⚽" },
      { name: "GUARDA-CHUVA", emoji: "☂️" },
      { name: "LIVRO", emoji: "📖" },
    ],
  },
  {
    emoji: "🦷",
    prompt: "Vamos limpar os dentes. O que usamos?",
    answer: "ESCOVA",
    choices: [
      { name: "FLOR", emoji: "🌼" },
      { name: "COLHER", emoji: "🥄" },
      { name: "ESCOVA", emoji: "🪥" },
    ],
  },
];
export const sentences = [
  {
    emoji: "👦 🍎",
    words: ["MENINO", "COME", "MAÇÃ"],
    options: ["MAÇÃ", "MENINO", "COME"],
  },
  {
    emoji: "🐱 ⚽",
    words: ["GATO", "QUER", "BOLA"],
    options: ["QUER", "BOLA", "GATO"],
  },
  {
    emoji: "👦 💧",
    words: ["MENINO", "BEBE", "ÁGUA"],
    options: ["ÁGUA", "MENINO", "BEBE"],
  },
];
