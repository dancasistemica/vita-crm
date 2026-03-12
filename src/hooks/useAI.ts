import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAIContext } from '@/hooks/useAIContext';
import { toast } from 'sonner';

interface UseAIOptions {
  type: string;
  cacheKey?: string;
  cacheDurationHours?: number;
}

interface UseAIReturn {
  response: string | null;
  loading: boolean;
  error: string | null;
  generate: (userMessage: string) => Promise<string | null>;
  regenerate: () => Promise<string | null>;
  clear: () => void;
}

export function useAI({ type, cacheKey, cacheDurationHours = 24 }: UseAIOptions): UseAIReturn {
  const { organizationId } = useOrganization();
  const { getFormattedContext } = useAIContext();
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string>('');

  const checkCache = useCallback(async (): Promise<string | null> => {
    if (!cacheKey || !organizationId) return null;
    try {
      const { data } = await supabase
        .from('ai_cache')
        .select('response, expires_at')
        .eq('organization_id', organizationId)
        .eq('cache_key', cacheKey)
        .maybeSingle();

      if (data && new Date(data.expires_at) > new Date()) {
        return data.response;
      }
      // Clean expired
      if (data) {
        await supabase.from('ai_cache').delete().eq('organization_id', organizationId).eq('cache_key', cacheKey);
      }
      return null;
    } catch {
      return null;
    }
  }, [cacheKey, organizationId]);

  const saveCache = useCallback(async (content: string) => {
    if (!cacheKey || !organizationId) return;
    try {
      const expiresAt = new Date(Date.now() + cacheDurationHours * 60 * 60 * 1000).toISOString();
      await supabase.from('ai_cache').upsert({
        organization_id: organizationId,
        cache_key: cacheKey,
        response: content,
        expires_at: expiresAt,
      }, { onConflict: 'organization_id,cache_key' });
    } catch {
      // Cache save failure is non-critical
    }
  }, [cacheKey, organizationId, cacheDurationHours]);

  const generate = useCallback(async (userMessage: string): Promise<string | null> => {
    setLastMessage(userMessage);
    setError(null);
    setLoading(true);

    try {
      // Check cache first
      const cached = await checkCache();
      if (cached) {
        setResponse(cached);
        setLoading(false);
        return cached;
      }

      const { data, error: fnError } = await supabase.functions.invoke('crm-ai', {
        body: {
          type,
          messages: [{ role: 'user', content: userMessage }],
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const content = data?.content || '';
      setResponse(content);
      await saveCache(content);
      return content;
    } catch (err: any) {
      const msg = err.message || 'Erro ao gerar resposta IA';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [type, checkCache, saveCache]);

  const regenerate = useCallback(async (): Promise<string | null> => {
    if (!lastMessage) return null;
    // Clear cache for regeneration
    if (cacheKey && organizationId) {
      await supabase.from('ai_cache').delete().eq('organization_id', organizationId).eq('cache_key', cacheKey);
    }
    return generate(lastMessage);
  }, [lastMessage, generate, cacheKey, organizationId]);

  const clear = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return { response, loading, error, generate, regenerate, clear };
}
