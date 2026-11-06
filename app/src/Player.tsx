import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Hls from "hls.js";
import mpegts from "mpegts.js";

interface Props {
  url: string;
}

const ehMpegTs = (url: string) => /\.ts(\?|$)/i.test(url);

const Player = forwardRef<HTMLVideoElement, Props>(function Player({ url }, refExterno) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState("");

  // Expõe o <video> real para quem usa o ref (tela cheia)
  useImperativeHandle(refExterno, () => videoRef.current as HTMLVideoElement, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let ts: mpegts.Player | null = null;

    setErro("");

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
      <video ref={videoRef} className="video" controls autoPlay playsInline />
      {erro && <p className="erro-player">{erro}</p>}
    </>
  );
});

export default Player;