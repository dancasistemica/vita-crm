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
  logo_size: number;
  logo_size_desktop: number;
  logo_size_mobile: number;
}

export interface AdvancedColors {
  color_hover: string;
  color_active: string;
  color_selected_bg: string;
  color_selected_text: string;
  color_text_primary: string;
  color_text_secondary: string;
  color_background: string;
  color_card_bg: string;
  color_border: string;
  color_success: string;
  color_warning: string;
  color_error: string;
  color_info: string;
  color_button_text: string;
  color_sidebar_text: string;
  color_sidebar_hover: string;
  color_sidebar_selected: string;
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
  logo_size: 32,
  logo_size_desktop: 40,
  logo_size_mobile: 32,
};

const DEFAULT_ADVANCED: AdvancedColors = {
  color_hover: '#6d28d9',
  color_active: '#5b21b6',
  color_selected_bg: '#ede9fe',
  color_selected_text: '#5b21b6',
  color_text_primary: '#111827',
  color_text_secondary: '#6b7280',
  color_background: '#f9fafb',
  color_card_bg: '#ffffff',
  color_border: '#e5e7eb',
  color_success: '#10b981',
  color_warning: '#f59e0b',
  color_error: '#ef4444',
  color_info: '#3b82f6',
  color_button_text: '#ffffff',
  color_sidebar_text: '#f3f4f6',
  color_sidebar_hover: '#4c1d95',
  color_sidebar_selected: '#7c3aed',
};

interface BrandContextType {
  brand: BrandSettings;
  advancedColors: AdvancedColors;
  loading: boolean;
  saveBrand: (settings: Partial<BrandSettings>) => Promise<void>;
  resetBrand: () => Promise<void>;
  updateLocalBrand: (settings: Partial<BrandSettings>) => void;
}

