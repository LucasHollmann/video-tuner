/**
 * Configuracao global da extensao (o que aparece no painel e onde ele fica).
 * Vale para todos os videos; o que e por video sao os valores de
 * velocidade/volume, que vivem so na memoria do content script.
 */

/** Onde o painel fica em relacao ao video. */
export const PLACEMENTS = [
  { value: "controls", label: "Na barra do player", hint: "Junto dos botões do próprio site" },
  { value: "overlay", label: "Sobre o vídeo", hint: "Flutuando em um dos cantos" }
];

/** Só vale para o modo overlay. */
export const CORNERS = [
  { value: "top-left", label: "Sup. esquerdo" },
  { value: "top-right", label: "Sup. direito" },
  { value: "bottom-left", label: "Inf. esquerdo" },
  { value: "bottom-right", label: "Inf. direito" }
];

export const DEFAULT_SETTINGS = {
  showSpeed: true,
  showVolume: true,
  showPip: true,
  showProgress: true,
  placement: "controls",
  expandInBar: true,
  corner: "top-left"
};

const KEY = "settings";

export async function readSettings() {
  const stored = await chrome.storage.local.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[KEY] || {}) };
}

export async function writeSettings(patch) {
  const current = await readSettings();
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ [KEY]: next });
  return next;
}

/** Avisa quando a configuracao muda — inclusive alterada em outra aba. */
export function watchSettings(onChange) {
  const listener = (changes, area) => {
    if (area !== "local" || !changes[KEY]) return;
    onChange({ ...DEFAULT_SETTINGS, ...(changes[KEY].newValue || {}) });
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
