import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Canal, Entrada, Epg } from "./types";
import Player from "./Player";
import Logo from "./Logo";
import OverlayCanal from "./OverlayCanal";
import { useNavegacao } from "./useNavegacao";
import { useFocoEspacial, focarPrimeiro } from "./useFocoEspacial";
import { agruparVariantes } from "./agrupar";
import { epgIdDe, programaAgora } from "./epg";
import { qualidade } from "./texto";
import { useFavoritos } from "./favoritos";

const LIMITE = 300;
const SEGUNDOS_TROCA = 5;

// Grupos que ficam no topo da primeira coluna, nesta ordem.
const GRUPOS_FIXOS = ["suporte", "suporte base", "suporte tecnico"];

type Modo = "lista" | "pequeno" | "medio";

const ROTULO_MODO: Record<Modo, string> = {
  lista: "Lista",
  pequeno: "Ícones pequenos",
  medio: "Ícones médios",
};

function hora(ms: number): string {
  return new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Posição do grupo na lista de fixos; -1 se não for fixo
function pesoFixo(nome: string): number {
  const n = semAcento(nome);
  return GRUPOS_FIXOS.findIndex((f) => n === f || n.startsWith(f));
}

interface Props {
  canais: Canal[];
  epg: Epg | null;
}

export default function Painel({ canais, epg }: Props) {
  const navigate = useNavigate();
  const { favoritos, alternar } = useFavoritos();
  useFocoEspacial();

  const [grupo, setGrupo] = useState("Todos");
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [busca, setBusca] = useState("");
  const [agrupar, setAgrupar] = useState(true);
  const [ordenar, setOrdenar] = useState(false);
  const [modo, setModo] = useState<Modo>("lista");
  const [atual, setAtual] = useState<Entrada | null>(null);
  const [varianteId, setVarianteId] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  const [pendente, setPendente] = useState<Entrada | null>(null);
  const [segundos, setSegundos] = useState(SEGUNDOS_TROCA);
  const [imersivo, setImersivo] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(focarPrimeiro, 50);
    return () => clearTimeout(t);
  }, []);

  const urlsFavoritas = useMemo(
    () => new Set(favoritos.map((f) => f.url)),
    [favoritos]
  );

  const entradas = useMemo(() => {
    const base = agruparVariantes(canais, agrupar);
    return base.map((e) => ({
      ...e,
      favorito: e.variantes.some((v) => urlsFavoritas.has(v.url)),
    }));
  }, [canais, agrupar, urlsFavoritas]);

  const ordenadas = useMemo(
    () =>
      ordenar
        ? [...entradas].sort((a, b) =>
            a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base", numeric: true })
          )
        : entradas,
    [entradas, ordenar]
  );

  const idEpg = useMemo(() => {
    const mapa = new Map<number, string>();
    if (!epg) return mapa;
    for (const e of entradas) {
      const id = epgIdDe(e.variantes, epg);
      if (id) mapa.set(e.id, id);
    }
    return mapa;
  }, [entradas, epg]);

  function programasDa(e: Entrada) {
    const id = idEpg.get(e.id);
    const lista = id ? epg?.porId.get(id) : undefined;
    return lista ?? [];
  }

  // Grupos com os fixos no topo, mantendo a ordem original dos demais
  const grupos = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const e of entradas) {
      contagem.set(e.grupo, (contagem.get(e.grupo) ?? 0) + 1);
    }

    const lista = [...contagem] as [string, number][];

    return lista.sort((a, b) => {
      const pa = pesoFixo(a[0]);
      const pb = pesoFixo(b[0]);

      if (pa !== -1 && pb !== -1) return pa - pb;
      if (pa !== -1) return -1;
      if (pb !== -1) return 1;
      return 0;
    });
  }, [entradas]);

  const totalFavoritos = useMemo(
    () => entradas.filter((e) => e.favorito).length,
    [entradas]
  );

  const grupoAtual = grupos.some(([nome]) => nome === grupo) ? grupo : "Todos";

  const filtrados = useMemo(
    () =>
      ordenadas.filter(
        (e) =>
          (soFavoritos
            ? e.favorito
            : grupoAtual === "Todos" || e.grupo === grupoAtual) &&
          e.nome.toLowerCase().includes(busca.toLowerCase())
      ),
    [ordenadas, grupoAtual, busca, soFavoritos]
  );
  const visiveis = filtrados.slice(0, LIMITE);

  const variante = atual
    ? (atual.variantes.find((v) => v.id === varianteId) ?? atual.variantes[0])
    : null;

  function escolher(e: Entrada) {
    setAtual(e);
    setVarianteId(null);
    setPendente(null);
  }

  function alternarAgrupar() {
    setAgrupar((a) => !a);
    setAtual(null);
    setVarianteId(null);
    setPendente(null);
  }

  function proximoModo() {
    setModo((m) => (m === "lista" ? "pequeno" : m === "pequeno" ? "medio" : "lista"));
  }

  const abrirTelaCheia = useCallback(async () => {
    const alvo = videoRef.current ?? areaRef.current;

    try {
      if (alvo) {
        if (alvo.requestFullscreen) {
          await alvo.requestFullscreen();
        } else if ((alvo as any).webkitRequestFullscreen) {
          await (alvo as any).webkitRequestFullscreen();
        } else if ((alvo as any).webkitEnterFullscreen) {
          (alvo as any).webkitEnterFullscreen();
        } else {
          setImersivo(true);
        }
      } else {
        setImersivo(true);
      }
    } catch {
      setImersivo(true);
    }

    videoRef.current?.play?.().catch(() => {});
  }, []);

  const sairTelaCheia = useCallback(async () => {
    setImersivo(false);
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen();
    } catch {
      // ignora
    }
  }, []);

  const navegarCanal = useCallback(
    (direcao: 1 | -1) => {
      const base = pendente ?? atual;
      if (!base) return;
      const i = filtrados.findIndex((x) => x.id === base.id);
      if (i < 0) return;
      const alvo = filtrados[i + direcao];
      if (!alvo) return;
      setPendente(alvo);
      setSegundos(SEGUNDOS_TROCA);
    },
    [pendente, atual, filtrados]
  );

  useEffect(() => {
    if (!pendente) return;
    if (segundos <= 0) {
      escolher(pendente);
      return;
    }
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [pendente, segundos]);

  // Leva o foco de volta ao canal que está tocando
  const voltarAoPlayer = useCallback(() => {
    if (!atual) return;
    const el = document.getElementById("canal-" + atual.id);
    if (el) {
      el.focus();
      el.scrollIntoView({ block: "center" });
    }
  }, [atual]);

  useNavegacao(() => {
    if (imersivo || document.fullscreenElement) {
      sairTelaCheia();
      return true;
    }
    if (pendente) {
      setPendente(null);
      return true;
    }
    if (atual) {
      setAtual(null);
      setVarianteId(null);
      return true;
    }
    navigate("/");
    return true;
  });

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const avancar = e.key === "PageUp" || e.keyCode === 427;
      const voltar = e.key === "PageDown" || e.keyCode === 428;
      if (!avancar && !voltar) return;
      if (!atual && !pendente) return;

      e.preventDefault();
      navegarCanal(avancar ? 1 : -1);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [atual, pendente, navegarCanal]);

  if (canais.length === 0) {
    return (
      <p className="vazio">
        Nenhum item nesta seção. Verifique os nomes dos grupos da sua lista.
      </p>
    );
  }

  const prog = atual ? programaAgora(programasDa(atual), agora) : null;
  const favoritoAtual = variante ? urlsFavoritas.has(variante.url) : false;
  const indicePendente = pendente
    ? filtrados.findIndex((x) => x.id === pendente.id)
    : -1;

  if (imersivo && atual && variante) {
    return (
      <div className="modo-imersivo">
        <Player key={variante.id} url={variante.url} />
        <div className="imersivo-info">
          <strong>{atual.nome}</strong>
          <span>{atual.grupo}</span>
        </div>
        <button className="botao imersivo-sair" data-nav onClick={sairTelaCheia}>
          ✕ Sair
        </button>
      </div>
    );
  }

  return (
    <main className="painel-tres">
      <aside className="coluna coluna-grupos">
        <ul className="lista">
          <li>
            <button
              className={"item item-favoritos" + (soFavoritos ? " ativo" : "")}
              data-nav
              onFocus={() => setSoFavoritos(true)}
              onClick={() => setSoFavoritos(true)}
            >
              <span>★ Favoritos</span>
              <span>{totalFavoritos}</span>
            </button>
          </li>

          <li>
            <button
              className={
                "item" + (!soFavoritos && grupoAtual === "Todos" ? " ativo" : "")
              }
              data-nav
              onFocus={() => {
                setSoFavoritos(false);
                setGrupo("Todos");
              }}
              onClick={() => {
                setSoFavoritos(false);
                setGrupo("Todos");
              }}
            >
              <span>Todos</span>
              <span>{entradas.length}</span>
            </button>
          </li>

          {grupos.map(([nome, qtd]) => {
            const fixo = pesoFixo(nome) !== -1;
            return (
              <li key={nome}>
                <button
                  className={
                    "item" +
                    (fixo ? " item-fixo" : "") +
                    (!soFavoritos && nome === grupoAtual ? " ativo" : "")
                  }
                  data-nav
                  onFocus={() => {
                    setSoFavoritos(false);
                    setGrupo(nome);
                  }}
                  onClick={() => {
                    setSoFavoritos(false);
                    setGrupo(nome);
                  }}
                >
                  <span>{nome}</span>
                  <span>{qtd}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="coluna coluna-canais">
        <input
          className="busca"
          data-nav
          placeholder="Pesquisar"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <div className="opcoes">
          <button className="botao" data-nav onClick={alternarAgrupar}>
            Agrupar: {agrupar ? "sim" : "não"}
          </button>
          <button className="botao" data-nav onClick={() => setOrdenar((o) => !o)}>
            A–Z: {ordenar ? "sim" : "não"}
          </button>
          <button className="botao" data-nav onClick={proximoModo}>
            {ROTULO_MODO[modo]}
          </button>
        </div>

        <ul className={"lista modo-" + modo}>
          {visiveis.map((e) => {
            const agoraNoAr = programaAgora(programasDa(e), agora).atual;
            return (
              <li key={e.id}>
                <button
                  id={"canal-" + e.id}
                  className={"item" + (atual?.id === e.id ? " ativo" : "")}
                  data-nav
                  onClick={() => escolher(e)}
                  title={e.nome}
                >
                  <Logo src={e.logo} nome={e.nome} />
                  <span className="nome-item">
                    <span>
                      {e.favorito && <span className="estrela">★ </span>}
                      {e.nome}
                    </span>
                    {agoraNoAr && <small className="epg-linha">▶ {agoraNoAr.titulo}</small>}
                  </span>
                  {e.variantes.length > 1 && (
                    <span className="selo">
                      {e.variantes.map((v) => qualidade(v.nome) || "?").join(" · ")}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {visiveis.length === 0 && (
            <li className="vazio">
              {soFavoritos ? "Nenhum favorito nesta seção." : "Nada encontrado"}
            </li>
          )}
        </ul>

        {filtrados.length > LIMITE && (
          <p className="aviso-limite">
            Mostrando {LIMITE} de {filtrados.length}. Use a pesquisa para refinar.
          </p>
        )}
      </section>

      <section className="painel coluna-player">
        {atual && variante ? (
          <>
            <div className="area-video" ref={areaRef}>
              <Player ref={videoRef} key={variante.id} url={variante.url} />

              {pendente && (
                <OverlayCanal
                  atual={atual}
                  pendente={pendente}
                  segundos={segundos}
                  total={filtrados.length}
                  indice={indicePendente}
                  onConfirmar={() => escolher(pendente)}
                  onCancelar={() => setPendente(null)}
                />
              )}
            </div>

            <div className="titulo-canal">
              <Logo src={atual.logo} nome={atual.nome} tamanho={56} />
              <div className="titulo-dados">
                <h2>{atual.nome}</h2>
                <p>{atual.grupo}</p>
              </div>
              <button
                className="botao botao-play"
                data-nav
                onClick={voltarAoPlayer}
                title="Voltar ao canal em reprodução"
              >
                ▶
              </button>
              <button
                className="botao botao-play"
                data-nav
                onClick={abrirTelaCheia}
                title="Assistir em tela cheia"
              >
                ⛶
              </button>
              <button
                className={"botao botao-favorito" + (favoritoAtual ? " ativo" : "")}
                data-nav
                onClick={() =>
                  alternar({
                    url: variante.url,
                    nome: atual.nome,
                    grupo: atual.grupo,
                    logo: atual.logo,
                  })
                }
              >
                {favoritoAtual ? "★ Favorito" : "☆ Favoritar"}
              </button>
            </div>

            {atual.variantes.length > 1 && (
              <div className="variantes">
                {atual.variantes.map((v, i) => (
                  <button
                    key={v.id}
                    className={"botao" + (v.id === variante.id ? " ativo" : "")}
                    data-nav
                    onClick={() => setVarianteId(v.id)}
                  >
                    {qualidade(v.nome) || "Versão " + (i + 1)}
                  </button>
                ))}
              </div>
            )}

            {prog && (prog.atual || prog.proximo) && (
              <div className="epg-bloco">
                {prog.atual && (
                  <>
                    <strong>Agora: {prog.atual.titulo}</strong>
                    <small>
                      {hora(prog.atual.inicio)} – {hora(prog.atual.fim)}
                    </small>
                    <div className="progresso">
                      <div
                        style={{
                          width:
                            Math.min(
                              100,
                              Math.max(
                                0,
                                ((agora - prog.atual.inicio) /
                                  (prog.atual.fim - prog.atual.inicio)) *
                                  100
                              )
                            ) + "%",
                        }}
                      />
                    </div>
                    {prog.atual.descricao && (
                      <p className="epg-desc">{prog.atual.descricao}</p>
                    )}
                  </>
                )}
                {prog.proximo && (
                  <p>
                    A seguir: {prog.proximo.titulo} ({hora(prog.proximo.inicio)})
                  </p>
                )}
              </div>
            )}

            {epg && !prog?.atual && !prog?.proximo && (
              <p className="aviso-limite">Sem programação no guia para este canal.</p>
            )}
          </>
        ) : (
          <div className="player-vazio">
            <span className="player-vazio-icone">▶</span>
            <strong>Pronto para assistir</strong>
            <p>Selecione um canal na lista ao lado.</p>
          </div>
        )}
      </section>
    </main>
  );
}