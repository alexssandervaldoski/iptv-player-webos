import type { Playlist } from "./types";
import { migrar } from "./playlist";

const CHAVE_PLAYLISTS = "cinebeco.playlists";
const CHAVE_ATIVA = "cinebeco.ativa";

// localStorage pode falhar no webOS (contexto restrito, cota cheia, modo privado)
function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string): void {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // silencioso: o app continua funcionando sem persistência
  }
}

export function lerPlaylists(): Playlist[] {
  const bruto = ler(CHAVE_PLAYLISTS);
  if (!bruto) return [];

  try {
    const lista = JSON.parse(bruto);
    if (!Array.isArray(lista)) return [];
    return lista
      .map(migrar)
      .filter((p): p is Playlist => p !== null);
  } catch {
    return [];
  }
}

export function gravarPlaylists(lista: Playlist[]): void {
  try {
    gravar(CHAVE_PLAYLISTS, JSON.stringify(lista));
  } catch {
    // JSON.stringify pode falhar com referências circulares
  }
}

export function lerAtiva(): string | null {
  return ler(CHAVE_ATIVA);
}

export function gravarAtiva(id: string | null): void {
  if (id === null) {
    try {
      localStorage.removeItem(CHAVE_ATIVA);
    } catch {
      // silencioso
    }
    return;
  }
  gravar(CHAVE_ATIVA, id);
}