import { PLACEMENTS } from "../settings.js";

/** Lista com um mini-diagrama do video e da barra em cada posicao. */
export default function PlacementPicker({ value, onChange }) {
  return (
    <div className="modes" role="radiogroup" aria-label="Posição do painel">
      {PLACEMENTS.map((mode) => (
        <button
          key={mode.value}
          type="button"
          role="radio"
          aria-checked={mode.value === value}
          className={`mode${mode.value === value ? " active" : ""}`}
          onClick={() => onChange(mode.value)}
        >
          <span className={`mode-figure mode-${mode.value}`} />
          <span className="mode-text">
            <span className="mode-label">{mode.label}</span>
            <span className="mode-hint">{mode.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
