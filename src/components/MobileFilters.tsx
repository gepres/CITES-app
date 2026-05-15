import { useMemo, useState } from 'react';
import {
  Activity,
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
import { APENDICE_INFO, estadoLabel, FACET_LABELS } from '../lib/meta';
import type { FacetOption } from '../lib/useSpeciesData';
import { FACET_KEYS } from '../lib/useSpeciesData';

interface Props {
  query: string;
  setQuery: (v: string) => void;
  facets: Record<FacetKey, FacetOption[]>;
  toggleFacet: (k: FacetKey, v: string) => void;
  clearFacet: (k: FacetKey) => void;
  activeCount: number;
  resultCount: number;
  onlyFav: boolean;
  setOnlyFav: (v: boolean) => void;
  favCount: number;
  onReset: () => void;
  onClose: () => void;
}

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

const ESTADO_FACETS = new Set<FacetKey>(['uicn', 'catNacional']);
const PEEK = 10;

function FacetSection({
  facetKey,
  options,
  onToggle,
  onClear,
}: {
  facetKey: FacetKey;
  options: FacetOption[];
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState(false);
  const Icon = FACET_ICON[facetKey];
  const selected = options.filter((o) => o.selected).length;
  const searchable = options.length > 14;

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? options.filter((o) => o.value.toLowerCase().includes(term))
      : options;
    const sel = list.filter((o) => o.selected);
    const rest = list.filter((o) => !o.selected);
    const merged = [...sel, ...rest];
    return expanded || term ? merged : merged.slice(0, PEEK);
  }, [options, q, expanded]);

  const hidden = options.length - visible.length;

  return (
    <section className="border-b border-slate-100 py-4 last:border-0 dark:border-slate-800">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`flex size-7 items-center justify-center rounded-lg ${
            selected > 0
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <Icon size={15} />
        </span>
        <h3 className="flex-1 text-sm font-bold">{FACET_LABELS[facetKey]}</h3>
        {selected > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400"
          >
            Limpiar ({selected})
          </button>
        )}
      </div>

      {searchable && (
        <div className="relative mb-3">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-3 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Buscar en ${FACET_LABELS[facetKey].toLowerCase()}…`}
            aria-label={`Buscar en ${FACET_LABELS[facetKey]}`}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {visible.map((o) => {
          const apCls =
            facetKey === 'apendice' ? APENDICE_INFO[o.value]?.cls : '';
          return (
            <button
              key={o.value}
              onClick={() => onToggle(o.value)}
              aria-pressed={o.selected}
              className={`flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition active:scale-95 ${
                o.selected
                  ? apCls
                    ? `${apCls} ring-2`
                    : 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <span className="max-w-[60vw] truncate">
                {ESTADO_FACETS.has(facetKey)
                  ? `${o.value} · ${estadoLabel(o.value)}`
                  : o.value}
              </span>
              <span
                className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                  o.selected ? 'bg-black/15' : 'bg-black/5 dark:bg-white/10'
                }`}
              >
                {o.count}
              </span>
            </button>
          );
        })}
        {visible.length === 0 && (
          <p className="py-1 text-xs text-slate-400">Sin coincidencias</p>
        )}
      </div>

      {!q && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 text-xs font-semibold text-brand-600 dark:text-brand-400"
        >
          Ver {hidden} más…
        </button>
      )}
      {!q && expanded && options.length > PEEK && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-3 text-xs font-semibold text-slate-500"
        >
          Ver menos
        </button>
      )}
    </section>
  );
}

export default function MobileFilters({
  query,
  setQuery,
  facets,
  toggleFacet,
  clearFacet,
  activeCount,
  resultCount,
  onlyFav,
  setOnlyFav,
  favCount,
  onReset,
  onClose,
}: Props) {
  const hasFilters = activeCount > 0 || onlyFav;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="animate-slide-up relative flex h-[92vh] flex-col rounded-t-3xl bg-white dark:bg-slate-900">
        {/* Asa + cabecera */}
        <div className="shrink-0 px-4 pt-2.5">
          <div
            className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700"
            onClick={onClose}
          />
          <div className="flex items-center justify-between pb-3">
            <div>
              <h2 className="text-lg font-extrabold">Filtros</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  {resultCount.toLocaleString('es-PE')}
                </span>{' '}
                especies coinciden
              </p>
            </div>
            <div className="flex items-center gap-1">
              {hasFilters && (
                <button
                  onClick={onReset}
                  className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-500 active:scale-95 dark:text-slate-400"
                >
                  <RotateCcw size={15} /> Limpiar
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Cerrar filtros"
                className="flex size-10 items-center justify-center rounded-xl hover:bg-slate-100 active:scale-90 dark:hover:bg-slate-800"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="relative pb-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-3.5 text-brand-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar especie, nombre común…"
              aria-label="Búsqueda global"
              className="w-full rounded-2xl border-2 border-slate-200 bg-white py-3 pl-11 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-800"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-lg text-slate-400 active:scale-90"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Cuerpo desplazable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <button
            onClick={() => setOnlyFav(!onlyFav)}
            className={`my-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition active:scale-[0.98] ${
              onlyFav
                ? 'bg-amber-400 text-amber-950'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Star size={17} className={onlyFav ? 'fill-amber-950' : ''} />
            {onlyFav ? 'Mostrando guardadas' : 'Solo guardadas'}
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-extrabold tabular-nums dark:bg-white/15">
              {favCount}
            </span>
          </button>

          {FACET_KEYS.map((key) => (
            <FacetSection
              key={key}
              facetKey={key}
              options={facets[key]}
              onToggle={(v) => toggleFacet(key, v)}
              onClear={() => clearFacet(key)}
            />
          ))}
          <div className="h-2" />
        </div>

        {/* Barra de acción fija */}
        <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
          <button
            onClick={onClose}
            className="h-12 w-full rounded-2xl bg-brand-600 text-sm font-extrabold text-white transition active:scale-[0.98]"
          >
            Ver {resultCount.toLocaleString('es-PE')} especies
          </button>
        </div>
      </div>
    </div>
  );
}
