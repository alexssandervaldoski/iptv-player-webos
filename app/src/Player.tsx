import { useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import type mpegts from "mpegts.js";

interface Props {
  url: string;
}

const ehMpegTs = (url: string) => /\.ts(\?|$)/i.test(url);

export default function Player({ url }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState("");
  const [precisaPlay, setPrecisaPlay] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let ts: mpegts.Player | null = null;
    let cancelado = false;

    setErro("");
    setPrecisaPlay(false);

    const aoFalhar = () =>
      setErro("O vídeo não pôde ser carregado (código " + (video.error?.code ?? "?") + ").");
    video.addEventListener("error", aoFalhar);

    async function iniciar() {
      if (ehMpegTs(url)) {
        const modulo = await import("mpegts.js");
        if (cancelado) return;
        const lib = modulo.default;

        if (lib.getFeatureList().mseLivePlayback) {
          ts = lib.createPlayer({ type: "mpegts", isLive: true, url });
          ts.on(lib.Events.ERROR, (tipo: string, detalhe: string) =>
            setErro(`Falha no stream: ${tipo} / ${detalhe}`)
          );
          ts.attachMediaElement(video);
          ts.load();
        } else {
          setErro("Este navegador não suporta MPEG-TS.");
        }
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else {
        const modulo = await import("hls.js");
        if (cancelado) return;
        const HlsLib = modulo.default;

        if (HlsLib.isSupported()) {
          hls = new HlsLib();
          hls.on(HlsLib.Events.ERROR, (_evento, dados) => {
            if (dados.fatal) setErro(`Falha no stream: ${dados.type} / ${dados.details}`);
          });
          hls.loadSource(url);
          hls.attachMedia(video);
        } else {
          setErro("Este navegador não suporta HLS.");
        }
      }

      if (!cancelado) video.play().catch(() => setPrecisaPlay(true));
    }

    iniciar();

    return () => {
      cancelado = true;
      video.removeEventListener("error", aoFalhar);
      ts?.destroy();
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [url]);

  const tentarPlay = () => {
    videoRef.current?.play().then(() => setPrecisaPlay(false)).catch(() => {});
  };

  return (
    <>
      <video ref={videoRef} className="video" controls autoPlay />
      {precisaPlay && (
        <button className="botao" data-nav onClick={tentarPlay}>
          Pressione OK para iniciar
        </button>
      )}
      {erro && <p className="erro">{erro}</p>}
    </>
  );
}