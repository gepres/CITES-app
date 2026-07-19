// Grabaciones de la especie: canto, llamada o sonido con su espectrograma.
//
// Primero se pide a /api/audio (función de Netlify), que consulta xeno-canto
// —la única fuente que entrega el espectrograma ya generado— y cae a
// iNaturalist si la especie no está o no hay API key configurada.
//
// Si esa ruta no existe (servidor de desarrollo, hosting estático sin
// funciones), el cliente consulta iNaturalist por su cuenta: se pierden los
// espectrogramas, pero el reproductor sigue funcionando.
import { useEffect, useState } from 'react';

export interface Recording {
  id: string;
  audio: string;
  /** Imagen del espectrograma. Solo xeno-canto la proporciona. */
  sono?: string;
  /** Misma imagen en alta resolución, para el visor ampliado. */
  sonoHd?: string;
  /** «song», «call», «alarm call»… tal como lo etiquetó quien grabó. */
  tipo?: string;
  autor: string;
  licencia?: string;
  licenciaUrl?: string;
  pagina?: string;
  lugar?: string;
  duracion?: string;
  calidad?: string;
  fuente: 'xeno-canto' | 'iNaturalist';
}

const INAT_LICENSES = 'cc0,cc-by,cc-by-nc,cc-by-sa,cc-by-nc-sa,cc-by-nd,cc-by-nc-nd';
const MAX = 12;

const cache = new Map<string, Recording[]>();
const enCurso = new Map<string, Promise<Recording[]>>();

/** Ruta del proxy con CORS. Necesaria para incrustar el espectrograma en el PNG. */
export const proxyMedia = (url: string) => `/api/media?u=${encodeURIComponent(url)}`;

function licenciaINat(code?: string) {
  if (!code) return { etiqueta: 'Sin licencia declarada', url: undefined };
  if (code === 'cc0')
    return { etiqueta: 'CC0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' };
  const partes = code.replace(/^cc-/, '');
  return {
    etiqueta: `CC ${partes.toUpperCase()}`,
    url: `https://creativecommons.org/licenses/${partes}/4.0/`,
  };
}

// Un .wav de iNaturalist pesa varios MB; el mismo canto en mp3 baja a unos
// cientos de KB. En móvil eso es la diferencia entre sonar al instante y
// gastar datos esperando, así que los formatos comprimidos van primero.
const pesado = (tipo?: string) => (/(wav|aiff|flac)/i.test(tipo ?? '') ? 1 : 0);

/** Respaldo del cliente cuando /api/audio no está disponible. */
async function directoINaturalist(nombre: string): Promise<Recording[]> {
  const url =
    `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(nombre)}` +
    `&sounds=true&sound_license=${INAT_LICENSES}&per_page=${MAX}&order_by=votes`;

  const r = await fetch(url);
  if (!r.ok) return [];
  const data = await r.json();

  interface Sonido {
    id?: number;
    file_url?: string;
    file_content_type?: string;
    license_code?: string;
    attribution?: string;
  }
  interface Obs {
    id: number;
    place_guess?: string;
    sounds?: Sonido[];
  }

  const crudas: { s: Sonido; obs: Obs }[] = [];
  for (const obs of (data?.results ?? []) as Obs[]) {
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
      audio: s.file_url!,
      autor:
        (s.attribution ?? '').replace(/^\(c\)\s*/i, '').split(',')[0] ||
        'Autor no indicado',
      licencia: lic.etiqueta,
      licenciaUrl: lic.url,
      pagina: `https://www.inaturalist.org/observations/${obs.id}`,
      lugar: obs.place_guess || undefined,
      fuente: 'iNaturalist' as const,
    };
  });
}

async function pedir(nombre: string): Promise<Recording[]> {
  try {
    const r = await fetch(`/api/audio?sp=${encodeURIComponent(nombre)}`);
    // Sin función desplegada, el comodín SPA responde el index.html: hay que
    // comprobar el tipo de contenido, no solo el código de estado.
    if (r.ok && r.headers.get('content-type')?.includes('application/json')) {
      const data = await r.json();
      if (Array.isArray(data?.recordings)) return data.recordings;
    }
  } catch {
    /* sin función: se intenta la fuente pública */
  }

  try {
    return await directoINaturalist(nombre);
  } catch {
    return [];
  }
}

export function fetchSpeciesAudio(nombre: string): Promise<Recording[]> {
  const cacheado = cache.get(nombre);
  if (cacheado) return Promise.resolve(cacheado);

  const yaPedido = enCurso.get(nombre);
  if (yaPedido) return yaPedido;

  const promesa = pedir(nombre).then((recs) => {
    cache.set(nombre, recs);
    enCurso.delete(nombre);
    return recs;
  });
  enCurso.set(nombre, promesa);
  return promesa;
}

export function useSpeciesAudio(nombre: string | undefined) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!nombre) {
      setRecordings([]);
      return;
    }
    let activo = true;
    setRecordings([]);
    setLoading(true);
    fetchSpeciesAudio(nombre)
      .then((r) => activo && setRecordings(r))
      .finally(() => activo && setLoading(false));
    return () => {
      activo = false;
    };
  }, [nombre]);

  return { recordings, loading };
}
