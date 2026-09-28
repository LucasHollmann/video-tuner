/**
 * Acha a barra de controles do player para encaixar o painel junto dos botoes
 * do proprio site.
 *
 * Nao existe padrao para isso: cada player monta a sua. Players com `controls`
 * nativo entao sao impossiveis — a barra mora num shadow root do navegador,
 * fechado para a pagina. Por isso o modo `controls` sempre pode nao encontrar
 * nada, e quem chama precisa ter um plano B.
 */

/** Players cuja estrutura vale fixar: o palpite generico erra ou fica feio. */
const KNOWN = [
  // O grupo da direita, antes de legendas/qualidade/tela cheia.
  { root: ".html5-video-player", bar: ".ytp-right-controls", insert: "start" }
];

const MIN_BUTTONS = 2;
const MIN_WIDTH_RATIO = 0.6;
const MIN_HEIGHT = 20;
const MAX_HEIGHT_RATIO = 0.3;
const FOOT_RATIO = 0.2;

/**
 * Palpite para os demais players: uma faixa flex, larga, baixa, colada no
 * rodape do video e com varios botoes dentro. A mais baixa vence — e a linha
 * dos botoes, e nao o container que a embrulha.
 */
function guessBar(root, video) {
  const box = video.getBoundingClientRect();
  let best = null;
  let bestHeight = Infinity;

  for (const el of root.querySelectorAll("div, nav, section")) {
    if (el.contains(video)) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width < box.width * MIN_WIDTH_RATIO) continue;
    if (rect.height < MIN_HEIGHT || rect.height > box.height * MAX_HEIGHT_RATIO) continue;
    if (Math.abs(rect.bottom - box.bottom) > box.height * FOOT_RATIO) continue;
    if (!getComputedStyle(el).display.includes("flex")) continue;
    if (el.querySelectorAll("button, [role='button']").length < MIN_BUTTONS) continue;

    if (rect.height < bestHeight) {
      best = el;
      bestHeight = rect.height;
    }
  }

  return best;
}

/**
 * @param {HTMLVideoElement} video
 * @returns {{ bar: HTMLElement, insert: "start" | "end" } | null} null quando o
 *   player nao expoe barra alcancavel (nativo, por exemplo).
 */
export function findControlBar(video) {
  for (const entry of KNOWN) {
    const root = video.closest(entry.root);
    const bar = root?.querySelector(entry.bar);
    if (bar) return { bar, insert: entry.insert };
  }

  // Sobe um pouco: a barra e irma de algum wrapper acima do <video>.
  let root = video.parentElement;
  for (let i = 0; i < 4 && root && root !== document.body; i += 1) {
    const bar = guessBar(root, video);
    if (bar) return { bar, insert: "end" };
    root = root.parentElement;
  }

  return null;
}
