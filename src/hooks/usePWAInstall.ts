import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed / shortcut open)
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);
    setIsInstalled(Boolean(isStandalone));

    // Detect iOS devices
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

/**
 * Sincroniza dinamicamente o Favicon, Apple Touch Icon e Web App Manifest
 * com a logo ativa do sistema para que qualquer atalho criado pelo celular ou
 * computador utilize a logo configurada.
 */
export function updateAppShortcutLogo(logoUrl: string) {
  if (typeof document === 'undefined' || !logoUrl) return;

  const resolved = logoUrl || '/logo/capa.png';

  // 1. Atualiza Favicon
  let iconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!iconLink) {
    iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    document.head.appendChild(iconLink);
  }
  iconLink.type = resolved.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  iconLink.href = resolved;

  // 2. Atualiza Apple Touch Icon (iOS Safari atalho na tela inicial)
  let appleTouchLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
  if (!appleTouchLink) {
    appleTouchLink = document.createElement('link');
    appleTouchLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleTouchLink);
  }
  appleTouchLink.href = resolved;

  // 3. Apple Touch Icon Precomposed
  let applePrecomp = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon-precomposed']");
  if (!applePrecomp) {
    applePrecomp = document.createElement('link');
    applePrecomp.rel = 'apple-touch-icon-precomposed';
    document.head.appendChild(applePrecomp);
  }
  applePrecomp.href = resolved;

  // 4. Injeta dinamicamente manifest com a logo atual
  try {
    const dynamicManifest = {
      id: '/',
      name: 'Maresia Gastronomia & Espetaria',
      short_name: 'Maresia',
      description: 'Sistema completo para gestão de espetinho, marmitaria e caixa.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0f172a',
      theme_color: '#0f172a',
      orientation: 'portrait-primary',
      icons: [
        {
          src: resolved,
          sizes: '192x192 256x256 384x384 512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: resolved,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    };
    const blob = new Blob([JSON.stringify(dynamicManifest, null, 2)], { type: 'application/manifest+json' });
    const manifestBlobUrl = URL.createObjectURL(blob);

    let manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestBlobUrl;
  } catch (err) {
    console.warn('Não foi possível gerar blob dinâmico do manifest:', err);
  }
}
