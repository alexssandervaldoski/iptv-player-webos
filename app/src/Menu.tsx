import { useEffect, useMemo } from "react";
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

function chaveNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

  // Quantos favoritos existem de fato na playlist carregada
  const favoritosAqui = useMemo(() => {
    const urls = new Set(canais.map((c) => c.url));
    const nomes = new Set(canais.map((c) => chaveNome(c.nome)));
    return favoritos.filter(
      (f) => urls.has(f.url) || nomes.has(chaveNome(f.nome))
    ).length;
  }, [favoritos, canais]);

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
        <span>{favoritosAqui} salvos</span>
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