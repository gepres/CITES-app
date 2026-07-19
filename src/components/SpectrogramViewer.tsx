import { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { proxyMedia, type Recording } from '../lib/speciesAudio';
import { tipoSonido } from '../lib/meta';

const mmss = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

const ZOOM_MIN = 1;
const ZOOM_MAX = 12;

// Separaciones «redondas» para las marcas de tiempo. Nada por debajo de un
// segundo: las etiquetas se rotulan en mm:ss y saldrían repetidas.
const PASOS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];

interface Props {
  rec: Recording;
  especie: string;
  /** Segundo por el que iba el reproductor de la ficha. */
  inicio?: number;
  onClose: () => void;
}

/**
 * Espectrograma a pantalla completa, con reproducción sincronizada.
 *
 * La imagen se estira horizontalmente para ampliar el eje del tiempo (que es
 * lo que interesa al comparar cantos) y el contenedor se desplaza siguiendo el
 * cabezal. El eje de frecuencias no se dibuja a propósito: xeno-canto no
 * publica el rango en kHz de cada sonograma y rotularlo a ojo sería inventar
 * un dato en una app de consulta científica.
 */
export default function SpectrogramViewer({
  rec,
  especie,
  inicio = 0,
  onClose,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [sonando, setSonando] = useState(false);
  const [t, setT] = useState(inicio);
  const [dur, setDur] = useState(0);
  const [zoom, setZoom] = useState(2);
  const [volumen, setVolumen] = useState(1);
  const [mudo, setMudo] = useState(false);
  const [ancho, setAncho] = useState(0);
  const [hdLista, setHdLista] = useState(false);
  const [ventana, setVentana] = useState({ inicio: 0, fin: 1 });
  // Vacío hasta decidir el origen: así no empieza a sonar el enlace remoto
  // para cortarse un segundo después al llegar el Blob.
  const [fuente, setFuente] = useState('');
  const [preparando, setPreparando] = useState(true);

  const hd = rec.sonoHd ?? rec.sono;

  // xeno-canto ignora las peticiones `Range`, así que el navegador considera
  // la pista no navegable y descarta cualquier salto de posición. Bajando los
  // bytes a un Blob local el audio sí admite saltos, que es de lo que va este
  // visor. Si la descarga falla, se reproduce del tirón desde el origen.
  useEffect(() => {
    let activo = true;
    let creada = '';
    setPreparando(true);

    (async () => {
      try {
        const r = await fetch(proxyMedia(rec.audio));
        if (!r.ok) throw new Error(String(r.status));
        const blob = await r.blob();
        if (!activo) return;
        creada = URL.createObjectURL(blob);
        setFuente(creada);
      } catch {
        if (activo) setFuente(rec.audio);
      } finally {
        if (activo) setPreparando(false);
      }
    })();

    return () => {
      activo = false;
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [rec.audio]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Alta resolución en segundo plano: mientras llega se ve la imagen normal.
  useEffect(() => {
    if (!hd || hd === rec.sono) {
      setHdLista(true);
      return;
    }
    let activo = true;
    const img = new Image();
    img.onload = () => activo && setHdLista(true);
    img.onerror = () => activo && setHdLista(true);
    img.src = hd;
    return () => {
      activo = false;
    };
  }, [hd, rec.sono]);

  // Ancho visible, para calcular las marcas de tiempo y la ventana del mapa.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const medir = () => setAncho(el.clientWidth);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = mudo ? 0 : volumen;
  }, [volumen, mudo]);

  const actualizarVentana = () => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth === 0) return;
    setVentana({
      inicio: el.scrollLeft / el.scrollWidth,
      fin: (el.scrollLeft + el.clientWidth) / el.scrollWidth,
    });
  };

  useEffect(actualizarVentana, [zoom, ancho]);

  const alternar = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => undefined);
    else a.pause();
  };

  const irA = (segundos: number) => {
    const a = audioRef.current;
    if (!a || !(dur > 0)) return;
    a.currentTime = Math.min(Math.max(segundos, 0), dur);
    setT(a.currentTime);
    centrar(a.currentTime);
  };

  /** Mantiene el cabezal a la vista mientras avanza la reproducción. */
  const centrar = (segundo: number) => {
    const el = scrollRef.current;
    if (!el || !(dur > 0) || zoom === 1) return;
    const x = (segundo / dur) * el.scrollWidth;
    if (x < el.scrollLeft + el.clientWidth * 0.15 || x > el.scrollLeft + el.clientWidth * 0.85) {
      el.scrollTo({ left: x - el.clientWidth / 2, behavior: 'smooth' });
    }
  };

  const clicEnEspectrograma = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || !(dur > 0)) return;
    const caja = el.getBoundingClientRect();
    const x = e.clientX - caja.left + el.scrollLeft;
    irA((x / el.scrollWidth) * dur);
  };

  const clicEnMapa = (e: React.MouseEvent<HTMLDivElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    irA(((e.clientX - caja.left) / caja.width) * dur);
  };

  const avance = dur > 0 ? (t / dur) * 100 : 0;

  // Marcas de tiempo: se elige la separación más pequeña que deje al menos
  // 72 px entre etiquetas con el zoom actual.
  const anchoTotal = ancho * zoom;
  const pxPorSeg = dur > 0 ? anchoTotal / dur : 0;
  const paso = PASOS.find((p) => p * pxPorSeg >= 72) ?? PASOS[PASOS.length - 1];
  const marcas: number[] = [];
  if (pxPorSeg > 0) {
    for (let s = 0; s <= dur; s += paso) marcas.push(s);
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-slate-950">
      {/* Cabecera */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-extrabold italic text-white">
            {especie}
          </h2>
          <p className="truncate text-xs text-white/60">
            {[tipoSonido(rec.tipo), rec.lugar, rec.autor]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar espectrograma"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 active:scale-90"
        >
          <X size={22} />
        </button>
      </div>

      {/* Eje de tiempo */}
      <div className="relative h-5 shrink-0 overflow-hidden bg-slate-900 text-[10px] text-white/50">
        <div
          className="relative h-full"
          style={{
            width: `${zoom * 100}%`,
            // El porcentaje ya es relativo a este elemento —que mide el ancho
            // total desplazable—, así que no hay que volver a multiplicar por
            // el zoom: basta la fracción desplazada.
            transform: `translateX(-${ventana.inicio * 100}%)`,
          }}
        >
          {marcas.map((s) => (
            <span
              key={s}
              className="absolute top-0.5 border-l border-white/20 pl-1 tabular-nums"
              style={{ left: `${(s / dur) * 100}%` }}
            >
              {mmss(s)}
            </span>
          ))}
        </div>
      </div>

      {/* Espectrograma */}
      <div
        ref={scrollRef}
        onScroll={actualizarVentana}
        onClick={clicEnEspectrograma}
        className="relative flex-1 cursor-pointer overflow-x-auto overflow-y-hidden bg-white"
      >
        <div className="relative h-full" style={{ width: `${zoom * 100}%` }}>
          <img
            src={hdLista ? hd : rec.sono}
            alt={`Espectrograma de ${especie}`}
            className="h-full w-full"
            style={{ objectFit: 'fill' }}
            draggable={false}
          />
          {/* Solo el cabezal: teñir lo ya reproducido emborrona el trazo, que
              es justo lo que se viene a mirar aquí. */}
          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-rose-500"
            style={{ left: `${avance}%` }}
          />
        </div>

        {!hdLista && (
          <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-2 py-1 text-[11px] text-white">
            <Loader2 size={12} className="animate-spin" />
            Cargando alta resolución…
          </div>
        )}
      </div>

      {/* Mapa general: la grabación entera, con la ventana visible marcada */}
      <div
        onClick={clicEnMapa}
        className="relative h-12 shrink-0 cursor-pointer border-t border-white/10 bg-white"
      >
        <img
          src={rec.sono}
          alt=""
          aria-hidden
          className="h-full w-full opacity-70"
          style={{ objectFit: 'fill' }}
          draggable={false}
        />
        {zoom > 1 && (
          <div
            className="pointer-events-none absolute inset-y-0 border-x-2 border-brand-500 bg-brand-500/10"
            style={{
              left: `${ventana.inicio * 100}%`,
              width: `${(ventana.fin - ventana.inicio) * 100}%`,
            }}
          />
        )}
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-1 bg-brand-500"
          style={{ width: `${avance}%` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-slate-900"
          style={{ left: `${avance}%` }}
        />
      </div>

      {/* Controles */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={alternar}
          disabled={preparando}
          aria-label={sonando ? 'Pausar' : 'Reproducir'}
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition enabled:hover:bg-brand-700 enabled:active:scale-90 disabled:opacity-60"
        >
          {preparando ? (
            <Loader2 size={20} className="animate-spin" />
          ) : sonando ? (
            <Pause size={20} className="fill-white" />
          ) : (
            <Play size={20} className="ml-0.5 fill-white" />
          )}
        </button>

        {/* Volumen */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMudo((v) => !v)}
            aria-label={mudo ? 'Activar sonido' : 'Silenciar'}
            className="flex size-11 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 active:scale-90"
          >
            {mudo || volumen === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={mudo ? 0 : volumen}
            onChange={(e) => {
              setVolumen(Number(e.target.value));
              setMudo(false);
            }}
            aria-label="Volumen"
            className="h-1.5 w-20 accent-brand-500 sm:w-24"
          />
        </div>

        <span className="shrink-0 text-sm font-semibold tabular-nums text-white">
          {mmss(t)}
          <span className="font-normal text-white/50"> / {mmss(dur)}</span>
        </span>

        {/* Zoom */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - 1))}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Alejar"
            className="flex size-11 items-center justify-center rounded-xl text-white/80 transition enabled:hover:bg-white/10 enabled:active:scale-90 disabled:opacity-30"
          >
            <ZoomOut size={20} />
          </button>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Nivel de acercamiento"
            className="h-1.5 w-24 accent-brand-500 sm:w-32"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + 1))}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Acercar"
            className="flex size-11 items-center justify-center rounded-xl text-white/80 transition enabled:hover:bg-white/10 enabled:active:scale-90 disabled:opacity-30"
          >
            <ZoomIn size={20} />
          </button>
          <span className="w-8 shrink-0 text-xs tabular-nums text-white/60">
            {zoom}×
          </span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={fuente || undefined}
        preload="auto"
        autoPlay
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
        onEnded={() => setSonando(false)}
        onTimeUpdate={(e) => {
          setT(e.currentTarget.currentTime);
          centrar(e.currentTarget.currentTime);
        }}
        onLoadedMetadata={(e) => {
          setDur(e.currentTarget.duration);
          if (inicio > 0 && inicio < e.currentTarget.duration) {
            e.currentTarget.currentTime = inicio;
          }
        }}
      />
    </div>
  );
}
