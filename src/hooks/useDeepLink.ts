import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const useDeepLink = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleUrl = (data: { url: string }) => {
      const url = data.url;
      // Parsear el scheme: athenea://work → /work
      const path = url.replace('athenea://', '/');

      const routeMap: Record<string, string> = {
        '/work': '/work',
        '/personal': '/personal',
        '/finance': '/finance',
        '/calendar': '/calendar',
        '/journal': '/journal',
        '/focus': '/focus',
        '/omnibar': '/', // abre home y dispara omnibar
      };

      const route = routeMap[path] || '/';
      navigate(route);

      // Caso especial: abrir omnibar
      if (path === '/omnibar') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('athenea:open-omnibar'));
        }, 300);
      }
    };

    // Manejar deep link cuando la app ya está abierta
    const listener = App.addListener('appUrlOpen', handleUrl);

    // Manejar deep link cuando la app se abre desde cero
    App.getLaunchUrl().then((result) => {
      if (result?.url) handleUrl({ url: result.url });
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [navigate]);
};
