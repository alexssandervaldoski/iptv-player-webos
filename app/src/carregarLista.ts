import { gunzipSync } from "fflate";
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
  const bytes = new Uint8Array(dados);

  // Gzip: assinatura 1f 8b
  if (bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    // WebOS não tem DecompressionStream: usa fflate como fallback
    if (typeof DecompressionStream === "undefined") {
      return new TextDecoder().decode(gunzipSync(bytes));
    }
    const fluxo = new Blob([dados]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(fluxo).text();
  }

  return new TextDecoder().decode(bytes);
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
    return "Não foi possível acessar o endereço (rede ou CORS).";
  }
  if (e instanceof Error) return e.message;
  return "Erro desconhecido.";
}