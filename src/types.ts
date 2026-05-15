export interface Species {
  id: number;
  tipo: 'Fauna silvestre' | 'Hidrobiológico';
  phylum: string;
  clase: string;
  orden: string;
  familia: string;
  genero: string;
  cientifico: string;
  comun: string;
  apendice: 'I' | 'II' | 'III' | string;
  anio: string;
  catNacional: string; // CR EN VU NT DD | NC
  uicn: string; // CR EN VU NT LC DD LR NE
  geografia: string; // Nativa | Endémica | Vagrante | Hipotética
  autor: string;
  sinonimos: string[];
  comentarios: string;
}

export interface Cambio {
  n: number;
  edicion: string;
  taxon: string;
  detalle: string;
}

export interface Fuente {
  n: number;
  anio: string;
  autor: string;
  titulo: string;
}

export interface Anexos {
  cita: string;
  equipo: { nombre: string; email: string }[];
  cambios: Cambio[];
  fuentes: Fuente[];
}

export type FacetKey =
  | 'tipo'
  | 'clase'
  | 'orden'
  | 'familia'
  | 'apendice'
  | 'catNacional'
  | 'uicn'
  | 'geografia';
