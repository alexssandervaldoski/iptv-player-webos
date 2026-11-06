import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Canal } from "./types";
import { SECOES } from "./secoes";
import { useNavegacao } from "./useNavegacao";
import { useFocoEspacial, focarPrimeiro } from "./useFocoEspacial";
import { useFavoritos } from "./favoritos";

interface Props {
  canais: Canal[];
  totalPlaylists: number;
}

export default function Menu({ canais, totalPlaylists }: Props) {
  const navigate = useNavigate();
  const { favoritos } = useFavoritos();
  useFocoEspacial();

  useNavegacao(() => false);

  useEffect(() => {
    const t = setTimeout(focarPrimeiro, 50);
    return () => clearTimeout(t);
  }, []);

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
        className="card-menu card-favoritos"
        data-nav
        onClick={() => navigate("/favoritos")}
      >
        <span className="icone">★</span>
        <strong>Favoritos</strong>
        <span>{favoritos.length} salvos</span>
      </button>

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