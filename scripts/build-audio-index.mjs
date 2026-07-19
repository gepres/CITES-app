/**
 * Genera el índice de especies con grabación disponible, que alimenta el
 * filtro «Solo con sonido».
 *
 *   npm run audio-index            # continúa donde se quedó
 *   npm run audio-index -- --force # vuelve a consultar las 568 especies
 *
 * NO se ejecuta en cada build: son cientos de consultas a servicios externos y
 * tarda unos diez minutos. El resultado se versiona en el repositorio y basta
 * con regenerarlo de vez en cuando, o al actualizar el listado del MINAM.
 *
 * Con XC_API_KEY definida se consulta primero xeno-canto; el resto se resuelve
 * con iNaturalist, que no necesita credenciales.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const especiesPath = join(root, 'src', 'data', 'species.json');
const indicePath = join(root, 'src', 'data', 'audio-index.json');

// La clave suele estar en un .env local (ignorado por git). Se lee a mano para
// no añadir dependencias: en Netlify llega ya como variable de entorno.
function claveXC() {
  if (process.env.XC_API_KEY) return process.env.XC_API_KEY;
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return undefined;
  const m = /^\s*XC_API_KEY\s*=\s*(.+?)\s*$/m.exec(readFileSync(envPath, 'utf8'));
  return m ? m[1].replace(/^["']|["']$/g, '') : undefined;
}

const XC_KEY = claveXC();
const FORCE = process.argv.includes('--force');
const PAUSA_MS = 1100; // iNaturalist pide no pasar de una consulta por segundo

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const especies = JSON.parse(readFileSync(especiesPath, 'utf8'));

// Estado previo: lo ya consultado no se vuelve a pedir salvo --force.
let previo = { especies: [], revisadas: [] };
if (!FORCE && existsSync(indicePath)) {
  try {
    const p = JSON.parse(readFileSync(indicePath, 'utf8'));
    previo = { especies: p.especies ?? [], revisadas: p.revisadas ?? [] };
  } catch {
    /* índice corrupto: se empieza de cero */
  }
}

const conAudio = new Set(previo.especies);
const revisadas = new Set(previo.revisadas);

async function enXenoCanto(nombre) {
  const [gen, ...resto] = nombre.split(/\s+/);
  const sp = resto.join(' ');
  if (!gen || !sp) return false;
  const query = encodeURIComponent(`gen:"${gen}" sp:"${sp}"`);
  const r = await fetch(
    `https://xeno-canto.org/api/3/recordings?query=${query}&key=${XC_KEY}&per_page=1`,
    { signal: AbortSignal.timeout(15000) },
  );
  if (!r.ok) return false;
  const d = await r.json();
  return Number(d?.numRecordings ?? 0) > 0;
}

async function enINaturalist(nombre) {
  const r = await fetch(
    `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(nombre)}` +
      `&sounds=true&sound_license=cc0,cc-by,cc-by-nc,cc-by-sa,cc-by-nc-sa,cc-by-nd,cc-by-nc-nd&per_page=1`,
    { signal: AbortSignal.timeout(15000) },
  );
  if (!r.ok) return false;
  const d = await r.json();
  return Number(d?.total_results ?? 0) > 0;
}

function guardar() {
  writeFileSync(
    indicePath,
    JSON.stringify(
      {
        generado: new Date().toISOString().slice(0, 10),
        fuente: XC_KEY ? 'xeno-canto + iNaturalist' : 'iNaturalist',
        total: conAudio.size,
        especies: [...conAudio].sort(),
        revisadas: [...revisadas].sort(),
      },
      null,
      0,
    ),
  );
}

const pendientes = especies.filter((s) => !revisadas.has(s.cientifico));
console.log(
  `[audio-index] ${pendientes.length} especies por consultar ` +
    `(${revisadas.size} ya revisadas) · fuente: ${XC_KEY ? 'xeno-canto + iNaturalist' : 'iNaturalist'}`,
);

let i = 0;
let fallos = 0;
for (const sp of pendientes) {
  i++;
  try {
    let tiene = false;
    if (XC_KEY) tiene = await enXenoCanto(sp.cientifico);
    if (!tiene) tiene = await enINaturalist(sp.cientifico);

    revisadas.add(sp.cientifico);
    if (tiene) conAudio.add(sp.cientifico);

    if (i % 25 === 0) {
      guardar();
      console.log(
        `  ${i}/${pendientes.length} · con sonido: ${conAudio.size} · fallos: ${fallos}`,
      );
    }
  } catch {
    // No se marca como revisada: se reintenta en la próxima ejecución.
    fallos++;
  }
  await espera(PAUSA_MS);
}

guardar();
console.log(
  `[audio-index] listo · ${conAudio.size} de ${especies.length} especies con grabación · ${fallos} consultas fallidas`,
);
