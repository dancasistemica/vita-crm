import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DASHBOARD_CARDS } from '@/config/dashboardCards';

export interface DashboardCardSetting {
  card_id: string;
  is_visible: boolean;
  position: number;
}

export function useDashboardSettings(organizationId: string | null) {
  const [settings, setSettings] = useState<DashboardCardSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!organizationId) {
      setSettings(DASHBOARD_CARDS.map(c => ({ card_id: c.id, is_visible: c.defaultVisible, position: c.defaultPosition })));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('dashboard_settings')
        .select('card_id, is_visible, position')
        .eq('organization_id', organizationId)
        .order('position', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Merge with defaults for any new cards not yet saved
        const savedIds = new Set(data.map(d => d.card_id));
        const merged = [
          ...data.map(d => ({ card_id: d.card_id, is_visible: d.is_visible ?? true, position: d.position })),
          ...DASHBOARD_CARDS.filter(c => !savedIds.has(c.id)).map(c => ({ card_id: c.id, is_visible: c.defaultVisible, position: c.defaultPosition })),
        ].sort((a, b) => a.position - b.position);
        setSettings(merged);
        console.log('[Dashboard] Configurações carregadas:', merged.length, 'cards, visíveis:', merged.filter(s => s.is_visible).length);
      } else {
        const defaults = DASHBOARD_CARDS.map(c => ({ card_id: c.id, is_visible: c.defaultVisible, position: c.defaultPosition }));
        setSettings(defaults);
        console.log('[Dashboard] Usando configurações padrão:', defaults.length, 'cards');
      }
    } catch (err) {
      console.error('[Dashboard] Erro ao carregar configurações:', err);
      setSettings(DASHBOARD_CARDS.map(c => ({ card_id: c.id, is_visible: c.defaultVisible, position: c.defaultPosition })));
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = useCallback(async (newSettings: DashboardCardSetting[]) => {
    if (!organizationId) return;
    const rows = newSettings.map(s => ({
      organization_id: organizationId,
      card_id: s.card_id,
      is_visible: s.is_visible,
      position: s.position,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('dashboard_settings')
      .upsert(rows, { onConflict: 'organization_id,card_id' });
    if (error) console.error('[Dashboard] Erro ao salvar configurações:', error);
    else console.log('[Dashboard] Configurações salvas para org:', organizationId);
  }, [organizationId]);

  const toggleVisibility = useCallback(async (cardId: string) => {
    const updated = settings.map(s =>
      s.card_id === cardId ? { ...s, is_visible: !s.is_visible } : s
    );
    setSettings(updated);
    console.log('[Dashboard] Visibilidade alterada:', cardId, updated.find(s => s.card_id === cardId)?.is_visible);
    await saveSettings(updated);
  }, [settings, saveSettings]);

  const reorder = useCallback(async (fromIndex: number, toIndex: number) => {
    const reordered = [...settings];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const withPositions = reordered.map((s, i) => ({ ...s, position: i }));
    setSettings(withPositions);
    console.log('[Dashboard] Card reordenado: de posição', fromIndex, 'para', toIndex);
    await saveSettings(withPositions);
  }, [settings, saveSettings]);

  return { settings, loading, toggleVisibility, reorder, loadSettings };
}
