import CornerPicker from "../components/CornerPicker.jsx";
import Toggle from "../components/Toggle.jsx";
import { useSettings } from "../useSettings.js";

export default function App() {
  const { settings, loaded, update } = useSettings();

  return (
    <div className={loaded ? "" : "loading"}>
      <header>
        <h1>Video Tuner</h1>
        <span className="status">configuração</span>
      </header>

      <section className="group">
        <h2>Controles no overlay</h2>
        <Toggle
          id="showSpeed"
          label="Velocidade"
          hint="0.25x a 8x"
          checked={settings.showSpeed}
          onChange={(showSpeed) => update({ showSpeed })}
        />
        <Toggle
          id="showVolume"
          label="Volume"
          hint="0% a 600% (acima de 100% via WebAudio)"
          checked={settings.showVolume}
          onChange={(showVolume) => update({ showVolume })}
        />
        <Toggle
          id="showPip"
          label="Picture-in-picture"
          hint="Botão para soltar o vídeo numa janela flutuante"
          checked={settings.showPip}
          onChange={(showPip) => update({ showPip })}
        />
        {!settings.showSpeed && !settings.showVolume && !settings.showPip ? (
          <p className="warn">Sem nenhum controle marcado, o overlay não aparece.</p>
        ) : null}
      </section>

      <section className="group">
        <h2>Canto do overlay</h2>
        <CornerPicker value={settings.corner} onChange={(corner) => update({ corner })} />
      </section>

      <p className="hint">
        O ajuste vale só para o vídeo em que foi feito — os outros seguem o padrão do site. Passe o
        mouse sobre um vídeo para ver o overlay e sobre o overlay para expandir.
      </p>
    </div>
  );
}
