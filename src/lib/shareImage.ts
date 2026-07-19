import type { Species } from '../types';
import type { Recording } from './speciesAudio';
import { APENDICE_INFO, estadoLabel, GEO_INFO, tipoSonido } from './meta';

const opts = { pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff' };

// Carga diferida: la librería de imagen solo se descarga al compartir.
const htmlToImage = () => import('html-to-image');

export const fileName = (sp: Species) =>
  `${sp.cientifico.replace(/\s+/g, '_')}_CITES.png`;

export async function downloadPng(node: HTMLElement, sp: Species): Promise<void> {
  const { toPng } = await htmlToImage();
  const dataUrl = await toPng(node, opts);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName(sp);
  a.click();
}

export async function nodeToFile(
  node: HTMLElement,
  sp: Species,
): Promise<File | null> {
  const { toBlob } = await htmlToImage();
  const blob = await toBlob(node, opts);
  return blob ? new File([blob], fileName(sp), { type: 'image/png' }) : null;
}

export function shareText(sp: Species, pista?: Recording | null): string {
  const ap = APENDICE_INFO[sp.apendice];
  const geo = GEO_INFO[sp.geografia];
  const L: string[] = [];

  L.push(`🐾 *${sp.cientifico}*`);
  if (sp.autor) L.push(`_${sp.autor}_`);
  if (sp.comun) L.push(`📛 ${sp.comun}`);
  L.push(`🏷️ Tipo: ${sp.tipo} · Ficha N° ${sp.id}`);

  L.push('');
  L.push('*🧬 Clasificación taxonómica*');
  L.push(`• Phylum: ${sp.phylum}`);
  L.push(`• Clase: ${sp.clase}`);
  L.push(`• Orden: ${sp.orden}`);
  L.push(`• Familia: ${sp.familia}`);
  L.push(`• Género: ${sp.genero}`);

  L.push('');
  L.push('*🛡️ Estado de conservación*');
  L.push(
    `• CITES: Apéndice ${sp.apendice}${ap ? ` — ${ap.desc}` : ''}`,
  );
  L.push(
    `• Categoría nacional: ${sp.catNacional} (${estadoLabel(sp.catNacional)})`,
  );
  L.push(`• UICN: ${sp.uicn} (${estadoLabel(sp.uicn)})`);
  L.push(
    `• Geografía: ${sp.geografia}${geo ? ` — ${geo.desc}` : ''}`,
  );
  L.push(`• Inclusión / enmienda CITES: ${sp.anio}`);

  if (sp.sinonimos.length > 0) {
    L.push('');
    L.push(`*🔁 Sinónimos (${sp.sinonimos.length})*`);
    L.push(sp.sinonimos.join(', '));
  }

  if (sp.comentarios) {
    L.push('');
    L.push('*📝 Comentarios de referencia*');
    L.push(sp.comentarios);
  }

  if (pista?.pagina) {
    L.push('');
    L.push('*🔊 Grabación de referencia*');
    const tipo = tipoSonido(pista.tipo);
    L.push(
      `${tipo ? `${tipo} · ` : ''}${pista.autor}${
        pista.licencia ? ` (${pista.licencia})` : ''
      }`,
    );
    L.push(`Escuchar en ${pista.fuente}: ${pista.pagina}`);
  }

  L.push('');
  L.push('📚 Fuente: MINAM 2023 — Listado de Especies de Fauna Silvestre CITES – Perú.');

  return L.join('\n');
}

export function whatsappUrl(
  sp: Species,
  phone: string,
  pista?: Recording | null,
): string {
  const digits = phone.replace(/\D/g, '');
  const text = encodeURIComponent(shareText(sp, pista));
  return digits
    ? `https://wa.me/${digits}?text=${text}`
    : `https://wa.me/?text=${text}`;
}
