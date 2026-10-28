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
    hint: "Uma fruta vermelhinha!",
    choices: [
      { name: "BOLA", emoji: "⚽" },
      { name: "MAÇÃ", emoji: "🍎" },
      { name: "GATO", emoji: "🐱" },
    ],
  },
  {
    word: "GATO",
    emoji: "🐱",
    hint: "Quem faz miau?",
    choices: [
      { name: "GATO", emoji: "🐱" },
      { name: "SOL", emoji: "☀️" },
      { name: "BOLA", emoji: "⚽" },
    ],
  },
  {
    word: "BOLA",
    emoji: "⚽",
    hint: "A gente pode chutar e rolar!",
    choices: [
      { name: "MAÇÃ", emoji: "🍎" },
      { name: "GATO", emoji: "🐱" },
      { name: "BOLA", emoji: "⚽" },
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
    emoji: "🦕 🍎",
    words: ["DINO", "COME", "MAÇÃ"],
    options: ["MAÇÃ", "DINO", "COME"],
  },
  {
    emoji: "🐱 ⚽",
    words: ["GATO", "QUER", "BOLA"],
    options: ["QUER", "BOLA", "GATO"],
  },
  {
    emoji: "🦕 💧",
    words: ["DINO", "BEBE", "ÁGUA"],
    options: ["ÁGUA", "DINO", "BEBE"],
  },
];
