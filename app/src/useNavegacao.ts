import { useEffect, useRef } from "react";

const SELETOR = "[data-nav]";
const SETAS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

// Procura, entre os elementos navegáveis, o mais próximo na direção da seta
function achar(atual: HTMLElement, tecla: string): HTMLElement | null {
  const a = atual.getBoundingClientRect();
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;

  let melhor: HTMLElement | null = null;
  let menorPontuacao = Infinity;

  for (const el of document.querySelectorAll<HTMLElement>(SELETOR)) {
    if (el === atual) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    const dx = r.left + r.width / 2 - ax;
    const dy = r.top + r.height / 2 - ay;

    let principal: number; // distância na direção da seta
    let lateral: number;   // quanto está fora de linha
    if (tecla === "ArrowRight") { principal = dx; lateral = Math.abs(dy); }
    else if (tecla === "ArrowLeft") { principal = -dx; lateral = Math.abs(dy); }
    else if (tecla === "ArrowDown") { principal = dy; lateral = Math.abs(dx); }
    else { principal = -dy; lateral = Math.abs(dx); }

    if (principal <= 0) continue; // está do lado oposto

    const pontuacao = principal + lateral * 2;
    if (pontuacao < menorPontuacao) {
      menorPontuacao = pontuacao;
      melhor = el;
    }
  }
  return melhor;
}

// aoVoltar devolve true se tratou o "voltar" (aí o navegador não faz o padrão)
export function useNavegacao(aoVoltar: () => boolean) {
  const voltarRef = useRef(aoVoltar);
  useEffect(() => {
    voltarRef.current = aoVoltar; // mantém sempre a versão mais recente
  });

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      // Voltar: Esc no computador, tecla 461 no controle da LG
      if (e.key === "Escape" || e.key === "GoBack" || e.keyCode === 461) {
        if (voltarRef.current()) e.preventDefault();
        return;
      }

      if (!SETAS.includes(e.key)) return;

      const ativo = document.activeElement;

      // Nada focado ainda: a primeira seta foca o primeiro item
      if (!(ativo instanceof HTMLElement) || !ativo.matches(SELETOR)) {
        const primeiro = document.querySelector<HTMLElement>(SELETOR);
        if (primeiro) {
          primeiro.focus();
          e.preventDefault();
        }
        return;
      }

      // Na caixa de busca, esquerda/direita mexem no cursor do texto,
      // e só saem dela quando o cursor está na ponta
      if (ativo instanceof HTMLInputElement) {
        if (e.key === "ArrowLeft" && ativo.selectionStart !== 0) return;
        if (e.key === "ArrowRight" && ativo.selectionStart !== ativo.value.length) return;
      }

      const destino = achar(ativo, e.key);
      if (destino) destino.focus(); // focus() também rola a lista até o item
      e.preventDefault(); // impede a página de rolar sozinha com as setas
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);
}