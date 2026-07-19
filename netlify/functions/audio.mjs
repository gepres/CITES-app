/**
 * Grabaciones de una especie por nombre científico.
 *
 *   GET /api/audio?sp=Ara%20macao
 *
 * Fuente principal: xeno-canto (aves, anuros, ortópteros y murciélagos), que
 * además entrega la imagen del espectrograma ya generada. Requiere una API key
 * gratuita —por eso vive aquí y no en el bundle— disponible en la variable de
 * entorno XC_API_KEY.
 *
 * Sin key, o si la especie no está en xeno-canto (mamíferos, reptiles…), se
 * consulta iNaturalist, que no necesita credenciales. El cliente sabe hacer esa
 * misma consulta por su cuenta, así que la app funciona igual sin esta función.
 */

const XC_API = 'https://xeno-canto.org/api/3/recordings';
const INAT_API = 'https://api.inaturalist.org/v1/observations';

// Licencias aceptadas: todo Creative Commons, nada de «reservados todos los
// derechos» (no podríamos mostrarlo ni incrustarlo en la imagen compartida).
const INAT_LICENSES = 'cc0,cc-by,cc-by-nc,cc-by-sa,cc-by-nc-sa,cc-by-nd,cc-by-nc-nd';

const MAX = 12;

const absolute = (u) => (u?.startsWith('//') ? `https:${u}` : u || undefined);

/** «//creativecommons.org/licenses/by-nc/4.0/» → «CC BY-NC 4.0» */
function licenciaXC(url) {
  const m = /licenses\/([a-z-]+)\/([\d.]+)/i.exec(url ?? '');
  if (!m) return { etiqueta: 'Ver licencia', url: absolute(url) };
  return {
    etiqueta: `CC ${m[1].toUpperCase()} ${m[2]}`,
    url: absolute(url),
  };
}

/** «cc-by-nc» → «CC BY-NC» */
function licenciaINat(code) {
  if (!code) return { etiqueta: 'Sin licencia declarada' };
  if (code === 'cc0') return { etiqueta: 'CC0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' };
  const partes = code.replace(/^cc-/, '');
  return {
    etiqueta: `CC ${partes.toUpperCase()}`,
    url: `https://creativecommons.org/licenses/${partes}/4.0/`,
  };
}

const CALIDAD = { A: 0, B: 1, C: 2, D: 3, E: 4 };

/**
 * Criterio de selección, en este orden:
 *  1. grabaciones aprovechables (calidad A o B) antes que las ruidosas;
 *  2. dentro de ellas, las hechas en Perú — es la fauna del listado;
 *  3. calidad exacta declarada por xeno-canto;
 *  4. formato comprimido: los .wav originales llegan a varios MB.
 *
 * El primer escalón importa: sin él, una grabación peruana de calidad D
 * desplazaba a una excelente de un país vecino.
 */
const prioridad = (g) => {
  const q = CALIDAD[g.q] ?? 5;
  return (
    (q <= 1 ? 0 : 1) * 1000 +
    (g.cnt === 'Peru' ? 0 : 1) * 100 +
    q * 10 +
    (/\.(wav|aiff|flac)$/i.test(g['file-name'] ?? '') ? 1 : 0)
  );
};

async function deXenoCanto(nombre, key) {
  const [genero, ...resto] = nombre.split(/\s+/);
  const especie = resto.join(' ');
  if (!genero || !especie) return [];

  const query = `gen:"${genero}" sp:"${especie}"`;
  const url = `${XC_API}?query=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}&per_page=${MAX}`;

  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) return [];
  const data = await r.json();

  return (data?.recordings ?? [])
    .filter((g) => g.file)
    .sort((a, b) => prioridad(a) - prioridad(b))
    .slice(0, MAX)
    .map((g) => {
      const lic = licenciaXC(g.lic);
      return {
        id: `xc-${g.id}`,
        audio: absolute(g.file),
        // `med` para la ficha (~30 KB). La grande ronda el medio mega, así
        // que solo se pide al abrir el visor ampliado.
        sono: absolute(g.sono?.med ?? g.sono?.small ?? g.sono?.large),
        sonoHd: absolute(g.sono?.large ?? g.sono?.full ?? g.sono?.med),
        tipo: g.type || undefined,
        autor: g.rec || 'Autor no indicado',
        licencia: lic.etiqueta,
        licenciaUrl: lic.url,
        pagina: absolute(g.url),
        lugar: [g.loc, g.cnt].filter(Boolean).join(', ') || undefined,
        duracion: g.length || undefined,
        calidad: g.q || undefined,
        fuente: 'xeno-canto',
      };
    });
}

// Un .wav de iNaturalist pesa varios MB; el mismo canto en mp3 baja a unos
// cientos de KB. En móvil eso es la diferencia entre sonar al instante y
// gastar datos esperando, así que los formatos comprimidos van primero.
const pesado = (tipo) => (/(wav|aiff|flac)/i.test(tipo ?? '') ? 1 : 0);

async function deINaturalist(nombre) {
  const url =
    `${INAT_API}?taxon_name=${encodeURIComponent(nombre)}&sounds=true` +
    `&sound_license=${INAT_LICENSES}&per_page=${MAX}&order_by=votes`;

  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) return [];
  const data = await r.json();

  const crudas = [];
  for (const obs of data?.results ?? []) {
    for (const s of obs.sounds ?? []) {
      if (s.file_url) crudas.push({ s, obs });
    }
  }

  // Orden estable: se conserva la valoración de iNaturalist dentro de cada
  // grupo de formatos y solo se posponen los archivos sin comprimir.
  crudas.sort(
    (a, b) => pesado(a.s.file_content_type) - pesado(b.s.file_content_type),
  );

  return crudas.slice(0, MAX).map(({ s, obs }) => {
    const lic = licenciaINat(s.license_code);
    return {
      id: `inat-${s.id ?? obs.id}`,
      audio: s.file_url,
      // iNaturalist no genera espectrogramas.
      sono: undefined,
      tipo: undefined,
      autor:
        (s.attribution ?? '').replace(/^\(c\)\s*/i, '').split(',')[0] ||
        'Autor no indicado',
      licencia: lic.etiqueta,
      licenciaUrl: lic.url,
      pagina: `https://www.inaturalist.org/observations/${obs.id}`,
      lugar: obs.place_guess || undefined,
      duracion: undefined,
      calidad: undefined,
      fuente: 'iNaturalist',
    };
  });
}

export default async (req) => {
  const sp = new URL(req.url).searchParams.get('sp')?.trim();

  if (!sp || sp.length > 120) {
    return Response.json({ error: 'Falta el parámetro sp' }, { status: 400 });
  }

  const key = process.env.XC_API_KEY;
  let recordings = [];
  let fuente = 'iNaturalist';

  try {
    if (key) {
      recordings = await deXenoCanto(sp, key);
      if (recordings.length > 0) fuente = 'xeno-canto';
    }
    if (recordings.length === 0) {
      recordings = await deINaturalist(sp);
    }
  } catch {
    // Una fuente caída no debe romper la ficha: se responde lista vacía.
    recordings = [];
  }

  return Response.json(
    { especie: sp, fuente, total: recordings.length, recordings },
    {
      headers: {
        // El navegador la revalida a diario; el CDN la guarda una semana.
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
};

export const config = { path: '/api/audio' };
