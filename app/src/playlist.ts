import type { Playlist } from "./types";

// Remove barra final e espaços do host
export function limparHost(host: string): string {
  return host.trim().replace(/\/+$/, "");
}

// Monta a URL da lista no padrão Xtream Codes
export function montarUrlXtream(host: string, usuario: string, senha: string): string {
  const h = limparHost(host);
  if (!h) return "";
  const u = encodeURIComponent(usuario.trim());
  const p = encodeURIComponent(senha.trim());
  return `${h}/get.php?username=${u}&password=${p}&type=m3u_plus&output=ts`;
}

// Monta a URL do guia de programação
export function montarEpgXtream(host: string, usuario: string, senha: string): string {
  const h = limparHost(host);
  if (!h) return "";
  const u = encodeURIComponent(usuario.trim());
  const p = encodeURIComponent(senha.trim());
  return `${h}/xmltv.php?username=${u}&password=${p}`;
}

// Recalcula url e epgUrl a partir do modo escolhido
export function recalcular(p: Playlist): Playlist {
  if (p.modo === "xtream") {
    return {
      ...p,
      url: montarUrlXtream(p.host, p.usuario, p.senha),
      epgUrl: montarEpgXtream(p.host, p.usuario, p.senha),
    };
  }
  return p;
}

// Converte uma playlist antiga (só url) para o formato novo
export function migrar(bruta: unknown): Playlist | null {
  if (!bruta || typeof bruta !== "object") return null;
  const p = bruta as Partial<Playlist> & { url?: string };

  if (!p.id || !p.url) return null;

  // Já está no formato novo
  if (p.modo === "xtream" || p.modo === "url") {
    return {
      id: p.id,
      nome: p.nome ?? "Playlist",
      modo: p.modo,
      host: p.host ?? "",
      usuario: p.usuario ?? "",
      senha: p.senha ?? "",
      url: p.url,
      epgUrl: p.epgUrl ?? "",
    };
  }

  // Formato antigo: tenta extrair host, usuário e senha da URL
  const achou = p.url.match(
    /^(https?:\/\/[^/]+)\/get\.php\?username=([^&]+)&password=([^&]+)/i
  );

  if (achou) {
    const host = achou[1];
    const usuario = decodeURIComponent(achou[2]);
    const senha = decodeURIComponent(achou[3]);
    return {
      id: p.id,
      nome: p.nome ?? "Playlist",
      modo: "xtream",
      host,
      usuario,
      senha,
      url: p.url,
      epgUrl: montarEpgXtream(host, usuario, senha),
    };
  }

  // Não é Xtream: mantém como URL crua
  return {
    id: p.id,
    nome: p.nome ?? "Playlist",
    modo: "url",
    host: "",
    usuario: "",
    senha: "",
    url: p.url,
    epgUrl: p.epgUrl ?? "",
  };
}