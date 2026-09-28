/** Barra de progresso do video com o play/pause ao lado. */

const PlayIcon = () => (
  <svg viewBox="0 0 20 20" width="13" height="13" aria-hidden="true" focusable="false">
    <path d="M6 3.5 16 10 6 16.5z" fill="currentColor" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 20 20" width="13" height="13" aria-hidden="true" focusable="false">
    <path d="M5.5 3.5h3.2v13H5.5zm5.8 0h3.2v13h-3.2z" fill="currentColor" />
  </svg>
);

/** mm:ss, ou h:mm:ss quando o video passa da hora. */
function clock(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const s = String(total % 60).padStart(2, "0");
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export default function TimeBar({ time, duration, paused, onSeek, onToggle }) {
  // Ao vivo (duration Infinity) e antes dos metadados nao ha o que navegar.
  const seekable = duration > 0;
  const label = paused ? "Reproduzir" : "Pausar";

  return (
    <section className="control vt-time">
      <div className="row">
        <label htmlFor="vt-seek">Tempo</label>
        <output htmlFor="vt-seek">
          {seekable ? `${clock(time)} / ${clock(duration)}` : "ao vivo"}
        </output>
      </div>

      <div className="vt-time-row">
        <button type="button" className="vt-play" title={label} aria-label={label} onClick={onToggle}>
          {paused ? <PlayIcon /> : <PauseIcon />}
        </button>
        <input
          id="vt-seek"
          type="range"
          min={0}
          max={seekable ? duration : 1}
          step={0.1}
          value={seekable ? Math.min(time, duration) : 0}
          disabled={!seekable}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
      </div>
    </section>
  );
}
