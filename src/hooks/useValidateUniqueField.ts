import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type TableName = 'lead_origins' | 'interest_levels' | 'pipeline_stages';
type ColumnName = 'name' | 'value';

export const useValidateUniqueField = (
  tableName: TableName,
  organizationId: string,
  columnName: ColumnName = 'name'
) => {
  const [existingValues, setExistingValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExistingValues = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from(tableName)
        .select(columnName)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('[ValidateUniqueField] Erro ao carregar:', error);
      }

      const values = (data || [])
        .map((item: Record<string, any>) => String(item[columnName] || '').toLowerCase())
        .filter(Boolean);
      setExistingValues(values);
      setLoading(false);
      console.log(`[ValidateUniqueField] ${tableName} carregados:`, data?.length || 0);
    };

    if (organizationId) {
      loadExistingValues();
    }
  }, [tableName, organizationId, columnName]);

  const isUnique = (value: string): boolean => {
    return !existingValues.includes(value.toLowerCase());
  };

  const validate = (value: string): { valid: boolean; error?: string } => {
    const normalized = value.trim();
    console.log('[ValidateUniqueField] Validando:', normalized);

    if (!normalized) {
      return { valid: false, error: 'Campo obrigatório' };
    }

    if (!isUnique(normalized)) {
      return { valid: false, error: 'Este valor já existe. Escolha outro.' };
    }

    return { valid: true };
  };

  return { isUnique, validate, existingValues, loading };
};
