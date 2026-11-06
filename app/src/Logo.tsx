import { useState } from "react";

interface Props {
  src: string;
  nome: string;
  tamanho?: number;
}

export default function Logo({ src, nome, tamanho = 40 }: Props) {
  // Guardamos QUAL endereço falhou, e não um "sim/não", para o componente
  // voltar a tentar sozinho quando receber outro endereço
  const [falhou, setFalhou] = useState("");
  const estilo = { width: tamanho, height: tamanho };

  if (!src || falhou === src) {
    return (
      <span className="logo logo-vazio" style={estilo}>
        {nome.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      className="logo"
      style={estilo}
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFalhou(src)}
    />
  );
}