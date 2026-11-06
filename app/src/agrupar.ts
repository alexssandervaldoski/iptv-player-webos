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
  const ordenadas = [...variantes].sort(
    (a, b) => pesoQualidade(b.nome) - pesoQualidade(a.nome)
  );
  const melhor = ordenadas[0];

  return {
    id: melhor.id,
    nome: nomeLimpo(melhor.nome),
    grupo: melhor.grupo,
    logo: melhor.logo,
    variantes: ordenadas.map((c) => ({
      id: c.id,
      nome: c.nome,
      url: c.url,
    })),
  };
});
}