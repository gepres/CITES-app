import { useEffect, useState, type ReactNode } from 'react';
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
import { ApendiceBadge, EstadoBadge, GeoBadge } from './Badge';
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
    <div className="flex items-start gap-3 py-2.5">
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
  const { photo, loading: photoLoading } = useSpeciesPhoto(sp?.cientifico);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' && !sharing && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, sharing]);

  if (!sp) return null;

  const ap = APENDICE_INFO[sp.apendice];
  const geo = GEO_INFO[sp.geografia];
  const fav = isFav(sp.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="animate-slide-in relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
              Ficha · N° {sp.id}
            </p>
            <h2 className="mt-1 text-xl font-extrabold italic leading-tight">
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
              aria-label="Cerrar"
              className="flex size-10 items-center justify-center rounded-xl transition hover:bg-slate-100 active:scale-90 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {(photoLoading || photo) && (
            <figure className="mb-5 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              {photo ? (
                <img
                  src={photo.url}
                  alt={`Foto referencial de ${sp.cientifico}`}
                  loading="lazy"
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="flex h-52 w-full animate-pulse items-center justify-center text-xs text-slate-400">
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

          <div className="mb-5 flex flex-wrap gap-2">
            <ApendiceBadge value={sp.apendice} />
            <GeoBadge value={sp.geografia} />
            <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {sp.tipo}
            </span>
          </div>

          <section className="mb-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              {ap?.label ?? 'Apéndice'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {ap?.desc}
            </p>
          </section>

          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            Clasificación taxonómica
          </h3>
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
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

          <h3 className="mb-1 mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">
            Conservación
          </h3>
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
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
            <>
              <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Sinónimos ({sp.sinonimos.length})
              </h3>
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
            </>
          )}

          {sp.comentarios && (
            <>
              <h3 className="mb-1 mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Comentarios de referencia
              </h3>
              <p className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                {sp.comentarios}
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            onClick={() => setSharing(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white transition hover:bg-brand-700 active:scale-95"
          >
            <Share2 size={17} /> Compartir
          </button>
          <a
            href={`https://www.gbif.org/species/search?q=${encodeURIComponent(sp.cientifico)}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-bold transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Ver en GBIF <ExternalLink size={15} />
          </a>
        </div>
      </aside>

      {sharing && <ShareDialog sp={sp} onClose={() => setSharing(false)} />}
    </div>
  );
}
