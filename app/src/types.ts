export type Tipo = "aovivo" | "filmes" | "series";

export interface Canal {
  id: number;
  nome: string;
  grupo: string;
  logo: string;
  url: string;
  tipo: Tipo;
}