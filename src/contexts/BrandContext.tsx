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
  root.style.setProperty('--sidebar-background', brand.sidebar_color);

  // Font
  const fontMap: Record<string, string> = {
    'DM Sans': "'DM Sans', sans-serif",
    'Inter': "'Inter', sans-serif",
    'Poppins': "'Poppins', sans-serif",
    'Nunito': "'Nunito', sans-serif",
  };
  root.style.setProperty('--font-sans', fontMap[brand.font_family] || fontMap['DM Sans']);

  // Favicon
  if (brand.favicon_url) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = brand.favicon_url;
  }
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [loading, setLoading] = useState(true);
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(null);

  // Fetch org id + brand settings directly from user session
  useEffect(() => {
    const loadBrand = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('[BrandContext] No user, using defaults');
          setLoading(false);
          return;
        }

        // Get user's org directly
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (!membership) {
          console.log('[BrandContext] No org membership, using defaults');
          setLoading(false);
          return;
        }

        setResolvedOrgId(membership.organization_id);

        const { data, error } = await supabase
          .from('brand_settings')
          .select('*')
          .eq('organization_id', membership.organization_id)
          .maybeSingle();

        if (error) throw error;

        const settings: BrandSettings = data
          ? {
              primary_color: data.primary_color,
              secondary_color: data.secondary_color,
              accent_color: data.accent_color,
              sidebar_color: data.sidebar_color,
              logo_url: data.logo_url,
              favicon_url: data.favicon_url,
              org_display_name: data.org_display_name,
              font_family: data.font_family,
            }
          : DEFAULT_BRAND;

        console.log('[BrandContext] ✅ Tema carregado:', settings.primary_color);
        setBrand(settings);
        applyBrandCSS(settings);
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
