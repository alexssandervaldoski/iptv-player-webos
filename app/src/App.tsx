import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { parseM3U } from "./parseM3U";
import { baixarEpg, baixarLista, mensagemDeErro } from "./carregarLista";
import { gravarAtiva, gravarPlaylists, lerAtiva, lerPlaylists } from "./armazenamento";
import type { Canal, Epg, Playlist } from "./types";
import Menu from "./Menu";
import Secao from "./Secao";
import Playlists from "./Playlists";
import "./App.css";

const LISTA_EXEMPLO = "/samples/teste.m3u";

// Abra com ?teclas no endereço para ver o código de cada tecla apertada
const mostrarTeclas = new URLSearchParams(window.location.search).has("teclas");

export default function App() {
  const [playlists, setPlaylists] = useState<Playlist[]>(lerPlaylists);
  const [ativaId, setAtivaId] = useState<string | null>(
    () => lerAtiva() ?? lerPlaylists()[0]?.id ?? null
  );
  const [canais, setCanais] = useState<Canal[]>([]);
  const [epg, setEpg] = useState<Epg | null>(null);
  const [erro, setErro] = useState("");
  const [avisoEpg, setAvisoEpg] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const [ultimaTecla, setUltimaTecla] = useState("");
  const arquivoRef = useRef<HTMLInputElement>(null);

  const ativa = playlists.find((p) => p.id === ativaId) ?? null;
  const urlLista = ativa?.url ?? LISTA_EXEMPLO;
  const urlEpg = ativa?.epgUrl ?? "";

  // Guarda as mudanças no armazenamento do navegador
  useEffect(() => {
    gravarPlaylists(playlists);
  }, [playlists]);

  useEffect(() => {
    gravarAtiva(ativaId);
  }, [ativaId]);

  // Baixa a lista quando o endereço muda ou quando o botão Atualizar é usado
  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro("");
    baixarLista(urlLista)
      .then((lista) => {
        if (!cancelado) setCanais(lista);
      })
      .catch((e) => {
        if (!cancelado) {
          setCanais([]);
          setErro(mensagemDeErro(e));
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true; // descarta respostas de endereços antigos
    };
  }, [urlLista, recarga]);

  // O guia (EPG) tem o seu próprio carregamento, que não trava a lista
  useEffect(() => {
    setEpg(null);
    setAvisoEpg("");
    if (!urlEpg) return;

    let cancelado = false;
    baixarEpg(urlEpg)
      .then((guia) => {
        if (!cancelado) setEpg(guia);
      })
      .catch((e) => {
        if (!cancelado) setAvisoEpg("Guia (EPG): " + mensagemDeErro(e));
      });
    return () => {
      cancelado = true;
    };
  }, [urlEpg, recarga]);

  useEffect(() => {
    if (!mostrarTeclas) return;
    const registrar = (e: KeyboardEvent) =>
      setUltimaTecla(`key=${e.key}  keyCode=${e.keyCode}`);
    window.addEventListener("keydown", registrar);
    return () => window.removeEventListener("keydown", registrar);
  }, []);

  function salvarPlaylist(p: Playlist) {
    setPlaylists((lista) =>
      lista.some((x) => x.id === p.id)
        ? lista.map((x) => (x.id === p.id ? p : x))
        : [...lista, p]
    );
    setAtivaId((a) => a ?? p.id); // a primeira lista salva já fica conectada
  }

  function apagarPlaylist(id: string) {
    const restantes = playlists.filter((p) => p.id !== id);
    setPlaylists(restantes);
    if (ativaId === id) setAtivaId(restantes[0]?.id ?? null);
  }

  function atualizarPlaylist(id: string) {
    if (id === ativaId) setRecarga((n) => n + 1); // já conectada: baixa de novo
    else setAtivaId(id); // outra lista: conectar já baixa
  }

  async function aoEscolherArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setCanais(parseM3U(await arquivo.text()));
    setErro("");
  }

  return (
    <HashRouter>
      <div className="app">
        <header className="barra">
          <h1>Xique-Xique APP</h1>
          <span className="nome-lista">
            {carregando ? "Carregando…" : ativa ? ativa.nome : "Lista de exemplo"}
          </span>
          <button className="botao" data-nav onClick={() => arquivoRef.current?.click()}>
            Abrir arquivo
          </button>
          <input
            ref={arquivoRef}
            type="file"
            accept=".m3u,.m3u8,text/plain"
            onChange={aoEscolherArquivo}
            hidden
          />
        </header>

        {erro && <p className="erro">{erro}</p>}
        {avisoEpg && <p className="erro">{avisoEpg}</p>}

        <Routes>
          <Route path="/" element={<Menu canais={canais} totalPlaylists={playlists.length} />} />
          <Route
            path="/playlists"
            element={
              <Playlists
                playlists={playlists}
                ativaId={ativaId}
                carregando={carregando}
                aoSalvar={salvarPlaylist}
                aoApagar={apagarPlaylist}
                aoConectar={setAtivaId}
                aoAtualizar={atualizarPlaylist}
              />
            }
          />
          <Route path="/:secao" element={<Secao canais={canais} epg={epg} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {mostrarTeclas && <div className="teclas">Última tecla: {ultimaTecla || "—"}</div>}
      </div>
    </HashRouter>
  );
}