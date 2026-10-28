export type ActivityKind = "figures" | "association" | "sentence";
export type Adventure = {
  id: string;
  title: string;
  description: string;
  kind: ActivityKind;
  emoji: string;
  color: string;
  category:
    | "animals"
    | "objects"
    | "foods"
    | "colors"
    | "emotions"
    | "transports"
    | "actions"
    | "nature";
  difficulty: "beginner" | "intermediate" | "advanced";
  minutes: number;
};
const entries: [string, string, string, string, string][] = [
  [
    "figuras-inicio",
    "Alimentos do dia a dia",
    "Ouça, repita e selecione os alimentos.",
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
  ["animais", "Bichinhos do bosque", "Conheça os animais.", "🐶", "lavender"],
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
    "Animais grandes",
    "Conheça animais de diferentes tamanhos.",
    "🐘",
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
    "Hora da refeição",
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
  [
    "clima",
    "Sol ou chuva?",
    "Prepare a criança para cada tempo.",
    "🌦️",
    "butter",
  ],
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
    "Como eu me sinto?",
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
    "Hora de comer",
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
    "Nossa rotina",
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
    category: [
      "figuras-inicio",
      "frutas",
      "refeicao",
      "frases-comida",
    ].includes(id)
      ? "foods"
      : ["animais", "dinossauros", "habitats", "frases-animais"].includes(id)
        ? "animals"
        : id === "transportes"
          ? "transports"
          : ["natureza", "clima", "frases-natureza"].includes(id)
            ? "nature"
            : ["emocoes", "frases-carinho"].includes(id)
              ? "emotions"
              : ["frases-parque", "frases-rotina", "frases-pedidos"].includes(
                    id,
                  )
                ? "actions"
                : "objects",
    difficulty:
      index < 8 ? "beginner" : index < 16 ? "intermediate" : "advanced",
    minutes: 3,
  }),
);
catalog.push(
  {
    id: "cores",
    title: "Cores para descobrir",
    description: "Ouça, repita e reconheça as cores.",
    emoji: "🎨",
    color: "lavender",
    kind: "figures",
    category: "colors",
    difficulty: "beginner",
    minutes: 3,
  },
  {
    id: "acoes",
    title: "Vamos nos movimentar",
    description: "Ouça e reconheça ações do dia a dia.",
    emoji: "🏃",
    color: "mint",
    kind: "figures",
    category: "actions",
    difficulty: "beginner",
    minutes: 3,
  },
);
catalog.push({
  id: "sentimentos-iniciais",
  title: "Carinhas e sentimentos",
  description: "Ouça e reconheça expressões em desenhos.",
  emoji: "😊",
  color: "peach",
  kind: "figures",
  category: "emotions",
  difficulty: "beginner",
  minutes: 3,
});
export const kindLabels: Record<ActivityKind, string> = {
  figures: "Identificar figuras",
  association: "Fazer associações",
  sentence: "Contar histórias em imagens",
};
export type Choice = { name: string; emoji: string; image_url?: string };
export type Round = {
  prompt: string;
  hint: string;
  choices: Choice[];
  answer: string;
  scene?: string;
  sequence?: Choice[];
  words?: string[];
  options?: string[];
};
export type ActivityContent = { id: string; rounds: Round[] };
