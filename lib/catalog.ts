export type ActivityKind = "figures" | "association" | "sentence";
export type Adventure = {
  id: string;
  title: string;
  description: string;
  kind: ActivityKind;
  emoji: string;
  color: string;
  free: boolean;
  minutes: number;
};
const entries: [string, string, string, string, string][] = [
  [
    "figuras-inicio",
    "Que figura é essa?",
    "As primeiras descobertas do Dino.",
    "🍎",
    "mint",
  ],
  [
    "frutas",
    "Piquenique de frutas",
    "Um cesto cheio de palavras gostosas.",
    "🍓",
    "peach",
  ],
  [
    "animais",
    "Bichinhos do bosque",
    "Conheça os amigos do Dino.",
    "🐶",
    "lavender",
  ],
  [
    "transportes",
    "Vamos passear?",
    "Descubra como ir de um lugar a outro.",
    "🚗",
    "sky",
  ],
  [
    "natureza",
    "Jardim das palavras",
    "Explore o que cresce e brilha lá fora.",
    "🌻",
    "butter",
  ],
  ["casa", "Minha casinha", "Encontre objetos do nosso lar.", "🏡", "peach"],
  ["roupas", "Hora de se vestir", "Cada peça tem seu nome.", "🧢", "sky"],
  [
    "dinossauros",
    "Vale dos dinossauros",
    "Explore o lar dos nossos amigos.",
    "🦕",
    "mint",
  ],
  [
    "associacao-inicio",
    "Palavras que combinam",
    "Pequenos pares do nosso dia a dia.",
    "🧩",
    "lavender",
  ],
  [
    "refeicao",
    "A mesa do Dino",
    "O que combina com cada refeição?",
    "🥣",
    "butter",
  ],
  [
    "higiene",
    "Cuidando de mim",
    "Descubra os objetos de cada cuidado.",
    "🪥",
    "sky",
  ],
  [
    "habitats",
    "Onde mora o bichinho?",
    "Cada animal tem um lugar para viver.",
    "🐠",
    "mint",
  ],
  ["clima", "Sol ou chuva?", "Prepare o Dino para cada tempo.", "🌦️", "butter"],
  [
    "profissoes",
    "Quem usa isso?",
    "Pessoas que ajudam a comunidade.",
    "🩺",
    "lavender",
  ],
  [
    "brincadeiras",
    "Vamos brincar juntos",
    "Encontre o parceiro da brincadeira.",
    "🪁",
    "peach",
  ],
  [
    "emocoes",
    "Como o Dino se sente?",
    "Converse sobre sentimentos e cuidados.",
    "💛",
    "mint",
  ],
  [
    "frases-inicio",
    "Minha primeira frase",
    "Três palavrinhas contam uma história.",
    "💬",
    "sky",
  ],
  [
    "frases-comida",
    "Dino está com fome",
    "Monte frases sobre a hora de comer.",
    "🍌",
    "butter",
  ],
  [
    "frases-animais",
    "O que o bicho faz?",
    "Pequenas ações, grandes histórias.",
    "🐱",
    "lavender",
  ],
  [
    "frases-parque",
    "Um dia no parque",
    "Conte como foi a brincadeira.",
    "🛝",
    "mint",
  ],
  [
    "frases-rotina",
    "Um dia com o Dino",
    "Organize palavras da nossa rotina.",
    "🛁",
    "sky",
  ],
  [
    "frases-pedidos",
    "Posso pedir?",
    "Pratique pedidos com seu adulto.",
    "🙋",
    "peach",
  ],
  [
    "frases-natureza",
    "Histórias do jardim",
    "Dê palavras às descobertas lá fora.",
    "🌳",
    "mint",
  ],
  [
    "frases-carinho",
    "Palavras de carinho",
    "Monte frases para compartilhar afeto.",
    "🤗",
    "lavender",
  ],
];
export const catalog: Adventure[] = entries.map(
  ([id, title, description, emoji, color], index) => ({
    id,
    title,
    description,
    emoji,
    color,
    kind: index < 8 ? "figures" : index < 16 ? "association" : "sentence",
    free: [0, 8, 16].includes(index),
    minutes: 3,
  }),
);
export const kindLabels: Record<ActivityKind, string> = {
  figures: "Identificar figuras",
  association: "Fazer associações",
  sentence: "Contar histórias em imagens",
};
export type Choice = { name: string; emoji: string };
export type Round = {
  prompt: string;
  hint: string;
  choices: Choice[];
  answer: string;
  scene?: string;
  words?: string[];
  options?: string[];
};
export type ActivityContent = { id: string; rounds: Round[] };
