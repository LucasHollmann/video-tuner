import { useEffect, useState } from "react";

const EMPTY = { time: 0, duration: 0, paused: true };

/**
 * Posicao e estado de reproducao do video.
 *
 * Fica fora do engine de proposito: o engine guarda ajustes do usuario, que
 * mudam raramente, enquanto isto muda quatro vezes por segundo e nao vale
 * notificar toda a arvore. `timeupdate` ja e frequente o bastante para uma
 * barra de progresso — nao precisa de requestAnimationFrame.
 *
 * `duration` e 0 em transmissao ao vivo (Infinity) e antes dos metadados: quem
 * desenha usa isso para saber que nao da para navegar.
 */
export function useMediaTime(video) {
  const [state, setState] = useState(EMPTY);

  useEffect(() => {
    if (!video) {
      setState(EMPTY);
      return undefined;
    }

    const sync = () =>
      setState({
        time: video.currentTime,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        paused: video.paused
      });

    sync();

    const events = [
      "timeupdate",
      "durationchange",
      "loadedmetadata",
      "play",
      "pause",
      "seeked",
      "emptied"
    ];
    for (const name of events) video.addEventListener(name, sync);

    return () => {
      for (const name of events) video.removeEventListener(name, sync);
    };
  }, [video]);

  return state;
}
