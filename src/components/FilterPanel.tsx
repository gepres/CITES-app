import {
  Activity,
  AudioLines,
  FolderTree,
  GitBranch,
  Globe2,
  type LucideIcon,
  MapPin,
  PawPrint,
  RotateCcw,
  Search,
  ShieldAlert,
  Star,
  Tags,
  X,
} from 'lucide-react';
import type { FacetKey } from '../types';
import { APENDICE_INFO, FACET_LABELS } from '../lib/meta';
import type { FacetOption } from '../lib/useSpeciesData';
import { FACET_KEYS, hayIndiceAudio } from '../lib/useSpeciesData';
import FacetGroup from './FacetGroup';

interface Props {
  query: string;
  setQuery: (v: string) => void;
  facets: Record<FacetKey, FacetOption[]>;
  toggleFacet: (k: FacetKey, v: string) => void;
  clearFacet: (k: FacetKey) => void;
  clearAll: () => void;
  activeCount: number;
  resultCount: number;
  onlyFav: boolean;
  setOnlyFav: (v: boolean) => void;
  favCount: number;
  onlyAudio: boolean;
  setOnlyAudio: (v: boolean) => void;
  audioCount: number;
}

const DEFAULT_OPEN: FacetKey[] = ['clase'];

const FACET_ICON: Record<FacetKey, LucideIcon> = {
  tipo: Tags,
  clase: PawPrint,
  orden: GitBranch,
  familia: FolderTree,
  apendice: ShieldAlert,
  catNacional: MapPin,
  uicn: Activity,
  geografia: Globe2,
};

export default function FilterPanel({
  query,
  setQuery,
  facets,
  toggleFacet,
  clearFacet,
  clearAll,
  activeCount,
  resultCount,
  onlyFav,
  setOnlyFav,
  favCount,
  onlyAudio,
  setOnlyAudio,
  audioCount,
}: Props) {
  const apOptions = facets.apendice;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Filtros
          </h2>
          {(activeCount > 0 || onlyFav || onlyAudio) && (
            <button
              onClick={() => {
                clearAll();
                setOnlyFav(false);
                setOnlyAudio(false);
              }}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              <RotateCcw size={13} /> Restablecer
            </button>
          )}
        </div>

        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-3.5 text-brand-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar especie, nombre común…"
            className="w-full rounded-2xl border-2 border-slate-200 bg-white py-3 pl-11 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
            aria-label="Búsqueda global"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Acceso rápido: Apéndice CITES */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['I', 'II', 'III'].map((ap) => {
            const opt = apOptions.find((o) => o.value === ap);
            const info = APENDICE_INFO[ap];
            return (
              <button
                key={ap}
                onClick={() => toggleFacet('apendice', ap)}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  opt?.selected
                    ? info.cls + ' ring-2'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
                title={info.desc}
              >
                <ShieldAlert size={13} />
                CITES {ap}
                <span className="tabular-nums opacity-70">
                  {opt?.count ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toggle: solo guardadas */}
        <button
          onClick={() => setOnlyFav(!onlyFav)}
          className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
            onlyFav
              ? 'bg-amber-400 text-amber-950'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <Star size={16} className={onlyFav ? 'fill-amber-950' : ''} />
          {onlyFav ? 'Mostrando guardadas' : 'Solo guardadas'}
          <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums dark:bg-white/15">
            {favCount}
          </span>
        </button>

        {/* Toggle: solo especies con grabación */}
        {hayIndiceAudio && (
          <button
            type="button"
            onClick={() => setOnlyAudio(!onlyAudio)}
            aria-pressed={onlyAudio}
            className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
              onlyAudio
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <AudioLines size={16} />
            {onlyAudio ? 'Mostrando con sonido' : 'Solo con sonido'}
            <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums dark:bg-white/15">
              {audioCount}
            </span>
          </button>
        )}

        <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
          <span className="text-base font-extrabold text-brand-600 dark:text-brand-400">
            {resultCount.toLocaleString('es-PE')}
          </span>{' '}
          especies coinciden
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {FACET_KEYS.map((key) => (
          <FacetGroup
            key={key}
            label={FACET_LABELS[key]}
            facetKey={key}
            icon={FACET_ICON[key]}
            options={facets[key]}
            onToggle={(v) => toggleFacet(key, v)}
            onClear={() => clearFacet(key)}
            defaultOpen={DEFAULT_OPEN.includes(key)}
          />
        ))}
        <div className="py-4" />
      </div>
    </div>
  );
}
