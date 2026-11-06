import type { Canal, Tipo } from "./types";

function pegarAtributo(linha: string, nome: string): string {
  const achou = linha.match(new RegExp(`${nome}="([^"]*)"`));
  return achou ? achou[1] : "";
}

// Palavras que indicam filme no nome do grupo
const PALAVRAS_FILME = [
  "filme",
  "filmes",
  "movie",
  "movies",
  "vod",
  "lancamento",
  "lancamentos",
  "cinema",
  "acao",
  "comedia",
  "drama",
  "terror",
  "suspense",
  "aventura",
  "animacao",
  "documentario",
  "romance",
  "ficcao",
  "guerra",
  "policial",
  "misterio",
  "fantasia",
  "familia",
  "classicos",
  "legendado",
  "dublado",
  "4k",
  "uhd",
];

// Palavras que indicam série no nome do grupo
const PALAVRAS_SERIE = [
  "serie",
  "series",
  "seriado",
  "seriados",
  "temporada",
  "temporadas",
  "novela",
  "novelas",
  "sitcom",
  "anime",
  "animes",
  "desenho",
  "desenhos",
  "infantil",
  "kids",
];

// Remove acentos para comparar sem depender de grafia
function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function classificar(grupo: string, nome: string): Tipo {
  const g = semAcento(grupo.toLowerCase());
  const n = semAcento(nome.toLowerCase());

  // Séries primeiro: "Série" tem prioridade sobre "Ação", por exemplo
  if (PALAVRAS_SERIE.some((p) => g.includes(p))) return "series";
  if (PALAVRAS_FILME.some((p) => g.includes(p))) return "filmes";

  // Sem grupo reconhecível, tenta pelo nome do item
  if (/\bS\d{1,2}\s*E\d{1,2}\b/i.test(nome)) return "series";
  if (/\b(temporada|season)\b/i.test(n)) return "series";

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
        tipo: classificar(pendente.grupo, pendente.nome),
      });
      pendente = null;
    }
  }
  return canais;
}