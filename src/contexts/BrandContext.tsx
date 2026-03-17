import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrandSettings {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  sidebar_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  org_display_name: string | null;
  font_family: string;
}

const DEFAULT_BRAND: BrandSettings = {
  primary_color: '#C4707A',
  secondary_color: '#F3E8FF',
  accent_color: '#C026D3',
  sidebar_color: '240 10% 10%',
  logo_url: null,
  favicon_url: null,
  org_display_name: null,
  font_family: 'DM Sans',
};

interface BrandContextType {
  brand: BrandSettings;
  loading: boolean;
  saveBrand: (settings: Partial<BrandSettings>) => Promise<void>;
  resetBrand: () => Promise<void>;
  updateLocalBrand: (settings: Partial<BrandSettings>) => void;
}

const BrandContext = createContext<BrandContextType>({
  brand: DEFAULT_BRAND,
  loading: true,
  saveBrand: async () => {},
  resetBrand: async () => {},
  updateLocalBrand: () => {},
});

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyBrandCSS(brand: BrandSettings) {
  const root = document.documentElement;
  const primaryHSL = hexToHSL(brand.primary_color);
  const secondaryHSL = hexToHSL(brand.secondary_color);
  const accentHSL = hexToHSL(brand.accent_color);

  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--ring', primaryHSL);
  root.style.setProperty('--sidebar-primary', primaryHSL);
  root.style.setProperty('--sidebar-ring', primaryHSL);
  root.style.setProperty('--secondary', secondaryHSL);
  root.style.setProperty('--accent', accentHSL);

  // sidebar_color may be HSL string or hex — normalize to HSL
  const sidebarVal = brand.sidebar_color;
  const sidebarHSL = sidebarVal.startsWith('#') ? hexToHSL(sidebarVal) : sidebarVal;
  root.style.setProperty('--sidebar-background', sidebarHSL);

  const fontMap: Record<string, string> = {
    'DM Sans': "'DM Sans', sans-serif",
    'Inter': "'Inter', sans-serif",
    'Poppins': "'Poppins', sans-serif",
    'Nunito': "'Nunito', sans-serif",
  };
  root.style.setProperty('--font-sans', fontMap[brand.font_family] || fontMap['DM Sans']);

  if (brand.favicon_url) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = brand.favicon_url;
    console.log('[BrandContext] Favicon aplicado:', brand.favicon_url);
  }
}

/** Load system_settings as a fallback map */
async function loadSystemDefaults(): Promise<Record<string, string | null>> {
  const { data } = await supabase
    .from('system_settings')
    .select('setting_key, setting_value');
  const map: Record<string, string | null> = {};
  for (const row of (data || [])) {
    map[row.setting_key] = row.setting_value;
  }
  return map;
}

