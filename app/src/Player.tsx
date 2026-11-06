import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import mpegts from "mpegts.js";

interface Props {
  url: string;
}

const ehMpegTs = (url: string) => /\.ts(\?|$)/i.test(url);

export default function Player({ url }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let ts: mpegts.Player | null = null;

    const aoFalhar = () =>
      setErro("O vídeo não pôde ser carregado (código " + (video.error?.code ?? "?") + ").");
    video.addEventListener("error", aoFalhar);

    if (ehMpegTs(url)) {
      if (mpegts.getFeatureList().mseLivePlayback) {
        ts = mpegts.createPlayer({ type: "mpegts", isLive: true, url });
        ts.on(mpegts.Events.ERROR, (tipo: string, detalhe: string) =>
          setErro(`Falha no stream: ${tipo} / ${detalhe}`)
        );
        ts.attachMediaElement(video);
        ts.load();
      } else {
        setErro("Este navegador não suporta MPEG-TS.");
      }
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.on(Hls.Events.ERROR, (_evento, dados) => {
        if (dados.fatal) setErro(`Falha no stream: ${dados.type} / ${dados.details}`);
      });
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      setErro("Este navegador não suporta HLS.");
    }
    video.play().catch(() => {});

    return () => {
      video.removeEventListener("error", aoFalhar);
      ts?.destroy();
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [url]);

  return (
    <>
      <video ref={videoRef} className="video" controls autoPlay />
      {erro && <p className="erro">{erro}</p>}
    </>
  );
}