export type Tipo = "aovivo" | "filmes" | "series";

export interface Canal {
  id: number;
  nome: string;
  grupo: string;
  logo: string;
  url: string;
  tipo: Tipo;
  epgId: string;
}

export type ModoPlaylist = "xtream" | "url";

// Uma lista salva pelo usuário
export interface Playlist {
  id: string;
  nome: string;
  modo: ModoPlaylist;
  host: string;
  usuario: string;
  senha: string;
  url: string;
  epgUrl: string;
}

export interface Programa {
  inicio: number; // milissegundos desde 1970
  fim: number;
  titulo: string;
  descricao: string;
}

export interface Epg {
  porId: Map<string, Programa[]>;
  idPorNome: Map<string, string>;
}

// Uma versão do canal (FHD, HD, SD...)
export interface Variante {
  id: number;
  nome: string;
  url: string;
}

// Um item da tela: um canal, com uma ou mais versões
export interface Entrada {
  id: number;
  nome: string;
  grupo: string;
  logo: string;
  variantes: Variante[];
  favorito?: boolean;
}