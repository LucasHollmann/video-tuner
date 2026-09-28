import { useEffect, useRef, useState } from "react";
import { engine } from "./engine.js";

// Videos menores que isso sao quase sempre thumbnails/anuncios: nao ganham overlay.
const MIN_WIDTH = 160;
const MIN_HEIGHT = 90;
// Folga para o ponteiro atravessar o vao entre o video e o painel.
const HIDE_DELAY = 260;

const inside = (rect, x, y) =>
  rect.width > 0 && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

/**
 * Descobre qual video esta sob o ponteiro.
 *
 * O teste e geometrico (e nao pelo composedPath do evento) porque players
 * cobrem o video com barras de controle proprias — pelo path o overlay
 * sumiria assim que o mouse encostasse nos controles do site.
 *
 * @param {HTMLElement} hostEl div do overlay: manter o ponteiro sobre ele
 *   preserva o video ativo.
 * @param {boolean} hold segura o video ativo mesmo com o ponteiro longe — e o
 *   que deixa o painel aberto sobreviver ate o clique fora.
 */
export function useHoveredVideo(hostEl, hold) {
  const [video, setVideo] = useState(null);
  const holdRef = useRef(hold);
  const hideTimer = useRef(null);

  holdRef.current = hold;

  const cancelHide = () => {
    clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };

  // Segurou com um hide ja agendado: o timer pendente sumiria com o painel.
  useEffect(() => {
    if (hold) cancelHide();
  }, [hold]);

  useEffect(() => {
    let point = { x: -1, y: -1 };
    let queued = false;

    const scheduleHide = () => {
      if (hideTimer.current || holdRef.current) return;
      hideTimer.current = setTimeout(() => {
        hideTimer.current = null;
        setVideo(null);
      }, HIDE_DELAY);
    };

    function evaluate() {
      const { x, y } = point;

      if (inside(hostEl.getBoundingClientRect(), x, y)) {
        cancelHide();
        return;
      }

      let best = null;
      let bestArea = Infinity;
      for (const el of engine.cachedMedia()) {
        if (el.tagName !== "VIDEO") continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < MIN_WIDTH || rect.height < MIN_HEIGHT) continue;
        if (!inside(rect, x, y)) continue;
        const area = rect.width * rect.height;
        // Video-em-video: o menor e o que esta de fato sob o ponteiro.
        if (area < bestArea) {
          best = el;
          bestArea = area;
        }
      }

      if (best) {
        cancelHide();
        engine.focus(best);
        setVideo((current) => (current === best ? current : best));
      } else {
        scheduleHide();
      }
    }

    const onMove = (event) => {
      point = { x: event.clientX, y: event.clientY };
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        evaluate();
      });
    };

    const onLeave = () => scheduleHide();

    document.addEventListener("pointermove", onMove, true);
    // Sem capture e no <html>: dispara so quando o ponteiro deixa a janela.
    // Com capture no document, cada saida de elemento interno agendaria o hide.
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      document.removeEventListener("pointermove", onMove, true);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      cancelHide();
    };
  }, [hostEl]);

  return video;
}
