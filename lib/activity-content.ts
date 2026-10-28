import "server-only";
import { freeContent } from "./free-content";
import type { ActivityContent, Choice, Round } from "./catalog";
function figures(
  id: string,
  items: [string, string, string][],
): ActivityContent {
  return {
    id,
    rounds: items.map(([name, emoji, hint], i) => ({
      prompt: `Encontre: ${name.toLowerCase()}`,
      hint,
      answer: name,
      choices: items
        .map(([name, emoji]) => ({ name, emoji }))
        .slice(i)
        .concat(items.map(([name, emoji]) => ({ name, emoji })).slice(0, i)),
    })),
  };
}
function pairs(
  id: string,
  items: [string, string, Choice, Choice, Choice][],
): ActivityContent {
  return {
    id,
    rounds: items.map(([scene, prompt, answer, a, b], i) => ({
      prompt,
      hint: "Peça ao adulto para conversar sobre a sua escolha.",
      scene,
      answer: answer.name,
      choices: i % 2 ? [a, answer, b] : [answer, a, b],
    })),
  };
}
function phrases(id: string, items: [string, string[]][]): ActivityContent {
  return {
    id,
    rounds: items.map(([scene, words]) => ({
      prompt: "Vamos montar uma frase?",
      hint: "Ouça e toque nas palavras na ordem.",
      scene,
      answer: words.join(" "),
      choices: [],
      words,
      options: [...words.slice(1), words[0]],
    })),
  };
}
const c = (name: string, emoji: string): Choice => ({ name, emoji });
const extra: ActivityContent[] = [
  figures("frutas", [
    ["BANANA", "🍌", "Amarelinha e fácil de descascar."],
    ["UVA", "🍇", "Pequenininha, nasce em cachos."],
    ["MORANGO", "🍓", "Vermelhinho, com sementinhas por fora."],
  ]),
  figures("animais", [
    ["CACHORRO", "🐶", "Quem faz au-au?"],
    ["PEIXE", "🐟", "Ele nada na água."],
    ["PATO", "🦆", "Quem faz quá-quá?"],
  ]),
  figures("transportes", [
    ["CARRO", "🚗", "Tem quatro rodas e faz vrum."],
    ["BICICLETA", "🚲", "A gente pedala para passear."],
    ["AVIÃO", "✈️", "Ele leva pessoas pelo céu."],
  ]),
  figures("natureza", [
    ["SOL", "☀️", "Ilumina e aquece o nosso dia."],
    ["FLOR", "🌻", "Pode crescer no jardim."],
    ["ÁRVORE", "🌳", "Tem tronco, folhas e dá sombra."],
  ]),
  figures("casa", [
    ["CAMA", "🛏️", "Um lugar gostoso para dormir."],
    ["CADEIRA", "🪑", "A gente usa para sentar."],
    ["PORTA", "🚪", "A gente abre para entrar."],
  ]),
  figures("roupas", [
    ["CAMISETA", "👕", "A gente veste no corpo."],
    ["SAPATO", "👟", "Protege os nossos pés."],
    ["BONÉ", "🧢", "Vai na cabeça para o passeio."],
  ]),
  figures("dinossauros", [
    ["DINOSSAURO", "🦕", "Um amigo de pescoço comprido."],
    ["OVO", "🥚", "O filhote pode nascer de dentro dele."],
    ["VULCÃO", "🌋", "Uma montanha que pode soltar lava."],
  ]),
  pairs("refeicao", [
    [
      "🍲",
      "A sopa está pronta. O que usamos para comer?",
      c("COLHER", "🥄"),
      c("ESCOVA", "🪥"),
      c("BOLA", "⚽"),
    ],
    [
      "🍞",
      "Vamos cortar o pão com a ajuda de um adulto. O que ele usa?",
      c("FACA", "🔪"),
      c("BONÉ", "🧢"),
      c("LÁPIS", "✏️"),
    ],
    [
      "💧",
      "Dino quer beber água. Onde colocamos a água?",
      c("COPO", "🥛"),
      c("SAPATO", "👟"),
      c("LIVRO", "📖"),
    ],
  ]),
  pairs("higiene", [
    [
      "👐",
      "Vamos lavar as mãos. O que ajuda a limpar?",
      c("SABÃO", "🧼"),
      c("BOLA", "⚽"),
      c("FLOR", "🌻"),
    ],
    [
      "🛁",
      "O banho terminou. O que usamos para secar o corpo?",
      c("TOALHA", "🧺"),
      c("COLHER", "🥄"),
      c("LÁPIS", "✏️"),
    ],
    [
      "💇",
      "Vamos arrumar o cabelo. O que usamos?",
      c("PENTE", "🪮"),
      c("COPO", "🥛"),
      c("BOLA", "⚽"),
    ],
  ]),
  pairs("habitats", [
    [
      "🐟",
      "Onde o peixe vive?",
      c("ÁGUA", "🌊"),
      c("CAMA", "🛏️"),
      c("ÁRVORE", "🌳"),
    ],
    [
      "🐦",
      "Onde o passarinho pode fazer seu ninho?",
      c("ÁRVORE", "🌳"),
      c("FOGÃO", "🍳"),
      c("COPO", "🥛"),
    ],
    [
      "🐝",
      "Onde as abelhas guardam o mel?",
      c("COLMEIA", "🍯"),
      c("SAPATO", "👟"),
      c("CAMA", "🛏️"),
    ],
  ]),
  pairs("clima", [
    [
      "☀️",
      "O dia está ensolarado. O que protege a cabeça?",
      c("BONÉ", "🧢"),
      c("COLHER", "🥄"),
      c("LIVRO", "📖"),
    ],
    [
      "❄️",
      "Está frio! Qual roupa ajuda a aquecer?",
      c("CASACO", "🧥"),
      c("SORVETE", "🍦"),
      c("BOLA", "⚽"),
    ],
    [
      "🌧️",
      "Vamos passear na chuva. O que protege os pés?",
      c("BOTAS", "🥾"),
      c("ÓCULOS", "👓"),
      c("CHAPÉU", "👒"),
    ],
  ]),
  pairs("profissoes", [
    [
      "👩‍⚕️",
      "A médica vai ouvir o coração. O que ela usa?",
      c("ESTETOSCÓPIO", "🩺"),
      c("PANELA", "🍲"),
      c("REGADOR", "🚿"),
    ],
    [
      "👨‍🍳",
      "O cozinheiro vai preparar o almoço. O que ele usa?",
      c("PANELA", "🍲"),
      c("BOLA", "⚽"),
      c("LIVRO", "📖"),
    ],
    [
      "👩‍🚒",
      "Os bombeiros precisam apagar o fogo. O que ajuda?",
      c("ÁGUA", "💦"),
      c("FLOR", "🌻"),
      c("TRAVESSEIRO", "🛏️"),
    ],
  ]),
  pairs("brincadeiras", [
    [
      "⚽",
      "Vamos jogar futebol. O que usamos?",
      c("BOLA", "⚽"),
      c("COLHER", "🥄"),
      c("ESCOVA", "🪥"),
    ],
    [
      "🖍️",
      "Dino quer fazer um desenho. Onde pode desenhar?",
      c("PAPEL", "📄"),
      c("ÁGUA", "🌊"),
      c("SAPATO", "👟"),
    ],
    [
      "🧩",
      "Como completamos um quebra-cabeça?",
      c("PEÇAS", "🧩"),
      c("BANANAS", "🍌"),
      c("COPOS", "🥛"),
    ],
  ]),
  pairs("emocoes", [
    [
      "😢",
      "Dino está triste e quer companhia. O que pode ajudar?",
      c("CONVERSAR", "💬"),
      c("EMPURRAR", "✋"),
      c("GRITAR", "📢"),
    ],
    [
      "🥱",
      "Dino está com sono. O que ele pode fazer?",
      c("DESCANSAR", "🛏️"),
      c("CORRER", "🏃"),
      c("PULAR", "🦘"),
    ],
    [
      "😠",
      "Dino está bravo. Vamos ajudá-lo a se acalmar?",
      c("RESPIRAR", "🌬️"),
      c("BATER", "👊"),
      c("QUEBRAR", "💥"),
    ],
  ]),
  phrases("frases-comida", [
    ["🦕 🍌", ["DINO", "COME", "BANANA"]],
    ["🐰 🥕", ["COELHO", "COME", "CENOURA"]],
    ["👧 💧", ["MENINA", "BEBE", "ÁGUA"]],
  ]),
  phrases("frases-animais", [
    ["🐱 💤", ["GATO", "GOSTA", "DE", "DORMIR"]],
    ["🐶 ⚽", ["CACHORRO", "PEGA", "BOLA"]],
    ["🐟 🌊", ["PEIXE", "NADA", "NA", "ÁGUA"]],
  ]),
  phrases("frases-parque", [
    ["🦕 ⚽", ["DINO", "CHUTA", "BOLA"]],
    ["👧 🌻", ["MENINA", "CHEIRA", "FLOR"]],
    ["👦 🪁", ["MENINO", "SOLTA", "PIPA"]],
  ]),
  phrases("frases-rotina", [
    ["🦕 🛁", ["DINO", "TOMA", "BANHO"]],
    ["👧 🪥", ["MENINA", "ESCOVA", "DENTES"]],
    ["👦 🛏️", ["MENINO", "VAI", "DORMIR"]],
  ]),
  phrases("frases-pedidos", [
    ["🙋 💧", ["EU", "QUERO", "ÁGUA"]],
    ["🙋 🧩", ["VAMOS", "BRINCAR", "JUNTOS"]],
    ["🙋 🤝", ["PRECISO", "DE", "AJUDA"]],
  ]),
  phrases("frases-natureza", [
    ["☀️ 🌤️", ["O", "SOL", "BRILHA"]],
    ["🌧️ 🌻", ["CHUVA", "MOLHA", "FLOR"]],
    ["🐦 🌳", ["PÁSSARO", "POUSA", "NA", "ÁRVORE"]],
  ]),
  phrases("frases-carinho", [
    ["🦕 🤗", ["DINO", "PEDE", "ABRAÇO"]],
    ["🤝 💛", ["EU", "GOSTO", "DE", "VOCÊ"]],
    ["🧸 🌙", ["BOA", "NOITE", "AMIGO"]],
  ]),
];
export const allContent: Record<string, ActivityContent> = {
  ...freeContent,
  ...Object.fromEntries(extra.map((a) => [a.id, a])),
};
