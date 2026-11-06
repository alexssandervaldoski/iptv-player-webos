import { useEffect, useRef } from "react";

// Teclas de voltar em TVs: Backspace, Escape e o código 461 do webOS
const VOLTAR = new Set(["Backspace", "Escape", "GoBack", "BrowserBack"]);

// aoVoltar devolve true se tratou o "voltar" (aí o navegador não faz o padrão)
export function useNavegacao(aoVoltar: () => boolean) {
  const voltarRef = useRef(aoVoltar);

  useEffect(() => {
    voltarRef.current = aoVoltar; // mantém sempre a versão mais recente
  });

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const ehVoltar =
        VOLTAR.has(e.key) || e.keyCode === 461 || e.keyCode === 10009;
      if (!ehVoltar) return;

      // Não sai da tela quando o usuário está digitando
      const alvo = e.target as HTMLElement;
      if (alvo.tagName === "INPUT" && alvo.getAttribute("type") !== "button") {
        return;
      }

      if (voltarRef.current()) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);
}