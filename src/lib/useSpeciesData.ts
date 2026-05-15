import { useMemo, useState } from 'react';
import speciesJson from '../data/species.json';
import anexosJson from '../data/anexos.json';
import type { Anexos, FacetKey, Species } from '../types';

const ALL_SPECIES = speciesJson as Species[];
export const ANEXOS = anexosJson as Anexos;

export const FACET_KEYS: FacetKey[] = [
  'tipo',
  'clase',
  'orden',
  'familia',
  'apendice',
  'catNacional',
  'uicn',
  'geografia',
];

export type Filters = Partial<Record<FacetKey, string[]>>;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

function matchesText(sp: Species, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const hay = norm(
    `${sp.cientifico} ${sp.comun} ${sp.genero} ${sp.familia} ${sp.orden} ${sp.clase} ${sp.autor} ${sp.sinonimos.join(' ')}`,
  );
  return terms.every((t) => hay.includes(t));
}

type FacetSets = Partial<Record<FacetKey, Set<string>>>;

function buildSets(filters: Filters): FacetSets {
  const sets: FacetSets = {};
  for (const key of FACET_KEYS) {
    const sel = filters[key];
    if (sel && sel.length > 0) sets[key] = new Set(sel);
  }
  return sets;
}

function passesFacets(sp: Species, sets: FacetSets, except?: FacetKey): boolean {
  for (const key of FACET_KEYS) {
    if (key === except) continue;
    const set = sets[key];
    if (set && !set.has(sp[key] as string)) return false;
  }
  return true;
}

export interface FacetOption {
  value: string;
  count: number;
  selected: boolean;
}

export function useSpeciesData() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});

  const terms = useMemo(
    () => norm(query).split(/\s+/).filter(Boolean),
    [query],
  );

  const sets = useMemo(() => buildSets(filters), [filters]);

  const filtered = useMemo(
    () =>
      ALL_SPECIES.filter(
        (sp) => matchesText(sp, terms) && passesFacets(sp, sets),
      ),
    [terms, sets],
  );

  // Conteos por faceta con cross-filtering (ignora la propia faceta).
  const facets = useMemo(() => {
    const result: Record<FacetKey, FacetOption[]> = {} as never;
    for (const key of FACET_KEYS) {
      const pool = ALL_SPECIES.filter(
        (sp) => matchesText(sp, terms) && passesFacets(sp, sets, key),
      );
      const counts = new Map<string, number>();
      for (const sp of pool) {
        const v = sp[key] as string;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      const sel = sets[key];
      result[key] = [...counts.entries()]
        .map(([value, count]) => ({
          value,
          count,
          selected: sel?.has(value) ?? false,
        }))
        .sort((a, b) =>
          b.count - a.count || a.value.localeCompare(b.value, 'es'),
        );
    }
    return result;
  }, [terms, sets]);

  const toggleFacet = (key: FacetKey, value: string) =>
    setFilters((prev) => {
      const cur = new Set(prev[key] ?? []);
      cur.has(value) ? cur.delete(value) : cur.add(value);
      const next = [...cur];
      return { ...prev, [key]: next.length ? next : undefined };
    });

  const clearFacet = (key: FacetKey) =>
    setFilters((prev) => ({ ...prev, [key]: undefined }));

  const clearAll = () => {
    setFilters({});
    setQuery('');
  };

  const activeCount =
    (query ? 1 : 0) +
    FACET_KEYS.reduce((n, k) => n + (filters[k]?.length ?? 0), 0);

  return {
    query,
    setQuery,
    filters,
    facets,
    filtered,
    toggleFacet,
    clearFacet,
    clearAll,
    activeCount,
  };
}
