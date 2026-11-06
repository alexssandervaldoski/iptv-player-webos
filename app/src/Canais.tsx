import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { Canal } from "./types";
import type { ContextoSecao } from "./Secao";
import Player from "./Player";
import { useNavegacao } from "./useNavegacao";

export default function Canais() {
  const { secao, canais } = useOutletContext<ContextoSecao>();
  const { nome } = useParams(); // o grupo vem do endereço
  const grupo = nome ?? "Todos";
  const navigate = useNavigate();

  const [busca, setBusca] = useState("");
  const [atual, setAtual] = useState<Canal | null>(null);

  const visiveis = useMemo(
    () =>
      canais.filter(
        (c) =>
          (grupo === "Todos" || c.grupo === grupo) &&
          c.nome.toLowerCase().includes(busca.toLowerCase())
      ),
    [canais, grupo, busca]
  );

  // Voltar: se há algo tocando, para; senão, volta às categorias da seção
  useNavegacao(() => {
    if (atual) {
      setAtual(null);
    } else {
      navigate("/" + secao);
    }
    return true;
  });

  // Teclas de canal: CH+ vai para o próximo, CH- para o anterior
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
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

  return (
    <div className="pagina">
      <div className="topo-pagina">
        <button className="botao" data-nav onClick={() => navigate("/" + secao)}>
          ← Categorias
        </button>
        <h2>{grupo}</h2>
        <span className="contagem">{visiveis.length} itens</span>
      </div>

      <main className="conteudo-canais">
        <section className="coluna">
          <input
            className="busca"
            data-nav
            placeholder="Pesquisar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
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
            {visiveis.length === 0 && <li className="vazio">Nada encontrado</li>}
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
            <p className="vazio">Selecione um item para assistir.</p>
          )}
        </section>
      </main>
    </div>
  );
}