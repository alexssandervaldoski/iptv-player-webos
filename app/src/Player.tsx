import { forwardRef, useEffect, useRef } from "react";

interface Props {
  url: string;
}

const Player = forwardRef<HTMLVideoElement, Props>(function Player({ url }, refExterno) {
  const interno = useRef<HTMLVideoElement>(null);

  // Usa o ref externo quando existir; senão, o interno
  function aplicarRef(el: HTMLVideoElement | null) {
    interno.current = el;
    if (typeof refExterno === "function") refExterno(el);
    else if (refExterno) refExterno.current = el;
  }

  // Tenta iniciar a reprodução assim que a fonte carrega
  useEffect(() => {
    const v = interno.current;
    if (!v) return;

    function tentarTocar() {
      v?.play().catch(() => {
        // Autoplay bloqueado: o usuário aperta OK
      });
    }

    v.addEventListener("loadeddata", tentarTocar);
    v.addEventListener("canplay", tentarTocar);
    tentarTocar();

    return () => {
      v.removeEventListener("loadeddata", tentarTocar);
      v.removeEventListener("canplay", tentarTocar);
    };
  }, [url]);

  return (
    <video
      ref={aplicarRef}
      className="video"
      src={url}
      controls
      autoPlay
      playsInline
      preload="auto"
    />
  );
});

export default Player;