const BrandContext = createContext<BrandContextType>({
  brand: DEFAULT_BRAND,
  advancedColors: DEFAULT_ADVANCED,
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

function applyBrandCSS(brand: BrandSettings, advanced: AdvancedColors) {
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

  // Logo size CSS custom properties
  root.style.setProperty('--logo-h-desktop', `${brand.logo_size_desktop}px`);
  root.style.setProperty('--logo-h-mobile', `${brand.logo_size_mobile}px`);

  // Advanced colors → CSS custom properties mapped to semantic tokens
  root.style.setProperty('--foreground', hexToHSL(advanced.color_text_primary));
  root.style.setProperty('--card-foreground', hexToHSL(advanced.color_text_primary));
  root.style.setProperty('--popover-foreground', hexToHSL(advanced.color_text_primary));
  root.style.setProperty('--muted-foreground', hexToHSL(advanced.color_text_secondary));
  root.style.setProperty('--background', hexToHSL(advanced.color_background));
  root.style.setProperty('--card', hexToHSL(advanced.color_card_bg));
  root.style.setProperty('--popover', hexToHSL(advanced.color_card_bg));
  root.style.setProperty('--border', hexToHSL(advanced.color_border));
  root.style.setProperty('--input', hexToHSL(advanced.color_border));
  root.style.setProperty('--success', hexToHSL(advanced.color_success));
  root.style.setProperty('--warning', hexToHSL(advanced.color_warning));
  root.style.setProperty('--destructive', hexToHSL(advanced.color_error));
  root.style.setProperty('--info', hexToHSL(advanced.color_info));
  root.style.setProperty('--primary-foreground', hexToHSL(advanced.color_button_text));
  root.style.setProperty('--sidebar-foreground', hexToHSL(advanced.color_sidebar_text));
  root.style.setProperty('--sidebar-accent', hexToHSL(advanced.color_sidebar_hover));
  root.style.setProperty('--sidebar-accent-foreground', hexToHSL(advanced.color_sidebar_text));

  console.log('[BrandContext] CSS custom properties aplicadas: 20+ variáveis');

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

/** Build advanced colors exclusively from system_settings */
function buildAdvancedColors(sysMap: Record<string, string | null>): AdvancedColors {
  const get = (key: keyof AdvancedColors, sysKey: string) => {
    const val = sysMap[sysKey];
    if (val !== undefined && val !== null && val !== '') return val;
    return DEFAULT_ADVANCED[key];
  };

  return {
    color_hover: get('color_hover', 'color_hover'),
    color_active: get('color_active', 'color_active'),
    color_selected_bg: get('color_selected_bg', 'color_selected_bg'),
    color_selected_text: get('color_selected_text', 'color_selected_text'),
    color_text_primary: get('color_text_primary', 'color_text_primary'),
    color_text_secondary: get('color_text_secondary', 'color_text_secondary'),
    color_background: get('color_background', 'color_background'),
    color_card_bg: get('color_card_bg', 'color_card_bg'),
    color_border: get('color_border', 'color_border'),
    color_success: get('color_success', 'color_success'),
    color_warning: get('color_warning', 'color_warning'),
    color_error: get('color_error', 'color_error'),
    color_info: get('color_info', 'color_info'),
    color_button_text: get('color_button_text', 'color_button_text'),
    color_sidebar_text: get('color_sidebar_text', 'color_sidebar_text'),
    color_sidebar_hover: get('color_sidebar_hover', 'color_sidebar_hover'),
    color_sidebar_selected: get('color_sidebar_selected', 'color_sidebar_selected'),
  };
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
    logo_size: (() => {
      const orgVal = orgData?.logo_size;
      if (orgVal !== undefined && orgVal !== null) return Number(orgVal);
      const sysVal = sysMap['logo_size'];
      if (sysVal !== undefined && sysVal !== null) return Number(sysVal);
      return DEFAULT_BRAND.logo_size;
    })(),
    logo_size_desktop: (() => {
      const orgVal = orgData?.logo_size_desktop;
      if (orgVal !== undefined && orgVal !== null) return Number(orgVal);
      const sysVal = sysMap['logo_size_desktop'];
      if (sysVal !== undefined && sysVal !== null) return Number(sysVal);
      return DEFAULT_BRAND.logo_size_desktop;
    })(),
    logo_size_mobile: (() => {
      const orgVal = orgData?.logo_size_mobile;
      if (orgVal !== undefined && orgVal !== null) return Number(orgVal);
      const sysVal = sysMap['logo_size_mobile'];
      if (sysVal !== undefined && sysVal !== null) return Number(sysVal);
      return DEFAULT_BRAND.logo_size_mobile;
    })(),
  };
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [advancedColors, setAdvancedColors] = useState<AdvancedColors>(DEFAULT_ADVANCED);
  const [loading, setLoading] = useState(true);
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(null);

  useEffect(() => {
    const loadBrand = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('[BrandContext] No user, using defaults');
          const sysMap = await loadSystemDefaults();
          const settings = buildBrand(null, sysMap);
          const advanced = buildAdvancedColors(sysMap);
          setBrand(settings);
          setAdvancedColors(advanced);
          applyBrandCSS(settings, advanced);
          if (sysMap['system_name']) {
            document.title = sysMap['system_name'];
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
            const sysMap = await loadSystemDefaults();
            const settings = buildBrand(null, sysMap);
            const advanced = buildAdvancedColors(sysMap);
            setBrand(settings);
            setAdvancedColors(advanced);
            applyBrandCSS(settings, advanced);
            setLoading(false);
            return;
          }
          orgId = membership.organization_id;
        }

        setResolvedOrgId(orgId);

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
        const advanced = buildAdvancedColors(sysMap);

        console.log('[BrandContext] ✅ Tema carregado:', settings.primary_color);
        console.log('[BrandContext] Campos avançados: exclusivamente do sistema global');
        setBrand(settings);
        setAdvancedColors(advanced);
        applyBrandCSS(settings, advanced);

        const tabTitle = orgResult.data?.org_display_name || sysMap['system_name'] || 'Vita CRM';
        document.title = tabTitle;
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

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'superadmin_current_org') {
        console.log('[BrandContext] Org switch detected, reloading brand');
        loadBrand();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    let lastOrgId = localStorage.getItem('superadmin_current_org');
    const interval = setInterval(() => {
      const current = localStorage.getItem('superadmin_current_org');
      if (current !== lastOrgId) {
        lastOrgId = current;
        console.log('[BrandContext] Org switch detected (same tab), reloading brand');
        loadBrand();
      }
    }, 1000);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const updateLocalBrand = useCallback((partial: Partial<BrandSettings>) => {
    console.log('[BrandContext] updateLocalBrand:', partial);
    setBrand(prev => {
      const next = { ...prev, ...partial };
      applyBrandCSS(next, advancedColors);
      return next;
    });
  }, [advancedColors]);

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
    applyBrandCSS(updated, advancedColors);
    console.log('[BrandContext] ✅ brand_settings salvo');
  }, [resolvedOrgId, brand, advancedColors]);

  const resetBrand = useCallback(async () => {
    if (!resolvedOrgId) {
      throw new Error('Organização não encontrada. Recarregue a página e tente novamente.');
    }
    await saveBrand(DEFAULT_BRAND);
  }, [resolvedOrgId, saveBrand]);

  return (
    <BrandContext.Provider value={{ brand, advancedColors, loading, saveBrand, resetBrand, updateLocalBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}

export { DEFAULT_BRAND };
