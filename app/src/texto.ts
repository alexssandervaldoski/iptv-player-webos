// Etiquetas como [HD], (1080p) ou [24H], que não fazem parte do nome do canal
const ETIQUETA = /[\[(]\s*(4k|uhd|fhd|hd|sd|h265|hevc|h264|(?:2160|1080|720|576|480)p?|24h|24hr)\s*[\])]/gi;
const QUALIDADE_SOLTA = /\b(4k|uhd|fhd|hd|sd|hevc|h265|h264|(?:2160|1080|720|576|480)p)\b/g;

// Só as etiquetas de qualidade, para mostrar um nome limpo na tela
const ETIQUETA_QUALIDADE = /\s*[\[(]\s*(4k|uhd|fhd|hd|sd|h265|hevc|h264|(?:2160|1080|720|576|480)p?)\s*[\])]/gi;

// minúsculas, sem acento e sem símbolos
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(ETIQUETA, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// O "miolo" do nome: sem qualidade, para comparar versões do mesmo canal
export function nomeBase(texto: string): string {
  return normalizar(texto).replace(QUALIDADE_SOLTA, " ").replace(/\s+/g, " ").trim();
}

export function nomeLimpo(nome: string): string {
  return nome.replace(ETIQUETA_QUALIDADE, " ").replace(/\s+/g, " ").trim();
}

// Devolve "FHD", "HD", "SD", "1080P"... ou "" se o nome não tiver qualidade
export function qualidade(nome: string): string {
  const achou =
    nome.match(/\b(4k|uhd|fhd|hd|sd)\b/i) ?? nome.match(/\b(2160|1080|720|576|480)p?\b/i);
  if (!achou) return "";
  const q = achou[1].toUpperCase();
  return /^\d/.test(q) ? q + "P" : q;
}

const PESO: Record<string, number> = {
  "4K": 5, UHD: 5, "2160P": 5,
  FHD: 4, "1080P": 4,
  HD: 3, "720P": 3,
  SD: 2, "576P": 2, "480P": 2,
};

export function pesoQualidade(nome: string): number {
  return PESO[qualidade(nome)] ?? 0;
}