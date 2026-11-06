import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { parseM3U } from "./parseM3U";
import type { Canal } from "./types";
import Player from "./Player";
import { useNavegacao } from "./useNavegacao";
import "./App.css";

// Abra com ?teclas no endereço para ver o código de cada tecla apertada
const mostrarTeclas = new URLSearchParams(window.location.search).has("teclas");

export default function App() {
  const [canais, setCanais] = useState<Canal[]>([]);
  const [grupo, setGrupo] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [atual, setAtual] = useState<Canal | null>(null);
  const [erro, setErro] = useState("");
  const [ultimaTecla, setUltimaTecla] = useState("");
  const arquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/samples/teste.m3u")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then((texto) => setCanais(parseM3U(texto)))
      .catch((e: Error) => setErro("Não foi possível carregar a lista: " + e.message));
  }, []);

  const grupos = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const c of canais) {
      contagem.set(c.grupo, (contagem.get(c.grupo) ?? 0) + 1);
    }
    const lista: [string, number][] = [["Todos", canais.length], ...contagem];
    return lista;
  }, [canais]);

  const visiveis = useMemo(
    () =>
      canais.filter(
        (c) =>
          (grupo === "Todos" || c.grupo === grupo) &&
          c.nome.toLowerCase().includes(busca.toLowerCase())
      ),
    [canais, grupo, busca]
  );

  // Voltar: se há um canal tocando, para a reprodução
  useNavegacao(() => {
    if (!atual) return false;
    setAtual(null);
    return true;
  });

  // Teclas de canal: CH+ vai para o próximo da lista, CH- para o anterior
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (mostrarTeclas) setUltimaTecla(`key=${e.key}  keyCode=${e.keyCode}`);

      const avancar = e.key === "PageUp" || e.keyCode === 427;
      const voltar = e.key === "PageDown" || e.keyCode === 428;
      if (!atual || (!avancar && !voltar)) return;

      const i = visiveis.findIndex((c) => c.id === atual.id);
      const proximo = visiveis[i + (avancar ? 1 : -1)];
      if (i >= 0 && proximo) {
        e.preventDefault();
        setAtual(proximo);
        document.getElementById("canal-" + proximo.id)?.focus();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [atual, visiveis]);

  async function aoEscolherArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setCanais(parseM3U(await arquivo.text()));
    setGrupo("Todos");
    setAtual(null);
    setErro("");
  }

  return (
    <div className="app">
      <header className="barra">
        <h1>Xique-Xique APP</h1>
        <button className="botao" data-nav onClick={() => arquivoRef.current?.click()}>
          Carregar lista
        </button>
        <input
          ref={arquivoRef}
          type="file"
          accept=".m3u,.m3u8,text/plain"
          onChange={aoEscolherArquivo}
          hidden
        />
        <span className="contagem">{visiveis.length} canais</span>
      </header>

      {erro && <p className="erro">{erro}</p>}

      <main className="conteudo">
        <aside className="coluna">
          <input
            className="busca"
            data-nav
            placeholder="Pesquisar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <ul className="lista">
            {grupos.map(([nome, qtd]) => (
              <li key={nome}>
                <button
                  className={"item" + (nome === grupo ? " ativo" : "")}
                  data-nav
                  onClick={() => setGrupo(nome)}
                >
                  <span>{nome}</span>
                  <span>{qtd}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="coluna">
          <ul className="lista">
            {visiveis.map((c) => (
              <li key={c.id}>
                <button
                  id={"canal-" + c.id}
                  className={"item" + (atual?.id === c.id ? " ativo" : "")}
                  data-nav
                  onClick={() => setAtual(c)}
                >
                  <span>{c.nome}</span>
                </button>
              </li>
            ))}
            {visiveis.length === 0 && <li className="vazio">Nenhum canal encontrado</li>}
          </ul>
        </section>

        <section className="painel">
          {atual ? (
            <>
              <Player key={atual.id} url={atual.url} />
              <h2>{atual.nome}</h2>
              <p>{atual.grupo}</p>
            </>
          ) : (
            <p className="vazio">Selecione um canal para assistir.</p>
          )}
        </section>
      </main>

      {mostrarTeclas && <div className="teclas">Última tecla: {ultimaTecla || "—"}</div>}
    </div>
  );
}