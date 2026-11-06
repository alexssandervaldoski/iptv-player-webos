import { useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { ContextoSecao } from "./Secao";
import { useNavegacao } from "./useNavegacao";

export default function Categorias() {
  const { secao, canais } = useOutletContext<ContextoSecao>();
  const navigate = useNavigate();

  // Voltar nesta tela leva ao menu principal
  useNavegacao(() => {
    navigate("/");
    return true;
  });

  const grupos = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const c of canais) {
      contagem.set(c.grupo, (contagem.get(c.grupo) ?? 0) + 1);
    }
    const lista: [string, number][] = [...contagem];
    return lista;
  }, [canais]);

  return (
    <main className="grade-categorias">
      <button
        className="categoria"
        data-nav
        onClick={() => navigate(`/${secao}/Todos`)}
      >
        <strong>Todos</strong>
        <span>{canais.length} itens</span>
      </button>

      {grupos.map(([nome, qtd]) => (
        <button
          key={nome}
          className="categoria"
          data-nav
          onClick={() => navigate(`/${secao}/${encodeURIComponent(nome)}`)}
        >
          <strong>{nome}</strong>
          <span>{qtd} itens</span>
        </button>
      ))}

      {canais.length === 0 && (
        <p className="vazio">Nenhum item nesta seção. Verifique os nomes dos grupos da sua lista.</p>
      )}
    </main>
  );
}