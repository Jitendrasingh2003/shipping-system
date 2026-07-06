import { createContext, useContext, useEffect, useState } from 'react';

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenantConfig = async () => {
      try {
        const slug = getSlugFromHost();
        const headers = {};
        if (slug) headers['x-tenant-slug'] = slug;

        const res = await fetch('/api/tenant/config', { headers });
        const data = await res.json();

        if (data.success && data.config) {
          setTenant(data.config);
          applyBranding(data.config);
        }
      } catch {
        // Default branding if tenant fetch fails
        applyBranding({ primaryColor: '#6366f1' });
      } finally {
        setLoading(false);
      }
    };

    fetchTenantConfig();
  }, []);

  const getSlugFromHost = () => {
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length >= 3 && parts[0] !== 'www') {
      return parts[0];
    }
    // Dev override via localStorage
    return localStorage.getItem('dev_tenant_slug') || null;
  };

  const applyBranding = (config) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', config.primaryColor || '#6366f1');
    root.style.setProperty('--primary-light', config.primaryColor ? config.primaryColor + '22' : '#6366f122');

    // Update tab title
    if (config.name) {
      document.title = `${config.name} — SmartShip`;
    }

    // Update favicon if logo provided
    if (config.logo) {
      const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = config.logo;
      document.head.appendChild(favicon);
    }
  };

  return (
    <TenantContext.Provider value={{ tenant, loading, setTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
export default TenantContext;
