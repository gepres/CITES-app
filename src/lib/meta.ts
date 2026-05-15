// Etiquetas legibles y colores para los códigos técnicos del listado.

export const APENDICE_INFO: Record<string, { label: string; cls: string; desc: string }> = {
  I: {
    label: 'Apéndice I',
    cls: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30',
    desc: 'Especies en peligro de extinción. Comercio internacional prohibido salvo circunstancias excepcionales.',
  },
  II: {
    label: 'Apéndice II',
    cls: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
    desc: 'No necesariamente en peligro, pero su comercio debe controlarse para evitar un uso incompatible con su supervivencia.',
  },
  III: {
    label: 'Apéndice III',
    cls: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30',
    desc: 'Especies protegidas en al menos un país que solicitó a otras Partes ayuda para controlar su comercio.',
  },
};

// Categorías UICN y categoría nacional (D.S. 004-2014-MINAGRI) comparten códigos.
const ESTADO_INFO: Record<string, { label: string; cls: string }> = {
  EX: { label: 'Extinta', cls: 'bg-black text-white dark:bg-white dark:text-black' },
  EW: { label: 'Extinta en estado silvestre', cls: 'bg-zinc-800 text-white' },
  CR: { label: 'En peligro crítico', cls: 'bg-rose-600 text-white' },
  EN: { label: 'En peligro', cls: 'bg-orange-500 text-white' },
  VU: { label: 'Vulnerable', cls: 'bg-amber-400 text-amber-950' },
  NT: { label: 'Casi amenazada', cls: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-300/80' },
  LC: { label: 'Preocupación menor', cls: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-400/80' },
  LR: { label: 'Bajo riesgo', cls: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-400/80' },
  DD: { label: 'Datos insuficientes', cls: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  NE: { label: 'No evaluada', cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
  NC: { label: 'No categorizada', cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
};

export const GEO_INFO: Record<string, { cls: string; desc: string }> = {
  Endémica: {
    cls: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30',
    desc: 'Presente únicamente en el Perú.',
  },
  Nativa: {
    cls: 'bg-brand-100 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/30',
    desc: 'Originaria del Perú, también presente en otros países.',
  },
  Vagrante: {
    cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    desc: 'Presencia ocasional o accidental en el territorio.',
  },
  Hipotética: {
    cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    desc: 'Presencia reportada pero no confirmada.',
  },
};

export const estadoLabel = (c: string) => ESTADO_INFO[c]?.label ?? c;
export const estadoCls = (c: string) =>
  ESTADO_INFO[c]?.cls ?? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';

export const FACET_LABELS: Record<string, string> = {
  tipo: 'Tipo',
  clase: 'Clase',
  orden: 'Orden',
  familia: 'Familia',
  apendice: 'Apéndice CITES',
  catNacional: 'Categoría nacional',
  uicn: 'Estado UICN',
  geografia: 'Geografía',
};
