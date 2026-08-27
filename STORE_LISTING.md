# Publicação na Chrome Web Store

Tudo o que o cadastro pede, já preenchido. Os textos que vão para a loja estão **em inglês**, prontos para colar; as instruções em volta ficam em pt-BR. O que só você pode fazer está marcado com **[você]**.

## 1. Antes de começar

- **[você]** Conta de desenvolvedor no [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) — taxa **única de US$ 5** por conta (não por extensão).
- URL da política de privacidade. Duas opções:
  - **Já funciona, sem configurar nada:** `https://github.com/LucasHollmann/video-tuner/blob/main/PRIVACY.md`
  - **Página formatada:** ligar o GitHub Pages em *Settings → Pages → Branch `main`, pasta `/docs`* e usar `https://lucashollmann.github.io/video-tuner/`. Enquanto o Pages não estiver ligado essa URL dá **404**, e a Store valida o link. Dá para trocar esse campo depois, sem reenviar o pacote.

  As duas têm o mesmo conteúdo, com resumo em inglês no fim — que é o que o revisor lê.

## 2. Gerar o pacote

```bash
npm install
npm run build
powershell -ExecutionPolicy Bypass -File scripts/zip.ps1
```

Sai `video-tuner-<versão>.zip` na raiz, com o `manifest.json` na raiz do zip (é o que a Store exige).

> Não troque o script por `Compress-Archive`: no Windows PowerShell 5.1 ele grava os caminhos internos com barra invertida, fora da especificação do ZIP, e o upload falha ou desempacota errado.

## 3. Ficha da loja (Store listing)

| Campo | Valor |
| --- | --- |
| **Name** | `Video Tuner` |
| **Summary** (máx. 132 caracteres) | `Control speed (up to 8x), volume (up to 600%) and picture-in-picture right on top of the video, on any site.` (108 caracteres) |
| **Category** | Tools |
| **Default language** | English (United States) |
| **Website URL** | `https://github.com/LucasHollmann/video-tuner` |
| **Support URL** | `https://github.com/LucasHollmann/video-tuner/issues` |

O campo *Summary* vem pré-preenchido com a `description` do manifest, que está em pt-BR. Substitua pelo texto em inglês acima.

### Description (colar como está)

```
Control the speed, the volume and picture-in-picture of any video without leaving the page.

Hover a video and a small badge appears in the corner, with a one-click picture-in-picture button. Hover the badge and it expands into the controls — sliders and presets, right on top of the player.

FEATURES

• Playback speed from 0.25x to 8x, with presets at 0.5x, 1x, 1.5x, 2x, 4x and 8x.
• Volume from 0% to 600%. Above 100% the audio is amplified through the Web Audio API — handy for quietly recorded videos.
• Picture-in-picture in one click, straight from the badge — including on players that hide the browser's own picture-in-picture entry.
• Per-video settings: what you change applies only to that video. Every other video on the page keeps the site's own behavior.
• A video you never adjusted is left untouched — the volume the site set stays exactly as it was.
• A "back to default" button that restores the precise values from before your adjustment.
• Works on any site, including custom players built with Shadow DOM, and in fullscreen.
• Works on single-page apps (YouTube, Netflix and the like): new videos are picked up automatically.
• Keyboard shortcuts: Ctrl+Shift+. to speed up, Ctrl+Shift+, to slow down, Ctrl+Shift+0 to return to 1x.

SETTINGS

The extension icon opens a settings screen where you choose which controls the overlay shows (speed, volume and picture-in-picture, in any combination) and which corner of the video it sits in.

PRIVACY

No data is collected, transmitted, or sold. The extension makes no network requests and contains no analytics or trackers. The only thing stored is your display preference, in the browser's own local storage.

Open source (MIT): https://github.com/LucasHollmann/video-tuner
```

## 4. Imagens

Tudo pronto em [`store/`](store/), gerado por `scripts/render-assets.ps1`:

| Item | Arquivo | Especificação |
| --- | --- | --- |
| Ícone da extensão | `public/icons/icon{16,48,128}.png` | vai dentro do zip |
| Ícone grande | `store/icon512.png` | 512×512, para a ficha e material avulso |
| Captura 1 — selo | `store/screenshot-1-badge.png` | 1280×800 |
| Captura 2 — painel aberto | `store/screenshot-2-panel.png` | 1280×800 |
| Captura 3 — configuração | `store/screenshot-3-settings.png` | 1280×800 |
| Bloco promocional pequeno | `store/promo-440x280.png` | 440×280 |
| Bloco promocional grande | `store/promo-1400x560.png` | 1400×560, só para destaque editorial |

Para regerar depois de mexer na UI:

