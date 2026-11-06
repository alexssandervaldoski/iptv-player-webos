import { useEffect, useState } from "react";

const CHAVE = "cinebeco:favoritos";

// Um favorito é identificado pela URL do canal — funciona entre playlists
export type Favorito = {
  url: string;
  nome: string;
  grupo: string;
  logo?: string;
};

function ler(): Favorito[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function gravar(lista: Favorito[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    // storage cheio ou bloqueado: ignora
  }
}

// Estado compartilhado entre componentes da mesma aba
let cache: Favorito[] = ler();
const ouvintes = new Set<(f: Favorito[]) => void>();

function notificar() {
  // Cópia nova a cada notificação: garante que o React veja a mudança
  const copia = [...cache];
  for (const fn of ouvintes) fn(copia);
}

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<Favorito[]>(() => [...cache]);

  useEffect(() => {
    ouvintes.add(setFavoritos);
    return () => {
      ouvintes.delete(setFavoritos);
    };
  }, []);

  function alternar(f: Favorito) {
    const existe = cache.some((x) => x.url === f.url);
    cache = existe ? cache.filter((x) => x.url !== f.url) : [...cache, f];
    gravar(cache);
    notificar();
  }

  function remover(url: string) {
    cache = cache.filter((x) => x.url !== url);
    gravar(cache);
    notificar();
  }

  function limpar() {
    cache = [];
    gravar(cache);
    notificar();
  }

  const ehFavorito = (url: string) => favoritos.some((x) => x.url === url);

  return { favoritos, alternar, remover, limpar, ehFavorito };
}