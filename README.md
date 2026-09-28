# Video Tuner

Extensão Chrome (Manifest V3) que coloca um controle de **velocidade**, **volume** e **picture-in-picture** sobre os vídeos de qualquer site.

## Como funciona

- Passe o mouse sobre um vídeo → aparece um selo discreto (por padrão dentro da **barra de controles do próprio player**) com os valores atuais e o botão de picture-in-picture.
- **Clique no selo** → ele expande com a barra de progresso (com play/pause), os sliders e presets, mais um botão *Voltar ao padrão*. Uma vez aberto, o painel só fecha quando você clica fora dele — dá para sair do vídeo, mexer nos controles e voltar sem perdê-lo.
- O ajuste vale **só para aquele vídeo**. Nada é persistido: os outros vídeos da página, e a próxima visita, seguem o padrão do site.
- Um vídeo que nunca foi ajustado não é tocado — o volume e a velocidade que o próprio player definiu ficam intactos.

O ícone da extensão abre a **tela de configuração** (no lugar do popup, sem página separada):

- quais controles aparecem no painel: velocidade, volume, tempo (progresso + play/pause) e picture-in-picture, em qualquer combinação;
- onde o painel fica: dentro da barra de controles do próprio player, ou flutuando sobre o vídeo — e, nesse caso, em qual dos quatro cantos.

Essa configuração é global e aplicada na hora, em todas as abas abertas.

## Recursos

- **Velocidade** de 0.25x a 8x pelo overlay (0.07x a 16x via atalhos), com presets até 8x.
- **Volume de 0% a 600%** — acima de 100% o áudio é amplificado por um `GainNode` do WebAudio.
- **Picture-in-picture** num clique, direto no selo: solta o vídeo numa janela flutuante e traz de volta. Se o player tiver marcado `disablePictureInPicture` para esconder o recurso, o clique libera — é um pedido explícito seu.
- **Atalhos de teclado** globais, aplicados ao vídeo sob o ponteiro (ou, na falta dele, ao maior vídeo visível que esteja tocando):
  | Atalho | Ação |
  | --- | --- |
  | `Ctrl+Shift+.` | +0.25x |
  | `Ctrl+Shift+,` | −0.25x |
  | `Ctrl+Shift+0` | volta para 1x |
- Funciona em SPAs (YouTube, Netflix etc.): o `MutationObserver` encontra vídeos novos, e um `<video>` reaproveitado para outra mídia volta ao padrão (evento `emptied`).
- Varre também **Shadow DOM**, cobrindo players customizados.
- Overlay imune ao CSS do site (Shadow DOM) e funcional em fullscreen.

## Build

Overlay e tela de configuração são feitos em **React** e passam por **Vite**, então a extensão precisa ser compilada antes de ser carregada.

```bash
npm install
npm run build         # gera dist/ (configuração + content script)
npm run dev:popup     # rebuild automático da tela de configuração
npm run dev:content   # rebuild automático do content script
```

São dois builds porque content scripts do MV3 não aceitam ES modules: a tela de configuração sai como módulo com code splitting e o content script como um único IIFE (`dist/content.js`).

## Instalação (modo desenvolvedor)

1. `npm install && npm run build`.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. **Carregar sem compactação** → selecione a pasta **`dist`**.

Depois de um `npm run build`, clique em **Atualizar** no card da extensão.

## Estrutura

```
popup.html                  # entrada HTML da tela de configuração
vite.config.js              # build da tela de configuração
vite.content.config.js      # build do content script (IIFE)
src/
  ui.css                    # tema + controles, compartilhado (`:root` e `:host`)
  settings.js               # configuração global: leitura, escrita e watch no storage
  useSettings.js            # hook reativo em cima do settings.js
  components/               # Control, Presets, Toggle, CornerPicker
  popup/
    main.jsx                # bootstrap do React
    App.jsx                 # tela de configuração
    popup.css               # estrutura só dessa tela
  content/
    index.jsx               # cria o div do painel e monta o React no Shadow DOM
    engine.js               # estado por vídeo, WebAudio, atalhos, store observável
    Overlay.jsx             # selo + painel expansível
    useHoveredVideo.js      # qual vídeo está sob o ponteiro (hit test geométrico)
    usePictureInPicture.js  # estado e acionamento do PiP do vídeo ativo
    useMediaTime.js         # posição/pausa do vídeo ativo (fora do engine)
    TimeBar.jsx             # barra de progresso + play/pause
    usePlacement.js         # reparenta o div: na barra do player ou sobre o vídeo
    controlBar.js           # acha a barra de controles do player (modo "na barra")
    overlay.css             # selo/painel (injetado inline no shadow root)
public/                     # copiado para dist/ sem transformação
  manifest.json             # MV3: permissões, content script, commands
  background.js             # service worker: atalhos de teclado
  icons/                    # ícones 16/48/128 (gerados, ver assets/)
assets/                     # fontes das imagens da loja (ícone, promos, capturas)
scripts/                    # zip do pacote, render das imagens, servidor do render
store/                      # imagens geradas para a Chrome Web Store
dist/                       # build final — é esta pasta que se carrega no Chrome
```

