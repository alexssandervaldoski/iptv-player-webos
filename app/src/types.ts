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

// Uma lista salva pelo usuário
export interface Playlist {
  id: string;
  nome: string;
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

// Um item da tela: um canal, com uma ou mais versões (FHD, HD, SD...)
export interface Entrada {
  id: number;
  nome: string;
  grupo: string;
  logo: string;
  tipo: Tipo;
  variantes: Canal[];
}