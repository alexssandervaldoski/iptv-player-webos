import { parseM3U } from "./parseM3U";
import { parseEpg } from "./epg";
import type { Canal, Epg } from "./types";

async function buscar(url: string): Promise<ArrayBuffer> {
  const resposta = await fetch(url, { cache: "no-cache" });
  if (!resposta.ok) throw new Error("HTTP " + resposta.status);
  return resposta.arrayBuffer();
}

async function baixarBytes(url: string): Promise<ArrayBuffer> {
  try {
    return await buscar(url);
  } catch (e) {
    // Em desenvolvimento, tenta de novo pelo servidor local (contorna o CORS)
    if (import.meta.env.DEV && e instanceof TypeError && /^https?:\/\//i.test(url)) {
      return buscar("/proxy?url=" + encodeURIComponent(url));
    }
    throw e;
  }
}

async function paraTexto(dados: ArrayBuffer): Promise<string> {
  const inicio = new Uint8Array(dados, 0, Math.min(2, dados.byteLength));
  const ehGzip = inicio.length === 2 && inicio[0] === 0x1f && inicio[1] === 0x8b;
  if (!ehGzip) return new TextDecoder().decode(dados);

  if (typeof DecompressionStream === "undefined") {
    throw new Error("Este navegador não descompacta arquivos .gz. Use um guia em .xml.");
  }
  const fluxo = new Blob([dados]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(fluxo).text();
}

export async function baixarLista(url: string): Promise<Canal[]> {
  const texto = await paraTexto(await baixarBytes(url));
  if (!texto.includes("#EXTINF")) {
    throw new Error("O endereço não parece ser uma lista M3U.");
  }
  return parseM3U(texto);
}

export async function baixarEpg(url: string): Promise<Epg> {
  return parseEpg(await paraTexto(await baixarBytes(url)));
}

export function mensagemDeErro(e: unknown): string {
  if (e instanceof TypeError) {
    return "Não foi possível baixar (sem internet, endereço fora do ar ou bloqueio de CORS).";
  }
  return e instanceof Error ? e.message : "Erro desconhecido.";
}