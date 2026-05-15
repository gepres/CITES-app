import { forwardRef, type ReactNode } from 'react';
import type { Species } from '../types';
import { APENDICE_INFO, estadoLabel, GEO_INFO } from '../lib/meta';

/**
 * Tarjeta diseñada para exportar como imagen (PNG) y compartir.
 * Incluye TODOS los datos de la ficha. Siempre en modo claro y ancho fijo
 * para que se vea bien fuera de la app.
 */
const ShareCard = forwardRef<
  HTMLDivElement,
  { sp: Species; photo?: string | null; photoCredit?: string }
>(function ShareCard({ sp, photo, photoCredit }, ref) {
    const ap = APENDICE_INFO[sp.apendice];
    const geo = GEO_INFO[sp.geografia];

    const Item = ({ k, v }: { k: string; v: string }) => (
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {k}
        </div>
        <div className="text-[13px] font-semibold text-slate-800">
          {v || '—'}
        </div>
      </div>
    );

    const Section = ({ title, children }: { title: string; children: ReactNode }) => (
      <div className="mt-4">
        <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-700">
          {title}
        </div>
        {children}
      </div>
    );

    return (
      <div
        ref={ref}
        style={{ width: 480 }}
        className="overflow-hidden rounded-3xl bg-white font-sans"
      >
        {photo && (
          <div className="relative">
            <img
              src={photo}
              crossOrigin="anonymous"
              alt={sp.cientifico}
              className="h-56 w-full object-cover"
            />
            {photoCredit && (
              <div className="absolute inset-x-0 bottom-0 truncate bg-black/45 px-3 py-1 text-[10px] text-white">
                📷 {photoCredit}
              </div>
            )}
          </div>
        )}
        <div className="bg-gradient-to-br from-brand-600 to-emerald-800 px-6 py-5 text-white">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest opacity-90">
            <span>🐾 Fauna Silvestre CITES · Perú</span>
            <span>
              N° {sp.id} · {sp.tipo}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-extrabold italic leading-tight">
            {sp.cientifico}
          </h2>
          {sp.autor && (
            <p className="text-sm font-medium text-white/80">{sp.autor}</p>
          )}
          {sp.comun && (
            <p className="mt-1 text-base font-semibold">{sp.comun}</p>
          )}
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${ap?.cls}`}>
              CITES {sp.apendice}
            </span>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
              {sp.geografia}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {sp.tipo}
            </span>
          </div>

          {ap?.desc && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {ap.label}
              </div>
              <p className="mt-1 text-[12.5px] leading-snug text-slate-600">
                {ap.desc}
              </p>
            </div>
          )}

          <Section title="Clasificación taxonómica">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-slate-50 p-4">
              <Item k="Phylum" v={sp.phylum} />
              <Item k="Clase" v={sp.clase} />
              <Item k="Orden" v={sp.orden} />
              <Item k="Familia" v={sp.familia} />
              <Item k="Género" v={sp.genero} />
            </div>
          </Section>

          <Section title="Estado de conservación">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-slate-50 p-4">
              <Item
                k="Categoría nacional"
                v={`${sp.catNacional} · ${estadoLabel(sp.catNacional)}`}
              />
              <Item k="UICN" v={`${sp.uicn} · ${estadoLabel(sp.uicn)}`} />
              <Item
                k="Geografía"
                v={geo ? `${sp.geografia}: ${geo.desc}` : sp.geografia}
              />
              <Item k="Inclusión / enmienda CITES" v={sp.anio} />
            </div>
          </Section>

          {sp.sinonimos.length > 0 && (
            <Section title={`Sinónimos (${sp.sinonimos.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {sp.sinonimos.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-slate-100 px-2 py-1 text-[11px] italic text-slate-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {sp.comentarios && (
            <Section title="Comentarios de referencia">
              <p className="rounded-2xl border border-slate-200 p-3 text-[12.5px] leading-snug text-slate-600">
                {sp.comentarios}
              </p>
            </Section>
          )}

          <p className="mt-5 border-t border-slate-100 pt-3 text-center text-[11px] text-slate-400">
            Fuente: MINAM 2023 — Listado de Especies de Fauna Silvestre CITES –
            Perú. Dirección General de Diversidad Biológica.
          </p>
        </div>
      </div>
    );
  },
);

export default ShareCard;
