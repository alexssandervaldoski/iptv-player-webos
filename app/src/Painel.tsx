import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Canal, Entrada, Epg } from "./types";
import Player from "./Player";
import Logo from "./Logo";
import { useNavegacao } from "./useNavegacao";
import { agruparVariantes } from "./agrupar";
import { epgIdDe, programaAgora } from "./epg";
import { qualidade } from "./texto";

// Desenha no máximo isto por vez, para listas enormes não travarem a tela
const LIMITE = 300;

function hora(ms: number): string {
  return new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  canais: Canal[];
  epg: Epg | null;
}

export default function Painel({ canais, epg }: Props) {
  const navigate = useNavigate();
  const [grupo, setGrupo] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [agrupar, setAgrupar] = useState(true);
  const [ordenar, setOrdenar] = useState(false);
  const [atual, setAtual] = useState<Entrada | null>(null);
  const [varianteId, setVarianteId] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  // Atualiza o "agora" a cada 30 segundos, para o guia acompanhar o relógio
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const entradas = useMemo(() => agruparVariantes(canais, agrupar), [canais, agrupar]);

  // Ordem alfabética opcional. O "numeric" põe "Canal 2" antes de "Canal 10"
  const ordenadas = useMemo(
    () =>
      ordenar
        ? [...entradas].sort((a, b) =>
            a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base", numeric: true })
          )
        : entradas,
    [entradas, ordenar]
  );

  // Para cada item, o id do canal dentro do guia (calculado uma vez)
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

  const grupos = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const e of entradas) {
      contagem.set(e.grupo, (contagem.get(e.grupo) ?? 0) + 1);
    }
    const lista: [string, number][] = [["Todos", entradas.length], ...contagem];
    return lista;
  }, [entradas]);

  const grupoAtual = grupos.some(([nome]) => nome === grupo) ? grupo : "Todos";

  const filtrados = useMemo(
    () =>
      ordenadas.filter(
        (e) =>
          (grupoAtual === "Todos" || e.grupo === grupoAtual) &&
          e.nome.toLowerCase().includes(busca.toLowerCase())
      ),
    [ordenadas, grupoAtual, busca]
  );
  const visiveis = filtrados.slice(0, LIMITE);

  const variante = atual
    ? (atual.variantes.find((v) => v.id === varianteId) ?? atual.variantes[0])
    : null;

  function escolher(e: Entrada) {
    setAtual(e);
    setVarianteId(null); // volta para a melhor qualidade
  }

  function alternarAgrupar() {
    setAgrupar((a) => !a);
    setAtual(null);
    setVarianteId(null);
  }

  // Voltar: se há algo tocando, para; senão, volta ao menu principal
  useNavegacao(() => {
    if (atual) {
      setAtual(null);
      setVarianteId(null);
    } else {
      navigate("/");
    }
    return true;
  });

  // Teclas de canal: CH+ vai para o próximo, CH- para o anterior
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const avancar = e.key === "PageUp" || e.keyCode === 427;
      const voltar = e.key === "PageDown" || e.keyCode === 428;
      if (!atual || (!avancar && !voltar)) return;

      const i = filtrados.findIndex((x) => x.id === atual.id);
      const proximo = filtrados[i + (avancar ? 1 : -1)];
      if (i >= 0 && proximo) {
        e.preventDefault();
        escolher(proximo);
        document.getElementById("canal-" + proximo.id)?.focus();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [atual, filtrados]);

  if (canais.length === 0) {
    return (
      <p className="vazio">
        Nenhum item nesta seção. Verifique os nomes dos grupos da sua lista.
      </p>
    );
  }

  const prog = atual ? programaAgora(programasDa(atual), agora) : null;

  return (
    <main className="painel-tres">
      <aside className="coluna coluna-grupos">
        <ul className="lista">
          {grupos.map(([nome, qtd]) => (
            <li key={nome}>
              <button
                className={"item" + (nome === grupoAtual ? " ativo" : "")}
                data-nav
                onFocus={() => setGrupo(nome)}
                onClick={() => setGrupo(nome)}
              >
                <span>{nome}</span>
                <span>{qtd}</span>
              </button>
            </li>
          ))}
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
            Agrupar versões: {agrupar ? "sim" : "não"}
          </button>
          <button className="botao" data-nav onClick={() => setOrdenar((o) => !o)}>
            Ordenar A–Z: {ordenar ? "sim" : "não"}
          </button>
        </div>

        <ul className="lista">
          {visiveis.map((e) => {
            const agoraNoAr = programaAgora(programasDa(e), agora).atual;
            return (
              <li key={e.id}>
                <button
                  id={"canal-" + e.id}
                  className={"item" + (atual?.id === e.id ? " ativo" : "")}
                  data-nav
                  onClick={() => escolher(e)}
                >
                  <Logo src={e.logo} nome={e.nome} />
                  <span className="nome-item">
                    <span>{e.nome}</span>
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
          {visiveis.length === 0 && <li className="vazio">Nada encontrado</li>}
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
            <Player key={variante.id} url={variante.url} />

            <div className="titulo-canal">
              <Logo src={atual.logo} nome={atual.nome} tamanho={56} />
              <div>
                <h2>{atual.nome}</h2>
                <p>{atual.grupo}</p>
              </div>
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
          <p className="vazio">Selecione um item para assistir.</p>
        )}
      </section>
    </main>
  );
}