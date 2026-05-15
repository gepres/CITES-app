import { useMemo } from 'react';
import { Fish, Sparkles, TriangleAlert } from 'lucide-react';
import type { Species } from '../types';
import { APENDICE_INFO } from '../lib/meta';

const THREATENED = new Set(['CR', 'EN', 'VU']);

export default function StatsCards({ data }: { data: Species[] }) {
  const s = useMemo(() => {
    const ap = { I: 0, II: 0, III: 0 } as Record<string, number>;
    let endemicas = 0;
    let amenazadas = 0;
    for (const sp of data) {
      if (ap[sp.apendice] !== undefined) ap[sp.apendice]++;
      if (sp.geografia === 'Endémica') endemicas++;
      if (THREATENED.has(sp.uicn) || THREATENED.has(sp.catNacional)) amenazadas++;
    }
    return { total: data.length, ap, endemicas, amenazadas };
  }, [data]);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* Total — tarjeta destacada */}
      <div className="col-span-2 flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-800 p-4 text-white shadow-lg shadow-brand-600/20 lg:col-span-1">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Fish size={28} />
        </div>
        <div className="min-w-0">
          <div className="text-4xl font-extrabold leading-none tracking-tight">
            {s.total.toLocaleString('es-PE')}
          </div>
          <div className="mt-1 text-sm font-semibold text-white/85">
            especies en la vista
          </div>
        </div>
      </div>

      {/* Apéndice CITES — chips de color (intuitivo) */}
      <div className="card col-span-2 p-4 lg:col-span-1">
        <div className="mb-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          Apéndice CITES
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['I', 'II', 'III'] as const).map((k) => (
            <div
              key={k}
              title={APENDICE_INFO[k].desc}
              className={`flex flex-col items-center rounded-xl py-2 ${APENDICE_INFO[k].cls}`}
            >
              <span className="text-2xl font-extrabold leading-none tabular-nums">
                {s.ap[k]}
              </span>
              <span className="mt-1 text-[11px] font-bold">CITES {k}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Endémicas */}
      <div className="card flex items-center gap-3 p-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
          <Sparkles size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-3xl font-extrabold leading-none tracking-tight">
            {s.endemicas.toLocaleString('es-PE')}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Endémicas
          </div>
          <div className="text-[11px] text-slate-400">exclusivas del Perú</div>
        </div>
      </div>

      {/* Amenazadas */}
      <div className="card flex items-center gap-3 p-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
          <TriangleAlert size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-3xl font-extrabold leading-none tracking-tight">
            {s.amenazadas.toLocaleString('es-PE')}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Amenazadas
          </div>
          <div className="text-[11px] text-slate-400">CR · EN · VU</div>
        </div>
      </div>
    </div>
  );
}
