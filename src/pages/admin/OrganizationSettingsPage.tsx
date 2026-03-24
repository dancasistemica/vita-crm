import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const CRON_URL = 'https://yelawymcltqewpkwsxxb.supabase.co/functions/v1/send-scheduled-messages';
const CRON_SCHEDULE_MINUTES = 5;
const ACTIVE_WINDOW_MINUTES = 10;

const maskToken = (token: string | null) => {
  if (!token) return '';
  if (token.length <= 8) return token;
  return `${'*'.repeat(token.length - 8)}${token.slice(-8)}`;
};

export default function OrganizationSettingsPage() {
  const { organizationId } = useOrganization();
  const { role, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [botconversaKey, setBotconversaKey] = useState('');
  const [botconversaConfigId, setBotconversaConfigId] = useState<string | null>(null);
  const [botconversaSaving, setBotconversaSaving] = useState(false);
  const [botconversaStatus, setBotconversaStatus] = useState<'none' | 'valid' | 'invalid'>('none');
  const [botconversaInvalidSource, setBotconversaInvalidSource] = useState<'previous' | 'current' | null>(null);
  const [botconversaLoading, setBotconversaLoading] = useState(false);
  const [savedApiKey, setSavedApiKey] = useState('');

  const canManage = role === 'admin' || role === 'superadmin';

  const fetchCronData = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .maybeSingle();

      if (error) throw error;
      const org = data as any;
      setToken(org?.cron_secret_token ?? null);
      setLastExecution(org?.last_cron_execution ?? null);
    } catch {
      toast.error('Erro ao carregar configurações do cron');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!organizationId) return;
    fetchCronData();
  }, [organizationId]);

  const fetchBotconversaConfig = async () => {
    if (!organizationId) return;
    setBotconversaLoading(true);
    try {
      const { data, error } = await supabase
        .from('botconversa_config')
        .select('id, api_key')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setBotconversaConfigId(data?.id ?? null);
      setBotconversaKey('');

      const apiKey = data?.api_key?.trim() ?? '';

      if (!apiKey) {
        if (data?.id) {
          await supabase
            .from('botconversa_config')
            .delete()
            .eq('id', data.id);
        } else {
          await supabase
            .from('botconversa_config')
            .delete()
            .eq('organization_id', organizationId)
            .or('api_key.is.null,api_key.eq.');
        }

        setBotconversaConfigId(null);
        setBotconversaStatus('none');
        setBotconversaInvalidSource(null);
        setSavedApiKey('');
        return;
      }

      const isValid = await validateBotconversaKey(apiKey);

      if (!isValid) {
        await supabase
          .from('botconversa_config')
          .delete()
          .eq('id', data?.id ?? '');
        setBotconversaConfigId(null);
        setBotconversaStatus('invalid');
        setBotconversaInvalidSource('previous');
        setSavedApiKey('');
        return;
      }

      setBotconversaStatus('valid');
      setBotconversaInvalidSource(null);
      setSavedApiKey(apiKey);
      console.log('[BotconversaConfig] Status:', {
        hasConfig: !!data,
        status: getStatusMessage(data),
      });
    } catch {
      toast.error('Erro ao carregar configuração do Botconversa');
      setBotconversaStatus('none');
      setBotconversaInvalidSource(null);
      setSavedApiKey('');
    } finally {
      setBotconversaLoading(false);
    }
  };

  useEffect(() => {
    if (!organizationId) return;
    fetchBotconversaConfig();
  }, [organizationId]);

  const maskedToken = useMemo(() => maskToken(token), [token]);

  const getStatusMessage = (config?: { api_key?: string | null } | null) => {
    const key = config?.api_key?.trim() ?? '';
    if (!key) return 'Nenhuma chave configurada';
    return 'Chave configurada';
  };

  const lastExecutionDate = useMemo(() => {
    if (!lastExecution) return null;
    const date = new Date(lastExecution);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [lastExecution]);

  const nextExecutionDate = useMemo(() => {
    if (!lastExecutionDate) return null;
    return new Date(lastExecutionDate.getTime() + CRON_SCHEDULE_MINUTES * 60 * 1000);
  }, [lastExecutionDate]);

  const isActive = useMemo(() => {
    if (!lastExecutionDate) return false;
    return Date.now() - lastExecutionDate.getTime() <= ACTIVE_WINDOW_MINUTES * 60 * 1000;
  }, [lastExecutionDate]);

  const cronJobUrl = useMemo(() => {
    if (!token) return '';
    const schedule = encodeURIComponent('*/5 * * * *');
    const headers = encodeURIComponent(`Authorization: Bearer ${token}`);
    return `https://cron-job.org/en/members/jobs/create?url=${encodeURIComponent(CRON_URL)}&schedule=${schedule}&headers=${headers}`;
  }, [token]);

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

  const handleSaveBotconversaKey = async () => {
    if (!organizationId) return;
    const trimmedKey = botconversaKey.trim();
    console.log('[BotconversaSettings] Salvando chave:', {
      hasKey: !!trimmedKey,
      keyLength: trimmedKey.length,
    });
    if (!trimmedKey) {
      if (botconversaStatus !== 'valid') {
        setBotconversaStatus('invalid');
        setBotconversaInvalidSource('current');
      }
      setBotconversaKey('');
      setSavedApiKey('');
      toast.error('Chave API inválida');
      return;
    }

    setBotconversaSaving(true);
    const isValid = await validateBotconversaKey(trimmedKey);

    if (!isValid) {
      setBotconversaSaving(false);
      if (botconversaStatus !== 'valid') {
        setBotconversaStatus('invalid');
        setBotconversaInvalidSource('current');
      }
      setBotconversaKey('');
      setSavedApiKey('');
      toast.error('Chave API inválida');
      return;
    }

    try {
      if (botconversaConfigId) {
        const { error } = await supabase
          .from('botconversa_config')
          .update({
            api_key: trimmedKey,
            updated_at: new Date().toISOString(),
          })
          .eq('id', botconversaConfigId);

        if (error) throw error;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const createdBy = userData.user?.id;

        const { data, error } = await supabase
          .from('botconversa_config')
          .insert({
            organization_id: organizationId,
            api_key: trimmedKey,
            created_by: createdBy,
          })
          .select('id')
          .single();

        if (error) throw error;
        setBotconversaConfigId(data?.id ?? null);
      }

      console.log('[BotconversaConfig] Chave salva:', {
        organizationId,
        hasApiKey: !!trimmedKey,
        apiKeyLength: trimmedKey.length,
      });

      const { data: config } = await supabase
        .from('botconversa_config')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      const safeConfig = config
        ? {
            ...config,
            api_key: config.api_key ? '[REDACTED]' : config.api_key,
          }
        : config;

      console.log('[BotconversaConfig] Dados do banco:', safeConfig);
      console.log('[BotconversaConfig] Status:', {
        hasConfig: !!config,
        status: getStatusMessage(config),
      });

      const persistedKey = config?.api_key?.trim() ?? '';
      setSavedApiKey(persistedKey);

      setBotconversaStatus('valid');
      setBotconversaInvalidSource(null);
      setBotconversaKey('');
      toast.success('Chave salva com sucesso!');
    } catch {
      if (botconversaStatus !== 'valid') {
        setBotconversaStatus('invalid');
        setBotconversaInvalidSource('current');
      }
      setBotconversaKey('');
      setSavedApiKey('');
      toast.error('Chave API inválida');
    } finally {
      setBotconversaSaving(false);
    }
  };

  const handleActivateAutomation = () => {
    console.log('[BotconversaSettings] handleActivateAutomation chamado');
    if (!cronJobUrl) {
      toast.error('Token do cron não encontrado');
      return;
    }
    window.open(cronJobUrl, '_blank', 'noopener,noreferrer');
    toast.success("Abrindo Cron-Job.org... Clique em 'Create' para ativar");
  };

  const handleCopy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Token copied!');
    } catch {
      toast.error('Erro ao copiar token');
    }
  };

  const handleRegenerate = async () => {
    if (!organizationId) return;
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-cron-secret-token', {
        body: { organization_id: organizationId },
      });

      if (error) throw error;

      if (data?.token) {
        setToken(data.token);
      } else {
        await fetchCronData();
      }

      toast.success('Token regenerated successfully');
    } catch {
      toast.error('Erro ao regenerar token');
    } finally {
      setRegenerating(false);
      setConfirmOpen(false);
    }
  };

  if (roleLoading) {
    return <div className="py-10 text-muted-foreground">Carregando...</div>;
  }

  if (!canManage) {
    return <div className="py-10 text-muted-foreground">Acesso restrito.</div>;
  }

  if (!organizationId) {
    return <div className="py-10 text-muted-foreground">Nenhuma organização selecionada.</div>;
  }

  const showActivateButton = botconversaConfigId !== undefined && botconversaConfigId !== null;
  const botconversaError = null;
  console.log('[BotconversaSettings] Estado antes de renderizar:', {
    configId: botconversaConfigId,
    showButton: showActivateButton,
    loading: botconversaLoading,
    error: botconversaError,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cron Job Configuration</CardTitle>
          <CardDescription>Gerencie o token e status do cron de mensagens agendadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Cron Secret Token</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                readOnly
                value={loading ? 'Carregando...' : maskedToken || '—'}
                className="font-mono"
              />
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button variant="outline" onClick={handleCopy} disabled={!token || loading}>
                  Copy
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmOpen(true)}
                  disabled={!token || loading || regenerating}
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-medium">Instruções para Cron-Job.org</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>1. Go to https://cron-job.org</p>
              <p>2. Create new cron job with:</p>
              <p className="pl-3">URL: {CRON_URL}</p>
              <p className="pl-3">Schedule: Every 5 minutes</p>
              <p className="pl-3">Headers: Authorization: Bearer [TOKEN]</p>
              <p>3. Save and test</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase text-muted-foreground">Last execution</p>
              <p className="mt-1 text-sm">
                {lastExecutionDate ? lastExecutionDate.toLocaleString('pt-BR') : '—'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase text-muted-foreground">Next execution (estimated)</p>
              <p className="mt-1 text-sm">
                {nextExecutionDate ? nextExecutionDate.toLocaleString('pt-BR') : '—'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase text-muted-foreground">Status</p>
              <div className="mt-2">
                <Badge className={isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Regenerate token</AlertDialogTitle>
              <AlertDialogDescription>
                This will invalidate the current token. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRegenerate} disabled={regenerating}>
                {regenerating ? 'Regenerating...' : 'Regenerate'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Botconversa Configuration</CardTitle>
          <CardDescription>Salve a chave API e ative a automação de envios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="botconversa-api-key">Chave API do Botconversa</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                id="botconversa-api-key"
                type="password"
                placeholder="Cole sua chave API aqui"
                value={botconversaKey}
                onChange={(event) => setBotconversaKey(event.target.value)}
                className="font-mono"
                disabled={botconversaLoading}
              />
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button onClick={handleSaveBotconversaKey} disabled={botconversaSaving || botconversaLoading}>
                  {botconversaSaving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    'Salvar'
                  )}
                </Button>
                {/* TESTE: Botão sempre visível */}
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={handleActivateAutomation}
                  disabled={botconversaLoading}
                >
                  Ativar Automação
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Badge
              className={
                botconversaStatus === 'valid'
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : botconversaStatus === 'invalid'
                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                    : 'bg-amber-100 text-amber-700 border-amber-200'
              }
            >
              {botconversaStatus === 'valid'
                ? '✓ Chave configurada'
                : botconversaStatus === 'invalid'
                  ? botconversaInvalidSource === 'previous'
                    ? '✗ Chave anterior inválida'
                    : '✗ Chave inválida'
                  : '⚠️ Nenhuma chave configurada'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
