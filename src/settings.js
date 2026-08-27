/**
 * Configuracao global da extensao (o que aparece no overlay e em qual canto).
 * Vale para todos os videos; o que e por video sao os valores de
 * velocidade/volume, que vivem so na memoria do content script.
 */

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
