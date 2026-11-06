import type { Canal, Tipo } from "./types";

function pegarAtributo(linha: string, nome: string): string {
  const achou = linha.match(new RegExp(`${nome}="([^"]*)"`));
  return achou ? achou[1] : "";
}

// Remove acentos para comparar sem depender de grafia
function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Grupos que claramente são de canais ao vivo
const PREFIXOS_AOVIVO = ["canais", "canal", "tv", "ao vivo", "aovivo", "live"];

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
  "classicos",
  "legendado",
  "dublado",
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
];

// Extensões típicas de arquivo (filmes e séries), não de stream ao vivo
const EXTENSOES_ARQUIVO = /\.(mp4|mkv|avi|mov|wmv|flv|webm|m4v)(\?|$)/i;

// Extensões típicas de stream ao vivo
const EXTENSOES_STREAM = /\.(ts|m3u8)(\?|$)/i;

function classificar(grupo: string, nome: string, url: string): Tipo {
  const g = semAcento(grupo.toLowerCase());
  const n = semAcento(nome.toLowerCase());

  // 1. Prefixo "Canais |" ou similar → sempre ao vivo, independente do resto
  const primeiroTermo = g.split(/[|\-–—/:>]/)[0].trim();
  if (PREFIXOS_AOVIVO.some((p) => primeiroTermo === p || primeiroTermo.startsWith(p + " "))) {
    return "aovivo";
  }

  // 2. Padrão S01E01 ou "temporada" no nome → série
  if (/\bS\d{1,2}\s*E\d{1,2}\b/i.test(nome)) return "series";
  if (/\b(temporada|season)\b/i.test(n)) return "series";

  // 3. Palavras de série no grupo → série
  if (PALAVRAS_SERIE.some((p) => g.includes(p))) return "series";

  // 4. URL com extensão de arquivo → filme (a menos que já caiu em série)
  if (EXTENSOES_ARQUIVO.test(url)) return "filmes";

  // 5. Palavras de filme no grupo → filme
  if (PALAVRAS_FILME.some((p) => g.includes(p))) return "filmes";

  // 6. URL de stream ao vivo → ao vivo
  if (EXTENSOES_STREAM.test(url)) return "aovivo";

  // 7. Sem sinal claro: ao vivo (comportamento padrão)
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
        tipo: classificar(pendente.grupo, pendente.nome, linha),
      });
      pendente = null;
    }
  }
  return canais;
}