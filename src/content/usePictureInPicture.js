import { useCallback, useEffect, useState } from "react";

/**
 * Picture-in-picture do video sob o ponteiro.
 *
 * Nao ha estado proprio para guardar: quem manda e o documento
 * (`document.pictureInPictureElement`), entao so espelhamos os eventos do
 * elemento — inclusive quando o usuario fecha a janelinha pelos controles do
 * proprio navegador.
 */

/**
 * Falso em iframe sem a permission policy `picture-in-picture` e em navegador
 * sem suporte; nesses casos o botao nem aparece.
 */
export const PIP_SUPPORTED = typeof document !== "undefined" && !!document.pictureInPictureEnabled;

/** @param {HTMLVideoElement | null} video */
export function usePictureInPicture(video) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!video) {
      setActive(false);
      return undefined;
    }

    const sync = () => setActive(document.pictureInPictureElement === video);
    sync();
    video.addEventListener("enterpictureinpicture", sync);
    video.addEventListener("leavepictureinpicture", sync);
    return () => {
      video.removeEventListener("enterpictureinpicture", sync);
      video.removeEventListener("leavepictureinpicture", sync);
    };
  }, [video]);

  // Sem await antes do requestPictureInPicture: a API exige gesto do usuario e
  // o gesto do clique nao sobrevive a um tick assincrono.
  const toggle = useCallback(() => {
    if (!video) return;
    if (document.pictureInPictureElement === video) {
      document.exitPictureInPicture().catch(() => {});
      return;
    }
    // Alguns players marcam o atributo para esconder o PiP nativo. O clique
    // aqui e um pedido explicito, entao liberamos.
    if (video.disablePictureInPicture) video.disablePictureInPicture = false;
    try {
      // Recusado enquanto a midia nao tem faixa de video, ou por politica do
      // site: nesse caso o estado simplesmente nao muda.
      video.requestPictureInPicture().catch(() => {});
    } catch (_) {
      /* navegador sem a API neste elemento */
    }
  }, [video]);

  return { active, toggle };
}
