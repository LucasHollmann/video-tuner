import { useCallback, useEffect, useSyncExternalStore } from "react";
import { softFullscreen } from "./softFullscreen.js";

/**
 * Liga o painel ao estado da tela cheia leve.
 *
 * O estado mora no modulo, e nao aqui, porque e um por pagina: o alvo esticado
 * sobrevive ao painel sumir quando o ponteiro sai do video.
 *
 * @returns {{ target: HTMLElement | null, isActive: (video: HTMLVideoElement | null) => boolean, toggle: (video: HTMLVideoElement | null) => void }}
 */
export function useSoftFullscreen() {
  const target = useSyncExternalStore(softFullscreen.subscribe, softFullscreen.getTarget);

  // Content script desmontado (nao acontece em uso normal, mas acontece no
  // reload da extensao): nao deixa a pagina travada no modo.
  useEffect(() => () => softFullscreen.exit(), []);

  const isActive = useCallback(
    (video) => !!target && !!video && (target === video || target.contains(video)),
    [target]
  );

  const toggle = useCallback((video) => softFullscreen.toggle(video), []);

  return { target, isActive, toggle };
}
