import { useEffect } from "react";

type Direcao = "cima" | "baixo" | "esq" | "dir";

const SELETOR = "[data-nav]";

function focaveis(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(SELETOR)).filter(
    (el) => el.offsetParent !== null && !el.hasAttribute("disabled")
  );
}

function centro(r: DOMRect) {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Distância com peso no eixo secundário: prefere vizinhos alinhados
function distancia(a: DOMRect, b: DOMRect, dir: Direcao): number {
  const ca = centro(a);
  const cb = centro(b);
  const dx = cb.x - ca.x;
  const dy = cb.y - ca.y;

  if (dir === "dir" && dx <= 1) return Infinity;
  if (dir === "esq" && dx >= -1) return Infinity;
  if (dir === "baixo" && dy <= 1) return Infinity;
  if (dir === "cima" && dy >= -1) return Infinity;

  const horizontal = dir === "dir" || dir === "esq";
  const principal = horizontal ? Math.abs(dx) : Math.abs(dy);
  const secundario = horizontal ? Math.abs(dy) : Math.abs(dx);

  return principal + secundario * 2;
}

function mover(dir: Direcao): boolean {
  const atual = document.activeElement as HTMLElement | null;
  const lista = focaveis();
  if (lista.length === 0) return false;

  if (!atual || !lista.includes(atual)) {
    lista[0].focus();
    return true;
  }

  const rAtual = atual.getBoundingClientRect();
  let melhor: HTMLElement | null = null;
  let menor = Infinity;

  for (const el of lista) {
    if (el === atual) continue;
    const d = distancia(rAtual, el.getBoundingClientRect(), dir);
    if (d < menor) {
      menor = d;
      melhor = el;
    }
  }

  if (melhor) {
    melhor.focus();
    melhor.scrollIntoView({ block: "nearest", inline: "nearest" });
    return true;
  }
  return false;
}

const MAPA: Record<string, Direcao> = {
  ArrowUp: "cima",
  ArrowDown: "baixo",
  ArrowLeft: "esq",
  ArrowRight: "dir",
};

export function useFocoEspacial() {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement;
      if (alvo.tagName === "INPUT" && alvo.getAttribute("type") !== "button") {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") return;
      }

      const dir = MAPA[e.key];
      if (!dir) return;

      if (mover(dir)) e.preventDefault();
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);
}

// Foca o primeiro elemento focável da tela
export function focarPrimeiro() {
  const lista = focaveis();
  if (lista.length > 0) lista[0].focus();
}