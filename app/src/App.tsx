import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { parseM3U } from "./parseM3U";
import type { Canal } from "./types";
import Menu from "./Menu";
import Secao from "./Secao";
import Categorias from "./Categorias";
import Canais from "./Canais";
import "./App.css";

// Abra com ?teclas no endereço para ver o código de cada tecla apertada
const mostrarTeclas = new URLSearchParams(window.location.search).has("teclas");

export default function App() {
  const [canais, setCanais] = useState<Canal[]>([]);
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

  useEffect(() => {
    if (!mostrarTeclas) return;
    const registrar = (e: KeyboardEvent) =>
      setUltimaTecla(`key=${e.key}  keyCode=${e.keyCode}`);
    window.addEventListener("keydown", registrar);
    return () => window.removeEventListener("keydown", registrar);
  }, []);

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
        </header>

        {erro && <p className="erro">{erro}</p>}

        <Routes>
          <Route path="/" element={<Menu canais={canais} />} />
          <Route path="/:secao" element={<Secao canais={canais} />}>
            <Route index element={<Categorias />} />
            <Route path=":nome" element={<Canais />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {mostrarTeclas && <div className="teclas">Última tecla: {ultimaTecla || "—"}</div>}
      </div>
    </HashRouter>
  );
}