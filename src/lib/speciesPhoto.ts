// Busca una foto referencial de la especie por nombre científico usando
// servicios libres y sin API key: iNaturalist y, como respaldo, Wikipedia.
import { useEffect, useState } from 'react';

export interface SpeciesPhoto {
  url: string;
  credit: string;
  source: string;
}

const cache = new Map<string, SpeciesPhoto | null>();

async function fromINaturalist(name: string): Promise<SpeciesPhoto | null> {
  const r = await fetch(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(
      name,
    )}&rank=species&per_page=1&locale=es`,
  );
  if (!r.ok) return null;
  const data = await r.json();
  const t = data?.results?.[0];
  const photo = t?.default_photo;
  if (!photo?.medium_url) return null;
  return {
    url: photo.medium_url,
    credit: (photo.attribution ?? 'iNaturalist').replace(/\(c\)/gi, '©'),
    source: 'iNaturalist',
  };
}

async function fromWikipedia(name: string): Promise<SpeciesPhoto | null> {
  for (const lang of ['es', 'en']) {
    try {
      const r = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          name,
        )}`,
      );
      if (!r.ok) continue;
      const d = await r.json();
      const src = d?.thumbnail?.source ?? d?.originalimage?.source;
      if (src) return { url: src, credit: 'Wikipedia', source: 'Wikipedia' };
    } catch {
      /* siguiente idioma */
    }
  }
  return null;
}

export async function fetchSpeciesPhoto(
  name: string,
): Promise<SpeciesPhoto | null> {
  if (cache.has(name)) return cache.get(name)!;
  let result: SpeciesPhoto | null = null;
  try {
    result = (await fromINaturalist(name)) ?? (await fromWikipedia(name));
  } catch {
    result = null;
  }
  cache.set(name, result);
  return result;
}

/** Convierte una imagen remota a data URL para incrustarla en el PNG. */
export async function toDataUrl(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { mode: 'cors' });
    if (!r.ok) return null;
    const blob = await r.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onloadend = () => resolve(typeof fr.result === 'string' ? fr.result : null);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function useSpeciesPhoto(name: string | undefined) {
  const [photo, setPhoto] = useState<SpeciesPhoto | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!name) return;
    let active = true;
    setPhoto(null);
    setLoading(true);
    fetchSpeciesPhoto(name)
      .then((p) => active && setPhoto(p))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [name]);

  return { photo, loading };
}
