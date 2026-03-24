import { useEffect, useMemo, useState } from 'react';
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
  const { config, loading, error, saveConfig, deleteConfig } = useBotconversaConfig(organizationId);

  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setApiKey(config.api_key || '');
      setIsEditing(false);
    }
  }, [config]);

  const maskedKey = useMemo(() => {
    const value = apiKey.trim();
    if (!value) return '••••••••';
    if (value.length <= 8) return '••••••••';
    return `${value.slice(0, 6)}••••••••${value.slice(-4)}`;
  }, [apiKey]);

  const handleSave = async () => {
    setSaving(true);
    const success = await saveConfig(apiKey);
    setSaving(false);

    if (success) {
      toast.success('Chave API salva com sucesso!');
      setIsEditing(false);
    } else {
      toast.error(error || 'Erro ao salvar chave API');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover a chave API do Botconversa?')) {
      return;
    }

    const success = await deleteConfig();
    if (success) {
      toast.success('Chave removida');
      setApiKey('');
    } else {
      toast.error(error || 'Erro ao remover chave');
    }
  };

  if (loading && !config) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold">🤖 Botconversa</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Organização: <strong>{organizationName}</strong>
        </p>
      </div>

      {!isEditing && config ? (
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Chave API</Label>
            <div className="mt-2 break-all rounded bg-muted px-3 py-3 font-mono text-sm">
              {maskedKey}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              disabled={isSaving}
              className="min-h-[44px]"
            >
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
              className="min-h-[44px]"
            >
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
              placeholder="Exemplo: 74d7277a-5a29-407c-8b89-f250acfa428a"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-2 h-11 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Cole sua chave API UUID do Botconversa
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleSave}
              disabled={isSaving || !apiKey.trim()}
              className="min-h-[44px]"
            >
              {isSaving ? 'Salvando...' : 'Salvar Chave'}
            </Button>
            {config && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setApiKey(config.api_key || '');
                }}
                className="min-h-[44px]"
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="rounded bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
        <p className="mb-2 font-semibold">💡 Como usar:</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>Cole sua chave API UUID do Botconversa acima</li>
          <li>Clique em "Salvar Chave"</li>
          <li>Pronto! Agora você pode agendar mensagens WhatsApp</li>
        </ol>
      </div>
    </div>
  );
};
