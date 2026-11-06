import { useEffect } from "react";
import type { Entrada } from "./types";

interface Props {
  atual: Entrada | null;
  pendente: Entrada;
  segundos: number;
  total: number;
  indice: number;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function OverlayCanal({
  atual,
  pendente,
  segundos,
  total,
  indice,
  onConfirmar,
  onCancelar,
}: Props) {
  // OK confirma, Voltar cancela
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        onConfirmar();
      }
      if (e.key === "Escape" || e.key === "Backspace" || e.keyCode === 461) {
        e.preventDefault();
        onCancelar();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onConfirmar, onCancelar]);

  const progresso = (segundos / 5) * 100;

  return (
    <div className="overlay-canal">
      <div className="overlay-topo">
        <span className="overlay-rotulo">CANAL ATUAL</span>
        <strong className="overlay-canal-atual">
          {atual ? atual.nome : "—"}
        </strong>
      </div>

      <div className="overlay-destino">
        <span className="overlay-rotulo">INDO PARA ESTE CANAL</span>
        <strong className="overlay-nome">{pendente.nome}</strong>
        <span className="overlay-grupo">{pendente.grupo}</span>
        <span className="overlay-posicao">
          {indice + 1} de {total}
        </span>
      </div>

      <div className="overlay-rodape">
        <span>OK confirmar · Voltar cancelar</span>
        <div className="overlay-timer">
          <div style={{ width: progresso + "%" }} />
        </div>
        <span className="overlay-segundos">{segundos}s</span>
      </div>
    </div>
  );
}