/** Merge: org brand_settings > system_settings > hardcoded defaults */
function buildBrand(
  orgData: any | null,
  sysMap: Record<string, string | null>
): BrandSettings {
  const get = (orgKey: keyof BrandSettings, sysKey: string, fallback: string | null) => {
    const orgVal = orgData?.[orgKey];
    if (orgVal !== undefined && orgVal !== null && orgVal !== '') {
      console.log('[BrandContext] Usando configuração da org para:', orgKey);
      return orgVal;
    }
    if (sysMap[sysKey] !== undefined && sysMap[sysKey] !== null) {
      console.log('[BrandContext] Usando fallback global para:', orgKey);
      return sysMap[sysKey];
    }
    return fallback;
  };

  return {
    primary_color: get('primary_color', 'primary_color', DEFAULT_BRAND.primary_color) as string,
    secondary_color: get('secondary_color', 'secondary_color', DEFAULT_BRAND.secondary_color) as string,
    accent_color: get('accent_color', 'accent_color', DEFAULT_BRAND.accent_color) as string,
    sidebar_color: get('sidebar_color', 'sidebar_bg_color', DEFAULT_BRAND.sidebar_color) as string,
    logo_url: get('logo_url', 'logo_url', DEFAULT_BRAND.logo_url) as string | null,
    favicon_url: get('favicon_url', 'favicon_url', DEFAULT_BRAND.favicon_url) as string | null,
    org_display_name: get('org_display_name', 'system_name', DEFAULT_BRAND.org_display_name) as string | null,
    font_family: get('font_family', 'font_family', DEFAULT_BRAND.font_family) as string,
  };
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [loading, setLoading] = useState(true);
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(null);

  useEffect(() => {
    const loadBrand = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('[BrandContext] No user, using defaults');
          // Even without user, load system defaults for login page
          const sysMap = await loadSystemDefaults();
          const settings = buildBrand(null, sysMap);
          setBrand(settings);
          applyBrandCSS(settings);
          // Apply system name as tab title
          if (sysMap['system_name']) {
            document.title = sysMap['system_name'];
            console.log('[BrandContext] Título da aba atualizado:', sysMap['system_name']);
          }
          setLoading(false);
          return;
        }

        // Resolve org id
        let orgId: string | null = null;
        const superadminOrgId = localStorage.getItem('superadmin_current_org');

        if (superadminOrgId && superadminOrgId !== 'consolidado') {
          const { data: isSuperadmin } = await supabase.rpc('is_superadmin', { _user_id: user.id });
          if (isSuperadmin) {
            orgId = superadminOrgId;
            console.log('[BrandContext] SuperAdmin viewing org:', orgId);
          }
        }

        if (!orgId) {
          const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

          if (!membership) {
            console.log('[BrandContext] No org membership, loading system defaults');
            const sysMap = await loadSystemDefaults();
            const settings = buildBrand(null, sysMap);
            setBrand(settings);
            applyBrandCSS(settings);
            setLoading(false);
            return;
          }
          orgId = membership.organization_id;
        }

        setResolvedOrgId(orgId);

        // Load system defaults and org settings in parallel
        const [sysMap, orgResult] = await Promise.all([
          loadSystemDefaults(),
          supabase
            .from('brand_settings')
            .select('*')
            .eq('organization_id', orgId)
            .maybeSingle(),
        ]);

        if (orgResult.error) throw orgResult.error;

        const settings = buildBrand(orgResult.data, sysMap);

        console.log('[BrandContext] ✅ Tema carregado:', settings.primary_color);
        setBrand(settings);
        applyBrandCSS(settings);

        // Apply system name as tab title
        const tabTitle = orgResult.data?.org_display_name || sysMap['system_name'] || 'Vita CRM';
        document.title = tabTitle;
        console.log('[BrandContext] Título da aba atualizado:', tabTitle);
      } catch (e) {
        console.error('[BrandContext] ❌ Erro:', e);
      } finally {
        setLoading(false);
      }
    };

    loadBrand();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadBrand();
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateLocalBrand = useCallback((partial: Partial<BrandSettings>) => {
    console.log('[BrandContext] updateLocalBrand:', partial);
    setBrand(prev => {
      const next = { ...prev, ...partial };
      applyBrandCSS(next);
      return next;
    });
  }, []);

  const saveBrand = useCallback(async (partial: Partial<BrandSettings>) => {
    if (!resolvedOrgId) {
      throw new Error('Organização não encontrada. Recarregue a página e tente novamente.');
    }

    const updated = { ...brand, ...partial };

    const { error } = await supabase
      .from('brand_settings')
      .upsert(
        {
          organization_id: resolvedOrgId,
          ...updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' }
      );

    if (error) throw error;

    setBrand(updated);
    applyBrandCSS(updated);
    console.log('[BrandContext] ✅ brand_settings salvo');
  }, [resolvedOrgId, brand]);

  const resetBrand = useCallback(async () => {
    if (!resolvedOrgId) {
      throw new Error('Organização não encontrada. Recarregue a página e tente novamente.');
    }
    await saveBrand(DEFAULT_BRAND);
  }, [resolvedOrgId, saveBrand]);

  return (
    <BrandContext.Provider value={{ brand, loading, saveBrand, resetBrand, updateLocalBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}

export { DEFAULT_BRAND };
