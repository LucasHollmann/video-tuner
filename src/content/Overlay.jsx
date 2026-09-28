import { useEffect, useState, useSyncExternalStore } from "react";
import Control from "../components/Control.jsx";
import { useSettings } from "../useSettings.js";
import { engine } from "./engine.js";
import { usePlacement } from "./usePlacement.js";
import { useHoveredVideo } from "./useHoveredVideo.js";
import { PIP_SUPPORTED, usePictureInPicture } from "./usePictureInPicture.js";
import { useMediaTime } from "./useMediaTime.js";
import TimeBar from "./TimeBar.jsx";

const SPEED_PRESETS = [0.5, 1, 1.5, 2, 4, 8].map((value) => ({ value, label: `${value}x` }));

const MAX_SPEED = 8;

const VOLUME_PRESETS = [
  { value: 0, label: "Mudo" },
  { value: 100, label: "100%" },
  { value: 200, label: "200%" },
  { value: 400, label: "400%" },
  { value: 600, label: "600%" }
];

const IDLE = { speed: 1, volume: 1 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const stop = (event) => event.stopPropagation();

/** Moldura com a janelinha no canto — o simbolo padrao de picture-in-picture. */
function PipIcon() {
  return (
    <svg viewBox="0 0 20 20" width="13" height="13" aria-hidden="true" focusable="false">
      <rect
        x="2"
        y="3.5"
        width="16"
        height="13"
        rx="2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect x="9.5" y="9.5" width="6.5" height="5" rx="1" fill="currentColor" />
    </svg>
  );
}

export default function Overlay({ hostEl }) {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  // Aberto, o painel segura o video ativo: so o clique fora fecha.
  const hovered = useHoveredVideo(hostEl, open);

  const showPip = settings.showPip && PIP_SUPPORTED;
  // Tudo que mora no corpo expandido; o botao de PiP sozinho, que fica no selo,
  // nao justifica abrir o painel.
  const hasControls = settings.showSpeed || settings.showVolume || settings.showProgress;
  const video = hasControls || showPip ? hovered : null;

  // Cada video tem seu proprio estado; engine.getState memoiza o objeto, entao
  // a comparacao por referencia do useSyncExternalStore continua valendo.
  const state = useSyncExternalStore(engine.subscribe, () =>
    video ? engine.getState(video) : IDLE
  );

  const pip = usePictureInPicture(video);
  const media = useMediaTime(settings.showProgress ? video : null);

  const placement = usePlacement(hostEl, video, settings.placement, settings.corner);

  // O video sumiu de vez (troca de pagina, player desmontado): recolhe, para
  // nao reabrir expandido na proxima vez.
  useEffect(() => {
    if (!video) setOpen(false);
  }, [video]);

  // Fecha no clique fora. Em capture no document, roda antes dos handlers de
  // dentro do shadow root — logo o stopPropagation do painel nao atrapalha —, e
  // composedPath enxerga o painel atraves do shadow, que `target` nao enxerga.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!event.composedPath().includes(hostEl)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, hostEl]);

  if (!video) return null;

  const volumePct = Math.round(state.volume * 100);
  const pipLabel = pip.active ? "Sair do picture-in-picture" : "Abrir em picture-in-picture";
  const pillLabel = open ? "Fechar os controles" : "Abrir os controles";

  // Vale o modo que usePlacement conseguiu aplicar, nao o pedido: sem barra
  // alcancavel, `controls` ja virou overlay e o CSS tem que acompanhar.
  const anchor = placement === "controls" ? "vt-controls" : `vt-${settings.corner}`;

  return (
    <div
      className={`vt-panel ${anchor}${open ? " is-open" : ""}`}
      // O clique no video costuma dar play/pause: nada do painel vaza pro site.
      onPointerDown={stop}
      onClick={stop}
      onDoubleClick={stop}
      onKeyDown={stop}
      onWheel={stop}
    >
      <div
        className={`vt-pill${hasControls ? " is-clickable" : ""}`}
        title={hasControls ? pillLabel : undefined}
        aria-expanded={hasControls ? open : undefined}
        onClick={hasControls ? () => setOpen((value) => !value) : undefined}
      >
        <span className="vt-mark">VT</span>
        {settings.showSpeed ? <span className="vt-value">{state.speed.toFixed(2)}x</span> : null}
        {settings.showSpeed && settings.showVolume ? <span className="vt-sep">·</span> : null}
        {settings.showVolume ? <span className="vt-value">{volumePct}%</span> : null}
        {showPip ? (
          <button
            type="button"
            className={`vt-pip${pip.active ? " is-active" : ""}`}
            aria-pressed={pip.active}
            title={pipLabel}
            aria-label={pipLabel}
            // Senao o clique sobe para o selo e abre/fecha o painel junto.
            onClick={(event) => {
              event.stopPropagation();
              pip.toggle();
            }}
          >
            <PipIcon />
          </button>
        ) : null}
      </div>

      {open && hasControls ? (
        <div className="vt-body">
          {settings.showProgress ? (
            <TimeBar
              time={media.time}
              duration={media.duration}
              paused={media.paused}
              onSeek={(seconds) => {
                video.currentTime = seconds;
              }}
              // play() rejeita quando o site bloqueia o autoplay: nao ha o que
              // fazer alem de nao derrubar o painel com um unhandled rejection.
              onToggle={() => {
                if (video.paused) video.play().catch(() => {});
                else video.pause();
              }}
            />
          ) : null}

          {settings.showSpeed ? (
            <Control
              id="vt-speed"
              label="Velocidade"
              display={`${state.speed.toFixed(2)}x`}
              value={clamp(state.speed, 0.25, MAX_SPEED)}
              min={0.25}
              max={MAX_SPEED}
              step={0.05}
              presets={SPEED_PRESETS}
              onChange={(value) => engine.setSpeed(video, value)}
            />
          ) : null}

          {settings.showVolume ? (
            <Control
              id="vt-volume"
              label="Volume"
              display={`${volumePct}%`}
              value={clamp(volumePct, 0, 600)}
              min={0}
              max={600}
              step={5}
              presets={VOLUME_PRESETS}
              onChange={(pct) => engine.setVolume(video, pct / 100)}
            />
          ) : null}

          <button type="button" className="vt-reset" onClick={() => engine.reset(video)}>
            Voltar ao padrão
          </button>
        </div>
      ) : null}
    </div>
  );
}
