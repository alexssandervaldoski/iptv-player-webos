import { useNavigate } from "react-router-dom";
import type { Canal } from "./types";
import { SECOES } from "./secoes";
import { useNavegacao } from "./useNavegacao";

interface Props {
  canais: Canal[];
  totalPlaylists: number;
}

export default function Menu({ canais, totalPlaylists }: Props) {
  const navigate = useNavigate();
  useNavegacao(() => false);

  return (
    <main className="menu">
      {SECOES.map((s) => (
        <button
          key={s.id}
          className={"card-menu card-" + s.id}
          data-nav
          onClick={() => navigate("/" + s.id)}
        >
          <span className="icone">{s.icone}</span>
          <strong>{s.rotulo}</strong>
          <span>{canais.filter((c) => c.tipo === s.id).length} itens</span>
        </button>
      ))}

      <button
        className="card-menu card-playlists"
        data-nav
        onClick={() => navigate("/playlists")}
      >
        <span className="icone">📋</span>
        <strong>Playlists</strong>
        <span>{totalPlaylists} salvas</span>
      </button>
    </main>
  );
}