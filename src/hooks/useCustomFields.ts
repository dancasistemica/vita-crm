import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface CustomFieldDef {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options: string[] | null;
  is_required: boolean;
  display_order: number;
}

export function useCustomFields() {
  const { organizationId } = useOrganization();
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    supabase
      .from('custom_fields')
      .select('id, field_name, field_label, field_type, field_options, is_required, display_order')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('display_order')
      .then(({ data, error }) => {
        if (!error && data) {
          setCustomFields(data as unknown as CustomFieldDef[]);
        }
        setLoading(false);
      });
  }, [organizationId]);

  return { customFields, loading };
}
