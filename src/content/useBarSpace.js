import { useEffect, useState } from "react";

/**
 * Quanto a barra precisa ter de folga para o painel expandir os campos.
 * Sao estimativas do proprio CSS (.vt-field em overlay.css): o selo fechado
 * mais um bloco "icone + valor + slider" por campo. Medir o painel expandido de
 * verdade exigiria desenha-lo antes de saber se cabe — e ele piscaria nos
 * players apertados.
 */
const BASE = 72;
const PER_FIELD = 152;

/** Folga extra so para expandir: evita piscar quando a barra oscila 1-2px. */
const HYSTERESIS = 16;

/**
 * So a propria barra e o pai dela. No YouTube a folga mora no pai (a faixa
 * inteira, entre o grupo da esquerda e o da direita); nos players que o
 * palpite acha, na propria barra. Mais acima ja e area que a barra nao ocupa.
 */
const MAX_DEPTH = 2;

/**
 * Largura que o elemento realmente ocupa, nao a que ele reserva.
 *
 * Um grupo com flex-grow (o `.ytp-left-controls` do YouTube e o caso classico)
 * estica ate o fim da linha: a caixa dele diz "a barra esta cheia" enquanto o
 * vao entre os botoes e o resto esta vazio. Quando os filhos somam menos que o
 * pai, a diferenca e exatamente esse vao — e ele conta como livre.
 */
function contentWidth(el) {
  const width = el.getBoundingClientRect().width;
  if (!el.children.length) return width;

  let sum = 0;
  for (const child of el.children) {
    const box = child.getBoundingClientRect();
    if (box.width === 0) continue;
    sum += box.width;
  }

  // Somar mais que o pai significa filho sobreposto ou fora do fluxo: ai a
  // caixa do pai e a unica medida em que da para confiar.
  return sum > 0 && sum < width ? sum : width;
}

/**
 * Espaco que sobraria na linha da barra se o painel nao estivesse la.
 *
 * Descontar a largura do proprio painel e o que torna a medida estavel: sem
 * isso, expandir consumiria a folga, a conta diria "nao cabe", o painel
 * recolheria, a folga voltaria — e ele ficaria piscando.
 */
function freeSpace(hostEl) {
  const hostWidth = hostEl.getBoundingClientRect().width;
  let row = hostEl.parentElement;
  let free = 0;

  for (let depth = 0; depth < MAX_DEPTH && row; depth += 1) {
    const rect = row.getBoundingClientRect();
    if (rect.width > 0) {
      let used = 0;
      for (const child of row.children) {
        // Item escondido (o proprio player esconde botoes em tela pequena)
        // nao disputa espaco.
        if (child.getBoundingClientRect().width === 0) continue;
        const own = contentWidth(child);
        used += child.contains(hostEl) ? Math.max(0, own - hostWidth) : own;
      }
      free = Math.max(free, rect.width - used);
    }
    row = row.parentElement;
  }

  return free;
}

/**
 * Diz se os campos expandidos cabem na barra do player onde o painel esta.
 *
 * @param {HTMLElement} hostEl div do painel, ja encaixado na barra
 * @param {boolean} active false quando o modo expandido nem esta em jogo
 * @param {number} fields quantos campos (velocidade, volume) seriam expandidos
 * @param {HTMLVideoElement | null} video so para remedir quando o video troca
 * @returns {boolean}
 */
export function useBarSpace(hostEl, active, fields, video) {
  const [fits, setFits] = useState(false);

  useEffect(() => {
    if (!active || fields === 0) {
      setFits(false);
      return undefined;
    }

    const needed = BASE + fields * PER_FIELD;

    const measure = () => {
      const free = freeSpace(hostEl);
      // Entra com folga a mais do que precisa para sair: a largura da barra
      // muda sozinha (botao de legenda que aparece, player que redimensiona).
      setFits((current) => (current ? free >= needed : free >= needed + HYSTERESIS));
    };

    measure();

    const observer = new ResizeObserver(measure);
    for (let row = hostEl.parentElement, depth = 0; row && depth <= MAX_DEPTH; depth += 1) {
      observer.observe(row);
      row = row.parentElement;
    }
    if (video) observer.observe(video);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [hostEl, active, fields, video]);

  return fits;
}
