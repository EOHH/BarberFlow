import { useEffect } from 'react';

const getHexColor = (colorName?: string | null): string => {
  if (!colorName) return '#10b981'; // default emerald
  const lower = colorName.toLowerCase();
  if (lower.includes('gold')) return '#d97706'; // amber-600
  if (lower.includes('emerald')) return '#059669'; // emerald-600
  if (lower.includes('indigo')) return '#4f46e5'; // indigo-600
  if (lower.includes('rose')) return '#e11d48'; // rose-600
  if (lower.includes('slate')) return '#475569'; // slate-600
  return '#10b981';
};

export function useDynamicPWA(tenant: { name?: string; logo_url?: string; theme_color?: string } | null) {
  useEffect(() => {
    if (!tenant) return;

    const name = tenant.name || 'BarberShop';
    const shortName = name.length > 12 ? name.substring(0, 12) : name;
    const themeColor = getHexColor(tenant.theme_color);
    
    // Si no hay logo, construir URL absoluta basada en el origen actual para evitar problemas con el manifest tipo Blob
    const iconUrl = tenant.logo_url || `${window.location.origin}/icon-192x192.png`;

    // 1. Inyectar/Actualizar el meta theme-color
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', themeColor);

    // 2. Inyectar/Actualizar el apple-touch-icon para iOS
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(appleIcon);
    }
    appleIcon.setAttribute('href', iconUrl);

    // 3. Generar dinámicamente el manifest.json
    const manifest = {
      name: name,
      short_name: shortName,
      description: `App oficial de ${name}`,
      theme_color: themeColor,
      background_color: '#050505',
      display: 'standalone',
      orientation: 'portrait',
      start_url: window.location.href, // Usar URL absoluta exacta actual para evitar errores
      icons: [
        {
          src: iconUrl,
          sizes: 'any',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: iconUrl,
          sizes: 'any',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.setAttribute('rel', 'manifest');
      document.head.appendChild(manifestLink);
    }
    manifestLink.setAttribute('href', manifestUrl);

    // Cleanup: revoke URL to avoid memory leaks if component unmounts (rare, but good practice)
    return () => {
      URL.revokeObjectURL(manifestUrl);
    };
  }, [tenant]);
}
