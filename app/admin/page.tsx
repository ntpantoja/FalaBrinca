"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { browserAuth } from "../../lib/supabase-browser";
import {
  categories,
  difficulties,
  validateActivity,
  type ManagedActivity,
  type Difficulty,
} from "../../lib/content-validation";
import { type Choice, type Round } from "../../lib/catalog";
import { Activity } from "../../components/activity";
const blankRound = (): Round => ({
  prompt: "Ouça e repita a palavra. Depois selecione a figura.",
  hint: "Repita com a criança, sem cobrar a pronúncia.",
  answer: "GATO",
  choices: [
    { name: "GATO", emoji: "🐱" },
    { name: "CACHORRO", emoji: "🐶" },
    { name: "COELHO", emoji: "🐰" },
  ],
});
const blank = (): ManagedActivity => ({
  id: `atividade-${Date.now().toString(36)}`,
  title: "",
  description: "Ouça a palavra, repita com um adulto e selecione a figura.",
  emoji: "🐱",
  color: "mint",
  kind: "figures",
  category: "animals",
  difficulty: "beginner",
  minutes: 1,
  published: false,
  revision: 1,
  content: { id: "", rounds: [blankRound()] },
});
export default function Admin() {
  const [activities, setActivities] = useState<ManagedActivity[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editor, setEditor] = useState<ManagedActivity | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<ManagedActivity | null>(null);
  const [uploading, setUploading] = useState(false);
  async function api(path: string, options: RequestInit = {}) {
    const auth = browserAuth();
    const session = auth ? (await auth.auth.getSession()).data.session : null;
    if (!session)
      throw new Error(
        "Entre na conta do proprietário para acessar o painel master.",
      );
    const response = await fetch(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...options.headers,
      },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Não foi possível concluir.");
    return data;
  }
  async function load() {
    setLoading(true);
    try {
      const data = await api("/api/admin/activities");
      setActivities(data.activities);
      setAllowed(true);
    } catch (e) {
      setAllowed(false);
      setMessage(
        e instanceof Error ? e.message : "Não foi possível carregar o painel.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function patchRound(index: number, update: Partial<Round>) {
    setEditor((current) =>
      current
        ? {
            ...current,
            content: {
              ...current.content,
              rounds: current.content.rounds.map((r, i) =>
                i === index ? { ...r, ...update } : r,
              ),
            },
          }
        : null,
    );
  }
  function updateChoice(
    index: number,
    choiceIndex: number,
    update: Partial<Choice>,
  ) {
    if (!editor) return;
    const round = editor.content.rounds[index];
    const sequence = editor.kind === "sentence";
    const list = sequence ? round.sequence! : round.choices;
    const old = list[choiceIndex];
    const next = list.map((c, i) =>
      i === choiceIndex ? { ...c, ...update } : c,
    );
    patchRound(
      index,
      sequence
        ? { sequence: next }
        : {
            choices: next,
            answer:
              old.name === round.answer ? next[choiceIndex].name : round.answer,
          },
    );
  }
  function changeLevel(value: Difficulty) {
    if (!editor) return;
    if (
      !window.confirm(
        "Mudar o tipo de atividade recria as rodadas do editor. Continuar?",
      )
    )
      return;
    const kind =
      value === "beginner"
        ? "figures"
        : value === "intermediate"
          ? "association"
          : "sentence";
    const round =
      kind === "sentence"
        ? {
            prompt: "Vamos montar uma história?",
            hint: "Observe e converse com a criança.",
            answer: "O gato quer a bola.",
            choices: [],
            sequence: [
              { name: "GATO", emoji: "🐱" },
              { name: "QUER", emoji: "🤲" },
              { name: "BOLA", emoji: "⚽" },
            ],
          }
        : blankRound();
    setEditor({
      ...editor,
      difficulty: value,
      kind,
      content: { id: editor.id, rounds: [round] },
    });
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editor) return;
    const data = validateActivity(editor);
    if (!data) {
      setMessage(
        "Confira os títulos, as imagens e as respostas de cada rodada. Use nomes diferentes para cada opção.",
      );
      return;
    }
    setBusy(true);
    try {
      await api(
        creating
          ? "/api/admin/activities"
          : `/api/admin/activities/${editor.id}`,
        {
          method: creating ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      setEditor(null);
      setMessage(
        "Atividade salva. Os assinantes verão as alterações ao recarregar a biblioteca.",
      );
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(activity: ManagedActivity) {
    if (
      !window.confirm(
        `Apagar “${activity.title}” e suas rodadas? Essa ação remove a atividade da biblioteca.`,
      )
    )
      return;
    setBusy(true);
    try {
      await api(
        `/api/admin/activities/${activity.id}?revision=${activity.revision}`,
        { method: "DELETE" },
      );
      setMessage("Atividade apagada.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível apagar.");
    } finally {
      setBusy(false);
    }
  }
  async function seed() {
    if (
      !window.confirm(
        "Importar as 24 atividades iniciais? As atividades existentes não serão sobrescritas. Atividades iniciais que você apagou serão recriadas.",
      )
    )
      return;
    setBusy(true);
    try {
      const data = await api("/api/admin/seed", { method: "POST" });
      setMessage(`${data.imported} atividades importadas.`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha na importação.");
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File, index: number, choiceIndex: number) {
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const data = await api("/api/admin/media", {
        method: "POST",
        body: form,
      });
      updateChoice(index, choiceIndex, { image_url: data.url });
      setMessage("Ilustração enviada. Salve a atividade para aplicar.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível enviar a imagem.",
      );
    } finally {
      setUploading(false);
    }
  }
  function showPreview() {
    const valid = validateActivity(editor);
    if (!valid) {
      setMessage("Preencha os campos da atividade antes de abrir a prévia.");
      return;
    }
    setPreview(valid);
  }
  return (
    <>
      <header className="family-header">
        <Link className="brand" href="/">
          FalaBrinca
        </Link>
        <div className="admin-header-links">
          <span className="pill">MASTER</span>
          <Link className="adult-link" href="/atividades">
            Ver biblioteca
          </Link>
          <Link className="adult-link" href="/conta">
            Minha conta
          </Link>
        </div>
      </header>
      <main className="admin-main">
        <span className="eyebrow">PAINEL DO PROPRIETÁRIO</span>
        <h1>Seu conteúdo, do seu jeito.</h1>
        <p>
          Crie, edite e organize os cards. Alterações publicadas ficam
          disponíveis para os assinantes ao atualizar a biblioteca.
        </p>
        <div className="admin-status" role="status">
          {message}
        </div>
        {loading ? (
          <p>Carregando…</p>
        ) : !allowed ? (
          <div className="notice">
            <h2>Acesso master necessário</h2>
            <p>
              Use sua conta confirmada e vincule o ID do usuário na variável
              MASTER_USER_ID da Vercel. Se a conta já estiver vinculada, confira
              a atualização do banco.
            </p>
            <Link className="primary" href="/conta?modo=login">
              Entrar na minha conta
            </Link>
            <button className="secondary" onClick={() => void load()}>
              Verificar acesso novamente
            </button>
          </div>
        ) : editor ? (
          <form className="admin-editor" onSubmit={save}>
            <div className="admin-editor-heading">
              <h2>{creating ? "Criar atividade" : "Editar atividade"}</h2>
              <button
                type="button"
                className="back"
                onClick={() => {
                  if (
                    window.confirm("Sair do editor sem salvar as alterações?")
                  )
                    setEditor(null);
                }}
              >
                Voltar à lista
              </button>
            </div>
            <div className="editor-grid">
              <label>
                Título do card
                <input
                  required
                  minLength={3}
                  maxLength={80}
                  value={editor.title}
                  onChange={(e) =>
                    setEditor({ ...editor, title: e.target.value })
                  }
                />
              </label>
              <label>
                Figura do card
                <input
                  required
                  maxLength={16}
                  value={editor.emoji}
                  onChange={(e) =>
                    setEditor({ ...editor, emoji: e.target.value })
                  }
                />
              </label>
              <label>
                Categoria
                <select
                  value={editor.category}
                  onChange={(e) =>
                    setEditor({
                      ...editor,
                      category: e.target.value as ManagedActivity["category"],
                    })
                  }
                >
                  {Object.entries(categories).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Dificuldade
                <select
                  value={editor.difficulty}
                  onChange={(e) => changeLevel(e.target.value as Difficulty)}
                >
                  {Object.entries(difficulties).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="full-width">
                Descrição para o responsável
                <textarea
                  required
                  minLength={3}
                  maxLength={240}
                  value={editor.description}
                  onChange={(e) =>
                    setEditor({ ...editor, description: e.target.value })
                  }
                />
              </label>
              <label>
                Cor do card
                <select
                  value={editor.color}
                  onChange={(e) =>
                    setEditor({ ...editor, color: e.target.value })
                  }
                >
                  {[
                    ["mint", "Verde"],
                    ["peach", "Pêssego"],
                    ["lavender", "Lilás"],
                    ["sky", "Azul"],
                    ["butter", "Amarelo"],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox editor-publish">
                <input
                  type="checkbox"
                  checked={editor.published}
                  onChange={(e) =>
                    setEditor({ ...editor, published: e.target.checked })
                  }
                />
                Publicar na biblioteca dos assinantes
              </label>
            </div>
            <div className="notice">
              <p>
                {editor.kind === "figures"
                  ? "Nível inicial: o app mostra a figura, fala a palavra, convida a criança a repetir e depois libera a seleção. A repetição é incentivada, não avaliada."
                  : editor.kind === "association"
                    ? "Escreva a pergunta falada, escolha uma pista visual e marque a resposta correta."
                    : "Escreva a frase que será narrada e escolha as figuras da sequência. As palavras não aparecem para a criança."}
              </p>
            </div>
            {editor.content.rounds.map((round, index) => (
              <fieldset className="round-editor" key={index}>
                <legend>Rodada {index + 1}</legend>
                <div className="editor-grid">
                  <label className="full-width">
                    {editor.kind === "sentence"
                      ? "Frase que será falada"
                      : "Instrução falada"}
                    <input
                      required
                      minLength={2}
                      maxLength={240}
                      value={
                        editor.kind === "sentence" ? round.answer : round.prompt
                      }
                      onChange={(e) =>
                        patchRound(
                          index,
                          editor.kind === "sentence"
                            ? { answer: e.target.value }
                            : { prompt: e.target.value },
                        )
                      }
                    />
                  </label>
                  {editor.kind !== "figures" && (
                    <label>
                      Pista visual (desenhos/emoji)
                      <input
                        maxLength={60}
                        value={round.scene || ""}
                        onChange={(e) =>
                          patchRound(index, { scene: e.target.value })
                        }
                      />
                    </label>
                  )}
                  <label
                    className={editor.kind === "figures" ? "full-width" : ""}
                  >
                    Orientação ao responsável
                    <input
                      maxLength={240}
                      value={round.hint}
                      onChange={(e) =>
                        patchRound(index, { hint: e.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="choice-editors">
                  {(editor.kind === "sentence"
                    ? round.sequence!
                    : round.choices
                  ).map((choice, choiceIndex) => (
                    <div className="choice-editor" key={choiceIndex}>
                      <div className="choice-preview">
                        {choice.image_url ? (
                          <img src={choice.image_url} alt={choice.name} />
                        ) : (
                          <span>{choice.emoji}</span>
                        )}
                      </div>
                      <label>
                        Nome para o áudio
                        <input
                          required
                          maxLength={60}
                          value={choice.name}
                          onChange={(e) =>
                            updateChoice(index, choiceIndex, {
                              name: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Desenho/emoji
                        <input
                          required
                          maxLength={16}
                          value={choice.emoji}
                          onChange={(e) =>
                            updateChoice(index, choiceIndex, {
                              emoji: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="upload-label">
                        Enviar ilustração
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={uploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void upload(file, index, choiceIndex);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {choice.image_url && (
                        <button
                          type="button"
                          className="back"
                          onClick={() =>
                            updateChoice(index, choiceIndex, { image_url: "" })
                          }
                        >
                          Usar apenas o desenho/emoji
                        </button>
                      )}
                      {editor.kind !== "sentence" && (
                        <label className="checkbox">
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={round.answer === choice.name}
                            onChange={() =>
                              patchRound(index, { answer: choice.name })
                            }
                          />
                          Figura correta
                        </label>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="back"
                  disabled={editor.content.rounds.length === 1}
                  onClick={() =>
                    setEditor({
                      ...editor,
                      content: {
                        ...editor.content,
                        rounds: editor.content.rounds.filter(
                          (_, i) => i !== index,
                        ),
                      },
                    })
                  }
                >
                  Remover rodada
                </button>
              </fieldset>
            ))}
            <div className="admin-actions">
              <button
                type="button"
                className="secondary"
                disabled={editor.content.rounds.length >= 12}
                onClick={() =>
                  setEditor({
                    ...editor,
                    content: {
                      ...editor.content,
                      rounds: [
                        ...editor.content.rounds,
                        structuredClone(
                          editor.content.rounds[
                            editor.content.rounds.length - 1
                          ],
                        ),
                      ],
                    },
                  })
                }
              >
                + Adicionar rodada
              </button>
              <button type="button" className="secondary" onClick={showPreview}>
                Ver prévia
              </button>
              <button className="primary" disabled={busy || uploading}>
                {busy ? "Salvando…" : "Salvar atividade"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="admin-toolbar">
              <label className="search-box">
                <span>⌕</span>
                <input
                  type="search"
                  aria-label="Buscar atividade"
                  placeholder="Buscar atividade…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button
                className="primary"
                onClick={() => {
                  setCreating(true);
                  setEditor(blank());
                  setMessage("");
                }}
              >
                + Nova atividade
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void seed()}
              >
                Importar 24 atividades iniciais
              </button>
            </div>
            <div className="admin-summary">
              <span>{activities.length} atividades</span>
              <span>
                {activities.filter((a) => a.published).length} publicadas
              </span>
              <span>
                {activities.filter((a) => !a.published).length} rascunhos
              </span>
            </div>
            <div className="admin-activity-list">
              {activities
                .filter((a) =>
                  `${a.title} ${categories[a.category]}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((a) => (
                  <article key={a.id}>
                    <span className="admin-card-icon">{a.emoji}</span>
                    <div>
                      <h2>{a.title}</h2>
                      <p>
                        {categories[a.category]} · {difficulties[a.difficulty]}{" "}
                        · {a.content.rounds.length} rodadas
                      </p>
                      <small>
                        {a.published
                          ? "Publicada"
                          : "Rascunho · não aparece para os assinantes"}
                      </small>
                    </div>
                    <div className="admin-row-actions">
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => {
                          setCreating(false);
                          setEditor(structuredClone(a));
                          setMessage("");
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="delete-button"
                        disabled={busy}
                        onClick={() => void remove(a)}
                      >
                        Apagar
                      </button>
                    </div>
                  </article>
                ))}
            </div>
            {!activities.length && (
              <div className="empty-state">
                <h2>Sua biblioteca está pronta para começar.</h2>
                <p>Importe as atividades iniciais ou crie seu primeiro card.</p>
              </div>
            )}
          </>
        )}
        {preview && (
          <div className="admin-preview">
            <button className="secondary" onClick={() => setPreview(null)}>
              Fechar prévia
            </button>
            <Activity
              key={preview.id}
              adventure={preview}
              content={preview.content}
              sound={"speechSynthesis" in window}
              onExit={() => setPreview(null)}
              onComplete={() => {
                setPreview(null);
                setMessage(
                  "Prévia concluída. Salve a atividade para publicar as alterações.",
                );
              }}
            />
          </div>
        )}
      </main>
    </>
  );
}
