import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Playlist } from "./types";
import { useNavegacao } from "./useNavegacao";

interface Props {
  playlists: Playlist[];
  ativaId: string | null;
  carregando: boolean;
  aoSalvar: (p: Playlist) => void;
  aoApagar: (id: string) => void;
  aoConectar: (id: string) => void;
  aoAtualizar: (id: string) => void;
}

const VAZIO = { nome: "", url: "", epgUrl: "" };

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "endereço inválido";
  }
}

const ehHttp = (texto: string) => /^https?:\/\//i.test(texto);

export default function Playlists({
  playlists,
  ativaId,
  carregando,
  aoSalvar,
  aoApagar,
  aoConectar,
  aoAtualizar,
}: Props) {
  const navigate = useNavigate();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(VAZIO);
  const [erroForm, setErroForm] = useState("");
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  function limpar() {
    setEditandoId(null);
    setForm(VAZIO);
    setErroForm("");
  }

  // Voltar: primeiro cancela a edição; depois volta ao menu
  useNavegacao(() => {
    if (editandoId !== null || form.nome || form.url || form.epgUrl) {
      limpar();
    } else {
      navigate("/");
    }
    return true;
  });

  function editar(p: Playlist) {
    setEditandoId(p.id);
    setForm({ nome: p.nome, url: p.url, epgUrl: p.epgUrl });
    setErroForm("");
  }

  function apagar(id: string) {
    if (confirmandoId === id) {
      aoApagar(id);
      setConfirmandoId(null);
      if (editandoId === id) limpar();
    } else {
      setConfirmandoId(id);
    }
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    const url = form.url.trim();
    const epgUrl = form.epgUrl.trim();

    if (!ehHttp(url)) {
      setErroForm("O endereço da lista deve começar com http:// ou https://");
      return;
    }
    if (epgUrl && !ehHttp(epgUrl)) {
      setErroForm("O endereço do guia deve começar com http:// ou https://");
      return;
    }

    aoSalvar({
      id: editandoId ?? Date.now().toString(36),
      nome: form.nome.trim() || "Minha lista",
      url,
      epgUrl,
    });
    limpar();
  }

  return (
    <div className="pagina">
      <div className="topo-pagina">
        <button className="botao" data-nav onClick={() => navigate("/")}>
          ← Menu
        </button>
        <h2>Playlists</h2>
      </div>

      <main className="tela-playlists">
        <section className="coluna">
          <ul className="lista">
            {playlists.map((p) => (
              <li key={p.id} className="item-playlist">
                <div className="dados">
                  <strong>{p.nome}</strong>
                  <small>
                    {host(p.url)}
                    {p.epgUrl ? " · com guia (EPG)" : ""}
                  </small>
                </div>
                {p.id === ativaId && <span className="selo">Conectada</span>}
                <div className="acoes">
                  <button className="botao" data-nav onClick={() => aoConectar(p.id)}>
                    Conectar
                  </button>
                  <button
                    className="botao"
                    data-nav
                    disabled={p.id === ativaId && carregando}
                    onClick={() => aoAtualizar(p.id)}
                  >
                    {p.id === ativaId && carregando ? "Atualizando…" : "Atualizar"}
                  </button>
                  <button className="botao" data-nav onClick={() => editar(p)}>
                    Editar
                  </button>
                  <button className="botao" data-nav onClick={() => apagar(p.id)}>
                    {confirmandoId === p.id ? "Confirmar?" : "Apagar"}
                  </button>
                </div>
              </li>
            ))}
            {playlists.length === 0 && (
              <li className="vazio">Nenhuma lista salva. Use o formulário ao lado.</li>
            )}
          </ul>
        </section>

        <form className="form-playlist" onSubmit={enviar}>
          <h2>{editandoId ? "Editar lista" : "Nova lista"}</h2>

          <label className="campo">
            Nome
            <input
              className="busca"
              data-nav
              placeholder="Minha lista"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </label>

          <label className="campo">
            Endereço da lista (M3U)
            <input
              className="busca"
              data-nav
              type="url"
              placeholder="https://..."
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </label>

          <label className="campo">
            Endereço do guia, EPG (opcional)
            <input
              className="busca"
              data-nav
              type="url"
              placeholder="https://..."
              value={form.epgUrl}
              onChange={(e) => setForm({ ...form, epgUrl: e.target.value })}
            />
          </label>

          {erroForm && <p className="erro">{erroForm}</p>}

          <div className="acoes">
            <button className="botao" data-nav type="submit">
              Salvar
            </button>
            <button className="botao" data-nav type="button" onClick={limpar}>
              Cancelar
            </button>
          </div>

          <p className="dica-form">
            Os endereços ficam salvos só neste navegador ou dispositivo. Se o seu provedor
            coloca usuário e senha no endereço, não compartilhe prints desta tela nem salve
            o endereço em arquivos do projeto.
          </p>
        </form>
      </main>
    </div>
  );
}