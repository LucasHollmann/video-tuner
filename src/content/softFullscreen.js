import { findControlBar } from "./controlBar.js";

/**
 * "Tela cheia leve": o video passa a ocupar a janela do navegador inteira, sem
 * entrar no fullscreen nativo do sistema.
 *
 * A diferenca pratica e que a aba continua sendo uma aba: a barra de endereco,
 * as outras janelas e o Alt+Tab seguem ali, e nada de notificacao fica
 * escondido. O preco e que isso e feito no CSS da pagina, nao por uma API do
 * navegador — por isso tudo aqui e defensivo e reversivel.
 *
 * Um alvo por vez na pagina; quem desenha se inscreve em `subscribe`.
 */

const STYLE_ID = "video-tuner-soft-fullscreen";

/** O elemento esticado. */
const HOST = "vt-sfs-host";
/** Ancestrais do alvo: precisam parar de criar bloco de contencao. */
const CHAIN = "vt-sfs-chain";
/** Wrappers entre o alvo e o <video>: senao o player segura o tamanho antigo. */
const FILL = "vt-sfs-fill";
const VIDEO = "vt-sfs-video";
const LOCK = "vt-sfs-lock";
/** Tudo que nao e o player: cabecalhos fixos, chats, banners, rodapes. */
const HIDE = "vt-sfs-hide";

/**
 * `position: fixed` so vale a janela quando nenhum ancestral cria bloco de
 * contencao — transform, filter, contain e will-change criam. Zerar isso
 * enquanto o modo esta ligado e o que faz o alvo alcancar as bordas.
 */
const CSS = `
.${LOCK} { overflow: hidden !important; }

.${HIDE} { display: none !important; }

.${CHAIN} {
  transform: none !important;
  filter: none !important;
  backdrop-filter: none !important;
  perspective: none !important;
  contain: none !important;
  will-change: auto !important;
  z-index: auto !important;
}

.${HOST} {
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 !important;
  background: #000 !important;
  /* Um degrau abaixo do painel da extensao, que usa o topo da escala. */
  z-index: 2147483646 !important;
}

.${FILL} {
  left: 0 !important;
  top: 0 !important;
  right: auto !important;
  bottom: auto !important;
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  transform: none !important;
}

.${VIDEO} {
  left: 0 !important;
  top: 0 !important;
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  /* O video quase nunca tem a proporcao da janela: contain poe as tarjas
     pretas no lugar de distorcer a imagem. */
  object-fit: contain !important;
}
`;

/** O div do painel (ver content/index.jsx): nunca entra na conta do que ocultar. */
const OVERLAY_ID = "video-tuner-overlay";

/**
 * Nao adianta ocultar — e esconder <head> quebraria a pagina inteira.
 */
const KEEP = new Set(["HEAD", "SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE"]);

/** Area acima da qual o candidato ja nao e "o player", e sim meia pagina. */
const MAX_AREA_RATIO = 4;
/** Folga para o wrapper ainda contar como colado no video. */
const HUG_RATIO = 1.08;
const HUG_SLACK = 8;

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);
}

function area(el) {
  const rect = el.getBoundingClientRect();
  return rect.width * rect.height;
}

/** Wrapper que so embrulha o video — esticar ele e o mesmo que esticar o video. */
function hugs(parent, video) {
  const box = video.getBoundingClientRect();
  const rect = parent.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return false;
  return (
    rect.width <= box.width * HUG_RATIO + HUG_SLACK &&
    rect.height <= box.height * HUG_RATIO + HUG_SLACK
  );
}

/**
 * O que esticar.
 *
 * O video sozinho seria o alvo obvio, mas a barra do proprio site e irma dele:
 * esticando so o video, os controles do player ficariam para tras, no tamanho
 * antigo. Por isso o alvo preferido e o menor ancestral que contem o video e a
 * barra — o player inteiro. Sem barra alcancavel (player nativo), sobe-se
 * apenas enquanto os wrappers continuarem colados no video.
 *
 * @param {HTMLVideoElement} video
 * @returns {HTMLElement}
 */