O painel é **um único div** para toda a página, reparentado para junto do vídeo sob o ponteiro — o que mantém o estado do React.

No modo `controls` ele vira um item flex da barra do próprio player, e some junto com ela. Não há padrão para isso — cada player monta a barra do seu jeito, e player com `controls` nativo é impossível, porque a barra fica num shadow root do navegador. `controlBar.js` tem uma entrada fixa para o YouTube e, para o resto, um palpite: dentro do player, a faixa flex mais baixa que seja larga, rasa, colada no rodapé do vídeo e com dois ou mais botões. Sem barra alcançável, o modo cai em `overlay`.

No modo `overlay` ele é `position: absolute` dentro do container do vídeo, o que dispensa recalcular posição em scroll ou fullscreen — o offset é relativo ao pai. Se esse pai for `position: static`, ele recebe `relative` temporariamente (restaurado quando o painel sai).

A posição de reprodução fica fora do `engine.js` (em `useMediaTime.js`): o engine guarda ajustes do usuário, que mudam raramente, enquanto `timeupdate` dispara quatro vezes por segundo e não vale notificar toda a árvore.

O `engine.js` guarda os ajustes num `WeakMap` por elemento e expõe um store observável (`subscribe`/`getState`) consumido via `useSyncExternalStore`, então mudanças por atalho de teclado aparecem no overlay na hora.

## Limitações conhecidas

O overlay leva o React para dentro de cada página (`dist/content.js`, ~200 kB / ~65 kB gzip). É um custo por página; se isso pesar, o caminho é carregar o overlay sob demanda como recurso web-acessível.

Vídeos menores que 160×90 px não recebem overlay — evita que thumbnails e anúncios ganhem um painel.

O botão de picture-in-picture só aparece onde o navegador permite (`document.pictureInPictureEnabled`): fica de fora em iframes sem a permission policy `picture-in-picture` e em navegadores sem a API.

Como nada é persistido, recarregar a página zera os ajustes. É o comportamento pedido: configuração por vídeo, padrão para o resto.

O boost acima de 100% usa `createMediaElementSource`. Se a mídia for **cross-origin sem cabeçalhos CORS**, o navegador silencia o áudio nesse caminho; nesse caso a extensão detecta a falha e mantém o volume nativo (máximo 100%). Streams via MSE/blob (YouTube, Netflix, Twitch, Vimeo) não são afetados.

## Publicação

Textos, imagens e justificativas de permissão para a Chrome Web Store estão em [STORE_LISTING.md](STORE_LISTING.md).

```bash
npm run build
powershell -ExecutionPolicy Bypass -File scripts/zip.ps1            # video-tuner-<versão>.zip
powershell -ExecutionPolicy Bypass -File scripts/render-assets.ps1  # imagens em store/
```

As imagens de [store/](store/) são geradas, não desenhadas à mão: as fontes ficam em [assets/](assets/) e o render abre o `dist` num Chrome headless. As capturas usam a UI real — o mesmo `content.js` e a mesma tela de configuração que vão para a loja — sobre um vídeo de exemplo, com a API `chrome.*` substituída por um stub.

## Privacidade

A extensão não coleta, não transmite e não vende dado nenhum: não faz requisições de rede e só guarda a sua configuração em `chrome.storage.local`. Detalhes em [PRIVACY.md](PRIVACY.md), publicado também em
<https://lucashollmann.github.io/video-tuner/> (`docs/index.html`, servido pelo GitHub Pages) — é essa a URL para o campo de política de privacidade da Chrome Web Store.

## Licença

MIT
