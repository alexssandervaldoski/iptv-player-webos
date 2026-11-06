import { useMemo } from "react";
import { Navigate, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import type { Canal, Tipo } from "./types";
import { SECOES } from "./secoes";

export interface ContextoSecao {
  secao: Tipo;
  canais: Canal[];
}

interface Props {
  canais: Canal[];
}

export default function Secao({ canais }: Props) {
  const { secao } = useParams();
  const navigate = useNavigate();
  const atual = SECOES.find((s) => s.id === secao);

  const doTipo = useMemo(
    () => canais.filter((c) => c.tipo === atual?.id),
    [canais, atual]
  );

  // Endereço inválido (ex.: #/abc): volta ao menu
  if (!atual) return <Navigate to="/" replace />;

  const contexto: ContextoSecao = { secao: atual.id, canais: doTipo };

  return (
    <div className="pagina">
      <nav className="barra-secao">
        <button className="botao" data-nav onClick={() => navigate("/")}>
          ← Menu
        </button>

        <div className="abas">
          {SECOES.map((s) => (
            <NavLink
              key={s.id}
              to={"/" + s.id}
              data-nav
              className={({ isActive }) => "aba" + (isActive ? " ativa" : "")}
            >
              {s.icone} {s.rotulo}
            </NavLink>
          ))}
        </div>

        <span className="contagem">{doTipo.length} itens</span>
      </nav>

      <Outlet context={contexto} />
    </div>
  );
}