```bash
npm run build
powershell -ExecutionPolicy Bypass -File scripts/render-assets.ps1
```

As capturas mostram a **interface real** — o `dist/content.js` e o bundle da tela de configuração rodando num Chrome headless, com a API `chrome.*` trocada por um stub e um vídeo de exemplo neutro. Os valores exibidos (1.50x, 200%) vêm de interação de verdade com os controles, não de texto forjado.

> A interface está em pt-BR e as capturas mostram isso, enquanto a ficha está em inglês. As notas para o revisor (seção 7) avisam disso. Se traduzir a UI algum dia, rode o render de novo.
>
> Se preferir capturas de sites reais em vez do vídeo de exemplo, instale a extensão sem compactação e fotografe a tela em 1280×800 — só evite deixar conteúdo de terceiros identificável na imagem.

## 5. Práticas de privacidade

**Single purpose:**

```
Adjust the playback speed and volume of videos on the page the user is viewing, and send them to picture-in-picture, through a control overlaid on the video itself.
```

**Justificativa de cada permissão:**

| Permissão | Justificativa (colar) |
| --- | --- |
| `storage` | `Stores only the user's display preferences: which of the controls (speed, volume, picture-in-picture) the overlay shows and which corner of the video it sits in. Nothing else is stored, and nothing leaves the device.` |
| `activeTab` | `The keyboard shortcuts need to identify the active tab in order to apply the speed change to the video the user is currently watching.` |
| Acesso a todos os sites (`host_permissions` / content script em `<all_urls>`) | `Videos exist on any website, and the extension's entire purpose is to control the video wherever it happens to be. The access is used only to inject the script that locates video elements, changes their playbackRate and volume properties, sends them to picture-in-picture on request, and draws the overlaid control. The extension does not read page content, does not access cookies, history or form data, and sends nothing to any server — it makes no network requests at all.` |

**Are you using remote code?** *No, I am not using remote code.* Todo o JavaScript vai dentro do pacote; a extensão não carrega script externo nem usa `eval`.

**Data collection:** não marcar nenhuma categoria. Depois marque as três declarações:

- I do not sell or transfer user data to third parties, outside of the approved use cases;
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose;
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** `https://github.com/LucasHollmann/video-tuner/blob/main/PRIVACY.md` — ou a do GitHub Pages, se você ligou (ver seção 1).

## 6. Distribuição

- Visibility: **Public**.
- Regiões: todas.
- Não contém anúncios; não é destinada a crianças.

## 7. Notes for the reviewer (campo opcional, ajuda)

O dashboard avisa que `<all_urls>` leva a **revisão detalhada** e sugere `activeTab`. A troca não serve aqui, e é isso que este texto explica — vale colar mesmo sendo campo opcional, porque é a única chance de responder ao ponto antes da fila.

```
Open source: https://github.com/LucasHollmann/video-tuner

How to test: open any site with a video (youtube.com, for example) and hover the video. A badge appears in the corner, with a picture-in-picture button; hover the badge and the panel expands with the speed and volume controls. The extension icon opens the settings screen.

Why broad host access is required, and why activeTab cannot replace it: the overlay must appear on hover, with no prior click, on whichever page the user is already watching a video on. activeTab is granted only after an explicit gesture on the extension icon, which would mean clicking the icon on every tab and after every navigation before any control shows up. A fixed list of sites is equally unworkable, since videos appear on arbitrary sites — that is the entire point of the extension.

What the access is actually used for: locating video and audio elements (including inside Shadow DOM) and reading/writing only their playbackRate and volume, calling the standard requestPictureInPicture API when the user clicks the picture-in-picture button, plus drawing the overlay inside a Shadow DOM. The extension does not read page content, cookies, history or form data. There are no network requests, no remote code, no analytics, and no data collection.

Note: the extension's user interface is in Brazilian Portuguese.
```

## 8. Depois de enviar

**Espere demora.** Por causa do `<all_urls>` o dashboard marca a extensão para revisão detalhada — é aviso de fila mais longa, não de reprovação. Pode levar de dias a algumas semanas na primeira publicação.

Se algum dia quiser sair dessa fila, o caminho é pedir só `activeTab` + `scripting` na instalação e oferecer o acesso a todos os sites como **permissão opcional**, concedida pelo usuário na tela de configuração (`optional_host_permissions` + `chrome.permissions.request` + `chrome.scripting.registerContentScripts`). Custa uma refatoração e muda a experiência de quem não concede.

Para publicar uma atualização: suba a `version` em `public/manifest.json`, rode `npm run build` e o `scripts/zip.ps1`, e envie o novo zip no mesmo item da Store. Toda versão passa por nova revisão.
