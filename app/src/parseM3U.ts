import type { Canal, Tipo } from "./types";

function pegarAtributo(linha: string, nome: string): string {
  const achou = linha.match(new RegExp(`${nome}="([^"]*)"`));
  return achou ? achou[1] : "";
}

function classificar(grupo: string): Tipo {
  const g = grupo.toLowerCase();
  if (/\b(filmes?|movies?)\b/.test(g)) return "filmes";
  if (/\b(s[eé]ries?)\b/.test(g)) return "series";
  return "aovivo";
}

export function parseM3U(texto: string): Canal[] {
  const canais: Canal[] = [];
  let pendente: { nome: string; grupo: string; logo: string; epgId: string } | null = null;

  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.trim();

    if (linha.startsWith("#EXTINF")) {
      const fimAtributos = linha.lastIndexOf('"');
      const virgula = linha.indexOf(",", fimAtributos >= 0 ? fimAtributos : 0);
      pendente = {
        nome: virgula >= 0 ? linha.slice(virgula + 1).trim() : "Sem nome",
        grupo: pegarAtributo(linha, "group-title") || "Sem grupo",
        logo: pegarAtributo(linha, "tvg-logo"),
        epgId: pegarAtributo(linha, "tvg-id"),
      };
    } else if (linha !== "" && !linha.startsWith("#") && pendente) {
      canais.push({
        id: canais.length,
        ...pendente,
        url: linha,
        tipo: classificar(pendente.grupo),
      });
      pendente = null;
    }
  }

  return canais;
}