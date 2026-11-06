import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ModoPlaylist, Playlist } from "./types";
import { useNavegacao } from "./useNavegacao";
import { useFocoEspacial, focarPrimeiro } from "./useFocoEspacial";
import { montarUrlXtream, montarEpgXtream, recalcular } from "./playlist";

interface Props {
  playlists: Playlist[];
  ativaId: string | null;
  onSalvar: (p: Playlist) => void;
  onRemover: (id: string) => void;
  onConectar: (id: string) => void;
}

function novoId(): string {
  return "pl_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function vazia(): Playlist {
  return {
    id: novoId(),
    nome: "",
    modo: "xtream",
    host: "",
    usuario: "",
    senha: "",
    url: "",
    epgUrl: "",
  };
}

export default function Playlists({
  playlists,
  ativaId,
  onSalvar,
  onRemover,
  onConectar,
}: Props) {
  const navigate = useNavigate();
  const [editando, setEditando] = useState<Playlist | null>(null);
  const [erro, setErro] = useState("");
  useFocoEspacial();

  useEffect(() => {
    const t = setTimeout(focarPrimeiro, 50);
    return () => clearTimeout(t);
  }, []);

  useNavegacao(() => {
    if (editando) {
      setEditando(null);
      setErro("");
      return true;
    }
    navigate("/");
    return true;
  });

  function abrirNova() {
    setErro("");
    setEditando(vazia());
  }

  function abrirEdicao(p: Playlist) {
    setErro("");
    setEditando({ ...p });
  }

  function alterar(campo: keyof Playlist, valor: string) {
    if (!editando) return;
    setEditando({ ...editando, [campo]: valor } as Playlist);
  }

  function trocarModo(modo: ModoPlaylist) {
    if (!editando) return;
    setEditando({ ...editando, modo });
  }

  function salvar() {
    if (!editando) return;

    const nome = editando.nome.trim() || "Playlist";
    const pronto = recalcular({ ...editando, nome });

    if (!pronto.url) {
      setErro(
        pronto.modo === "xtream"
          ? "Preencha o host, o usuário e a senha."
          : "Cole o endereço completo da lista."
      );
      return;
    }

    onSalvar(pronto);
    setEditando(null);
    setErro("");
  }

  // Prévia da URL que será gerada
  const previa =
    editando?.modo === "xtream"
      ? montarUrlXtream(editando.host, editando.usuario, editando.senha)
      : editando?.url ?? "";

  const previaEpg =
    editando?.modo === "xtream"
      ? montarEpgXtream(editando.host, editando.usuario, editando.senha)
      : "";

  if (editando) {
    return (
      <div className="pagina">
        <div className="topo-pagina">
          <button
            className="botao"
            data-nav
            onClick={() => {
              setEditando(null);
              setErro("");
            }}
          >
            ← Voltar
          </button>
          <h2>{playlists.some((p) => p.id === editando.id) ? "Editar playlist" : "Nova playlist"}</h2>
        </div>

        <main className="form-playlist">
          <label className="campo">
            <span>Nome</span>
            <input
              className="entrada"
              data-nav
              placeholder="Minha lista"
              value={editando.nome}
              onChange={(e) => alterar("nome", e.target.value)}
            />
          </label>

          <div className="modos">
            <button
              className={"botao" + (editando.modo === "xtream" ? " ativo" : "")}
              data-nav
              onClick={() => trocarModo("xtream")}
            >
              Host + usuário + senha
            </button>
            <button
              className={"botao" + (editando.modo === "url" ? " ativo" : "")}
              data-nav
              onClick={() => trocarModo("url")}
            >
              URL completa
            </button>
          </div>

          {editando.modo === "xtream" ? (
            <>
              <label className="campo">
                <span>Host</span>
                <input
                  className="entrada"
                  data-nav
                  placeholder="http://servidor.com:8080"
                  value={editando.host}
                  onChange={(e) => alterar("host", e.target.value)}
                />
              </label>

              <label className="campo">
                <span>Usuário</span>
                <input
                  className="entrada"
                  data-nav
                  placeholder="seu_usuario"
                  value={editando.usuario}
                  onChange={(e) => alterar("usuario", e.target.value)}
                />
              </label>

              <label className="campo">
                <span>Senha</span>
                <input
                  className="entrada"
                  data-nav
                  placeholder="sua_senha"
                  value={editando.senha}
                  onChange={(e) => alterar("senha", e.target.value)}
                />
              </label>

              {previa && (
                <div className="previa">
                  <span className="previa-rotulo">Endereço gerado</span>
                  <code className="previa-url">{previa}</code>
                  {previaEpg && (
                    <>
                      <span className="previa-rotulo">Guia de programação</span>
                      <code className="previa-url">{previaEpg}</code>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <label className="campo">
              <span>Endereço da lista</span>
              <input
                className="entrada"
                data-nav
                placeholder="http://servidor.com/lista.m3u"
                value={editando.url}
                onChange={(e) => alterar("url", e.target.value)}
              />
            </label>
          )}

          {erro && <p className="erro">{erro}</p>}

          <div className="acoes">
            <button className="botao botao-principal" data-nav onClick={salvar}>
              Salvar
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pagina">
      <div className="topo-pagina">
        <button className="botao" data-nav onClick={() => navigate("/")}>
          ← Menu
        </button>
        <h2>Playlists</h2>
        <span className="contagem">{playlists.length} salvas</span>
      </div>

      <main className="lista-playlists">
        {playlists.map((p) => (
          <div
            key={p.id}
            className={"card-playlist" + (p.id === ativaId ? " ativa" : "")}
          >
            <div className="card-playlist-info">
              <strong>{p.nome}</strong>
              <small>{p.modo === "xtream" ? p.host : p.url}</small>
              {p.id === ativaId && <span className="selo-ativa">Conectada</span>}
            </div>

            <div className="card-playlist-acoes">
              <button className="botao" data-nav onClick={() => onConectar(p.id)}>
                Conectar
              </button>
              <button className="botao" data-nav onClick={() => abrirEdicao(p)}>
                Editar
              </button>
              <button
                className="botao botao-perigo"
                data-nav
                onClick={() => onRemover(p.id)}
              >
                Remover
              </button>
            </div>
          </div>
        ))}

        {playlists.length === 0 && (
          <p className="vazio">Nenhuma playlist salva ainda.</p>
        )}

        <button className="botao botao-principal" data-nav onClick={abrirNova}>
          + Adicionar playlist
        </button>
      </main>
    </div>
  );
}