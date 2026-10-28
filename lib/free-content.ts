import { figures, associations, sentences } from "./activities";
import type { ActivityContent } from "./catalog";
export const freeContent: Record<string, ActivityContent> = {
  "figuras-inicio": {
    id: "figuras-inicio",
    rounds: figures.map((r) => ({
      prompt: `Encontre: ${r.word.toLowerCase()}`,
      hint: r.hint,
      choices: r.choices,
      answer: r.word,
    })),
  },
  "associacao-inicio": {
    id: "associacao-inicio",
    rounds: associations.map((r) => ({
      prompt: r.prompt,
      hint: "Observe e converse com seu adulto.",
      scene: r.emoji,
      choices: r.choices,
      answer: r.answer,
    })),
  },
  "frases-inicio": {
    id: "frases-inicio",
    rounds: sentences.map((r) => ({
      prompt: "Vamos montar uma frase?",
      hint: "Ouça e toque nas palavras na ordem.",
      scene: r.emoji,
      choices: [],
      answer: r.words.join(" "),
      words: r.words,
      options: r.options,
    })),
  },
};
