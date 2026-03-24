import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { useBotconversaConfig } from '@/hooks/useBotconversaConfig';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BotconversaSettingsProps {
  organizationId: string;
  organizationName: string;
}

export const BotconversaSettings = ({
  organizationId,
  organizationName,
}: BotconversaSettingsProps) => {
  console.log('[BotconversaSettings] Renderizando com org:', organizationId, organizationName);

  const { config, loading, error, saveConfig, deleteConfig } = useBotconversaConfig(organizationId);
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    console.log('[BotconversaSettings] Config carregada:', config?.id, 'Loading:', loading);
    if (config) {
      setApiKey(config.api_key || '');
      setIsEditing(false);
    }
  }, [config]);

  const handleSave = async () => {
    console.log('[BotconversaSettings] Clicou em Salvar');
    setSaving(true);
    const success = await saveConfig(apiKey);
    setSaving(false);

    if (success) {
      toast.success('Chave salva com sucesso!');
      setIsEditing(false);
    } else {
      toast.error(error || 'Erro ao salvar');
    }
  };

  const handleDelete = async () => {
    console.log('[BotconversaSettings] Clicou em Deletar');
    if (!confirm('Remover chave API?')) return;

    const success = await deleteConfig();
    if (success) {
      toast.success('Chave removida');
      setApiKey('');
    } else {
      toast.error(error || 'Erro ao remover');
    }
  };

  if (loading && !config) {
    console.log('[BotconversaSettings] Renderizando loading state');
    return (
      <div className="p-6 text-center text-muted-foreground">
        Carregando configurações...
      </div>
    );
  }

  if (error && !config) {
    console.log('[BotconversaSettings] Renderizando error state:', error);
    return (
      <div className="p-6 border rounded-lg bg-card">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar configurações: {error}
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Recarregar Página
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card">
      <div>
        <h3 className="font-semibold text-lg">🤖 Botconversa</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Organização: <strong>{organizationName}</strong>
        </p>
      </div>

      {!isEditing && config ? (
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Chave API</Label>
            <div className="mt-2 p-3 bg-muted rounded font-mono text-sm break-all">
              {apiKey.substring(0, 8)}...{apiKey.substring(apiKey.length - 8)}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              disabled={isSaving}
            >
              Editar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="api-key">Chave API (UUID)</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="74d7277a-5a29-407c-8b89-f250acfa428a"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-2 font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving || !apiKey.trim()}>
              {isSaving ? 'Salvando...' : 'Salvar Chave'}
            </Button>
            {config && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setApiKey(config.api_key || '');
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
