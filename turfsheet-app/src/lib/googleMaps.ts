/**
 * Loads the Google Maps JavaScript API once per page.
 *
 * The standalone map injected the script on boot; in a SPA the Maps page can
 * mount and unmount repeatedly, so the promise is memoised and the script tag
 * is reused rather than appended again.
 */

let loadPromise: Promise<typeof google.maps> | null = null;

const SCRIPT_ID = 'google-maps-js-api';

export class MissingMapsKeyError extends Error {
  constructor() {
    super(
      'Missing Google Maps browser key. Add VITE_GOOGLE_MAPS_API_KEY to turfsheet-app/.env.local.'
    );
    this.name = 'MissingMapsKeyError';
  }
}

export function mapsApiKey(): string {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
}

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.maps) {
      resolve(window.google.maps);
      return;
    }

    const key = mapsApiKey();
    if (!key || key.includes('PASTE_')) {
      reject(new MissingMapsKeyError());
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    const onLoad = () => resolve(window.google.maps);
    const onError = () => {
      // Let a later mount retry rather than caching the failure forever.
      loadPromise = null;
      script.remove();
      reject(new Error('Failed to load the Google Maps JavaScript API.'));
    };

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        key
      )}&v=weekly`;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return loadPromise;
}
