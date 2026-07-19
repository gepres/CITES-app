/**
 * Reenvía la imagen del espectrograma añadiendo cabeceras CORS.
 *
 *   GET /api/media?u=https://xeno-canto.org/sounds/uploaded/XXX/ffts/XC1-med.png
 *
 * Hace falta por dos motivos distintos:
 *
 * 1. Espectrograma: xeno-canto no envía `Access-Control-Allow-Origin`, así que
 *    html-to-image no podría incrustarlo en el PNG que se comparte (el lienzo
 *    quedaría contaminado y la imagen saldría en blanco).
 * 2. Audio del visor ampliado: xeno-canto responde a las peticiones `Range`
 *    con el archivo entero, de modo que el navegador marca la pista como no
 *    navegable (`seekable` vacío) e ignora cualquier salto de posición. Con
 *    estos bytes el visor arma un Blob local, que sí admite saltos.
 *
 * El reproductor de la ficha sigue apuntando al origen, así que solo se paga
 * ancho de banda cuando alguien abre el visor. Y únicamente se aceptan los
 * dominios de la lista: un proxy abierto sería una puerta de entrada a SSRF.
 */

const HOSTS = new Set([
  'xeno-canto.org',
  'www.xeno-canto.org',
  'static.inaturalist.org',
  'inaturalist-open-data.s3.amazonaws.com',
]);

const TIPOS = ['image/', 'audio/'];

// Las funciones de Netlify no pueden devolver respuestas mucho mayores; por
// encima de esto el visor se queda con la reproducción directa, sin saltos.
const MAX_BYTES = 6 * 1024 * 1024;

export default async (req) => {
  const raw = new URL(req.url).searchParams.get('u');
  if (!raw) return new Response('Falta el parámetro u', { status: 400 });

  let destino;
  try {
    destino = new URL(raw);
  } catch {
    return new Response('URL inválida', { status: 400 });
  }

  if (destino.protocol !== 'https:' || !HOSTS.has(destino.hostname)) {
    return new Response('Dominio no permitido', { status: 403 });
  }

  let upstream;
  try {
    upstream = await fetch(destino, { signal: AbortSignal.timeout(8000) });
  } catch {
    return new Response('No se pudo obtener el recurso', { status: 502 });
  }

  const tipo = upstream.headers.get('content-type') ?? '';
  if (!upstream.ok || !TIPOS.some((t) => tipo.startsWith(t))) {
    return new Response('El recurso no es una imagen ni un audio', {
      status: 415,
    });
  }

  const largo = Number(upstream.headers.get('content-length') ?? 0);
  if (largo > MAX_BYTES) {
    return new Response('Recurso demasiado grande', { status: 413 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': tipo,
      'Cache-Control': 'public, max-age=604800, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const config = { path: '/api/media' };
