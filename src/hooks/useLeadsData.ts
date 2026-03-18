import { useEffect, useState, useCallback } from 'react';
import { useDataAccess } from '@/hooks/useDataAccess';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DbLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  city: string | null;
  rg: string | null;
  cpf: string | null;
  entry_date: string | null;
  origin: string | null;
  interest_level: string | null;
  main_interest: string | null;
  tags: string[] | null;
  custom_data: Record<string, any> | null;
  pipeline_stage: string | null;
  responsible: string | null;
  notes: string | null;
  deal_value: number | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface LeadView {
  id: string;
  name: string;
  phone: string;
  email: string;
  instagram: string;
  city: string;
  rg: string;
  cpf: string;
  entryDate: string;
  origin: string;
  interestLevel: string;
  mainInterest: string;
  tags: string[];
  customData: Record<string, any>;
  pipelineStage: string;
  responsible: string;
  notes: string;
  dealValue: number | null;
}

interface OriginView { id: string; name: string; }
interface StageView { id: string; name: string; order: number; }
interface TagView { id: string; name: string; color: string; }
interface InterestLevelView { id: string; value: string; label: string; }

function toLeadView(db: DbLead): LeadView {
  return {
    id: db.id,
    name: db.name,
    phone: db.phone || '',
    email: db.email || '',
    instagram: db.instagram || '',
    city: db.city || '',
    rg: db.rg || '',
    cpf: db.cpf || '',
    entryDate: db.entry_date || '',
    origin: db.origin || '',
    interestLevel: db.interest_level || 'frio',
    mainInterest: db.main_interest || '',
    tags: db.tags || [],
    customData: (db.custom_data as Record<string, any>) || {},
    pipelineStage: db.pipeline_stage || '1',
    responsible: db.responsible || '',
    notes: db.notes || '',
    dealValue: db.deal_value != null ? Number(db.deal_value) : null,
  };
}

export function useLeadsData() {
  const dataAccess = useDataAccess();
  const { organizationId } = useOrganization();
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadView[]>([]);
  const [origins, setOrigins] = useState<string[]>([]);
  const [pipelineStages, setPipelineStages] = useState<StageView[]>([]);
  const [tags, setTags] = useState<TagView[]>([]);
  const [interestLevels, setInterestLevels] = useState<InterestLevelView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!dataAccess) return;

    console.log('[useLeadsData] fetchAll iniciado');

    try {
      setLoading(true);
      setError(null);

      const [leadsData, originsData, stagesData, tagsData, levelsData] = await Promise.allSettled([
        dataAccess.getLeads(),
        dataAccess.getLeadOrigins(),
        dataAccess.getPipelineStages(),
        dataAccess.getTags(),
        dataAccess.getInterestLevels(),
      ]);

      if (leadsData.status === 'fulfilled') {
        const mappedLeads = (leadsData.value as DbLead[]).map(toLeadView);
        console.log('[useLeadsData] Leads carregados:', mappedLeads.length);
        setLeads(mappedLeads);
        console.log('[useLeadsData] Estado local atualizado:', mappedLeads.length, 'leads');
      } else {
        console.error('[useLeadsData] Erro leads:', leadsData.reason);
        setError('Erro ao carregar leads');
      }

      if (originsData.status === 'fulfilled') {
        setOrigins((originsData.value as OriginView[]).map(o => o.name));
      }
      if (stagesData.status === 'fulfilled') {
        const mappedStages = (stagesData.value as any[]).map(s => ({
          id: s.id,
          name: s.name,
          order: s.sort_order ?? 0,
        }));
        console.log('[useLeadsData] Stages carregados:', mappedStages.length);
        setPipelineStages(mappedStages);
      }
      if (tagsData.status === 'fulfilled') {
        setTags((tagsData.value as any[]).map(t => ({
          id: t.id,
          name: t.name,
          color: t.color || '',
        })));
      }
      if (levelsData.status === 'fulfilled') {
        setInterestLevels((levelsData.value as any[]).map(l => ({
          id: l.id,
          value: l.value,
          label: l.label,
        })));
      }
    } catch (err) {
      console.error('[useLeadsData] Erro em fetchAll:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [dataAccess]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const deleteLead = useCallback(async (leadId: string) => {
    if (!dataAccess) return;
    try {
      await dataAccess.deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (err) {
      console.error('[useLeadsData] Erro ao deletar:', err);
      throw err;
    }
  }, [dataAccess]);

  const updateLead = useCallback(async (leadId: string, updates: Partial<LeadView>) => {
    if (!dataAccess) {
      console.warn('[useLeadsData] updateLead ignorado: dataAccess indisponível', { leadId, updates });
      return;
    }

    try {
      console.log('[useLeadsData] updateLead chamado:', { leadId, updates });

      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.instagram !== undefined) dbUpdates.instagram = updates.instagram;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.rg !== undefined) dbUpdates.rg = updates.rg;
      if (updates.cpf !== undefined) dbUpdates.cpf = updates.cpf;
      if (updates.entryDate !== undefined) dbUpdates.entry_date = updates.entryDate;
      if (updates.origin !== undefined) dbUpdates.origin = updates.origin;
      if (updates.interestLevel !== undefined) dbUpdates.interest_level = updates.interestLevel;
      if (updates.mainInterest !== undefined) dbUpdates.main_interest = updates.mainInterest;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.customData !== undefined) dbUpdates.custom_data = updates.customData;
      if (updates.pipelineStage !== undefined) dbUpdates.pipeline_stage = updates.pipelineStage;
      if (updates.responsible !== undefined) dbUpdates.responsible = updates.responsible;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.dealValue !== undefined) dbUpdates.deal_value = updates.dealValue;

      console.log('[useLeadsData] Payload para update no banco:', { leadId, dbUpdates });

      const result = await dataAccess.updateLead(leadId, dbUpdates);
      console.log('[useLeadsData] Lead atualizado no banco:', result);

      console.log('[useLeadsData] 🔄 Chamando fetchAll() para sincronizar...');
      await fetchAll();
      console.log('[useLeadsData] ✅ fetchAll() completado - dados sincronizados');

      return result;
    } catch (err) {
      console.error('[useLeadsData] ❌ Erro ao atualizar lead:', err);
      await fetchAll();
      throw err;
    }
  }, [dataAccess, fetchAll]);

  const addLead = useCallback(async (leadData: Partial<LeadView>) => {
    if (!dataAccess) return;
    try {
      const dbData: Record<string, unknown> = {
        name: leadData.name || '',
        phone: leadData.phone || '',
        email: leadData.email || '',
        instagram: leadData.instagram || '',
        city: leadData.city || '',
        rg: leadData.rg || '',
        cpf: leadData.cpf || '',
        entry_date: leadData.entryDate || new Date().toISOString().split('T')[0],
        origin: leadData.origin || '',
        interest_level: leadData.interestLevel || 'frio',
        main_interest: leadData.mainInterest || '',
        tags: leadData.tags || [],
        custom_data: leadData.customData || {},
        pipeline_stage: leadData.pipelineStage || '1',
        responsible: leadData.responsible || '',
        notes: leadData.notes || '',
        deal_value: leadData.dealValue ?? null,
      };

      const created = await dataAccess.createLead(dbData);
      setLeads(prev => [toLeadView(created as DbLead), ...prev]);
    } catch (err) {
      console.error('[useLeadsData] Erro ao criar:', err);
      throw err;
    }
  }, [dataAccess]);

  return {
    leads, origins, pipelineStages, tags, interestLevels,
    loading, error,
    addLead, updateLead, deleteLead,
    refetch: fetchAll,
  };
}
