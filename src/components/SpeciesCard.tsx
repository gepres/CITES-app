import { ChevronRight, Star } from 'lucide-react';
import type { Species } from '../types';
import { ApendiceBadge, EstadoBadge, GeoBadge } from './Badge';

interface Props {
  sp: Species;
  onSelect: (sp: Species) => void;
  isFav: boolean;
  onToggleFav: (id: number) => void;
}

export default function SpeciesCard({ sp, onSelect, isFav, onToggleFav }: Props) {
  return (
    <div className="relative">
      <button
        onClick={() => onSelect(sp)}
        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 pr-12 text-left transition active:scale-[0.99] active:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="shrink-0 text-xs font-bold tabular-nums text-slate-300 dark:text-slate-600">
              {sp.id}
            </span>
            <h3 className="truncate text-[15px] font-bold italic leading-tight">
              {sp.cientifico}
            </h3>
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
            {sp.comun || '—'}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {sp.clase} · {sp.familia}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <ApendiceBadge value={sp.apendice} />
            <GeoBadge value={sp.geografia} />
            {sp.uicn !== 'NE' && <EstadoBadge value={sp.uicn} title="UICN" />}
          </div>
        </div>
        <ChevronRight
          size={20}
          className="shrink-0 self-center text-slate-300 dark:text-slate-600"
        />
      </button>

      <button
        onClick={() => onToggleFav(sp.id)}
        aria-label={isFav ? 'Quitar de guardadas' : 'Guardar especie'}
        aria-pressed={isFav}
        className={`absolute right-2 top-2 flex size-9 items-center justify-center rounded-xl transition active:scale-90 ${
          isFav
            ? 'text-amber-500'
            : 'text-slate-300 hover:text-amber-500 dark:text-slate-600'
        }`}
      >
        <Star size={20} className={isFav ? 'fill-amber-500' : ''} />
      </button>
    </div>
  );
}