function findTarget(video) {
  const bar = findControlBar(video)?.bar;
  if (bar) {
    let node = video.parentElement;
    while (node && node !== document.body && !node.contains(bar)) node = node.parentElement;
    // Conter a barra nao basta: num site que empilha video e controles soltos
    // no meio do artigo, o ancestral comum e a pagina.
    if (node && node !== document.body && area(node) <= area(video) * MAX_AREA_RATIO) {
      return node;
    }
  }

  let target = video;
  let parent = video.parentElement;
  while (parent && parent !== document.body && hugs(parent, video)) {
    target = parent;
    parent = parent.parentElement;
  }
  return target;
}

/** @type {{ target: HTMLElement, cleanup: () => void } | null} */
let current = null;
const listeners = new Set();

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Players recalculam o proprio layout no resize da janela. Como aqui a janela
 * nao mudou — so o tamanho do player —, o aviso tem que ser nosso.
 */
function nudgeLayout() {
  window.dispatchEvent(new Event("resize"));
}

export const softFullscreen = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** @returns {HTMLElement | null} o alvo esticado agora, se houver. */
  getTarget() {
    return current?.target ?? null;
  },

  /** @param {HTMLVideoElement | null} video */
  isActive(video) {
    const target = current?.target;
    return !!target && !!video && (target === video || target.contains(video));
  },

  /** @param {HTMLVideoElement} video */
  enter(video) {
    if (!video) return;
    softFullscreen.exit();
    ensureStyle();

    const target = findTarget(video);
    const touched = [];

    const mark = (el, className) => {
      el.classList.add(className);
      touched.push([el, className]);
    };

    mark(target, HOST);
    mark(video, VIDEO);
    for (let node = video.parentElement; node && node !== target; node = node.parentElement) {
      mark(node, FILL);
    }
    for (let node = target.parentElement; node; node = node.parentElement) {
      mark(node, CHAIN);
    }
    // A pagina atras continua rolando com a roda do mouse se nao travar aqui.
    mark(document.documentElement, LOCK);
    if (document.body) mark(document.body, LOCK);

    // Cobrir com z-index nao basta: um cabecalho `fixed` dentro do proprio
    // contexto de empilhamento dele fica por cima de qualquer valor nosso. O
    // que resolve e tirar do layout tudo que nao e o player — ou seja, os
    // irmaos de cada degrau entre o alvo e o <html>.
    const hidden = new Set();
    const hideOthers = () => {
      for (let node = target; node && node.parentElement; node = node.parentElement) {
        for (const sibling of node.parentElement.children) {
          if (sibling === node || hidden.has(sibling)) continue;
          if (KEEP.has(sibling.tagName) || sibling.id === OVERLAY_ID) continue;
          sibling.classList.add(HIDE);
          hidden.add(sibling);
        }
      }
    };
    hideOthers();

    // Esc e o gesto que todo mundo ja tem na mao para sair de tela cheia.
    // Em capture, antes dos atalhos do proprio site.
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      event.preventDefault();
      softFullscreen.exit();
    };
    window.addEventListener("keydown", onKeyDown, true);

    // Duas coisas de uma vez: o player pode ser desmontado por baixo (SPA
    // trocando de pagina) — sem sair, o travamento do scroll sobreviveria para
    // a pagina seguinte —, e o site pode pendurar elementos novos no body
    // depois (modal, toast, banner de cookie), que precisam sumir tambem.
    // Coalescido num frame: em player movimentado isso dispara o tempo todo.
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        // Ja saiu (ou ja entrou em outro video) entre a mutacao e o frame.
        if (current !== state) return;
        if (!document.contains(target)) softFullscreen.exit();
        else hideOthers();
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    const state = {
      target,
      cleanup: () => {
        window.removeEventListener("keydown", onKeyDown, true);
        observer.disconnect();
        for (const [el, className] of touched) el.classList.remove(className);
        // Remover so a nossa classe: quem ja estava escondido pelo site
        // continua escondido, como tem que ser.
        for (const el of hidden) el.classList.remove(HIDE);
        hidden.clear();
      }
    };
    current = state;

    nudgeLayout();
    emit();
  },

  exit() {
    if (!current) return;
    current.cleanup();
    current = null;
    nudgeLayout();
    emit();
  },

  /** @param {HTMLVideoElement | null} video */
  toggle(video) {
    if (!video) return;
    if (softFullscreen.isActive(video)) softFullscreen.exit();
    else softFullscreen.enter(video);
  }
};
