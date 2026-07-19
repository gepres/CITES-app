import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Activity,
  CalendarDays,
  Dna,
  ExternalLink,
  FolderTree,
  GitBranch,
  Globe2,
  Leaf,
  type LucideIcon,
  MapPin,
  PawPrint,
  Share2,
  Star,
  X,
} from 'lucide-react';
import type { Species } from '../types';
import { APENDICE_INFO, estadoLabel, GEO_INFO } from '../lib/meta';
import { useSpeciesPhoto } from '../lib/speciesPhoto';
import { useSpeciesAudio, type Recording } from '../lib/speciesAudio';
import { ApendiceBadge, EstadoBadge, GeoBadge } from './Badge';
import AudioPlayer from './AudioPlayer';
import ShareDialog from './ShareDialog';

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 py-2.5 dark:border-slate-800">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function Titulo({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
      {children}
    </h3>
  );
}

interface Props {
  sp: Species | null;
  onClose: () => void;
  isFav: (id: number) => boolean;
  onToggleFav: (id: number) => void;
}

export default function SpeciesDetail({
  sp,
  onClose,
  isFav,
  onToggleFav,
}: Props) {
  const [sharing, setSharing] = useState(false);
  const [pistaIdx, setPistaIdx] = useState(0);
  const { photo, loading: photoLoading } = useSpeciesPhoto(sp?.cientifico);
  const { recordings, loading: audioLoading } = useSpeciesAudio(sp?.cientifico);

  // La grabación activa se deriva en el render: la ficha la necesita para
  // compartirla y el reproductor para sonar, sin duplicar estado.
  const pista: Recording | null = recordings[pistaIdx] ?? null;

  const dialogo = useRef<HTMLDivElement>(null);
  const cuerpo = useRef<HTMLDivElement>(null);
  const focoPrevio = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' && !sharing && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, sharing]);

  // Al abrir la ficha se lleva el foco al diálogo y, al cerrarla, se devuelve
  // a la fila desde la que se abrió.
  const id = sp?.id;
  useEffect(() => {
    if (id === undefined) return;
    focoPrevio.current = document.activeElement as HTMLElement;
    dialogo.current?.focus();
    if (cuerpo.current) cuerpo.current.scrollTop = 0;
    setPistaIdx(0);
    return () => focoPrevio.current?.focus?.();
  }, [id]);

  if (!sp) return null;

  const ap = APENDICE_INFO[sp.apendice];
  const geo = GEO_INFO[sp.geografia];
  const fav = isFav(sp.id);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 lg:p-6">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={dialogo}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ficha-titulo"
        className="animate-slide-up relative flex h-full w-full flex-col bg-white outline-none dark:bg-slate-900 sm:animate-fade-in sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-3xl sm:shadow-2xl lg:max-w-6xl"
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
              Ficha · N° {sp.id}
            </p>
            <h2
              id="ficha-titulo"
              className="mt-1 text-xl font-extrabold italic leading-tight sm:text-2xl"
            >
              {sp.cientifico}
            </h2>
            {sp.autor && <p className="text-sm text-slate-500">{sp.autor}</p>}
            {sp.comun && (
              <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                {sp.comun}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onToggleFav(sp.id)}
              aria-label={fav ? 'Quitar de guardadas' : 'Guardar especie'}
              aria-pressed={fav}
              className={`flex size-10 items-center justify-center rounded-xl transition active:scale-90 ${
                fav
                  ? 'bg-amber-100 text-amber-500 dark:bg-amber-500/15'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Star size={20} className={fav ? 'fill-amber-500' : ''} />
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar ficha"
              className="flex size-10 items-center justify-center rounded-xl transition hover:bg-slate-100 active:scale-90 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Cuerpo — una columna en móvil, dos en escritorio */}
        <div ref={cuerpo} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-7">
            {/* Columna multimedia */}
            <div className="space-y-4">
              {(photoLoading || photo) && (
                <figure className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                  {photo ? (
                    <img
                      src={photo.url}
                      alt={`Foto referencial de ${sp.cientifico}`}
                      loading="lazy"
                      className="h-52 w-full object-cover lg:h-64"
                    />
                  ) : (
                    <div className="flex h-52 w-full animate-pulse items-center justify-center text-xs text-slate-400 lg:h-64">
                      Buscando foto…
                    </div>
                  )}
                  {photo && (
                    <figcaption className="truncate px-3 py-1.5 text-[11px] text-slate-400">
                      📷 {photo.source} · {photo.credit} · foto referencial
                    </figcaption>
                  )}
                </figure>
              )}

              {/* La `key` reinicia el reproductor al cambiar de grabación. */}
              <AudioPlayer
                key={pista?.id ?? 'sin-grabacion'}
                recordings={recordings}
                loading={audioLoading}
                idx={pistaIdx}
                onIdx={setPistaIdx}
                especie={sp.cientifico}
              />

              <div className="flex flex-wrap gap-2">
                <ApendiceBadge value={sp.apendice} />
                <GeoBadge value={sp.geografia} />
                <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {sp.tipo}
                </span>
              </div>

              <section className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <Titulo>{ap?.label ?? 'Apéndice'}</Titulo>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {ap?.desc}
                </p>
              </section>
            </div>

            {/* Columna de datos */}
            <div className="min-w-0">
              <Titulo>Clasificación taxonómica</Titulo>
              {/* Dos columnas ya en móvil: son valores de una palabra y así se
                  recorta a la mitad el desplazamiento en pantallas pequeñas. */}
              <dl className="grid grid-cols-2 gap-x-4 sm:gap-x-7">
                <Row label="Phylum" value={sp.phylum} icon={Dna} />
                <Row label="Clase" value={sp.clase} icon={PawPrint} />
                <Row label="Orden" value={sp.orden} icon={GitBranch} />
                <Row label="Familia" value={sp.familia} icon={FolderTree} />
                <Row
                  label="Género"
                  value={<span className="italic">{sp.genero}</span>}
                  icon={Leaf}
                />
              </dl>

              <div className="mt-5">
                <Titulo>Conservación</Titulo>
              </div>
              <dl className="grid gap-x-7 sm:grid-cols-2">
                <Row
                  label="Categoría nacional"
                  icon={MapPin}
                  value={
                    <span className="flex items-center gap-2">
                      <EstadoBadge value={sp.catNacional} />
                      {estadoLabel(sp.catNacional)}
                    </span>
                  }
                />
                <Row
                  label="UICN"
                  icon={Activity}
                  value={
                    <span className="flex items-center gap-2">
                      <EstadoBadge value={sp.uicn} />
                      {estadoLabel(sp.uicn)}
                    </span>
                  }
                />
                <Row
                  label="Geografía"
                  icon={Globe2}
                  value={geo ? `${sp.geografia}: ${geo.desc}` : sp.geografia}
                />
                <Row
                  label="Inclusión / enmienda CITES"
                  value={sp.anio}
                  icon={CalendarDays}
                />
              </dl>

              {sp.sinonimos.length > 0 && (
                <div className="mt-5">
                  <Titulo>Sinónimos ({sp.sinonimos.length})</Titulo>
                  <div className="flex flex-wrap gap-1.5">
                    {sp.sinonimos.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-slate-100 px-2 py-1 text-xs italic text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sp.comentarios && (
                <div className="mt-5">
                  <Titulo>Comentarios de referencia</Titulo>
                  <p className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    {sp.comentarios}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 p-3 dark:border-slate-800 sm:flex sm:justify-end sm:p-4">
          <button
            onClick={() => setSharing(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white transition hover:bg-brand-700 active:scale-95 sm:h-11 sm:px-6"
          >
            <Share2 size={17} /> Compartir
          </button>
          <a
            href={`https://www.gbif.org/species/search?q=${encodeURIComponent(sp.cientifico)}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-bold transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:hover:bg-slate-800 sm:h-11 sm:px-6"
          >
            Ver en GBIF <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {sharing && (
        <ShareDialog
          sp={sp}
          pista={pista}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
