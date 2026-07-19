import { useEffect, useMemo, useState } from 'react';
import { Download, SlidersHorizontal, X } from 'lucide-react';
import type { FacetKey, Species } from './types';
import { FACET_LABELS } from './lib/meta';
import { exportCsv } from './lib/exportCsv';
import { hayIndiceAudio, tieneAudio, useSpeciesData } from './lib/useSpeciesData';
import { useFavorites } from './lib/useFavorites';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import FilterPanel from './components/FilterPanel';
import MobileFilters from './components/MobileFilters';
import SpeciesTable from './components/SpeciesTable';
import SpeciesDetail from './components/SpeciesDetail';
import AnexosModal from './components/AnexosModal';
import InstallPrompt from './components/InstallPrompt';

export default function App() {
  const {
    query,
    setQuery,
    filters,
    facets,
    filtered,
    toggleFacet,
    clearFacet,
    clearAll,
    activeCount,
  } = useSpeciesData();

  const { isFav, toggle: toggleFav, count: favCount } = useFavorites();

  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );
  const [selected, setSelected] = useState<Species | null>(null);
  const [showAnexos, setShowAnexos] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);
  const [onlyAudio, setOnlyAudio] = useState(false);

  const visible = useMemo(() => {
    let out = filtered;
    if (onlyFav) out = out.filter((s) => isFav(s.id));
    if (onlyAudio) out = out.filter(tieneAudio);
    return out;
  }, [filtered, onlyFav, isFav, onlyAudio]);

  // Cuántas de las especies filtradas tienen grabación, para el botón.
  const audioCount = useMemo(
    () => (hayIndiceAudio ? filtered.filter(tieneAudio).length : 0),
    [filtered],
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('tema', dark ? 'dark' : 'light');
    } catch {
      /* almacenamiento no disponible */
    }
  }, [dark]);

  // Bloquea el scroll del fondo cuando hay una capa modal abierta.
  useEffect(() => {
    const open = selected || showAnexos || mobileFilters;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selected, showAnexos, mobileFilters]);

  const chips = (Object.keys(filters) as FacetKey[]).flatMap((k) =>
    (filters[k] ?? []).map((v) => ({ key: k, value: v })),
  );

  const totalActive = activeCount + (onlyFav ? 1 : 0) + (onlyAudio ? 1 : 0);
  const resetAll = () => {
    clearAll();
    setOnlyFav(false);
    setOnlyAudio(false);
  };

  return (
    <div className="min-h-screen">
      <Header
        dark={dark}
        onToggleTheme={() => setDark((v) => !v)}
        onOpenAnexos={() => setShowAnexos(true)}
      />

      <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-6 sm:py-5">
        <InstallPrompt />
        <StatsCards data={visible} />

        <div className="mt-4 flex gap-5 sm:mt-5">
          {/* Sidebar de filtros (escritorio) */}
          <aside className="card sticky top-[80px] hidden h-[calc(100vh-100px)] w-72 shrink-0 overflow-hidden lg:block">
            <FilterPanel
              query={query}
              setQuery={setQuery}
              facets={facets}
              toggleFacet={toggleFacet}
              clearFacet={clearFacet}
              clearAll={clearAll}
              activeCount={activeCount}
              resultCount={visible.length}
              onlyFav={onlyFav}
              setOnlyFav={setOnlyFav}
              favCount={favCount}
              onlyAudio={onlyAudio}
              setOnlyAudio={setOnlyAudio}
              audioCount={audioCount}
            />
          </aside>

          <section className="min-w-0 flex-1">
            {/* Barra de acciones */}
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => setMobileFilters(true)}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-semibold transition hover:bg-slate-100 active:scale-[0.98] dark:border-slate-700 dark:hover:bg-slate-800 sm:flex-none sm:px-4 lg:hidden"
              >
                <SlidersHorizontal size={16} /> Filtros
                {totalActive > 0 && (
                  <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {totalActive}
                  </span>
                )}
              </button>

              {/* Chips de filtros activos — scroll horizontal en móvil */}
              <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-1.5 lg:flex">
                {chips.map((c) => (
                  <button
                    key={`${c.key}:${c.value}`}
                    onClick={() => toggleFacet(c.key, c.value)}
                    className="chip bg-brand-100 text-brand-700 transition hover:bg-brand-200 dark:bg-brand-500/15 dark:text-brand-300"
                    title={`Quitar filtro ${FACET_LABELS[c.key]}: ${c.value}`}
                  >
                    <span className="opacity-60">{FACET_LABELS[c.key]}:</span>
                    {c.value}
                    <X size={12} />
                  </button>
                ))}
                {totalActive > 0 && (
                  <button
                    onClick={resetAll}
                    className="text-xs font-medium text-slate-500 hover:text-brand-600 hover:underline"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              <button
                onClick={() => exportCsv(visible)}
                disabled={visible.length === 0}
                aria-label="Exportar resultados a CSV"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3.5 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-95 disabled:opacity-40 sm:px-4"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Exportar CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
            </div>

            {/* Chips de filtros activos — móvil (scroll horizontal) */}
            {(chips.length > 0 || onlyFav || onlyAudio) && (
              <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
                {onlyFav && (
                  <button
                    onClick={() => setOnlyFav(false)}
                    className="chip shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                  >
                    ★ Guardadas
                    <X size={12} />
                  </button>
                )}
                {onlyAudio && (
                  <button
                    type="button"
                    onClick={() => setOnlyAudio(false)}
                    className="chip shrink-0 bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                  >
                    🔊 Con sonido
                    <X size={12} />
                  </button>
                )}
                {chips.map((c) => (
                  <button
                    key={`${c.key}:${c.value}`}
                    onClick={() => toggleFacet(c.key, c.value)}
                    className="chip shrink-0 bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                  >
                    <span className="opacity-60">{FACET_LABELS[c.key]}:</span>
                    {c.value}
                    <X size={12} />
                  </button>
                ))}
                <button
                  onClick={resetAll}
                  className="shrink-0 whitespace-nowrap px-2 text-xs font-medium text-slate-500"
                >
                  Limpiar todo
                </button>
              </div>
            )}

            <SpeciesTable
              data={visible}
              onSelect={setSelected}
              isFav={isFav}
              onToggleFav={toggleFav}
            />

            <p className="mt-4 text-center text-xs text-slate-400">
              Datos: MINAM 2023 · Listado de Especies de Fauna Silvestre CITES –
              Perú. Aplicativo de consulta no oficial con fines informativos.
            </p>
            <p className="mt-1 text-center text-xs text-slate-400">
              Desarrollado por{' '}
              <a
                href="https://genaropretill.com/"
                target="_blank"
                rel="noreferrer"
                className="font-medium transition hover:text-brand-600 hover:underline dark:hover:text-brand-400"
              >
                genaropretill.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Filtros móvil — bottom sheet */}
      {mobileFilters && (
        <MobileFilters
          query={query}
          setQuery={setQuery}
          facets={facets}
          toggleFacet={toggleFacet}
          clearFacet={clearFacet}
          activeCount={activeCount}
          resultCount={visible.length}
          onlyFav={onlyFav}
          setOnlyFav={setOnlyFav}
          favCount={favCount}
          onlyAudio={onlyAudio}
          setOnlyAudio={setOnlyAudio}
          audioCount={audioCount}
          onReset={resetAll}
          onClose={() => setMobileFilters(false)}
        />
      )}

      <SpeciesDetail
        sp={selected}
        onClose={() => setSelected(null)}
        isFav={isFav}
        onToggleFav={toggleFav}
      />
      {showAnexos && <AnexosModal onClose={() => setShowAnexos(false)} />}
    </div>
  );
}
