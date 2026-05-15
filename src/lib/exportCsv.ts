import type { Species } from '../types';

const HEADERS: [keyof Species, string][] = [
  ['id', 'N°'],
  ['tipo', 'Tipo'],
  ['phylum', 'Phylum'],
  ['clase', 'Clase'],
  ['orden', 'Orden'],
  ['familia', 'Familia'],
  ['genero', 'Género'],
  ['cientifico', 'Nombre científico'],
  ['comun', 'Nombre común'],
  ['apendice', 'Apéndice CITES'],
  ['anio', 'Inclusión/enmienda'],
  ['catNacional', 'Categoría nacional'],
  ['uicn', 'UICN'],
  ['geografia', 'Geografía'],
  ['autor', 'Autor'],
];

const esc = (v: unknown) => {
  const s = Array.isArray(v) ? v.join('; ') : String(v ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportCsv(rows: Species[]): void {
  const head = HEADERS.map(([, h]) => esc(h)).join(';');
  const body = rows
    .map((r) => HEADERS.map(([k]) => esc(r[k])).join(';'))
    .join('\n');
  // BOM para que Excel reconozca UTF-8.
  const blob = new Blob(['﻿' + head + '\n' + body], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fauna-cites-peru_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
