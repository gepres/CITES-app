import { useRef, useState } from 'react';
import {
  AudioLines,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Maximize2,
  Pause,
  Play,
} from 'lucide-react';
import { proxyMedia, type Recording } from '../lib/speciesAudio';
import { tipoSonido } from '../lib/meta';
import SpectrogramViewer from './SpectrogramViewer';

const mmss = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

interface Props {
  recordings: Recording[];
  loading: boolean;
  /** Grabación mostrada. La controla la ficha, que también la comparte. */
  idx: number;
  onIdx: (i: number) => void;
  /** Nombre científico, para la cabecera del visor ampliado. */
  especie: string;
}

/**
 * Reproductor de una grabación con su espectrograma.
 *
 * El estado de reproducción se reinicia montando de nuevo el componente (la
 * ficha le pasa `key` con el id de la grabación), no con efectos: así no hay
 * un instante en que se vea el tiempo de la pista anterior.
 */
export default function AudioPlayer({
  recordings,
  loading,
  idx,
  onIdx,
  especie,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pistaRef = useRef<HTMLDivElement>(null);

  const [sonando, setSonando] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const [ampliado, setAmpliado] = useState(false);
  // xeno-canto no sirve sus imágenes con CORS y a veces rechaza el enlace
  // directo: si falla, se reintenta a través del proxy propio.
  const [viaProxy, setViaProxy] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-6 text-xs text-slate-500 dark:border-slate-700">
        <Loader2 size={14} className="animate-spin" />
        Buscando grabaciones…
      </div>
    );
  }

  const rec = recordings[idx];
  if (!rec) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-6 text-xs text-slate-400 dark:border-slate-700">
        <AudioLines size={14} />
        Sin grabaciones disponibles para esta especie
      </div>
    );
  }

  const alternar = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      setCargando(true);
      a.play()
        .then(() => setError(false))
        .catch(() => setError(true))
        .finally(() => setCargando(false));
    } else {
      a.pause();
    }
  };

  const irA = (segundos: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(dur) || dur <= 0) return;
    a.currentTime = Math.min(Math.max(segundos, 0), dur);
    setT(a.currentTime);
  };

  const buscarConClic = (e: React.MouseEvent<HTMLDivElement>) => {
    const caja = pistaRef.current?.getBoundingClientRect();
    if (!caja) return;
    irA(((e.clientX - caja.left) / caja.width) * dur);
  };

  const buscarConTeclado = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') irA(t + 5);
    else if (e.key === 'ArrowLeft') irA(t - 5);
    else if (e.key === 'Home') irA(0);
    else if (e.key === 'End') irA(dur);
    else if (e.key === ' ' || e.key === 'Enter') alternar();
    else return;
    e.preventDefault();
  };

  const avance = dur > 0 ? (t / dur) * 100 : 0;
  const imagenSono = rec.sono
    ? viaProxy
      ? proxyMedia(rec.sono)
      : rec.sono
    : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Espectrograma (xeno-canto) o banda de progreso simple (iNaturalist) */}
      <div
        ref={pistaRef}
        onClick={buscarConClic}
        onKeyDown={buscarConTeclado}
        role="slider"
        tabIndex={0}
        aria-label="Posición de la grabación"
        aria-valuemin={0}
        aria-valuemax={Math.round(dur)}
        aria-valuenow={Math.round(t)}
        aria-valuetext={`${mmss(t)} de ${mmss(dur)}`}
        className={`relative h-24 select-none outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:h-28 ${
          // El espectrograma de xeno-canto viene sobre fondo claro: con un
          // contenedor oscuro se vería una banda gris alrededor.
          imagenSono ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-900'
        } ${dur > 0 ? 'cursor-pointer' : ''}`}
      >
        {imagenSono ? (
          <img
            src={imagenSono}
            alt={`Espectrograma de ${tipoSonido(rec.tipo) ?? 'la grabación'}`}
            className="h-full w-full object-cover"
            onError={() => setViaProxy((v) => !v)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-600">
            <AudioLines size={22} />
            <span className="text-[11px]">Sin espectrograma en esta fuente</span>
          </div>
        )}

        {/* Zona ya reproducida + cabezal */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 bg-brand-500/25"
          style={{ width: `${avance}%` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-brand-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]"
          style={{ left: `${avance}%` }}
        />

        {rec.sono && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              audioRef.current?.pause();
              setAmpliado(true);
            }}
            aria-label="Ver el espectrograma a pantalla completa"
            title="Ampliar espectrograma"
            className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-lg bg-slate-900/70 text-white backdrop-blur transition hover:bg-slate-900 active:scale-90"
          >
            <Maximize2 size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={alternar}
          aria-label={sonando ? 'Pausar grabación' : 'Reproducir grabación'}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 active:scale-90"
        >
          {cargando ? (
            <Loader2 size={18} className="animate-spin" />
          ) : sonando ? (
            <Pause size={18} className="fill-white" />
          ) : (
            <Play size={18} className="ml-0.5 fill-white" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold tabular-nums">
              {mmss(t)}
              <span className="font-normal text-slate-400">
                {' / '}
                {dur > 0 ? mmss(dur) : (rec.duracion ?? '—')}
              </span>
            </span>
            {rec.tipo && (
              <span className="truncate text-xs first-letter:uppercase text-slate-500">
                {tipoSonido(rec.tipo)}
              </span>
            )}
          </div>
          <p className="truncate text-[11px] text-slate-400">
            {rec.lugar ?? 'Ubicación no indicada'}
          </p>
        </div>

        {recordings.length > 1 && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => onIdx(Math.max(0, idx - 1))}
              disabled={idx === 0}
              aria-label="Grabación anterior"
              className="flex size-9 items-center justify-center rounded-lg text-slate-500 transition enabled:hover:bg-slate-100 disabled:opacity-30 dark:enabled:hover:bg-slate-800"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[11px] tabular-nums text-slate-400">
              {idx + 1}/{recordings.length}
            </span>
            <button
              type="button"
              onClick={() => onIdx(Math.min(recordings.length - 1, idx + 1))}
              disabled={idx === recordings.length - 1}
              aria-label="Grabación siguiente"
              className="flex size-9 items-center justify-center rounded-lg text-slate-500 transition enabled:hover:bg-slate-100 disabled:opacity-30 dark:enabled:hover:bg-slate-800"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <p className="flex flex-wrap items-center gap-x-1.5 border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400 dark:border-slate-800">
        {error ? (
          <span className="text-rose-500">
            No se pudo reproducir esta grabación.
          </span>
        ) : (
          <>
            <span className="font-medium text-slate-500">{rec.autor}</span>
            {rec.licencia && (
              <>
                <span>·</span>
                {rec.licenciaUrl ? (
                  <a
                    href={rec.licenciaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {rec.licencia}
                  </a>
                ) : (
                  <span>{rec.licencia}</span>
                )}
              </>
            )}
            <span>·</span>
            {rec.pagina ? (
              <a
                href={rec.pagina}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 hover:underline"
              >
                {rec.fuente} <ExternalLink size={10} />
              </a>
            ) : (
              <span>{rec.fuente}</span>
            )}
          </>
        )}
      </p>

      <audio
        ref={audioRef}
        src={rec.audio}
        preload="metadata"
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
        onEnded={() => setSonando(false)}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onError={() => setError(true)}
      />

      {ampliado && (
        <SpectrogramViewer
          rec={rec}
          especie={especie}
          inicio={t}
          onClose={() => setAmpliado(false)}
        />
      )}
    </section>
  );
}
