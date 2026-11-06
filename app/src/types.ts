export type Tipo = "aovivo" | "filmes" | "series";

export type Canal = {
  id: number;
  nome: string;
  grupo: string;
  logo: string;
  epgId: string;
  url: string;
  tipo: Tipo;
};

export type Variante = {
  id: number;
  nome: string;
  url: string;
};

export type Entrada = {
  id: number;
  nome: string;
  grupo: string;
  logo: string;
  variantes: Variante[];
  favorito?: boolean;
};

export type Programa = {
  titulo: string;
  descricao?: string;
  inicio: number;
  fim: number;
};

export type Epg = {
  porId: Map<string, Programa[]>;
};

export type ModoPlaylist = "xtream" | "url";

export type Playlist = {
  id: string;
  nome: string;
  modo: ModoPlaylist;
  host: string;
  usuario: string;
  senha: string;
  url: string;
  epgUrl?: string;
};