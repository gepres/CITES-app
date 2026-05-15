import { useEffect, useState } from 'react';
import { Mail, X } from 'lucide-react';
import { ANEXOS } from '../lib/useSpeciesData';

const TABS = ['Cambios 2023', 'Fuentes', 'Equipo'] as const;
type Tab = (typeof TABS)[number];

export default function AnexosModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('Cambios 2023');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="animate-fade-in relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold">Anexos y fuentes</h2>
            <p className="mt-1 max-w-xl text-xs text-slate-500">{ANEXOS.cita}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-slate-200 px-4 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-3 text-sm font-medium transition ${
                tab === t
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'Cambios 2023' && (
            <ol className="space-y-3">
              {ANEXOS.cambios.map((c) => (
                <li
                  key={`${c.n}-${c.taxon}`}
                  className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      {c.edicion}
                    </span>
                    <span className="text-sm font-bold italic">{c.taxon}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {c.detalle}
                  </p>
                </li>
              ))}
            </ol>
          )}

          {tab === 'Fuentes' && (
            <ul className="space-y-2">
              {ANEXOS.fuentes.map((f) => (
                <li
                  key={f.n}
                  className="flex gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
                >
                  <span className="shrink-0 font-bold tabular-nums text-slate-400">
                    {f.anio}
                  </span>
                  <span>
                    <span className="font-semibold">{f.autor}</span>{' '}
                    <span className="text-slate-600 dark:text-slate-300">
                      {f.titulo}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {tab === 'Equipo' && (
            <ul className="space-y-2">
              {ANEXOS.equipo.map((e) => (
                <li
                  key={e.email}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
                >
                  <span className="font-medium">{e.nombre}</span>
                  <a
                    href={`mailto:${e.email}`}
                    className="flex items-center gap-1.5 text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <Mail size={14} /> {e.email}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
