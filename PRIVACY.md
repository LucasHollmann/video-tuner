# Política de Privacidade — Video Tuner

**Vigente desde:** 13 de agosto de 2026
**Extensão:** Video Tuner (Chrome, Manifest V3)

## Resumo

O Video Tuner **não coleta, não transmite e não vende nenhum dado**. A extensão não faz requisições de rede, não tem analytics, telemetria, rastreadores nem servidores. Tudo o que ela faz acontece localmente, no seu navegador.

## O que é armazenado

| Dado | Onde | Quando é apagado |
| --- | --- | --- |
| Sua configuração: quais controles aparecem no overlay (velocidade/volume) e em qual canto do vídeo | `chrome.storage.local`, no seu dispositivo | Ao remover a extensão, ou ao limpar os dados dela |
| Velocidade e volume ajustados em um vídeo específico | Apenas na memória da aba | Ao recarregar ou fechar a página |

Nada disso sai do seu computador. A extensão não usa `chrome.storage.sync`, portanto a configuração também não é enviada para a sua conta Google.

## O que a extensão acessa nas páginas

Para funcionar, a extensão insere um script nas páginas que você visita. Esse script:

- localiza elementos `<video>` e `<audio>` da página, inclusive dentro de Shadow DOM;
- lê e altera **apenas** as propriedades `playbackRate` e `volume` desses elementos;
- amplifica o áudio acima de 100% usando a Web Audio API (`GainNode`), inteiramente dentro da própria aba;
- desenha o overlay de controle sobre o vídeo, isolado num Shadow DOM.

A extensão **não** lê o conteúdo das páginas, o histórico de navegação, cookies, dados de formulários, senhas, e **não** acessa o conteúdo dos vídeos ou do áudio. Nenhuma informação é enviada para lugar algum.

## Permissões e por que são necessárias

| Permissão | Motivo |
| --- | --- |
| `storage` | Guardar sua configuração (controles exibidos e canto do overlay) localmente. |
| `activeTab` | Ao usar um atalho de teclado, identificar a aba ativa para aplicar a mudança nela. |
| `host_permissions: <all_urls>` | Vídeos existem em qualquer site, e a extensão foi feita para funcionar em qualquer um deles. Esse acesso é usado só para inserir o script de controle descrito acima — nunca para ler ou enviar conteúdo das páginas. |

## Terceiros

Nenhum. A extensão não integra serviços externos, não carrega código remoto e não compartilha dados com ninguém.

## Uso de dados conforme a Chrome Web Store

Declaramos que os dados manipulados pela extensão **não** são vendidos a terceiros, **não** são usados para finalidade alheia à função principal da extensão e **não** são usados para avaliar crédito ou conceder empréstimos.

## Mudanças nesta política

Se a política mudar, esta página e o arquivo `PRIVACY.md` no repositório serão atualizados, com nova data de vigência. O histórico completo de alterações fica público no Git.

## Contato

Dúvidas ou pedidos sobre privacidade: abra uma issue em
<https://github.com/LucasHollmann/video-tuner/issues>.

---

## Privacy Policy (English summary)

**Effective:** August 13, 2026

Video Tuner collects, transmits, and sells **no data**. It makes no network requests and contains no analytics or tracking.

Stored locally on your device via `chrome.storage.local`: your preferences only (which controls the overlay shows, and which corner it appears in). Per-video speed and volume adjustments live in page memory and are discarded on reload. Nothing is synced to your Google account.

The content script locates `<video>`/`<audio>` elements and reads/writes only their `playbackRate` and `volume`, amplifying audio above 100% locally through the Web Audio API. It does not read page content, browsing history, cookies, or form data, and sends nothing anywhere.

Permissions: `storage` (save preferences), `activeTab` (apply keyboard shortcuts to the current tab), `<all_urls>` (videos can be on any site — used solely to inject the control script).

No third parties are involved. Data is not sold, is not used for any purpose unrelated to the extension's core function, and is not used for creditworthiness or lending.

Contact: <https://github.com/LucasHollmann/video-tuner/issues>.
