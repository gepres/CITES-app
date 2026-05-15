# Fauna Silvestre CITES · Perú — Explorador

Aplicativo web para consultar el **Listado oficial de Especies de Fauna Silvestre
CITES – Perú (MINAM 2023)**: 568 especies con taxonomía completa, Apéndice CITES,
categoría nacional, estado UICN, geografía, autoría, sinónimos y comentarios.

Diseño **mobile‑first** (uso principal en celular), con modo **claro / oscuro**.

## Stack

| Pieza        | Tecnología                                  |
| ------------ | ------------------------------------------- |
| Build / dev  | Vite 5                                      |
| UI           | React 18 + TypeScript                       |
| Estilos      | Tailwind CSS 3                              |
| Tabla        | TanStack Table v8 (orden, paginación)       |
| Íconos       | lucide-react                                |
| Datos        | `.xls` → JSON en build (SheetJS)            |

No requiere servidor: los datos se incrustan en el bundle. La carpeta `dist/`
se puede publicar en cualquier hosting estático (Vercel, Netlify, GitHub Pages…).

## Uso

```bash
npm install
npm run dev        # desarrollo  → http://localhost:5173
npm run build      # producción  → dist/
npm run preview    # previsualiza el build
```

`npm run data` regenera `src/data/*.json` desde el `.xls`. Se ejecuta
automáticamente antes de `dev` y `build`. Para actualizar el listado, reemplaza
el archivo `Listado_de_Fauna_CITES_Perú_v. *.xls` en la raíz y reconstruye.

## Funcionalidades

- **Búsqueda global** (sin acentos) por nombre científico, común, género,
  familia, autor y sinónimos.
- **Filtros facetados** con iconos, conteos en vivo y *cross‑filtering*: tipo,
  clase, orden, familia, Apéndice CITES, categoría nacional, UICN, geografía.
- **Chips rápidos de Apéndice CITES** (I/II/III) coloreados.
- **Guardado local** ⭐: marca especies como favoritas (persistido en
  `localStorage`) y filtra con «Solo guardadas».
- **Tarjetas táctiles en móvil** / tabla densa y ordenable en escritorio.
- Tarjetas de **estadísticas** según los filtros activos.
- **Ficha de detalle** por especie con iconos en cada dato (taxonomía,
  conservación, sinónimos, comentarios, enlace a GBIF).
- **Foto referencial** de la especie por nombre científico vía servicios
  libres sin API key (iNaturalist → Wikipedia de respaldo), con atribución.
- **Compartir ficha completa**: la **imagen PNG** y el texto de **WhatsApp**
  incluyen *todos* los datos (tipo, phylum, taxonomía, descripción del
  Apéndice, conservación, sinónimos, comentarios) y la foto incrustada.
  WhatsApp solicita un número opcional con código de país; además compartir
  nativo del sistema / copiar datos.
- Panel de **Anexos**: cambios 2023, fuentes consultadas y equipo técnico.
- **Exportación a CSV** (UTF‑8) de los resultados filtrados.
- Modo **claro / oscuro** persistente, sin parpadeo inicial.
- **PWA instalable**: favicon propio, manifest, service worker (app‑shell
  offline) y banner de instalación en móvil (Android/Chrome) con instrucciones
  para iOS Safari.

> ⚠️ Producción: la app debe servirse desde la **raíz del dominio** sobre
> **HTTPS**. El service worker (`/sw.js`, scope raíz) y los iconos usan rutas
> absolutas; si se despliega bajo un subpath habría que ajustarlas.

## Iconos / favicon

`npm run favicon` regenera desde un único SVG: `favicon.svg`, `favicon.ico`
(16/32/48), `apple-touch-icon.png`, `icon-192/512.png` y `site.webmanifest`
en `public/`. La marca es la hoja blanca sobre degradado verde del header.

## UX móvil (foco principal)

- Áreas táctiles ≥ 44 px en filtros, paginación y acciones.
- Filtros en *drawer* deslizable con botón fijo «Ver N especies».
- Orden por selector en móvil (las cabeceras de tabla no aplican ahí).
- Chips de filtros activos con scroll horizontal.
- Header compacto con accesos a Anexos, CITES y tema siempre alcanzables.

## Calidad

`react-doctor`: **93/100 (Great)** — sin errores de seguridad ni de
corrección. Las advertencias restantes son preferencia de paleta (slate),
`forwardRef` (necesario en React 18, no en 19) y sugerencias estilísticas
(`useReducer`, headings) — ninguna es un defecto. La librería de imagen
(`html-to-image`) se carga de forma diferida solo al compartir, para no
penalizar la carga inicial en móvil.

> Aplicativo de consulta no oficial con fines informativos. Fuente: MINAM
> (2023), Dirección General de Diversidad Biológica.
