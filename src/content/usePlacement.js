import { useEffect, useState } from "react";
import { findControlBar } from "./controlBar.js";

const MARGIN = 12;

/** O div absoluto precisa de um bloco de contencao: se o pai for static, viramos relative. */
function ensurePositioned(el) {
  if (getComputedStyle(el).position !== "static") return () => {};
  const previous = el.style.position;
  el.style.position = "relative";
  return () => {
    el.style.position = previous;
  };
}

/**
 * Coloca o div do painel junto do video.
 *
 * Em `overlay` o div e reparentado para o container do video e posicionado com
 * position:absolute — como o offset e relativo ao pai, scroll da pagina e
 * fullscreen nao exigem recalculo; so mudanca de layout, coberta pelos
 * ResizeObserver.
 *
 * Em `controls` ele vira um item da barra do proprio player (ver findControlBar)
 * e some junto com ela; player sem barra alcancavel cai em `overlay`.
 *
 * @param {HTMLElement} hostEl
 * @param {HTMLVideoElement | null} video video ativo (null esconde o painel)
 * @param {string} placement overlay | controls
 * @param {string} corner top-left | top-right | bottom-left | bottom-right
 * @returns {string} o modo que valeu de fato
 */
export function usePlacement(hostEl, video, placement, corner) {
  // `controls` num player sem barra alcancavel vira `overlay`; quem desenha
  // precisa saber o modo que de fato valeu.
  const [effective, setEffective] = useState(placement);

  useEffect(() => {
    const parent = video?.parentElement;
    if (!video || !parent) {
      hostEl.style.display = "none";
      return undefined;
    }

    // Resolver com o painel fora do layout: senao a altura que ele proprio
    // adiciona entra na conta dos wrappers e a ancora fica oscilando.
    hostEl.style.display = "none";

    if (placement === "controls") {
      const found = findControlBar(video);
      if (found) {
        setEffective("controls");
        if (hostEl.parentNode !== found.bar) {
          if (found.insert === "start") found.bar.insertBefore(hostEl, found.bar.firstChild);
          else found.bar.appendChild(hostEl);
        }
        hostEl.style.position = "relative";
        hostEl.style.inset = "auto";
        // A barra e uma linha flex: entrar como item centralizado alinha o
        // painel com os botoes do proprio player.
        hostEl.style.alignSelf = "center";
        hostEl.style.display = "inline-flex";
        return undefined;
      }
    }

    setEffective("overlay");
    hostEl.style.alignSelf = "auto";
    hostEl.style.display = "block";
    const restorePosition = ensurePositioned(parent);
    if (hostEl.parentNode !== parent) parent.appendChild(hostEl);
    hostEl.style.position = "absolute";

    const place = () => {
      const box = video.getBoundingClientRect();
      const host = parent.getBoundingClientRect();
      // Offset do video dentro do pai, em coordenadas do pai.
      const left = box.left - host.left + parent.scrollLeft;
      const top = box.top - host.top + parent.scrollTop;
      const [vertical, horizontal] = corner.split("-");

      if (horizontal === "left") {
        hostEl.style.left = `${Math.round(left + MARGIN)}px`;
        hostEl.style.right = "auto";
      } else {
        hostEl.style.left = "auto";
        hostEl.style.right = `${Math.round(host.width - (left + box.width) + MARGIN)}px`;
      }

      if (vertical === "top") {
        hostEl.style.top = `${Math.round(top + MARGIN)}px`;
        hostEl.style.bottom = "auto";
      } else {
        hostEl.style.top = "auto";
        hostEl.style.bottom = `${Math.round(host.height - (top + box.height) + MARGIN)}px`;
      }
    };

    place();

    const observer = new ResizeObserver(place);
    observer.observe(video);
    observer.observe(parent);
    window.addEventListener("resize", place);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      restorePosition();
    };
  }, [hostEl, video, placement, corner]);

  return effective;
}
