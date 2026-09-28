import { createRoot } from "react-dom/client";
import Overlay from "./Overlay.jsx";
import { start } from "./engine.js";
// ?inline: o CSS vem como string para dentro do shadow root, sem vazar
// para a pagina e sem sofrer com o CSS do site.
import uiCss from "../ui.css?inline";
import overlayCss from "./overlay.css?inline";

/**
 * Um unico div para toda a pagina: ele e reparentado para junto do video sob o
 * ponteiro (ver usePlacement), o que preserva o estado do React. A posicao
 * (absoluta sobre o video ou no fluxo, acima/abaixo) quem decide e usePlacement.
 */
function mountOverlay() {
  const host = document.createElement("div");
  host.id = "video-tuner-overlay";
  host.style.cssText = [
    "position:absolute",
    "z-index:2147483647",
    "display:none",
    "margin:0",
    "padding:0"
  ].join(";");

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `${uiCss}\n${overlayCss}`;
  shadow.appendChild(style);

  const mount = document.createElement("div");
  shadow.appendChild(mount);

  createRoot(mount).render(<Overlay hostEl={host} />);
}

if (!window.__videoTunerLoaded) {
  window.__videoTunerLoaded = true;
  start();
  mountOverlay();
}
