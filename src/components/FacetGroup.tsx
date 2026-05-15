import { useMemo, useState } from 'react';
import { ChevronDown, Search, type LucideIcon } from 'lucide-react';
import type { FacetOption } from '../lib/useSpeciesData';
import { estadoLabel } from '../lib/meta';

interface Props {
  label: string;
  facetKey: string;
  icon: LucideIcon;
  options: FacetOption[];
  onToggle: (value: string) => void;
  onClear: () => void;
  defaultOpen?: boolean;
}

const PEEK = 8;
const SEARCH_THRESHOLD = 12;
const USE_ESTADO_LABEL = new Set(['uicn', 'catNacional']);

export default function FacetGroup({
  label,
  facetKey,
  icon: Icon,
  options,
  onToggle,
  onClear,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);
  const [q, setQ] = useState('');

  const selectedCount = options.filter((o) => o.selected).length;

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? options.filter((o) => o.value.toLowerCase().includes(term))
      : options;
    // Mantén siempre visibles las opciones seleccionadas.
    const sel = list.filter((o) => o.selected);
    const rest = list.filter((o) => !o.selected);
    const merged = [...sel, ...rest];
    return expanded || term ? merged : merged.slice(0, PEEK);
  }, [options, q, expanded]);

  const hidden = options.length - visible.length;

  return (
    <div className="border-b border-slate-100 py-1 last:border-0 dark:border-slate-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 py-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span
            className={`flex size-7 items-center justify-center rounded-lg transition ${
              selectedCount > 0
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <Icon size={15} />
          </span>
          {label}
          {selectedCount > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {selectedCount}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="animate-fade-in pb-2">
          {selectedCount > 0 && (
            <button
              onClick={onClear}
              className="mb-1.5 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Limpiar ({selectedCount})
            </button>
          )}

          {options.length >= SEARCH_THRESHOLD && (
            <div className="relative mb-2">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Buscar en ${label.toLowerCase()}…`}
                aria-label={`Buscar en ${label}`}
                className="input !py-1.5 !pl-8 text-xs"
              />
            </div>
          )}

          <ul className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {visible.map((o) => (
              <li key={o.value}>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700">
                  <input
                    type="checkbox"
                    checked={o.selected}
                    onChange={() => onToggle(o.value)}
                    className="size-[18px] shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <span className="flex-1 truncate" title={o.value}>
                    {USE_ESTADO_LABEL.has(facetKey)
                      ? `${o.value} · ${estadoLabel(o.value)}`
                      : o.value}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-slate-400">
                    {o.count}
                  </span>
                </label>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="p-2 text-xs text-slate-400">Sin coincidencias</li>
            )}
          </ul>

          {!expanded && hidden > 0 && !q && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-1.5 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Ver {hidden} más…
            </button>
          )}
          {expanded && options.length > PEEK && !q && (
            <button
              onClick={() => setExpanded(false)}
              className="mt-1.5 text-xs font-medium text-slate-500 hover:underline"
            >
              Ver menos
            </button>
          )}
        </div>
      )}
    </div>
  );
}
