import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Star,
} from 'lucide-react';
import type { Species } from '../types';
import { ApendiceBadge, EstadoBadge, GeoBadge } from './Badge';
import SpeciesCard from './SpeciesCard';

interface Props {
  data: Species[];
  onSelect: (sp: Species) => void;
  isFav: (id: number) => boolean;
  onToggleFav: (id: number) => void;
}

const apOrder = (a: { original: Species }, b: { original: Species }) =>
  ['I', 'II', 'III'].indexOf(a.original.apendice) -
  ['I', 'II', 'III'].indexOf(b.original.apendice);

const MOBILE_SORTS: { id: string; label: string; desc: boolean }[] = [
  { id: 'id', label: 'N° (oficial)', desc: false },
  { id: 'cientifico', label: 'Especie A→Z', desc: false },
  { id: 'apendice', label: 'Apéndice CITES', desc: false },
  { id: 'anio', label: 'Año (reciente)', desc: true },
];

export default function SpeciesTable({
  data,
  onSelect,
  isFav,
  onToggleFav,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: false }]);

  const columns = useMemo<ColumnDef<Species>[]>(
    () => [
      {
        id: 'fav',
        header: '',
        enableSorting: false,
        cell: (c) => {
          const fav = isFav(c.row.original.id);
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFav(c.row.original.id);
              }}
              aria-label={fav ? 'Quitar de guardadas' : 'Guardar especie'}
              className={`flex size-7 items-center justify-center rounded-lg transition hover:scale-110 ${
                fav
                  ? 'text-amber-500'
                  : 'text-slate-300 hover:text-amber-500 dark:text-slate-600'
              }`}
            >
              <Star size={16} className={fav ? 'fill-amber-500' : ''} />
            </button>
          );
        },
        size: 40,
      },
      {
        accessorKey: 'id',
        header: 'N°',
        cell: (c) => (
          <span className="tabular-nums text-slate-400">{c.getValue<number>()}</span>
        ),
        size: 56,
      },
      {
        accessorKey: 'cientifico',
        header: 'Especie',
        cell: (c) => {
          const sp = c.row.original;
          return (
            <div className="min-w-[200px]">
              <div className="font-semibold italic text-slate-900 dark:text-slate-100">
                {sp.cientifico}
              </div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                {sp.comun || '—'}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'clase',
        header: 'Clase',
        cell: (c) => (
          <div className="text-sm">
            <div className="font-medium">{c.getValue<string>()}</div>
            <div className="text-xs text-slate-500">{c.row.original.orden}</div>
          </div>
        ),
      },
      {
        accessorKey: 'familia',
        header: 'Familia',
        cell: (c) => <span className="text-sm">{c.getValue<string>()}</span>,
      },
      {
        accessorKey: 'apendice',
        header: 'CITES',
        cell: (c) => <ApendiceBadge value={c.getValue<string>()} />,
        sortingFn: apOrder,
      },
      {
        accessorKey: 'catNacional',
        header: 'Cat. nac.',
        cell: (c) => (
          <EstadoBadge value={c.getValue<string>()} title="Categoría nacional" />
        ),
      },
      {
        accessorKey: 'uicn',
        header: 'UICN',
        cell: (c) => <EstadoBadge value={c.getValue<string>()} title="UICN" />,
      },
      {
        accessorKey: 'geografia',
        header: 'Geografía',
        cell: (c) => <GeoBadge value={c.getValue<string>()} />,
      },
      {
        accessorKey: 'anio',
        header: 'Año',
        cell: (c) => (
          <span className="tabular-nums text-sm text-slate-500">
            {c.getValue<string>()}
          </span>
        ),
        size: 64,
      },
    ],
    [isFav, onToggleFav],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const total = data.length;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);
  const rows = table.getRowModel().rows;

  const mobileSortValue =
    MOBILE_SORTS.find((s) => s.id === sorting[0]?.id)?.id ?? 'id';

  return (
    <div className="card overflow-hidden">
      {/* Orden — solo visible en móvil (en escritorio se ordena por cabecera) */}
      <div className="flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800 lg:hidden">
        <label
          htmlFor="mobile-sort"
          className="text-xs font-medium text-slate-500"
        >
          Ordenar:
        </label>
        <select
          id="mobile-sort"
          value={mobileSortValue}
          onChange={(e) => {
            const opt = MOBILE_SORTS.find((s) => s.id === e.target.value)!;
            setSorting([{ id: opt.id, desc: opt.desc }]);
          }}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {MOBILE_SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de tarjetas — móvil / tablet */}
      <div className="space-y-2.5 p-3 lg:hidden">
        {rows.map((row) => (
          <SpeciesCard
            key={row.id}
            sp={row.original}
            onSelect={onSelect}
            isFav={isFav(row.original.id)}
            onToggleFav={onToggleFav}
          />
        ))}
        {total === 0 && (
          <p className="px-4 py-16 text-center text-sm text-slate-400">
            No hay especies que coincidan con los filtros.
            <br />
            Prueba ampliar o restablecer los criterios.
          </p>
        )}
      </div>

      {/* Tabla — escritorio */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/80">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted();
                  return (
                    <th
                      key={h.id}
                      className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-semibold dark:border-slate-800"
                    >
                      {h.column.getCanSort() ? (
                        <button
                          onClick={h.column.getToggleSortingHandler()}
                          className="flex items-center gap-1 transition hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sorted === 'asc' ? (
                            <ChevronUp size={13} />
                          ) : sorted === 'desc' ? (
                            <ChevronDown size={13} />
                          ) : (
                            <ArrowUpDown size={13} className="opacity-30" />
                          )}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelect(row.original)}
                className="cursor-pointer border-b border-slate-100 transition last:border-0 hover:bg-brand-50/60 dark:border-slate-800/70 dark:hover:bg-brand-500/10"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {total === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-sm text-slate-400"
                >
                  No hay especies que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación — táctil en móvil */}
      {total > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-200 p-3 text-sm dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex items-center justify-between gap-3 text-slate-500 sm:justify-start">
            <span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {from.toLocaleString('es-PE')}–{to.toLocaleString('es-PE')}
              </span>{' '}
              de {total.toLocaleString('es-PE')}
            </span>
            <select
              value={pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              aria-label="Filas por página"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / pág.
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-1 sm:justify-end">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-300 px-4 font-medium transition enabled:hover:bg-slate-100 enabled:active:scale-95 disabled:opacity-40 dark:border-slate-700 dark:enabled:hover:bg-slate-800 sm:h-9 sm:flex-none"
            >
              <ChevronLeft size={16} /> <span className="sm:hidden">Anterior</span>
            </button>
            <span className="px-3 text-center text-xs text-slate-500">
              {pageIndex + 1} / {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-300 px-4 font-medium transition enabled:hover:bg-slate-100 enabled:active:scale-95 disabled:opacity-40 dark:border-slate-700 dark:enabled:hover:bg-slate-800 sm:h-9 sm:flex-none"
            >
              <span className="sm:hidden">Siguiente</span> <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
