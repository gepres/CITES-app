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
npm run audio-index # índice de especies con grabación (ver «Sonido»)
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
- **Ficha de detalle** por especie en diálogo amplio: dos columnas en
  escritorio (multimedia a la izquierda, datos a la derecha) y pantalla
  completa en móvil, con iconos en cada dato (taxonomía, conservación,
  sinónimos, comentarios, enlace a GBIF).
- **Foto referencial** de la especie por nombre científico vía servicios
  libres sin API key (iNaturalist → Wikipedia de respaldo), con atribución.
- **Canto y espectrograma** 🔊: reproductor con la huella visual del sonido,
  navegación entre grabaciones, autoría y licencia (ver *Sonido* más abajo).
- **Visor de espectrograma a pantalla completa**: eje de tiempo, cabezal de
  reproducción, mapa general de la grabación con la ventana visible, y
  controles de play/pausa, volumen y acercamiento (1× a 12×). Se puede saltar
  a cualquier punto pulsando sobre el espectrograma o sobre el mapa.
- **Filtro «Solo con sonido»** para quedarse con las especies que tienen
  grabación disponible.
- **Compartir ficha completa**: la **imagen PNG** y el texto de **WhatsApp**
  incluyen *todos* los datos (tipo, phylum, taxonomía, descripción del
  Apéndice, conservación, sinónimos, comentarios), la foto incrustada y el
  **espectrograma** del canto con su autoría.
  WhatsApp solicita un número opcional con código de país; además compartir
  nativo del sistema / copiar datos.
- Panel de **Anexos**: cambios 2023, fuentes consultadas y equipo técnico.
- **Exportación a CSV** (UTF‑8) de los resultados filtrados.
- Modo **claro / oscuro** persistente, sin parpadeo inicial.
- **PWA instalable**: favicon propio, manifest, service worker (app‑shell
  offline) y banner de instalación en móvil (Android/Chrome) con instrucciones
  para iOS Safari.

## Sonido y espectrogramas

El 86 % del listado (296 aves, 114 mamíferos y 79 anfibios) puede tener
grabación. Se usan dos fuentes, en este orden:

| Fuente          | Requiere key | Espectrograma        | Cobertura                    |
| --------------- | ------------ | -------------------- | ---------------------------- |
| **xeno-canto**  | sí (gratis)  | sí, ya generado      | aves, anuros y murciélagos   |
| **iNaturalist** | no           | no                   | el resto, sobre todo mamíferos |

> La Macaulay Library de eBird (`media.ebird.org`) es la mejor colección del
> mundo, pero **su API responde 403 a peticiones externas**: no hay forma
> legítima de traer su audio, solo enlazar a sus fichas públicas.

De las grabaciones disponibles se elige, por este orden: **calidad
aprovechable** (A o B), **grabada en Perú**, calidad exacta y **formato
comprimido** (un `.wav` original ronda los MB; el mismo canto en mp3, unos
cientos de KB). El escalón de calidad va primero a propósito: sin él, una
grabación peruana de calidad D desplazaba a una excelente de un país vecino.

Del espectrograma se usa la versión `med` (~18 KB) en la ficha; la de color,
mucho más nítida pero de cientos de KB, se descarga solo al abrir el visor
ampliado. Los tipos de vocalización se traducen al español (`flight call` →
«llamada en vuelo») en `src/lib/meta.ts`.

> **Por qué el visor descarga el audio.** xeno-canto responde a las peticiones
> `Range` con el archivo completo, así que el navegador marca la pista como no
> navegable (`seekable` vacío) e **ignora cualquier salto de posición**, aunque
> tenga el audio entero en memoria. El visor lo resuelve bajando los bytes por
> `/api/media` y montando un Blob local, que sí admite saltos. El reproductor
> de la ficha sigue apuntando al origen: solo se gasta ancho de banda propio
> cuando alguien abre el visor.

### Activar xeno-canto (opcional pero recomendado)

Sin key la app funciona igual, con iNaturalist y sin espectrogramas. Para
activarlos:

1. Crea una cuenta en <https://xeno-canto.org> y copia tu clave desde
   <https://xeno-canto.org/account>.
2. En Netlify: *Site configuration → Environment variables* → añade
   `XC_API_KEY` con ese valor.
3. Vuelve a desplegar.

La clave **nunca** se incrusta en el bundle: vive solo en la función
`netlify/functions/audio.mjs`, que corre en el servidor. `media.mjs` reenvía
únicamente la imagen del espectrograma (con lista blanca de dominios) para
poder incrustarla en el PNG que se comparte; el audio se reproduce directo
desde el origen y no consume ancho de banda propio.

En `vite dev` no hay funciones: el cliente detecta que `/api/audio` no
responde JSON y consulta iNaturalist por su cuenta.

### Índice para el filtro «Solo con sonido»

```bash
npm run audio-index            # continúa donde se quedó (~10 min)
npm run audio-index -- --force # vuelve a consultar las 568 especies
```

Consulta especie por especie y guarda el resultado en
`src/data/audio-index.json`, que **sí se versiona** en el repositorio. No se
ejecuta en cada build (son cientos de peticiones externas); basta regenerarlo
cada cierto tiempo o al actualizar el listado del MINAM. Mientras el índice
esté vacío, el filtro se oculta solo.

> ⚠️ Producción: la app debe servirse desde la **raíz del dominio** sobre
> **HTTPS**. El service worker (`/sw.js`, scope raíz) y los iconos usan rutas
> absolutas; si se despliega bajo un subpath habría que ajustarlas.

## Deploy en Netlify

El proyecto trae `netlify.toml` (+ `public/_redirects` y `public/_headers`),
así que funciona con cualquiera de estas opciones:

**A. Git (deploy continuo, recomendado)**
1. `git init && git add . && git commit -m "deploy"`
2. Sube el repo a GitHub/GitLab.
3. En Netlify: *Add new site → Import from Git*. Detecta solo:
   build `npm run build`, publish `dist`, Node 20.

**B. Netlify CLI (sin Git)**
```bash
npm i -g netlify-cli
netlify login            # abre el navegador
netlify deploy --build              # previsualización
netlify deploy --build --prod       # producción
```

**C. Arrastrar carpeta**
`npm run build` y arrastra la carpeta `dist/` a https://app.netlify.com/drop
(incluye `_redirects`/`_headers`, así que el SPA y la PWA funcionan igual).

> Netlify sirve en la raíz del dominio sobre HTTPS, por lo que el service
> worker y la instalación PWA funcionan sin ajustes. El `.xls` se versiona
> en el repo y `npm run build` regenera los JSON en cada deploy.

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

`react-doctor` v0.8.1: **65/100**, sin errores (solo advertencias). El grueso
son **43 avisos de `button-has-type`**, repartidos por toda la interfaz: la
app no tiene ni un `<form>`, así que ningún botón puede enviar nada por
accidente. Es higiene pendiente, no un defecto.

El resto son dos falsos positivos (las funciones de `netlify/functions/` no se
importan desde el bundle porque corren en el servidor), el *fetch* dentro de
`useEffect` de las fuentes externas —con cancelación y caché propias— y
sugerencias de estilo sobre componentes preexistentes.

> Versiones anteriores del README citaban 93/100; esa nota correspondía a una
> versión más antigua de la herramienta, con otro conjunto de reglas.

La librería de imagen (`html-to-image`) se carga de forma diferida solo al
compartir, para no penalizar la carga inicial en móvil.

> Aplicativo de consulta no oficial con fines informativos. Fuente: MINAM
> (2023), Dirección General de Diversidad Biológica.
