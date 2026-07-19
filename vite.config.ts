import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

/**
 * Ejecuta las funciones de `netlify/functions` durante `npm run dev`.
 *
 * Vite solo sirve archivos estáticos, así que sin esto `/api/audio` no existe
 * en local: la app caería al respaldo de iNaturalist y nunca se verían los
 * espectrogramas de xeno-canto aunque haya API key. El plugin da la misma
 * ruta que en producción, sin necesidad de la CLI de Netlify.
 */
function funcionesNetlify(): Plugin {
  const RUTAS: Record<string, string> = {
    '/api/audio': 'netlify/functions/audio.mjs',
    '/api/media': 'netlify/functions/media.mjs',
  };

  return {
    name: 'funciones-netlify-dev',
    apply: 'serve',
    configureServer(server) {
      // La clave vive en .env (ignorado por git); en Netlify ya es variable
      // de entorno. Se carga a mano para no añadir dependencias.
      const env = resolve(server.config.root, '.env');
      if (existsSync(env) && !process.env.XC_API_KEY) {
        const m = /^\s*XC_API_KEY\s*=\s*(.+?)\s*$/m.exec(readFileSync(env, 'utf8'));
        if (m) process.env.XC_API_KEY = m[1].replace(/^["']|["']$/g, '');
      }

      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const archivo = RUTAS[url.pathname];
        if (!archivo) return next();

        (async () => {
          const ruta = resolve(server.config.root, archivo);
          // Node cachea los módulos ESM: sin este sufijo habría que reiniciar
          // el servidor cada vez que se toca una función.
          const version = statSync(ruta).mtimeMs;
          const mod = await import(`${pathToFileURL(ruta).href}?v=${version}`);
          const respuesta: Response = await mod.default(
            new Request(`http://localhost${req.url}`),
          );
          res.statusCode = respuesta.status;
          respuesta.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await respuesta.arrayBuffer()));
        })().catch(next);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), funcionesNetlify()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          table: ['@tanstack/react-table'],
        },
      },
    },
  },
});
