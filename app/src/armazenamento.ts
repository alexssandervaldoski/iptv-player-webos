import type { Playlist } from "./types";
import { migrar } from "./playlist";

const CHAVE_PLAYLISTS = "cinebeco:playlists";
const CHAVE_ATIVA = "cinebeco:ativa";

export function lerPlaylists(): Playlist[] {
  try {
    const bruto = localStorage.getItem(CHAVE_PLAYLISTS);
    if (!bruto) return [];
    const lista = JSON.parse(bruto);
    if (!Array.isArray(lista)) return [];
    return lista.map(migrar).filter((p): p is Playlist => Boolean(p));
  } catch {
    return [];
  }
}

export function gravarPlaylists(lista: Playlist[]) {
  try {
    localStorage.setItem(CHAVE_PLAYLISTS, JSON.stringify(lista));
  } catch {
    // storage cheio ou bloqueado: ignora
  }
}

export function lerAtiva(): string | null {
  try {
    return localStorage.getItem(CHAVE_ATIVA);
  } catch {
    return null;
  }
}

export function gravarAtiva(id: string | null) {
  try {
    if (id) localStorage.setItem(CHAVE_ATIVA, id);
    else localStorage.removeItem(CHAVE_ATIVA);
  } catch {
    // ignora
  }
}