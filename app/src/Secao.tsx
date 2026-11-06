import { useMemo } from "react";
import { Navigate, NavLink, useNavigate, useParams } from "react-router-dom";
import type { Canal, Epg } from "./types";
import { SECOES } from "./secoes";
import Painel from "./Painel";
import { useFavoritos } from "./favoritos";

interface Props {
  canais: Canal[];
  epg: Epg | null;
}

function chaveNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export default function Secao({ canais, epg }: Props) {
  const { secao } = useParams();
  const navigate = useNavigate();
  const { favoritos } = useFavoritos();
  const atual = SECOES.find((s) => s.id === secao);

  const doTipo = useMemo(
    () => canais.filter((c) => c.tipo === atual?.id),
    [canais, atual]
  );

  const favoritosAqui = useMemo(() => {
    const urls = new Set(canais.map((c) => c.url));
    const nomes = new Set(canais.map((c) => chaveNome(c.nome)));
    return favoritos.filter(
      (f) => urls.has(f.url) || nomes.has(chaveNome(f.nome))
    ).length;
  }, [favoritos, canais]);

  if (!atual) return <Navigate to="/" replace />;

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

          <NavLink
            to="/favoritos"
            data-nav
            className={({ isActive }) => "aba" + (isActive ? " ativa" : "")}
          >
            ★ Favoritos{favoritosAqui > 0 ? ` (${favoritosAqui})` : ""}
          </NavLink>
        </div>

        <span className="contagem">{doTipo.length} itens</span>
      </nav>

      <Painel key={atual.id} canais={doTipo} epg={epg} />
    </div>
  );
}