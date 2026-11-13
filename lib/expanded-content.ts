import "server-only";
import type { ActivityContent, Choice } from "./catalog";
const packs = [
  {
    id: "figuras-animals-fazenda",
    title: "Amigos da fazenda",
    category: "animals",
    items: [
      {
        name: "VACA",
        emoji: "🐮",
        image_url: "/puzzles/animals-fazenda-0.svg",
      },
      {
        name: "PORCO",
        emoji: "🐷",
        image_url: "/puzzles/animals-fazenda-1.svg",
      },
      {
        name: "GALINHA",
        emoji: "🐔",
        image_url: "/puzzles/animals-fazenda-2.svg",
      },
    ],
  },
  {
    id: "figuras-animals-mata",
    title: "Passeio pela mata",
    category: "animals",
    items: [
      {
        name: "MACACO",
        emoji: "🐒",
        image_url: "/puzzles/animals-mata-0.svg",
      },
      {
        name: "TIGRE",
        emoji: "🐯",
        image_url: "/puzzles/animals-mata-1.svg",
      },
      {
        name: "URSO",
        emoji: "🐻",
        image_url: "/puzzles/animals-mata-2.svg",
      },
    ],
  },
  {
    id: "figuras-animals-mar",
    title: "Amigos do mar",
    category: "animals",
    items: [
      {
        name: "POLVO",
        emoji: "🐙",
        image_url: "/puzzles/animals-mar-0.svg",
      },
      {
        name: "GOLFINHO",
        emoji: "🐬",
        image_url: "/puzzles/animals-mar-1.svg",
      },
      {
        name: "BALEIA",
        emoji: "🐳",
        image_url: "/puzzles/animals-mar-2.svg",
      },
    ],
  },
  {
    id: "figuras-animals-jardim",
    title: "Bichinhos do jardim",
    category: "animals",
    items: [
      {
        name: "BORBOLETA",
        emoji: "🦋",
        image_url: "/puzzles/animals-jardim-0.svg",
      },
      {
        name: "ABELHA",
        emoji: "🐝",
        image_url: "/puzzles/animals-jardim-1.svg",
      },
      {
        name: "CARACOL",
        emoji: "🐌",
        image_url: "/puzzles/animals-jardim-2.svg",
      },
    ],
  },
  {
    id: "figuras-animals-aves",
    title: "Quem tem asas?",
    category: "animals",
    items: [
      {
        name: "CORUJA",
        emoji: "🦉",
        image_url: "/puzzles/animals-aves-0.svg",
      },
      {
        name: "PAPAGAIO",
        emoji: "🦜",
        image_url: "/puzzles/animals-aves-1.svg",
      },
      {
        name: "PINGUIM",
        emoji: "🐧",
        image_url: "/puzzles/animals-aves-2.svg",
      },
    ],
  },
  {
    id: "figuras-animals-pets",
    title: "Amigos de casa",
    category: "animals",
    items: [
      {
        name: "GATO",
        emoji: "🐱",
        image_url: "/puzzles/animals-pets-0.svg",
      },
      {
        name: "COELHO",
        emoji: "🐰",
        image_url: "/puzzles/animals-pets-1.svg",
      },
      {
        name: "HAMSTER",
        emoji: "🐹",
        image_url: "/puzzles/animals-pets-2.svg",
      },
    ],
  },
  {
    id: "figuras-animals-savana",
    title: "Passeio na savana",
    category: "animals",
    items: [
      {
        name: "ZEBRA",
        emoji: "🦓",
        image_url: "/puzzles/animals-savana-0.svg",
      },
      {
        name: "GIRAFA",
        emoji: "🦒",
        image_url: "/puzzles/animals-savana-1.svg",
      },
      {
        name: "ELEFANTE",
        emoji: "🐘",
        image_url: "/puzzles/animals-savana-2.svg",
      },
    ],
  },
  {
    id: "figuras-animals-lago",
    title: "Vida no lago",
    category: "animals",
    items: [
      {
        name: "SAPO",
        emoji: "🐸",
        image_url: "/puzzles/animals-lago-0.svg",
      },
      {
        name: "TARTARUGA",
        emoji: "🐢",
        image_url: "/puzzles/animals-lago-1.svg",
      },
      {
        name: "PATO",
        emoji: "🦆",
        image_url: "/puzzles/animals-lago-2.svg",
      },
    ],
  },
  {
    id: "figuras-animals-pequenos",
    title: "Pequenos exploradores",
    category: "animals",
    items: [
      {
        name: "JOANINHA",
        emoji: "🐞",
        image_url: "/puzzles/animals-pequenos-0.svg",
      },
      {
        name: "FORMIGA",
        emoji: "🐜",
        image_url: "/puzzles/animals-pequenos-1.svg",
      },
      {
        name: "GRILO",
        emoji: "🦗",
        image_url: "/puzzles/animals-pequenos-2.svg",
      },
    ],
  },
  {
    id: "figuras-foods-fruteira",
    title: "A fruteira colorida",
    category: "foods",
    items: [
      {
        name: "MAÇÃ",
        emoji: "🍎",
        image_url: "/puzzles/foods-fruteira-0.svg",
      },
      {
        name: "BANANA",
        emoji: "🍌",
        image_url: "/puzzles/foods-fruteira-1.svg",
      },
      {
        name: "UVA",
        emoji: "🍇",
        image_url: "/puzzles/foods-fruteira-2.svg",
      },
    ],
  },
  {
    id: "figuras-foods-almoco",
    title: "Vamos almoçar?",
    category: "foods",
    items: [
      {
        name: "ARROZ",
        emoji: "🍚",
        image_url: "/puzzles/foods-almoco-0.svg",
      },
      {
        name: "FRANGO",
        emoji: "🍗",
        image_url: "/puzzles/foods-almoco-1.svg",
      },
      {
        name: "SALADA",
        emoji: "🥗",
        image_url: "/puzzles/foods-almoco-2.svg",
      },
    ],
  },
  {
    id: "figuras-foods-legumes",
    title: "Cesta de legumes",
    category: "foods",
    items: [
      {
        name: "CENOURA",
        emoji: "🥕",
        image_url: "/puzzles/foods-legumes-0.svg",
      },
      {
        name: "MILHO",
        emoji: "🌽",
        image_url: "/puzzles/foods-legumes-1.svg",
      },
      {
        name: "BRÓCOLIS",
        emoji: "🥦",
        image_url: "/puzzles/foods-legumes-2.svg",
      },
    ],
  },
  {
    id: "figuras-foods-lanche",
    title: "Lanche da tarde",
    category: "foods",
    items: [
      {
        name: "PÃO",
        emoji: "🍞",
        image_url: "/puzzles/foods-lanche-0.svg",
      },
      {
        name: "QUEIJO",
        emoji: "🧀",
        image_url: "/puzzles/foods-lanche-1.svg",
      },
      {
        name: "OVO",
        emoji: "🥚",
        image_url: "/puzzles/foods-lanche-2.svg",
      },
    ],
  },
  {
    id: "figuras-foods-pomar",
    title: "Passeio no pomar",
    category: "foods",
    items: [
      {
        name: "PERA",
        emoji: "🍐",
        image_url: "/puzzles/foods-pomar-0.svg",
      },
      {
        name: "LARANJA",
        emoji: "🍊",
        image_url: "/puzzles/foods-pomar-1.svg",
      },
      {
        name: "PÊSSEGO",
        emoji: "🍑",
        image_url: "/puzzles/foods-pomar-2.svg",
      },
    ],
  },
  {
    id: "figuras-foods-verdes",
    title: "Verdinhos no prato",
    category: "foods",
    items: [
      {
        name: "PEPINO",
        emoji: "🥒",
        image_url: "/puzzles/foods-verdes-0.svg",
      },
      {
        name: "ALFACE",
        emoji: "🥬",
        image_url: "/puzzles/foods-verdes-1.svg",
      },
      {
        name: "ERVILHA",
        emoji: "🫛",
        image_url: "/puzzles/foods-verdes-2.svg",
      },
    ],
  },
  {
    id: "figuras-foods-redondas",
    title: "Frutinhas redondas",
    category: "foods",
    items: [
      {
        name: "MELANCIA",
        emoji: "🍉",
        image_url: "/puzzles/foods-redondas-0.svg",
      },
      {
        name: "MELÃO",
        emoji: "🍈",
        image_url: "/puzzles/foods-redondas-1.svg",
      },
      {
        name: "CEREJA",
        emoji: "🍒",
        image_url: "/puzzles/foods-redondas-2.svg",
      },
    ],
  },
  {
    id: "figuras-foods-tigelas",
    title: "Comida na tigela",
    category: "foods",
    items: [
      {
        name: "SOPA",
        emoji: "🍲",
        image_url: "/puzzles/foods-tigelas-0.svg",
      },
      {
        name: "MACARRÃO",
        emoji: "🍝",
        image_url: "/puzzles/foods-tigelas-1.svg",
      },
      {
        name: "BATATA",
        emoji: "🥔",
        image_url: "/puzzles/foods-tigelas-2.svg",
      },
    ],
  },
  {
    id: "figuras-foods-tropicais",
    title: "Sabores tropicais",
    category: "foods",
    items: [
      {
        name: "ABACAXI",
        emoji: "🍍",
        image_url: "/puzzles/foods-tropicais-0.svg",
      },
      {
        name: "MANGA",
        emoji: "🥭",
        image_url: "/puzzles/foods-tropicais-1.svg",
      },
      {
        name: "COCO",
        emoji: "🥥",
        image_url: "/puzzles/foods-tropicais-2.svg",
      },
    ],
  },
  {
    id: "figuras-objects-brinquedos",
    title: "Caixa de brinquedos",
    category: "objects",
    items: [
      {
        name: "BOLA",
        emoji: "⚽",
        image_url: "/puzzles/objects-brinquedos-0.svg",
      },
      {
        name: "URSO DE PELÚCIA",
        emoji: "🧸",
        image_url: "/puzzles/objects-brinquedos-1.svg",
      },
      {
        name: "PIPA",
        emoji: "🪁",
        image_url: "/puzzles/objects-brinquedos-2.svg",
      },
    ],
  },
  {
    id: "figuras-objects-escola",
    title: "Minha mochila",
    category: "objects",
    items: [
      {
        name: "LÁPIS",
        emoji: "✏️",
        image_url: "/puzzles/objects-escola-0.svg",
      },
      {
        name: "LIVRO",
        emoji: "📚",
        image_url: "/puzzles/objects-escola-1.svg",
      },
      {
        name: "MOCHILA",
        emoji: "🎒",
        image_url: "/puzzles/objects-escola-2.svg",
      },
    ],
  },
  {
    id: "figuras-objects-cozinha",
    title: "Objetos da cozinha",
    category: "objects",
    items: [
      {
        name: "COLHER",
        emoji: "🥄",
        image_url: "/puzzles/objects-cozinha-0.svg",
      },
      {
        name: "PRATO",
        emoji: "🍽️",
        image_url: "/puzzles/objects-cozinha-1.svg",
      },
      {
        name: "COPO",
        emoji: "🥛",
        image_url: "/puzzles/objects-cozinha-2.svg",
      },
    ],
  },
  {
    id: "figuras-objects-roupinhas",
    title: "Vamos nos vestir?",
    category: "objects",
    items: [
      {
        name: "CAMISETA",
        emoji: "👕",
        image_url: "/puzzles/objects-roupinhas-0.svg",
      },
      {
        name: "CALÇA",
        emoji: "👖",
        image_url: "/puzzles/objects-roupinhas-1.svg",
      },
      {
        name: "VESTIDO",
        emoji: "👗",
        image_url: "/puzzles/objects-roupinhas-2.svg",
      },
    ],
  },
  {
    id: "figuras-objects-banheiro",
    title: "Hora do cuidado",
    category: "objects",
    items: [
      {
        name: "ESCOVA DE DENTES",
        emoji: "🪥",
        image_url: "/puzzles/objects-banheiro-0.svg",
      },
      {
        name: "SABÃO",
        emoji: "🧼",
        image_url: "/puzzles/objects-banheiro-1.svg",
      },
      {
        name: "ESPONJA",
        emoji: "🧽",
        image_url: "/puzzles/objects-banheiro-2.svg",
      },
    ],
  },
  {
    id: "figuras-objects-quarto",
    title: "Meu quarto",
    category: "objects",
    items: [
      {
        name: "CAMA",
        emoji: "🛏️",
        image_url: "/puzzles/objects-quarto-0.svg",
      },
      {
        name: "CADEIRA",
        emoji: "🪑",
        image_url: "/puzzles/objects-quarto-1.svg",
      },
      {
        name: "LUMINÁRIA",
        emoji: "💡",
        image_url: "/puzzles/objects-quarto-2.svg",
      },
    ],
  },
  {
    id: "figuras-objects-musica",
    title: "Vamos fazer música?",
    category: "objects",
    items: [
      {
        name: "TAMBOR",
        emoji: "🥁",
        image_url: "/puzzles/objects-musica-0.svg",
      },
      {
        name: "VIOLÃO",
        emoji: "🎸",
        image_url: "/puzzles/objects-musica-1.svg",
      },
      {
        name: "PIANO",
        emoji: "🎹",
        image_url: "/puzzles/objects-musica-2.svg",
      },
    ],
  },
  {
    id: "figuras-objects-acessorios",
    title: "Prontos para sair",
    category: "objects",
    items: [
      {
        name: "BONÉ",
        emoji: "🧢",
        image_url: "/puzzles/objects-acessorios-0.svg",
      },
      {
        name: "SAPATO",
        emoji: "👟",
        image_url: "/puzzles/objects-acessorios-1.svg",
      },
      {
        name: "ÓCULOS",
        emoji: "👓",
        image_url: "/puzzles/objects-acessorios-2.svg",
      },
    ],
  },
  {
    id: "figuras-objects-casinha",
    title: "Coisas da casinha",
    category: "objects",
    items: [
      {
        name: "PORTA",
        emoji: "🚪",
        image_url: "/puzzles/objects-casinha-0.svg",
      },
      {
        name: "CHAVE",
        emoji: "🔑",
        image_url: "/puzzles/objects-casinha-1.svg",
      },
      {
        name: "RELÓGIO",
        emoji: "⏰",
        image_url: "/puzzles/objects-casinha-2.svg",
      },
    ],
  },
  {
    id: "figuras-colors-quadrados",
    title: "Quadrados coloridos",
    category: "colors",
    items: [
      {
        name: "VERMELHO",
        emoji: "🟥",
        image_url: "/puzzles/colors-quadrados-0.svg",
      },
      {
        name: "AZUL",
        emoji: "🟦",
        image_url: "/puzzles/colors-quadrados-1.svg",
      },
      {
        name: "AMARELO",
        emoji: "🟨",
        image_url: "/puzzles/colors-quadrados-2.svg",
      },
    ],
  },
  {
    id: "figuras-colors-coracoes",
    title: "Corações coloridos",
    category: "colors",
    items: [
      {
        name: "VERDE",
        emoji: "💚",
        image_url: "/puzzles/colors-coracoes-0.svg",
      },
      {
        name: "ROXO",
        emoji: "💜",
        image_url: "/puzzles/colors-coracoes-1.svg",
      },
      {
        name: "LARANJA",
        emoji: "🧡",
        image_url: "/puzzles/colors-coracoes-2.svg",
      },
    ],
  },
  {
    id: "figuras-colors-circulos",
    title: "Bolinhas coloridas",
    category: "colors",
    items: [
      {
        name: "AZUL",
        emoji: "🔵",
        image_url: "/puzzles/colors-circulos-0.svg",
      },
      {
        name: "VERMELHO",
        emoji: "🔴",
        image_url: "/puzzles/colors-circulos-1.svg",
      },
      {
        name: "VERDE",
        emoji: "🟢",
        image_url: "/puzzles/colors-circulos-2.svg",
      },
    ],
  },
  {
    id: "figuras-colors-frutascores",
    title: "As cores das frutas",
    category: "colors",
    items: [
      {
        name: "MAÇÃ VERMELHA",
        emoji: "🍎",
        image_url: "/puzzles/colors-frutascores-0.svg",
      },
      {
        name: "BANANA AMARELA",
        emoji: "🍌",
        image_url: "/puzzles/colors-frutascores-1.svg",
      },
      {
        name: "UVA ROXA",
        emoji: "🍇",
        image_url: "/puzzles/colors-frutascores-2.svg",
      },
    ],
  },
  {
    id: "figuras-colors-vegetaiscores",
    title: "As cores da horta",
    category: "colors",
    items: [
      {
        name: "CENOURA LARANJA",
        emoji: "🥕",
        image_url: "/puzzles/colors-vegetaiscores-0.svg",
      },
      {
        name: "BRÓCOLIS VERDE",
        emoji: "🥦",
        image_url: "/puzzles/colors-vegetaiscores-1.svg",
      },
      {
        name: "MILHO AMARELO",
        emoji: "🌽",
        image_url: "/puzzles/colors-vegetaiscores-2.svg",
      },
    ],
  },
  {
    id: "figuras-colors-quadradosnovos",
    title: "Mais quadrados coloridos",
    category: "colors",
    items: [
      {
        name: "ROXO",
        emoji: "🟪",
        image_url: "/puzzles/colors-quadradosnovos-0.svg",
      },
      {
        name: "LARANJA",
        emoji: "🟧",
        image_url: "/puzzles/colors-quadradosnovos-1.svg",
      },
      {
        name: "MARROM",
        emoji: "🟫",
        image_url: "/puzzles/colors-quadradosnovos-2.svg",
      },
    ],
  },
  {
    id: "figuras-colors-coracoesnovos",
    title: "Cores para compartilhar",
    category: "colors",
    items: [
      {
        name: "ROSA",
        emoji: "🩷",
        image_url: "/puzzles/colors-coracoesnovos-0.svg",
      },
      {
        name: "AZUL CLARO",
        emoji: "🩵",
        image_url: "/puzzles/colors-coracoesnovos-1.svg",
      },
      {
        name: "BRANCO",
        emoji: "🤍",
        image_url: "/puzzles/colors-coracoesnovos-2.svg",
      },
    ],
  },
  {
    id: "figuras-colors-bolinhasnovas",
    title: "Mais bolinhas coloridas",
    category: "colors",
    items: [
      {
        name: "AMARELO",
        emoji: "🟡",
        image_url: "/puzzles/colors-bolinhasnovas-0.svg",
      },
      {
        name: "ROXO",
        emoji: "🟣",
        image_url: "/puzzles/colors-bolinhasnovas-1.svg",
      },
      {
        name: "LARANJA",
        emoji: "🟠",
        image_url: "/puzzles/colors-bolinhasnovas-2.svg",
      },
    ],
  },
  {
    id: "figuras-colors-claroseescuros",
    title: "Claro e escuro",
    category: "colors",
    items: [
      {
        name: "PRETO",
        emoji: "⚫",
        image_url: "/puzzles/colors-claroseescuros-0.svg",
      },
      {
        name: "BRANCO",
        emoji: "⚪",
        image_url: "/puzzles/colors-claroseescuros-1.svg",
      },
      {
        name: "MARROM",
        emoji: "🟤",
        image_url: "/puzzles/colors-claroseescuros-2.svg",
      },
    ],
  },
  {
    id: "figuras-emotions-carinhas",
    title: "Como está a carinha?",
    category: "emotions",
    items: [
      {
        name: "FELIZ",
        emoji: "😊",
        image_url: "/puzzles/emotions-carinhas-0.svg",
      },
      {
        name: "TRISTE",
        emoji: "😢",
        image_url: "/puzzles/emotions-carinhas-1.svg",
      },
      {
        name: "BRAVO",
        emoji: "😠",
        image_url: "/puzzles/emotions-carinhas-2.svg",
      },
    ],
  },
  {
    id: "figuras-emotions-surpresas",
    title: "Uma surpresa no rosto",
    category: "emotions",
    items: [
      {
        name: "SURPRESO",
        emoji: "😮",
        image_url: "/puzzles/emotions-surpresas-0.svg",
      },
      {
        name: "ASSUSTADO",
        emoji: "😨",
        image_url: "/puzzles/emotions-surpresas-1.svg",
      },
      {
        name: "TRANQUILO",
        emoji: "😌",
        image_url: "/puzzles/emotions-surpresas-2.svg",
      },
    ],
  },
  {
    id: "figuras-emotions-sono",
    title: "O corpo pede descanso",
    category: "emotions",
    items: [
      {
        name: "COM SONO",
        emoji: "🥱",
        image_url: "/puzzles/emotions-sono-0.svg",
      },
      {
        name: "DORMINDO",
        emoji: "😴",
        image_url: "/puzzles/emotions-sono-1.svg",
      },
      {
        name: "ACORDADO",
        emoji: "🙂",
        image_url: "/puzzles/emotions-sono-2.svg",
      },
    ],
  },
  {
    id: "figuras-emotions-risadas",
    title: "Hora de dar risada",
    category: "emotions",
    items: [
      {
        name: "RINDO",
        emoji: "😄",
        image_url: "/puzzles/emotions-risadas-0.svg",
      },
      {
        name: "CHORANDO",
        emoji: "😭",
        image_url: "/puzzles/emotions-risadas-1.svg",
      },
      {
        name: "SORRINDO",
        emoji: "😀",
        image_url: "/puzzles/emotions-risadas-2.svg",
      },
    ],
  },
  {
    id: "figuras-emotions-carinho",
    title: "Carinhas de carinho",
    category: "emotions",
    items: [
      {
        name: "MANDANDO BEIJO",
        emoji: "😘",
        image_url: "/puzzles/emotions-carinho-0.svg",
      },
      {
        name: "ABRAÇANDO",
        emoji: "🤗",
        image_url: "/puzzles/emotions-carinho-1.svg",
      },
      {
        name: "ENCANTADO",
        emoji: "😍",
        image_url: "/puzzles/emotions-carinho-2.svg",
      },
    ],
  },
  {
    id: "figuras-emotions-curiosos",
    title: "Carinhas curiosas",
    category: "emotions",
    items: [
      {
        name: "PENSATIVO",
        emoji: "🤔",
        image_url: "/puzzles/emotions-curiosos-0.svg",
      },
      {
        name: "CURIOSO",
        emoji: "🧐",
        image_url: "/puzzles/emotions-curiosos-1.svg",
      },
      {
        name: "CONFUSO",
        emoji: "😕",
        image_url: "/puzzles/emotions-curiosos-2.svg",
      },
    ],
  },
  {
    id: "figuras-emotions-animados",
    title: "Muita animação",
    category: "emotions",
    items: [
      {
        name: "EMPOLGADO",
        emoji: "🤩",
        image_url: "/puzzles/emotions-animados-0.svg",
      },
      {
        name: "FESTEJANDO",
        emoji: "🥳",
        image_url: "/puzzles/emotions-animados-1.svg",
      },
      {
        name: "SATISFEITO",
        emoji: "😋",
        image_url: "/puzzles/emotions-animados-2.svg",
      },
    ],
  },
  {
    id: "figuras-emotions-cansados",
    title: "Precisando de uma pausa",
    category: "emotions",
    items: [
      {
        name: "CANSADO",
        emoji: "😩",
        image_url: "/puzzles/emotions-cansados-0.svg",
      },
      {
        name: "PREOCUPADO",
        emoji: "😟",
        image_url: "/puzzles/emotions-cansados-1.svg",
      },
      {
        name: "ALIVIADO",
        emoji: "😮‍💨",
        image_url: "/puzzles/emotions-cansados-2.svg",
      },
    ],
  },
  {
    id: "figuras-emotions-timidez",
    title: "Jeitos de se expressar",
    category: "emotions",
    items: [
      {
        name: "TÍMIDO",
        emoji: "🫣",
        image_url: "/puzzles/emotions-timidez-0.svg",
      },
      {
        name: "COM VERGONHA",
        emoji: "😳",
        image_url: "/puzzles/emotions-timidez-1.svg",
      },
      {
        name: "PISCANDO",
        emoji: "😉",
        image_url: "/puzzles/emotions-timidez-2.svg",
      },
    ],
  },
  {
    id: "figuras-transports-rua",
    title: "Passeio pela rua",
    category: "transports",
    items: [
      {
        name: "CARRO",
        emoji: "🚗",
        image_url: "/puzzles/transports-rua-0.svg",
      },
      {
        name: "ÔNIBUS",
        emoji: "🚌",
        image_url: "/puzzles/transports-rua-1.svg",
      },
      {
        name: "BICICLETA",
        emoji: "🚲",
        image_url: "/puzzles/transports-rua-2.svg",
      },
    ],
  },
  {
    id: "figuras-transports-ajuda",
    title: "Veículos que ajudam",
    category: "transports",
    items: [
      {
        name: "AMBULÂNCIA",
        emoji: "🚑",
        image_url: "/puzzles/transports-ajuda-0.svg",
      },
      {
        name: "CARRO DE POLÍCIA",
        emoji: "🚓",
        image_url: "/puzzles/transports-ajuda-1.svg",
      },
      {
        name: "CAMINHÃO DE BOMBEIROS",
        emoji: "🚒",
        image_url: "/puzzles/transports-ajuda-2.svg",
      },
    ],
  },
  {
    id: "figuras-transports-agua",
    title: "Passeio na água",
    category: "transports",
    items: [
      {
        name: "BARCO",
        emoji: "⛵",
        image_url: "/puzzles/transports-agua-0.svg",
      },
      {
        name: "CANOA",
        emoji: "🛶",
        image_url: "/puzzles/transports-agua-1.svg",
      },
      {
        name: "NAVIO",
        emoji: "🚢",
        image_url: "/puzzles/transports-agua-2.svg",
      },
    ],
  },
  {
    id: "figuras-transports-ceu",
    title: "Viagem pelo céu",
    category: "transports",
    items: [
      {
        name: "AVIÃO",
        emoji: "✈️",
        image_url: "/puzzles/transports-ceu-0.svg",
      },
      {
        name: "HELICÓPTERO",
        emoji: "🚁",
        image_url: "/puzzles/transports-ceu-1.svg",
      },
      {
        name: "FOGUETE",
        emoji: "🚀",
        image_url: "/puzzles/transports-ceu-2.svg",
      },
    ],
  },
  {
    id: "figuras-transports-trabalho",
    title: "Veículos do trabalho",
    category: "transports",
    items: [
      {
        name: "TRATOR",
        emoji: "🚜",
        image_url: "/puzzles/transports-trabalho-0.svg",
      },
      {
        name: "CAMINHÃO",
        emoji: "🚚",
        image_url: "/puzzles/transports-trabalho-1.svg",
      },
      {
        name: "CAMINHONETE",
        emoji: "🛻",
        image_url: "/puzzles/transports-trabalho-2.svg",
      },
    ],
  },
  {
    id: "figuras-transports-rodinhas",
    title: "Brincando sobre rodas",
    category: "transports",
    items: [
      {
        name: "PATINETE",
        emoji: "🛴",
        image_url: "/puzzles/transports-rodinhas-0.svg",
      },
      {
        name: "SKATE",
        emoji: "🛹",
        image_url: "/puzzles/transports-rodinhas-1.svg",
      },
      {
        name: "PATINS",
        emoji: "🛼",
        image_url: "/puzzles/transports-rodinhas-2.svg",
      },
    ],
  },
  {
    id: "figuras-transports-trilhos",
    title: "Passeio nos trilhos",
    category: "transports",
    items: [
      {
        name: "TREM",
        emoji: "🚂",
        image_url: "/puzzles/transports-trilhos-0.svg",
      },
      {
        name: "METRÔ",
        emoji: "🚇",
        image_url: "/puzzles/transports-trilhos-1.svg",
      },
      {
        name: "BONDE",
        emoji: "🚋",
        image_url: "/puzzles/transports-trilhos-2.svg",
      },
    ],
  },
  {
    id: "figuras-transports-cidade",
    title: "Movimento na cidade",
    category: "transports",
    items: [
      {
        name: "TÁXI",
        emoji: "🚕",
        image_url: "/puzzles/transports-cidade-0.svg",
      },
      {
        name: "MOTO",
        emoji: "🏍️",
        image_url: "/puzzles/transports-cidade-1.svg",
      },
      {
        name: "VAN",
        emoji: "🚐",
        image_url: "/puzzles/transports-cidade-2.svg",
      },
    ],
  },
  {
    id: "figuras-transports-viagens",
    title: "Novos caminhos",
    category: "transports",
    items: [
      {
        name: "LANCHA",
        emoji: "🚤",
        image_url: "/puzzles/transports-viagens-0.svg",
      },
      {
        name: "TELEFÉRICO",
        emoji: "🚠",
        image_url: "/puzzles/transports-viagens-1.svg",
      },
      {
        name: "TREM RÁPIDO",
        emoji: "🚄",
        image_url: "/puzzles/transports-viagens-2.svg",
      },
    ],
  },
  {
    id: "figuras-actions-movimento",
    title: "Vamos nos movimentar?",
    category: "actions",
    items: [
      {
        name: "CORRER",
        emoji: "🏃",
        image_url: "/puzzles/actions-movimento-0.svg",
      },
      {
        name: "ANDAR",
        emoji: "🚶",
        image_url: "/puzzles/actions-movimento-1.svg",
      },
      {
        name: "NADAR",
        emoji: "🏊",
        image_url: "/puzzles/actions-movimento-2.svg",
      },
    ],
  },
  {
    id: "figuras-actions-maos",
    title: "O que as mãos fazem?",
    category: "actions",
    items: [
      {
        name: "BATER PALMAS",
        emoji: "👏",
        image_url: "/puzzles/actions-maos-0.svg",
      },
      {
        name: "DAR TCHAU",
        emoji: "👋",
        image_url: "/puzzles/actions-maos-1.svg",
      },
      {
        name: "ACENAR COM AS DUAS MÃOS",
        emoji: "🙌",
        image_url: "/puzzles/actions-maos-2.svg",
      },
    ],
  },
  {
    id: "figuras-actions-rotina",
    title: "Ações da rotina",
    category: "actions",
    items: [
      {
        name: "DORMIR",
        emoji: "😴",
        image_url: "/puzzles/actions-rotina-0.svg",
      },
      {
        name: "TOMAR BANHO",
        emoji: "🛀",
        image_url: "/puzzles/actions-rotina-1.svg",
      },
      {
        name: "ESCOVAR OS DENTES",
        emoji: "🪥",
        image_url: "/puzzles/actions-rotina-2.svg",
      },
    ],
  },
  {
    id: "figuras-actions-brincar",
    title: "Brincadeiras com o corpo",
    category: "actions",
    items: [
      {
        name: "DANÇAR",
        emoji: "💃",
        image_url: "/puzzles/actions-brincar-0.svg",
      },
      {
        name: "PEDALAR",
        emoji: "🚴",
        image_url: "/puzzles/actions-brincar-1.svg",
      },
      {
        name: "JOGAR BOLA",
        emoji: "⛹️",
        image_url: "/puzzles/actions-brincar-2.svg",
      },
    ],
  },
  {
    id: "figuras-actions-cuidar",
    title: "Cuidando da casa",
    category: "actions",
    items: [
      {
        name: "VARRER",
        emoji: "🧹",
        image_url: "/puzzles/actions-cuidar-0.svg",
      },
      {
        name: "REGAR",
        emoji: "🚿",
        image_url: "/puzzles/actions-cuidar-1.svg",
      },
      {
        name: "COZINHAR",
        emoji: "🧑‍🍳",
        image_url: "/puzzles/actions-cuidar-2.svg",
      },
    ],
  },
  {
    id: "figuras-actions-expressar",
    title: "Meu rosto se movimenta",
    category: "actions",
    items: [
      {
        name: "SORRIR",
        emoji: "😀",
        image_url: "/puzzles/actions-expressar-0.svg",
      },
      {
        name: "CHORAR",
        emoji: "😢",
        image_url: "/puzzles/actions-expressar-1.svg",
      },
      {
        name: "PISCAR",
        emoji: "😉",
        image_url: "/puzzles/actions-expressar-2.svg",
      },
    ],
  },
  {
    id: "figuras-actions-passeio",
    title: "Passeando e brincando",
    category: "actions",
    items: [
      {
        name: "ESCALAR",
        emoji: "🧗",
        image_url: "/puzzles/actions-passeio-0.svg",
      },
      {
        name: "REMAR",
        emoji: "🚣",
        image_url: "/puzzles/actions-passeio-1.svg",
      },
      {
        name: "SURFAR",
        emoji: "🏄",
        image_url: "/puzzles/actions-passeio-2.svg",
      },
    ],
  },
  {
    id: "figuras-actions-ouvir",
    title: "Descobrir com o corpo",
    category: "actions",
    items: [
      {
        name: "OUVIR",
        emoji: "👂",
        image_url: "/puzzles/actions-ouvir-0.svg",
      },
      {
        name: "OLHAR",
        emoji: "👀",
        image_url: "/puzzles/actions-ouvir-1.svg",
      },
      {
        name: "FALAR",
        emoji: "🗣️",
        image_url: "/puzzles/actions-ouvir-2.svg",
      },
    ],
  },
  {
    id: "figuras-actions-relaxar",
    title: "Ações para relaxar",
    category: "actions",
    items: [
      {
        name: "RESPIRAR",
        emoji: "🌬️",
        image_url: "/puzzles/actions-relaxar-0.svg",
      },
      {
        name: "ABRAÇAR",
        emoji: "🤗",
        image_url: "/puzzles/actions-relaxar-1.svg",
      },
      {
        name: "DESCANSAR",
        emoji: "🧘",
        image_url: "/puzzles/actions-relaxar-2.svg",
      },
    ],
  },
  {
    id: "figuras-nature-jardim",
    title: "Meu pequeno jardim",
    category: "nature",
    items: [
      {
        name: "FLOR",
        emoji: "🌻",
        image_url: "/puzzles/nature-jardim-0.svg",
      },
      {
        name: "ÁRVORE",
        emoji: "🌳",
        image_url: "/puzzles/nature-jardim-1.svg",
      },
      {
        name: "FOLHA",
        emoji: "🍃",
        image_url: "/puzzles/nature-jardim-2.svg",
      },
    ],
  },
  {
    id: "figuras-nature-tempo",
    title: "O tempo lá fora",
    category: "nature",
    items: [
      {
        name: "SOL",
        emoji: "☀️",
        image_url: "/puzzles/nature-tempo-0.svg",
      },
      {
        name: "CHUVA",
        emoji: "🌧️",
        image_url: "/puzzles/nature-tempo-1.svg",
      },
      {
        name: "NUVEM",
        emoji: "☁️",
        image_url: "/puzzles/nature-tempo-2.svg",
      },
    ],
  },
  {
    id: "figuras-nature-noite",
    title: "O céu da noite",
    category: "nature",
    items: [
      {
        name: "LUA",
        emoji: "🌙",
        image_url: "/puzzles/nature-noite-0.svg",
      },
      {
        name: "ESTRELA",
        emoji: "⭐",
        image_url: "/puzzles/nature-noite-1.svg",
      },
      {
        name: "PLANETA",
        emoji: "🪐",
        image_url: "/puzzles/nature-noite-2.svg",
      },
    ],
  },
  {
    id: "figuras-nature-agua",
    title: "Lugares com água",
    category: "nature",
    items: [
      {
        name: "MAR",
        emoji: "🌊",
        image_url: "/puzzles/nature-agua-0.svg",
      },
      {
        name: "PRAIA",
        emoji: "🏖️",
        image_url: "/puzzles/nature-agua-1.svg",
      },
      {
        name: "GELO",
        emoji: "🧊",
        image_url: "/puzzles/nature-agua-2.svg",
      },
    ],
  },
  {
    id: "figuras-nature-plantas",
    title: "Plantas diferentes",
    category: "nature",
    items: [
      {
        name: "CACTO",
        emoji: "🌵",
        image_url: "/puzzles/nature-plantas-0.svg",
      },
      {
        name: "PALMEIRA",
        emoji: "🌴",
        image_url: "/puzzles/nature-plantas-1.svg",
      },
      {
        name: "PINHEIRO",
        emoji: "🌲",
        image_url: "/puzzles/nature-plantas-2.svg",
      },
    ],
  },
  {
    id: "figuras-nature-flores",
    title: "Um jardim de flores",
    category: "nature",
    items: [
      {
        name: "ROSA",
        emoji: "🌹",
        image_url: "/puzzles/nature-flores-0.svg",
      },
      {
        name: "TULIPA",
        emoji: "🌷",
        image_url: "/puzzles/nature-flores-1.svg",
      },
      {
        name: "HIBISCO",
        emoji: "🌺",
        image_url: "/puzzles/nature-flores-2.svg",
      },
    ],
  },
  {
    id: "figuras-nature-paisagens",
    title: "Explorando paisagens",
    category: "nature",
    items: [
      {
        name: "MONTANHA",
        emoji: "⛰️",
        image_url: "/puzzles/nature-paisagens-0.svg",
      },
      {
        name: "ILHA",
        emoji: "🏝️",
        image_url: "/puzzles/nature-paisagens-1.svg",
      },
      {
        name: "VULCÃO",
        emoji: "🌋",
        image_url: "/puzzles/nature-paisagens-2.svg",
      },
    ],
  },
  {
    id: "figuras-nature-ceucores",
    title: "Cores no céu",
    category: "nature",
    items: [
      {
        name: "ARCO-ÍRIS",
        emoji: "🌈",
        image_url: "/puzzles/nature-ceucores-0.svg",
      },
      {
        name: "RELÂMPAGO",
        emoji: "⚡",
        image_url: "/puzzles/nature-ceucores-1.svg",
      },
      {
        name: "NEVE",
        emoji: "❄️",
        image_url: "/puzzles/nature-ceucores-2.svg",
      },
    ],
  },
  {
    id: "figuras-nature-sementes",
    title: "Da semente à planta",
    category: "nature",
    items: [
      {
        name: "BROTO",
        emoji: "🌱",
        image_url: "/puzzles/nature-sementes-0.svg",
      },
      {
        name: "TRIGO",
        emoji: "🌾",
        image_url: "/puzzles/nature-sementes-1.svg",
      },
      {
        name: "TREVO",
        emoji: "☘️",
        image_url: "/puzzles/nature-sementes-2.svg",
      },
    ],
  },
];
const puzzles = [
  {
    id: "quebra-cabeca-animals-fazenda",
    items: [
      {
        name: "VACA",
        emoji: "🐮",
        image_url: "/puzzles/animals-fazenda-0.svg",
      },
      {
        name: "PORCO",
        emoji: "🐷",
        image_url: "/puzzles/animals-fazenda-1.svg",
      },
      {
        name: "GALINHA",
        emoji: "🐔",
        image_url: "/puzzles/animals-fazenda-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-animals-mata",
    items: [
      {
        name: "MACACO",
        emoji: "🐒",
        image_url: "/puzzles/animals-mata-0.svg",
      },
      {
        name: "TIGRE",
        emoji: "🐯",
        image_url: "/puzzles/animals-mata-1.svg",
      },
      {
        name: "URSO",
        emoji: "🐻",
        image_url: "/puzzles/animals-mata-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-animals-mar",
    items: [
      {
        name: "POLVO",
        emoji: "🐙",
        image_url: "/puzzles/animals-mar-0.svg",
      },
      {
        name: "GOLFINHO",
        emoji: "🐬",
        image_url: "/puzzles/animals-mar-1.svg",
      },
      {
        name: "BALEIA",
        emoji: "🐳",
        image_url: "/puzzles/animals-mar-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-foods-fruteira",
    items: [
      {
        name: "MAÇÃ",
        emoji: "🍎",
        image_url: "/puzzles/foods-fruteira-0.svg",
      },
      {
        name: "BANANA",
        emoji: "🍌",
        image_url: "/puzzles/foods-fruteira-1.svg",
      },
      {
        name: "UVA",
        emoji: "🍇",
        image_url: "/puzzles/foods-fruteira-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-foods-almoco",
    items: [
      {
        name: "ARROZ",
        emoji: "🍚",
        image_url: "/puzzles/foods-almoco-0.svg",
      },
      {
        name: "FRANGO",
        emoji: "🍗",
        image_url: "/puzzles/foods-almoco-1.svg",
      },
      {
        name: "SALADA",
        emoji: "🥗",
        image_url: "/puzzles/foods-almoco-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-foods-legumes",
    items: [
      {
        name: "CENOURA",
        emoji: "🥕",
        image_url: "/puzzles/foods-legumes-0.svg",
      },
      {
        name: "MILHO",
        emoji: "🌽",
        image_url: "/puzzles/foods-legumes-1.svg",
      },
      {
        name: "BRÓCOLIS",
        emoji: "🥦",
        image_url: "/puzzles/foods-legumes-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-objects-brinquedos",
    items: [
      {
        name: "BOLA",
        emoji: "⚽",
        image_url: "/puzzles/objects-brinquedos-0.svg",
      },
      {
        name: "URSO DE PELÚCIA",
        emoji: "🧸",
        image_url: "/puzzles/objects-brinquedos-1.svg",
      },
      {
        name: "PIPA",
        emoji: "🪁",
        image_url: "/puzzles/objects-brinquedos-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-objects-escola",
    items: [
      {
        name: "LÁPIS",
        emoji: "✏️",
        image_url: "/puzzles/objects-escola-0.svg",
      },
      {
        name: "LIVRO",
        emoji: "📚",
        image_url: "/puzzles/objects-escola-1.svg",
      },
      {
        name: "MOCHILA",
        emoji: "🎒",
        image_url: "/puzzles/objects-escola-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-objects-cozinha",
    items: [
      {
        name: "COLHER",
        emoji: "🥄",
        image_url: "/puzzles/objects-cozinha-0.svg",
      },
      {
        name: "PRATO",
        emoji: "🍽️",
        image_url: "/puzzles/objects-cozinha-1.svg",
      },
      {
        name: "COPO",
        emoji: "🥛",
        image_url: "/puzzles/objects-cozinha-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-colors-quadrados",
    items: [
      {
        name: "VERMELHO",
        emoji: "🟥",
        image_url: "/puzzles/colors-quadrados-0.svg",
      },
      {
        name: "AZUL",
        emoji: "🟦",
        image_url: "/puzzles/colors-quadrados-1.svg",
      },
      {
        name: "AMARELO",
        emoji: "🟨",
        image_url: "/puzzles/colors-quadrados-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-colors-coracoes",
    items: [
      {
        name: "VERDE",
        emoji: "💚",
        image_url: "/puzzles/colors-coracoes-0.svg",
      },
      {
        name: "ROXO",
        emoji: "💜",
        image_url: "/puzzles/colors-coracoes-1.svg",
      },
      {
        name: "LARANJA",
        emoji: "🧡",
        image_url: "/puzzles/colors-coracoes-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-colors-circulos",
    items: [
      {
        name: "AZUL",
        emoji: "🔵",
        image_url: "/puzzles/colors-circulos-0.svg",
      },
      {
        name: "VERMELHO",
        emoji: "🔴",
        image_url: "/puzzles/colors-circulos-1.svg",
      },
      {
        name: "VERDE",
        emoji: "🟢",
        image_url: "/puzzles/colors-circulos-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-emotions-carinhas",
    items: [
      {
        name: "FELIZ",
        emoji: "😊",
        image_url: "/puzzles/emotions-carinhas-0.svg",
      },
      {
        name: "TRISTE",
        emoji: "😢",
        image_url: "/puzzles/emotions-carinhas-1.svg",
      },
      {
        name: "BRAVO",
        emoji: "😠",
        image_url: "/puzzles/emotions-carinhas-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-emotions-surpresas",
    items: [
      {
        name: "SURPRESO",
        emoji: "😮",
        image_url: "/puzzles/emotions-surpresas-0.svg",
      },
      {
        name: "ASSUSTADO",
        emoji: "😨",
        image_url: "/puzzles/emotions-surpresas-1.svg",
      },
      {
        name: "TRANQUILO",
        emoji: "😌",
        image_url: "/puzzles/emotions-surpresas-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-emotions-sono",
    items: [
      {
        name: "COM SONO",
        emoji: "🥱",
        image_url: "/puzzles/emotions-sono-0.svg",
      },
      {
        name: "DORMINDO",
        emoji: "😴",
        image_url: "/puzzles/emotions-sono-1.svg",
      },
      {
        name: "ACORDADO",
        emoji: "🙂",
        image_url: "/puzzles/emotions-sono-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-transports-rua",
    items: [
      {
        name: "CARRO",
        emoji: "🚗",
        image_url: "/puzzles/transports-rua-0.svg",
      },
      {
        name: "ÔNIBUS",
        emoji: "🚌",
        image_url: "/puzzles/transports-rua-1.svg",
      },
      {
        name: "BICICLETA",
        emoji: "🚲",
        image_url: "/puzzles/transports-rua-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-transports-ajuda",
    items: [
      {
        name: "AMBULÂNCIA",
        emoji: "🚑",
        image_url: "/puzzles/transports-ajuda-0.svg",
      },
      {
        name: "CARRO DE POLÍCIA",
        emoji: "🚓",
        image_url: "/puzzles/transports-ajuda-1.svg",
      },
      {
        name: "CAMINHÃO DE BOMBEIROS",
        emoji: "🚒",
        image_url: "/puzzles/transports-ajuda-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-transports-agua",
    items: [
      {
        name: "BARCO",
        emoji: "⛵",
        image_url: "/puzzles/transports-agua-0.svg",
      },
      {
        name: "CANOA",
        emoji: "🛶",
        image_url: "/puzzles/transports-agua-1.svg",
      },
      {
        name: "NAVIO",
        emoji: "🚢",
        image_url: "/puzzles/transports-agua-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-actions-movimento",
    items: [
      {
        name: "CORRER",
        emoji: "🏃",
        image_url: "/puzzles/actions-movimento-0.svg",
      },
      {
        name: "ANDAR",
        emoji: "🚶",
        image_url: "/puzzles/actions-movimento-1.svg",
      },
      {
        name: "NADAR",
        emoji: "🏊",
        image_url: "/puzzles/actions-movimento-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-actions-maos",
    items: [
      {
        name: "BATER PALMAS",
        emoji: "👏",
        image_url: "/puzzles/actions-maos-0.svg",
      },
      {
        name: "DAR TCHAU",
        emoji: "👋",
        image_url: "/puzzles/actions-maos-1.svg",
      },
      {
        name: "ACENAR COM AS DUAS MÃOS",
        emoji: "🙌",
        image_url: "/puzzles/actions-maos-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-actions-rotina",
    items: [
      {
        name: "DORMIR",
        emoji: "😴",
        image_url: "/puzzles/actions-rotina-0.svg",
      },
      {
        name: "TOMAR BANHO",
        emoji: "🛀",
        image_url: "/puzzles/actions-rotina-1.svg",
      },
      {
        name: "ESCOVAR OS DENTES",
        emoji: "🪥",
        image_url: "/puzzles/actions-rotina-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-nature-jardim",
    items: [
      {
        name: "FLOR",
        emoji: "🌻",
        image_url: "/puzzles/nature-jardim-0.svg",
      },
      {
        name: "ÁRVORE",
        emoji: "🌳",
        image_url: "/puzzles/nature-jardim-1.svg",
      },
      {
        name: "FOLHA",
        emoji: "🍃",
        image_url: "/puzzles/nature-jardim-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-nature-tempo",
    items: [
      {
        name: "SOL",
        emoji: "☀️",
        image_url: "/puzzles/nature-tempo-0.svg",
      },
      {
        name: "CHUVA",
        emoji: "🌧️",
        image_url: "/puzzles/nature-tempo-1.svg",
      },
      {
        name: "NUVEM",
        emoji: "☁️",
        image_url: "/puzzles/nature-tempo-2.svg",
      },
    ],
  },
  {
    id: "quebra-cabeca-nature-noite",
    items: [
      {
        name: "LUA",
        emoji: "🌙",
        image_url: "/puzzles/nature-noite-0.svg",
      },
      {
        name: "ESTRELA",
        emoji: "⭐",
        image_url: "/puzzles/nature-noite-1.svg",
      },
      {
        name: "PLANETA",
        emoji: "🪐",
        image_url: "/puzzles/nature-noite-2.svg",
      },
    ],
  },
];
const memories = [
  {
    id: "memoria-animals",
    groups: [
      [
        {
          name: "VACA",
          emoji: "🐮",
          image_url: "/puzzles/animals-fazenda-0.svg",
        },
        {
          name: "PORCO",
          emoji: "🐷",
          image_url: "/puzzles/animals-fazenda-1.svg",
        },
        {
          name: "GALINHA",
          emoji: "🐔",
          image_url: "/puzzles/animals-fazenda-2.svg",
        },
      ],
      [
        {
          name: "MACACO",
          emoji: "🐒",
          image_url: "/puzzles/animals-mata-0.svg",
        },
        {
          name: "TIGRE",
          emoji: "🐯",
          image_url: "/puzzles/animals-mata-1.svg",
        },
        {
          name: "URSO",
          emoji: "🐻",
          image_url: "/puzzles/animals-mata-2.svg",
        },
      ],
      [
        {
          name: "POLVO",
          emoji: "🐙",
          image_url: "/puzzles/animals-mar-0.svg",
        },
        {
          name: "GOLFINHO",
          emoji: "🐬",
          image_url: "/puzzles/animals-mar-1.svg",
        },
        {
          name: "BALEIA",
          emoji: "🐳",
          image_url: "/puzzles/animals-mar-2.svg",
        },
      ],
    ],
  },
  {
    id: "memoria-foods",
    groups: [
      [
        {
          name: "MAÇÃ",
          emoji: "🍎",
          image_url: "/puzzles/foods-fruteira-0.svg",
        },
        {
          name: "BANANA",
          emoji: "🍌",
          image_url: "/puzzles/foods-fruteira-1.svg",
        },
        {
          name: "UVA",
          emoji: "🍇",
          image_url: "/puzzles/foods-fruteira-2.svg",
        },
      ],
      [
        {
          name: "ARROZ",
          emoji: "🍚",
          image_url: "/puzzles/foods-almoco-0.svg",
        },
        {
          name: "FRANGO",
          emoji: "🍗",
          image_url: "/puzzles/foods-almoco-1.svg",
        },
        {
          name: "SALADA",
          emoji: "🥗",
          image_url: "/puzzles/foods-almoco-2.svg",
        },
      ],
      [
        {
          name: "CENOURA",
          emoji: "🥕",
          image_url: "/puzzles/foods-legumes-0.svg",
        },
        {
          name: "MILHO",
          emoji: "🌽",
          image_url: "/puzzles/foods-legumes-1.svg",
        },
        {
          name: "BRÓCOLIS",
          emoji: "🥦",
          image_url: "/puzzles/foods-legumes-2.svg",
        },
      ],
    ],
  },
  {
    id: "memoria-objects",
    groups: [
      [
        {
          name: "BOLA",
          emoji: "⚽",
          image_url: "/puzzles/objects-brinquedos-0.svg",
        },
        {
          name: "URSO DE PELÚCIA",
          emoji: "🧸",
          image_url: "/puzzles/objects-brinquedos-1.svg",
        },
        {
          name: "PIPA",
          emoji: "🪁",
          image_url: "/puzzles/objects-brinquedos-2.svg",
        },
      ],
      [
        {
          name: "LÁPIS",
          emoji: "✏️",
          image_url: "/puzzles/objects-escola-0.svg",
        },
        {
          name: "LIVRO",
          emoji: "📚",
          image_url: "/puzzles/objects-escola-1.svg",
        },
        {
          name: "MOCHILA",
          emoji: "🎒",
          image_url: "/puzzles/objects-escola-2.svg",
        },
      ],
      [
        {
          name: "COLHER",
          emoji: "🥄",
          image_url: "/puzzles/objects-cozinha-0.svg",
        },
        {
          name: "PRATO",
          emoji: "🍽️",
          image_url: "/puzzles/objects-cozinha-1.svg",
        },
        {
          name: "COPO",
          emoji: "🥛",
          image_url: "/puzzles/objects-cozinha-2.svg",
        },
      ],
    ],
  },
  {
    id: "memoria-colors",
    groups: [
      [
        {
          name: "VERMELHO",
          emoji: "🟥",
          image_url: "/puzzles/colors-quadrados-0.svg",
        },
        {
          name: "AZUL",
          emoji: "🟦",
          image_url: "/puzzles/colors-quadrados-1.svg",
        },
        {
          name: "AMARELO",
          emoji: "🟨",
          image_url: "/puzzles/colors-quadrados-2.svg",
        },
      ],
      [
        {
          name: "VERDE",
          emoji: "💚",
          image_url: "/puzzles/colors-coracoes-0.svg",
        },
        {
          name: "ROXO",
          emoji: "💜",
          image_url: "/puzzles/colors-coracoes-1.svg",
        },
        {
          name: "LARANJA",
          emoji: "🧡",
          image_url: "/puzzles/colors-coracoes-2.svg",
        },
      ],
      [
        {
          name: "AZUL",
          emoji: "🔵",
          image_url: "/puzzles/colors-circulos-0.svg",
        },
        {
          name: "VERMELHO",
          emoji: "🔴",
          image_url: "/puzzles/colors-circulos-1.svg",
        },
        {
          name: "VERDE",
          emoji: "🟢",
          image_url: "/puzzles/colors-circulos-2.svg",
        },
      ],
    ],
  },
  {
    id: "memoria-emotions",
    groups: [
      [
        {
          name: "FELIZ",
          emoji: "😊",
          image_url: "/puzzles/emotions-carinhas-0.svg",
        },
        {
          name: "TRISTE",
          emoji: "😢",
          image_url: "/puzzles/emotions-carinhas-1.svg",
        },
        {
          name: "BRAVO",
          emoji: "😠",
          image_url: "/puzzles/emotions-carinhas-2.svg",
        },
      ],
      [
        {
          name: "SURPRESO",
          emoji: "😮",
          image_url: "/puzzles/emotions-surpresas-0.svg",
        },
        {
          name: "ASSUSTADO",
          emoji: "😨",
          image_url: "/puzzles/emotions-surpresas-1.svg",
        },
        {
          name: "TRANQUILO",
          emoji: "😌",
          image_url: "/puzzles/emotions-surpresas-2.svg",
        },
      ],
      [
        {
          name: "COM SONO",
          emoji: "🥱",
          image_url: "/puzzles/emotions-sono-0.svg",
        },
        {
          name: "DORMINDO",
          emoji: "😴",
          image_url: "/puzzles/emotions-sono-1.svg",
        },
        {
          name: "ACORDADO",
          emoji: "🙂",
          image_url: "/puzzles/emotions-sono-2.svg",
        },
      ],
    ],
  },
  {
    id: "memoria-transports",
    groups: [
      [
        {
          name: "CARRO",
          emoji: "🚗",
          image_url: "/puzzles/transports-rua-0.svg",
        },
        {
          name: "ÔNIBUS",
          emoji: "🚌",
          image_url: "/puzzles/transports-rua-1.svg",
        },
        {
          name: "BICICLETA",
          emoji: "🚲",
          image_url: "/puzzles/transports-rua-2.svg",
        },
      ],
      [
        {
          name: "AMBULÂNCIA",
          emoji: "🚑",
          image_url: "/puzzles/transports-ajuda-0.svg",
        },
        {
          name: "CARRO DE POLÍCIA",
          emoji: "🚓",
          image_url: "/puzzles/transports-ajuda-1.svg",
        },
        {
          name: "CAMINHÃO DE BOMBEIROS",
          emoji: "🚒",
          image_url: "/puzzles/transports-ajuda-2.svg",
        },
      ],
      [
        {
          name: "BARCO",
          emoji: "⛵",
          image_url: "/puzzles/transports-agua-0.svg",
        },
        {
          name: "CANOA",
          emoji: "🛶",
          image_url: "/puzzles/transports-agua-1.svg",
        },
        {
          name: "NAVIO",
          emoji: "🚢",
          image_url: "/puzzles/transports-agua-2.svg",
        },
      ],
    ],
  },
  {
    id: "memoria-actions",
    groups: [
      [
        {
          name: "CORRER",
          emoji: "🏃",
          image_url: "/puzzles/actions-movimento-0.svg",
        },
        {
          name: "ANDAR",
          emoji: "🚶",
          image_url: "/puzzles/actions-movimento-1.svg",
        },
        {
          name: "NADAR",
          emoji: "🏊",
          image_url: "/puzzles/actions-movimento-2.svg",
        },
      ],
      [
        {
          name: "BATER PALMAS",
          emoji: "👏",
          image_url: "/puzzles/actions-maos-0.svg",
        },
        {
          name: "DAR TCHAU",
          emoji: "👋",
          image_url: "/puzzles/actions-maos-1.svg",
        },
        {
          name: "ACENAR COM AS DUAS MÃOS",
          emoji: "🙌",
          image_url: "/puzzles/actions-maos-2.svg",
        },
      ],
      [
        {
          name: "DORMIR",
          emoji: "😴",
          image_url: "/puzzles/actions-rotina-0.svg",
        },
        {
          name: "TOMAR BANHO",
          emoji: "🛀",
          image_url: "/puzzles/actions-rotina-1.svg",
        },
        {
          name: "ESCOVAR OS DENTES",
          emoji: "🪥",
          image_url: "/puzzles/actions-rotina-2.svg",
        },
      ],
    ],
  },
  {
    id: "memoria-nature",
    groups: [
      [
        {
          name: "FLOR",
          emoji: "🌻",
          image_url: "/puzzles/nature-jardim-0.svg",
        },
        {
          name: "ÁRVORE",
          emoji: "🌳",
          image_url: "/puzzles/nature-jardim-1.svg",
        },
        {
          name: "FOLHA",
          emoji: "🍃",
          image_url: "/puzzles/nature-jardim-2.svg",
        },
      ],
      [
        {
          name: "SOL",
          emoji: "☀️",
          image_url: "/puzzles/nature-tempo-0.svg",
        },
        {
          name: "CHUVA",
          emoji: "🌧️",
          image_url: "/puzzles/nature-tempo-1.svg",
        },
        {
          name: "NUVEM",
          emoji: "☁️",
          image_url: "/puzzles/nature-tempo-2.svg",
        },
      ],
      [
        {
          name: "LUA",
          emoji: "🌙",
          image_url: "/puzzles/nature-noite-0.svg",
        },
        {
          name: "ESTRELA",
          emoji: "⭐",
          image_url: "/puzzles/nature-noite-1.svg",
        },
        {
          name: "PLANETA",
          emoji: "🪐",
          image_url: "/puzzles/nature-noite-2.svg",
        },
      ],
    ],
  },
];
const identify = (items: Choice[]) =>
  items.map((target, index) => ({
    prompt: `Encontre ${target.name.toLowerCase()}.`,
    hint: "Ouça, repita se quiser e toque no desenho. Sem cobrança de pronúncia.",
    answer: target.name,
    choices: [...items.slice(index), ...items.slice(0, index)],
  }));
export const expandedContent: Record<string, ActivityContent> =
  Object.fromEntries([
    ...packs.map((p) => [p.id, { id: p.id, rounds: identify(p.items) }]),
    ...puzzles.map((p) => [
      p.id,
      {
        id: p.id,
        rounds: p.items.map((target) => ({
          prompt: `Vamos montar ${target.name.toLowerCase()}?`,
          hint: "Arraste cada peça até o espaço correspondente. Também é possível tocar na peça e no espaço.",
          answer: target.name,
          choices: [target],
        })),
      },
    ]),
    ...memories.map((p) => [
      p.id,
      {
        id: p.id,
        rounds: p.groups.map((items) => ({
          prompt: "Vamos encontrar os pares?",
          hint: "Toque em duas cartas. Ouça os nomes e encontre os desenhos iguais.",
          answer: items[0].name,
          choices: items,
        })),
      },
    ]),
  ]);
