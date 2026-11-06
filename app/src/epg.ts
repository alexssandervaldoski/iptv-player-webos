import type { Canal, Epg, Programa } from "./types";
import { nomeBase } from "./texto";

// Datas do XMLTV: "20261106180000 -0300"
function parseData(texto: string): number {
  const m = texto.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/);
  if (!m) return NaN;
  const [, ano, mes, dia, hora, min, seg, desvio] = m;
  const fuso = desvio ? `${desvio.slice(0, 3)}:${desvio.slice(3)}` : "Z";
  return Date.parse(`${ano}-${mes}-${dia}T${hora}:${min}:${seg}${fuso}`);
}

export function parseEpg(xml: string): Epg {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("O guia (EPG) não é um XML válido.");
  }

  // Nome do canal no guia -> id do canal no guia
  const idPorNome = new Map<string, string>();
  for (const canal of doc.querySelectorAll("channel")) {
    const id = canal.getAttribute("id");
    if (!id) continue;
    for (const nome of canal.querySelectorAll("display-name")) {
      const chave = nomeBase(nome.textContent ?? "");
      if (chave && !idPorNome.has(chave)) idPorNome.set(chave, id);
    }
  }

  // Guardamos só uma janela de tempo (2h atrás até 24h à frente) para economizar memória
  const agora = Date.now();
  const de = agora - 2 * 3600000;
  const ate = agora + 24 * 3600000;
  const porId = new Map<string, Programa[]>();

  for (const p of doc.querySelectorAll("programme")) {
    const id = p.getAttribute("channel");
    const inicio = parseData(p.getAttribute("start") ?? "");
    const fim = parseData(p.getAttribute("stop") ?? "");
    if (!id || Number.isNaN(inicio) || Number.isNaN(fim)) continue;
    if (fim < de || inicio > ate) continue;

    const programa: Programa = {
      inicio,
      fim,
      titulo: p.querySelector("title")?.textContent?.trim() || "Sem título",
      descricao: p.querySelector("desc")?.textContent?.trim() || "",
    };
    const lista = porId.get(id);
    if (lista) lista.push(programa);
    else porId.set(id, [programa]);
  }

  for (const lista of porId.values()) lista.sort((a, b) => a.inicio - b.inicio);
  return { porId, idPorNome };
}

// Acha o id do canal no guia: primeiro pelo tvg-id, depois pelo nome
export function epgIdDe(variantes: Canal[], epg: Epg): string | null {
  for (const v of variantes) {
    if (v.epgId && epg.porId.has(v.epgId)) return v.epgId;
  }
  for (const v of variantes) {
    const id = epg.idPorNome.get(nomeBase(v.nome));
    if (id && epg.porId.has(id)) return id;
  }
  return null;
}

export function programaAgora(
  lista: Programa[],
  agora: number
): { atual: Programa | null; proximo: Programa | null } {
  let atual: Programa | null = null;
  let proximo: Programa | null = null;

  for (const p of lista) {
    if (p.inicio <= agora && agora < p.fim) {
      atual = p;
    } else if (p.inicio > agora) {
      proximo = p;
      break;
    }
  }
  return { atual, proximo };
}