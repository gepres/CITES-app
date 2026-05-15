import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Registra el service worker en producción. */
export function registerSW(): void {
  if (!('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* sin SW: la app sigue funcionando, solo no es instalable/offline */
    });
  });
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios/i.test(navigator.userAgent);

const DISMISS_KEY = 'fauna-cites:pwa-dismiss';

/**
 * Estado del flujo de instalación.
 * - canInstall: hay prompt nativo disponible (Android/Chrome/Edge).
 * - iosHint: iOS Safari (instalación manual vía «Compartir»).
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setDeferred(null);
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* almacenamiento no disponible */
    }
  };

  const iosHint = isIOS() && !installed;

  return {
    installed,
    dismissed,
    canInstall: !!deferred,
    iosHint,
    install,
    dismiss,
    // Banner siempre visible en el home hasta instalar o descartar.
    show: !installed && !dismissed,
  };
}
