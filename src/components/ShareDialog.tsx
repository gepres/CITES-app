import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ImageOff,
  Loader2,
  Share2,
  X,
} from 'lucide-react';
import type { Species } from '../types';
import ShareCard from './ShareCard';
import {
  downloadPng,
  nodeToFile,
  shareText,
  whatsappUrl,
} from '../lib/shareImage';
import { fetchSpeciesPhoto, toDataUrl } from '../lib/speciesPhoto';

// Ícono de WhatsApp (lucide no lo trae) — glyph simple en SVG.
function WhatsappIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
    </svg>
  );
}

const WA_KEY = 'fauna-cites:wa-num';

const loadWaNum = (): string => {
  try {
    return localStorage.getItem(WA_KEY) ?? '';
  } catch {
    return '';
  }
};

// El usuario edita el número completo (con código de país). Solo se toma
// como destinatario si tiene dígitos suficientes; si no, se abre el selector.
const phoneDigits = (raw: string): string => {
  const d = raw.replace(/\D/g, '');
  return d.length >= 8 ? d : '';
};

export default function ShareDialog({
  sp,
  onClose,
}: {
  sp: Species;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState(() => loadWaNum() || '+51 ');
  const [remember, setRemember] = useState(() => loadWaNum() !== '');
  const [busy, setBusy] = useState<null | 'png' | 'share'>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoCredit, setPhotoCredit] = useState('');
  const [photoState, setPhotoState] = useState<
    'loading' | 'ok' | 'none'
  >('loading');
  const [withPhoto, setWithPhoto] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Busca una foto referencial (iNaturalist/Wikipedia) y la incrusta como
  // data URL para que también quede en el PNG/compartido.
  useEffect(() => {
    let active = true;
    setPhoto(null);
    setPhotoState('loading');
    (async () => {
      const found = await fetchSpeciesPhoto(sp.cientifico);
      if (!active) return;
      if (!found) {
        setPhotoState('none');
        return;
      }
      // Preferimos data URL (más confiable en el PNG); si falla, usamos la
      // URL remota directa — html-to-image la incrusta vía CORS.
      const data = await toDataUrl(found.url);
      if (!active) return;
      setPhoto(data ?? found.url);
      setPhotoCredit(`${found.source} · ${found.credit}`);
      setPhotoState('ok');
    })();
    return () => {
      active = false;
    };
  }, [sp.cientifico]);

  const cardPhoto = withPhoto ? photo : null;
  const cardCredit = withPhoto ? photoCredit : undefined;

  const canNativeShare =
    typeof navigator !== 'undefined' && !!navigator.share;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setErr('');
    setBusy('png');
    try {
      await downloadPng(cardRef.current, sp);
    } catch {
      setErr('No se pudo generar la imagen. Inténtalo de nuevo.');
    } finally {
      setBusy(null);
    }
  };

  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    setErr('');
    setBusy('share');
    try {
      const file = await nodeToFile(cardRef.current, sp);
      const data: ShareData = { text: shareText(sp), title: sp.cientifico };
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ ...data, files: [file] });
      } else {
        await navigator.share(data);
      }
    } catch {
      /* el usuario canceló o no es compatible: silencioso */
    } finally {
      setBusy(null);
    }
  };

  const persistNumber = (rememberOn: boolean, value: string) => {
    try {
      const v = value.trim();
      if (rememberOn && phoneDigits(v)) localStorage.setItem(WA_KEY, v);
      else localStorage.removeItem(WA_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
  };

  const handleWhatsapp = () => {
    persistNumber(remember, phone);
    window.open(whatsappUrl(sp, phoneDigits(phone)), '_blank', 'noopener');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText(sp));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setErr('No se pudo copiar al portapapeles.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* ShareCard fuera de pantalla, solo para capturar la imagen */}
      <div
        aria-hidden
        style={{ position: 'fixed', left: -10000, top: 0 }}
      >
        <ShareCard
          ref={cardRef}
          sp={sp}
          photo={cardPhoto}
          photoCredit={cardCredit}
        />
      </div>

      <div className="animate-slide-in relative flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h3 className="flex items-center gap-2 text-base font-extrabold">
            <Share2 size={18} className="text-brand-600" /> Compartir ficha
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-9 items-center justify-center rounded-xl hover:bg-slate-100 active:scale-95 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* Vista previa (se desplaza si la ficha es larga) */}
          <div className="flex max-h-[42vh] justify-center overflow-y-auto rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
            <div style={{ zoom: 0.62 }}>
              <ShareCard sp={sp} photo={cardPhoto} photoCredit={cardCredit} />
            </div>
          </div>

          {/* Estado de la foto referencial */}
          {photoState === 'loading' && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              Buscando foto de la especie…
            </div>
          )}
          {photoState === 'none' && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ImageOff size={14} />
              Sin foto disponible · se comparte solo la ficha
            </div>
          )}
          {photoState === 'ok' && (
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={withPhoto}
                onChange={(e) => setWithPhoto(e.target.checked)}
                className="size-5 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">
                  Incluir foto de la especie
                </span>
                <span className="block text-[11px] text-slate-400">
                  Se añade al inicio de la imagen al descargar o compartir
                </span>
              </span>
            </label>
          )}

          {/* WhatsApp */}
          <div>
            <label
              htmlFor="wa-num"
              className="mb-1.5 block text-xs font-semibold text-slate-500"
            >
              Número de WhatsApp (opcional)
            </label>
            <div className="flex gap-2">
              <input
                id="wa-num"
                inputMode="tel"
                autoComplete="tel"
                maxLength={18}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/[^\d+ ]/g, ''))
                }
                placeholder="+51 987 654 321"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                onClick={handleWhatsapp}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white transition active:scale-95"
              >
                <WhatsappIcon /> Enviar
              </button>
            </div>

            <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => {
                  setRemember(e.target.checked);
                  persistNumber(e.target.checked, phone);
                }}
                className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Recordar número en este dispositivo
            </label>

            <p className="mt-1.5 text-[11px] text-slate-400">
              Solo el número, sin «+51». Vacío = elegir contacto. Adjunta la
              imagen descargada si quieres enviarla.
            </p>
          </div>

          {/* Acciones */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              disabled={busy !== null}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
            >
              {busy === 'png' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Descargar imagen
            </button>

            {canNativeShare ? (
              <button
                onClick={handleNativeShare}
                disabled={busy !== null}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-bold transition active:scale-95 disabled:opacity-50 dark:border-slate-700"
              >
                {busy === 'share' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Share2 size={16} />
                )}
                Compartir…
              </button>
            ) : (
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-bold transition active:scale-95 dark:border-slate-700"
              >
                {copied ? (
                  <Check size={16} className="text-brand-600" />
                ) : (
                  <Copy size={16} />
                )}
                {copied ? 'Copiado' : 'Copiar datos'}
              </button>
            )}
          </div>

          {err && <p className="text-center text-xs text-rose-500">{err}</p>}
        </div>
      </div>
    </div>
  );
}
