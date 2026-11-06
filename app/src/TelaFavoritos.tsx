import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Canal, Epg } from "./types";
import Player from "./Player";
import Logo from "./Logo";
import { useNavegacao } from "./useNavegacao";
import { useFocoEspacial, focarPrimeiro } from "./useFocoEspacial";
import { useFavoritos } from "./favoritos";

interface Props {
  canais: Canal[];
  epg?: Epg | null;
}

const ROTULO_TIPO: Record<string, string> = {
  aovivo: "Ao Vivo",
  filmes: "Filme",
  series: "Série",
};

// Normaliza o nome para comparar entre playlists diferentes
function chaveNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export default function TelaFavoritos({ canais }: Props) {
  const navigate = useNavigate();
  const { favoritos, remover } = useFavoritos();
  const [atual, setAtual] = useState<Canal | null>(null);
  useFocoEspacial();

  // Casa cada favorito com um canal: primeiro pela URL, depois pelo nome
  const disponiveis = useMemo(() => {
    const porUrl = new Map(canais.map((c) => [c.url, c]));
    const porNome = new Map<string, Canal>();
    for (const c of canais) {
      const k = chaveNome(c.nome);
      if (!porNome.has(k)) porNome.set(k, c);
    }

    const vistos = new Set<string>();
    const lista: Canal[] = [];

    for (const f of favoritos) {
      const canal = porUrl.get(f.url) ?? porNome.get(chaveNome(f.nome));
      if (!canal) continue;
      if (vistos.has(canal.url)) continue;
      vistos.add(canal.url);
      lista.push(canal);
    }
    return lista;
  }, [favoritos, canais]);

  const ausentes = favoritos.length - disponiveis.length;

  useEffect(() => {
    const t = setTimeout(focarPrimeiro, 50);
    return () => clearTimeout(t);
  }, []);

  useNavegacao(() => {
    if (atual) {
      setAtual(null);
    } else {
      navigate("/");
    }
    return true;
  });

  if (favoritos.length === 0) {
    return (
      <div className="pagina">
        <div className="topo-pagina">
          <button className="botao" data-nav onClick={() => navigate("/")}>
            ← Menu
          </button>
          <h2>Favoritos</h2>
        </div>
        <p className="vazio">
          Nenhum favorito ainda. Abra um canal e use o botão ☆ Favoritar.
        </p>
      </div>
    );
  }

  return (
    <div className="pagina">
      <div className="topo-pagina">
        <button className="botao" data-nav onClick={() => navigate("/")}>
          ← Menu
        </button>
        <h2>Favoritos</h2>
        <span className="contagem">{disponiveis.length} itens</span>
      </div>

      <main className="painel-tres painel-favoritos">
        <section className="coluna coluna-canais">
          <ul className="lista">
            {disponiveis.map((c) => (
              <li key={c.url}>
                <button
                  id={"fav-" + c.url}
                  className={"item" + (atual?.url === c.url ? " ativo" : "")}
                  data-nav
                  onClick={() => setAtual(c)}
                >
                  <Logo src={c.logo} nome={c.nome} />
                  <span className="nome-item">
                    <span>{c.nome}</span>
                    <small className="epg-linha">
                      {ROTULO_TIPO[c.tipo] ?? c.tipo} · {c.grupo}
                    </small>
                  </span>
                </button>
              </li>
            ))}
            {disponiveis.length === 0 && (
              <li className="vazio">
                Os favoritos salvos não existem na playlist atual.
              </li>
            )}
          </ul>

          {ausentes > 0 && (
            <p className="aviso-limite">
              {ausentes} favorito(s) de outra playlist não aparecem aqui.
            </p>
          )}
        </section>

        <section className="painel coluna-player">
          {atual ? (
            <>
              <Player key={atual.url} url={atual.url} />

              <div className="titulo-canal">
                <Logo src={atual.logo} nome={atual.nome} tamanho={56} />
                <div className="titulo-dados">
                  <h2>{atual.nome}</h2>
                  <p>
                    {ROTULO_TIPO[atual.tipo] ?? atual.tipo} · {atual.grupo}
                  </p>
                </div>
                <button
                  className="botao botao-favorito ativo"
                  data-nav
                  onClick={() => {
                    const salvo = favoritos.find(
                      (f) => f.url === atual.url || chaveNome(f.nome) === chaveNome(atual.nome)
                    );
                    if (salvo) remover(salvo.url);
                    setAtual(null);
                  }}
                >
                  ★ Remover
                </button>
              </div>
            </>
          ) : (
            <div className="player-vazio">
              <span className="player-vazio-icone">★</span>
              <strong>Seus favoritos</strong>
              <p>Selecione um item ao lado para assistir.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}