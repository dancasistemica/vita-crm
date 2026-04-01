import { useEffect, useMemo, useState } from 'react';
import { Loader, AlertCircle, Info } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Label,
} from '@/components/ui/ds';
import { toast } from 'sonner';

const CRON_URL = 'https://yelawymcltqewpkwsxxb.supabase.co/functions/v1/send-scheduled-messages';
const CRON_SCHEDULE_MINUTES = 5;
const ACTIVE_WINDOW_MINUTES = 10;

const maskToken = (token: string | null) => {
  if (!token) return '';
  if (token.length <= 8) return token;
  return `${'*'.repeat(token.length - 8)}${token.slice(-8)}`;
};

interface BotconversaSettingsProps {
  organizationId: string | null;
  organizationName?: string | null;
  cronSecretToken?: string | null;
}

const BotconversaSettings = ({ organizationId, organizationName }: BotconversaSettingsProps) => {
  const [botconversaKey, setBotconversaKey] = useState('');
  const [botconversaConfigId, setBotconversaConfigId] = useState<string | null>(null);
  const [botconversaSaving, setBotconversaSaving] = useState(false);
  const [botconversaStatus, setBotconversaStatus] = useState<'none' | 'valid' | 'invalid'>('none');
  const [botconversaInvalidSource, setBotconversaInvalidSource] = useState<'previous' | 'current' | null>(null);
  const [botconversaLoading, setBotconversaLoading] = useState(false);

  const validateBotconversaKey = async (apiKey: string) => {
    try {
      const response = await fetch('https://api.botconversa.com.br/v1/account/info', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const fetchBotconversaConfig = async () => {
    if (!organizationId) return;
    setBotconversaLoading(true);
    try {
      const { data, error } = await supabase
        .from('botconversa_config')
        .select('id, api_key')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setBotconversaConfigId(data?.id ?? null);
      const apiKey = data?.api_key?.trim() ?? '';

      if (!apiKey) {
        if (data?.id) await supabase.from('botconversa_config').delete().eq('id', data.id);
        setBotconversaConfigId(null);
        setBotconversaStatus('none');
        return;
      }

      const isValid = await validateBotconversaKey(apiKey);
      if (!isValid) {
        await supabase.from('botconversa_config').delete().eq('id', data?.id ?? '');
        setBotconversaConfigId(null);
        setBotconversaStatus('invalid');
        setBotconversaInvalidSource('previous');
        return;
      }

      setBotconversaStatus('valid');
    } catch {
      toast.error('Erro ao carregar configuração do Botconversa');
      setBotconversaStatus('none');
    } finally {
      setBotconversaLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) fetchBotconversaConfig();
  }, [organizationId]);

  const handleSaveBotconversaKey = async () => {
    if (!organizationId) return;
    const trimmedKey = botconversaKey.trim();
    if (!trimmedKey) {
      setBotconversaStatus('invalid');
      setBotconversaInvalidSource('current');
      toast.error('Chave API inválida');
      return;
    }

    setBotconversaSaving(true);
    const isValid = await validateBotconversaKey(trimmedKey);

    if (!isValid) {
      setBotconversaSaving(false);
      setBotconversaStatus('invalid');
      setBotconversaInvalidSource('current');
      toast.error('Chave API inválida');
      return;
    }

    try {
      if (botconversaConfigId) {
        await supabase.from('botconversa_config').update({ api_key: trimmedKey, updated_at: new Date().toISOString() }).eq('id', botconversaConfigId);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        await supabase.from('botconversa_config').insert({ organization_id: organizationId, api_key: trimmedKey, created_by: userData.user?.id });
      }
      setBotconversaStatus('valid');
      toast.success('Chave salva com sucesso!');
    } catch {
      toast.error('Erro ao salvar chave');
    } finally {
      setBotconversaSaving(false);
    }
  };

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold mb-2">Botconversa Configuration</h2>
        <p className="text-sm text-neutral-500 mb-4">Organização: {organizationName}</p>
      </div>
      <div className="space-y-3">
        <Label>Chave API do Botconversa</Label>
        <Input type="password" value={botconversaKey} onChange={(e) => setBotconversaKey(e.target.value)} disabled={botconversaLoading} />
        <Button onClick={handleSaveBotconversaKey} disabled={botconversaSaving}>Salvar</Button>
      </div>
    </Card>
  );
};

export default function OrganizationSettingsPage() {
  const { organizationId } = useOrganization();
  const { role, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canManage = role === 'admin' || role === 'superadmin';

  const fetchCronData = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('organizations').select('*').eq('id', organizationId).maybeSingle();
      if (error) throw error;
      setToken(data?.cron_secret_token ?? null);
      setLastExecution(data?.last_cron_execution ?? null);
    } catch {
      toast.error('Erro ao carregar configurações do cron');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) fetchCronData();
  }, [organizationId]);

  const maskedToken = useMemo(() => maskToken(token), [token]);
  const lastExecutionDate = useMemo(() => lastExecution ? new Date(lastExecution) : null, [lastExecution]);
  const nextExecutionDate = useMemo(() => lastExecutionDate ? new Date(lastExecutionDate.getTime() + CRON_SCHEDULE_MINUTES * 60 * 1000) : null, [lastExecutionDate]);
  const isActive = useMemo(() => lastExecutionDate ? Date.now() - lastExecutionDate.getTime() <= ACTIVE_WINDOW_MINUTES * 60 * 1000 : false, [lastExecutionDate]);

  const handleCopy = async () => {
    if (token) {
      await navigator.clipboard.writeText(token);
      toast.success('Token copiado!');
    }
  };

  const handleRegenerate = async () => {
    if (!organizationId) return;
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-cron-secret-token', { body: { organization_id: organizationId } });
      if (error) throw error;
      if (data?.token) setToken(data.token);
      else await fetchCronData();
      toast.success('Token regenerado');
    } catch {
      toast.error('Erro ao regenerar token');
    } finally {
      setRegenerating(false);
      setConfirmOpen(false);
    }
  };

  if (roleLoading || loading) return <div className="py-10 text-neutral-500">Carregando...</div>;
  if (!canManage) return <div className="py-10 text-neutral-500">Acesso restrito.</div>;
  if (!organizationId) return <div className="py-10 text-neutral-500">Nenhuma organização selecionada.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-2">Cron Job Configuration</h2>
          <p className="text-sm text-neutral-500 mb-4">Gerencie o token e status do cron de mensagens agendadas</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Cron Secret Token</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input readOnly value={maskedToken || '—'} className="font-mono" />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleCopy} disabled={!token}>Copy</Button>
                <Button variant="error" onClick={() => setConfirmOpen(true)} disabled={!token || regenerating}>Regenerate</Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">Instruções para Cron-Job.org</p>
            <div className="text-sm text-neutral-500 space-y-1">
              <p>1. Go to https://cron-job.org</p>
              <p>2. Create new cron job with:</p>
              <p className="pl-3">URL: {CRON_URL}</p>
              <p className="pl-3">Schedule: Every 5 minutes</p>
              <p className="pl-3">Headers: Authorization: Bearer [TOKEN]</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase text-neutral-500">Last execution</p>
              <p className="mt-1 text-sm">{lastExecutionDate ? lastExecutionDate.toLocaleString('pt-BR') : '—'}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase text-neutral-500">Next execution</p>
              <p className="mt-1 text-sm">{nextExecutionDate ? nextExecutionDate.toLocaleString('pt-BR') : '—'}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase text-neutral-500">Status</p>
              <div className="mt-2">
                <Badge variant={isActive ? 'success' : 'neutral'}>{isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <Card variant="default" padding="lg" className="w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-2">Regenerate Token?</h2>
            <p className="text-sm text-neutral-600 mb-6">This will invalidate the current token. Continue?</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
              <Button variant="error" className="flex-1" onClick={handleRegenerate} disabled={regenerating}>
                {regenerating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
