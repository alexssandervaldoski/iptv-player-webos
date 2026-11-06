import type { Playlist } from "./types";

const CHAVE_PLAYLISTS = "xique2:playlists";
const CHAVE_ATIVA = "xique2:playlist-ativa";
const CHAVE_ANTIGA = "xique:url-lista"; // versão anterior: um endereço só

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, valor);
  } catch {
    // sem armazenamento disponível: segue sem lembrar
  }
}

export function lerPlaylists(): Playlist[] {
  const texto = ler(CHAVE_PLAYLISTS);
  if (texto) {
    try {
      const dados = JSON.parse(texto);
      if (Array.isArray(dados)) return dados as Playlist[];
    } catch {
      // dados corrompidos: ignora
    }
  }
  const antiga = ler(CHAVE_ANTIGA);
  if (antiga) return [{ id: "importada", nome: "Minha lista", url: antiga, epgUrl: "" }];
  return [];
}

export function gravarPlaylists(lista: Playlist[]) {
  gravar(CHAVE_PLAYLISTS, JSON.stringify(lista));
}

export function lerAtiva(): string | null {
  return ler(CHAVE_ATIVA);
}

export function gravarAtiva(id: string | null) {
  gravar(CHAVE_ATIVA, id);
}