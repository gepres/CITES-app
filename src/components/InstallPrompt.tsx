import { useState } from 'react';
import {
  Download,
  Leaf,
  MoreVertical,
  Share,
  SquarePlus,
  X,
} from 'lucide-react';
import { useInstallPrompt } from '../lib/pwa';

export default function InstallPrompt() {
  const { show, canInstall, iosHint, install, dismiss } = useInstallPrompt();
  const [howto, setHowto] = useState(false);

  if (!show) return null;

  const onAction = () => {
    if (canInstall) install();
    else setHowto((v) => !v);
  };

  return (
    <div className="animate-fade-in mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-800 text-white shadow-lg shadow-brand-600/25">
      <div className="flex items-center gap-3 p-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <Leaf size={26} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold leading-tight sm:text-base">
            Instala la app en tu celular
          </p>
          <p className="mt-0.5 text-xs text-white/85">
            Acceso directo, abre más rápido y funciona sin conexión.
          </p>
        </div>

        <button
          onClick={onAction}
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-brand-700 transition active:scale-95"
        >
          <Download size={17} />
          Instalar
        </button>

        <button
          onClick={dismiss}
          aria-label="Ahora no"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 active:scale-90"
        >
          <X size={18} />
        </button>
      </div>

      {howto && !canInstall && (
        <div className="border-t border-white/15 bg-black/10 px-4 py-3 text-xs leading-relaxed text-white/90">
          {iosHint ? (
            <p>
              En Safari pulsa{' '}
              <Share size={14} className="mb-0.5 inline" /> <b>Compartir</b> y
              luego <SquarePlus size={14} className="mb-0.5 inline" />{' '}
              <b>«Añadir a pantalla de inicio»</b>.
            </p>
          ) : (
            <p>
              Abre el menú{' '}
              <MoreVertical size={14} className="mb-0.5 inline" /> del navegador
              y elige <b>«Instalar app»</b> o{' '}
              <b>«Añadir a pantalla de inicio»</b>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
