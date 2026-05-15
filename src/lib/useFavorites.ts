import { useCallback, useEffect, useState } from 'react';

const KEY = 'fauna-cites:favoritos';

function load(): Set<number> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((n) => typeof n === 'number')) : new Set();
  } catch {
    return new Set();
  }
}

export function useFavorites() {
  const [favs, setFavs] = useState<Set<number>>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...favs]));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [favs]);

  const toggle = useCallback((id: number) => {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setFavs(new Set()), []);
  const isFav = useCallback((id: number) => favs.has(id), [favs]);

  return { favs, isFav, toggle, clear, count: favs.size };
}
