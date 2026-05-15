import { APENDICE_INFO, estadoCls, estadoLabel, GEO_INFO } from '../lib/meta';

export function ApendiceBadge({ value }: { value: string }) {
  const info = APENDICE_INFO[value];
  return (
    <span
      title={info?.desc}
      className={`chip ${info?.cls ?? 'bg-slate-100 text-slate-600'}`}
    >
      CITES {value}
    </span>
  );
}

export function EstadoBadge({ value, title }: { value: string; title?: string }) {
  return (
    <span
      title={title ? `${title}: ${estadoLabel(value)}` : estadoLabel(value)}
      className={`chip ${estadoCls(value)}`}
    >
      {value}
    </span>
  );
}

export function GeoBadge({ value }: { value: string }) {
  const info = GEO_INFO[value];
  return (
    <span
      title={info?.desc}
      className={`chip ${info?.cls ?? 'bg-slate-100 text-slate-600'}`}
    >
      {value}
    </span>
  );
}
