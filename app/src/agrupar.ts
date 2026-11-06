import type { Canal, Entrada } from "./types";
import { nomeBase, nomeLimpo, pesoQualidade } from "./texto";

// Junta as versões do mesmo canal (mesma seção, mesmo grupo e mesmo nome base)
export function agruparVariantes(canais: Canal[], agrupar: boolean): Entrada[] {
  const mapa = new Map<string, Canal[]>();

  for (const c of canais) {
    const base = nomeBase(c.nome) || String(c.id);
    const chave = agrupar ? `${c.tipo}|${c.grupo}|${base}` : String(c.id);
    const lista = mapa.get(chave);
    if (lista) lista.push(c);
    else mapa.set(chave, [c]);
  }

  return [...mapa.values()].map((variantes) => {
    // A melhor qualidade fica primeiro e é a que toca por padrão
    const ordenadas = [...variantes].sort(
      (a, b) => pesoQualidade(b.nome) - pesoQualidade(a.nome)
    );
    const principal = ordenadas[0];
    return {
      id: principal.id,
      nome: nomeLimpo(principal.nome),
      grupo: principal.grupo,
      logo: ordenadas.find((v) => v.logo)?.logo ?? "",
      tipo: principal.tipo,
      variantes: ordenadas,
    };
  });
}