// Convierte el .xls oficial de MINAM a JSON limpio para la SPA.
// Ejecutado automáticamente antes de `dev` y `build` (ver package.json).
import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src', 'data');
mkdirSync(outDir, { recursive: true });

// Localiza el .xls (el nombre trae acentos/espacios; lo buscamos por patrón).
const xls = readdirSync(root).find((f) => /^Listado_de_Fauna_CITES.*\.xls$/i.test(f));
if (!xls) throw new Error('No se encontró el archivo Listado_de_Fauna_CITES_*.xls en la raíz.');

const wb = XLSX.read(readFileSync(join(root, xls)), { type: 'buffer', cellDates: true });

const clean = (v) =>
  v == null ? '' : String(v).replace(/\s+/g, ' ').trim();
const dash = (v) => {
  const c = clean(v);
  return c === '-' || c === '—' || c === '' ? '' : c;
};

/* ----------------------------- Base 2023 ------------------------------ */
const baseRows = XLSX.utils.sheet_to_json(wb.Sheets['Base 2023'], {
  header: 1,
  defval: null,
  raw: false,
});

const species = [];
for (let i = 1; i < baseRows.length; i++) {
  const r = baseRows[i] || [];
  const scientific = clean(r[7]);
  if (!scientific) continue; // descarta filas vacías / artefactos de celdas combinadas

  const tipoRaw = clean(r[1]).toUpperCase();
  species.push({
    id: Number(clean(r[0])) || species.length + 1,
    tipo: tipoRaw.startsWith('HIDRO') ? 'Hidrobiológico' : 'Fauna silvestre',
    phylum: clean(r[2]),
    clase: clean(r[3]),
    orden: clean(r[4]),
    familia: clean(r[5]),
    genero: clean(r[6]),
    cientifico: scientific,
    comun: clean(r[8]),
    apendice: clean(r[9]),                 // I | II | III
    anio: clean(r[10]),                    // año de inclusión / enmienda
    catNacional: dash(r[11]) || 'NC',      // CR EN VU NT DD | NC (no categorizada)
    uicn: dash(r[12]) || 'NE',             // CR EN VU NT LC DD LR NE
    geografia: clean(r[13]) || 'Nativa',
    autor: clean(r[14]),
    sinonimos: clean(r[15])
      ? clean(r[15]).split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    comentarios: clean(r[16]),
  });
}

/* ------------------------------ Anexos -------------------------------- */
const anexRows = XLSX.utils.sheet_to_json(wb.Sheets['Anexos'], {
  header: 1,
  defval: null,
  raw: false,
});

const cita = clean(anexRows[0]?.[0]).replace(/\s*\[Enlace\]\s*$/i, '');
const equipo = [];
const cambios = [];
const fuentes = [];
let section = '';
for (const r of anexRows) {
  if (!r) continue;
  const c0 = clean(r[0]);
  if (/Equipo técnico/i.test(c0)) { section = 'equipo'; continue; }
  if (/Cambios relevantes/i.test(c0)) { section = 'cambios'; continue; }
  if (/Fuentes consultadas/i.test(c0)) { section = 'fuentes'; continue; }
  if (!c0 && !clean(r[3])) continue;
  if (/^N°$/i.test(c0)) continue; // fila de encabezado interna

  if (section === 'equipo' && clean(r[3])) {
    equipo.push({ nombre: c0, email: clean(r[3]) });
  } else if (section === 'cambios' && /^\d+$/.test(c0)) {
    cambios.push({
      n: Number(c0),
      edicion: clean(r[1]),
      taxon: clean(r[2]),
      detalle: clean(r[3]),
    });
  } else if (section === 'fuentes' && /^\d+$/.test(c0)) {
    fuentes.push({
      n: Number(c0),
      anio: clean(r[1]),
      autor: clean(r[2]),
      titulo: clean(r[3]),
    });
  }
}

/* ------------------------------ Salida -------------------------------- */
writeFileSync(join(outDir, 'species.json'), JSON.stringify(species));
writeFileSync(
  join(outDir, 'anexos.json'),
  JSON.stringify({ cita, equipo, cambios, fuentes }),
);

console.log(
  `[convert-data] ${species.length} especies · ${cambios.length} cambios 2023 · ${fuentes.length} fuentes → src/data/`,
);
