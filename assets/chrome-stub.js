/**
 * Stub da API chrome.* para renderizar as imagens da loja fora da extensao.
 *
 * As paginas de captura carregam o codigo real (dist/content.js e o bundle da
 * tela de configuracao); so a camada de storage e falsa, para o navegador
 * comum nao quebrar em `chrome.storage`.
 *
 * Aceita ?corner=, ?showSpeed=, ?showVolume= e ?showPip= para variar o estado
 * exibido. O que nao vier na query fica com o padrao real do settings.js.
 */
(() => {
  const params = new URLSearchParams(location.search);

  // So as chaves presentes na query: o readSettings mescla por cima do
  // DEFAULT_SETTINGS, entao o resto segue o padrao de verdade da extensao.
  const settings = {};
  for (const name of ["showSpeed", "showVolume", "showPip"]) {
    if (params.has(name)) settings[name] = params.get(name) !== "false";
  }
  if (params.has("corner")) settings.corner = params.get("corner");

  window.chrome = {
    storage: {
      local: {
        get: () => Promise.resolve({ settings }),
        set: () => Promise.resolve()
      },
      onChanged: { addListener() {}, removeListener() {} }
    },
    runtime: { onMessage: { addListener() {} } }
  };
})();
