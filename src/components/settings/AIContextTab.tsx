import { Badge, Button, Card, Input, Label, Select, Separator, Textarea } from "@/components/ui/ds";
import { useState, useEffect } from 'react';
import { useAIContext, AIContextData } from '@/hooks/useAIContext';
import { Brain, Target, Briefcase, Plus, X, Sparkles, Eye } from 'lucide-react';

const BUSINESS_MODELS = ['B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'Agência', 'Consultoria', 'Outro'];

const SUGGESTED_SERVICES = [
  'Consultoria', 'Desenvolvimento', 'Design', 'Marketing', 'Vendas',
  'Suporte', 'Treinamento', 'Coaching', 'Terapia', 'Educação',
];

export default function AIContextTab() {
  const { data, loading, saving, save, getFormattedContext } = useAIContext();
  const [form, setForm] = useState<AIContextData>(data);
  const [newService, setNewService] = useState('');
  const [newExcluded, setNewExcluded] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { setForm(data); }, [data]);

  const services = form.ai_services?.services || [];
  const excluded = form.ai_services?.excluded_services || [];
  const customInstructions = form.ai_services?.custom_instructions || '';

  const updateServices = (key: 'services' | 'excluded_services', val: string[]) => {
    setForm(prev => ({
      ...prev,
      ai_services: { ...prev.ai_services, [key]: val },
    }));
  };

  const addTag = (key: 'services' | 'excluded_services', value: string, setter: (v: string) => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const current = form.ai_services?.[key] || [];
    if (!current.includes(trimmed)) {
      updateServices(key, [...current, trimmed]);
    }
    setter('');
  };

  const removeTag = (key: 'services' | 'excluded_services', value: string) => {
    const current = form.ai_services?.[key] || [];
    updateServices(key, current.filter(s => s !== value));
  };

  if (loading) return <div className="flex items-center justify-center p-6 text-neutral-500">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Descrição do Negócio */}
      <Card>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-2">
            <Brain className="h-5 w-5 text-primary" />
            Descrição do Negócio
          </h2>
          <p className="text-sm text-neutral-500 mb-4">Descreva brevemente o que sua organização faz para a IA personalizar sugestões.</p>
        </div>
        <div>
          <Textarea
            placeholder="Ex: Agência de marketing digital especializada em e-commerce"
            maxLength={500}
            value={form.ai_context}
            onChange={e => setForm(prev => ({ ...prev, ai_context: e.target.value }))}
            className="min-h-[100px]"
          />
          <p className="text-xs text-neutral-500 mt-1">{form.ai_context.length}/500 caracteres</p>
        </div>
      </Card>

      {/* Serviços */}
      <Card>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Serviços
          </h2>
          <p className="text-sm text-neutral-500 mb-4">Defina os serviços que sua organização oferece e os que NÃO oferece.</p>
        </div>
        <div>
          {/* Serviços Oferecidos */}
          <div className="space-y-3">
            <Label>Serviços Oferecidos</Label>
            <div className="flex gap-3">
              <Input
                placeholder="Adicionar serviço..."
                value={newService}
                onChange={e => setNewService(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('services', newService, setNewService))}
              />
              <Button type="button" size="sm" variant="secondary" onClick={() => addTag('services', newService, setNewService)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {services.map(s => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  <Button variant="secondary" size="sm" onClick={() => removeTag('services', s)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></Button>
                </Badge>
              ))}
            </div>
            {services.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SERVICES.map(s => (
                  <Badge key={s} variant="secondary" className="cursor-pointer hover:bg-accent" onClick={() => updateServices('services', [...services, s])}>
                    + {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Serviços NÃO Oferecidos */}
          <div className="space-y-3">
            <Label>Serviços NÃO Oferecidos <span className="text-neutral-500 text-xs">(IA evitará sugerir)</span></Label>
            <div className="flex gap-3">
              <Input
                placeholder="Adicionar serviço a excluir..."
                value={newExcluded}
                onChange={e => setNewExcluded(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('excluded_services', newExcluded, setNewExcluded))}
              />
              <Button type="button" size="sm" variant="secondary" onClick={() => addTag('excluded_services', newExcluded, setNewExcluded)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {excluded.map(s => (
                <Badge key={s} variant="error" className="gap-1">
                  {s}
                  <Button variant="secondary" size="sm" onClick={() => removeTag('excluded_services', s)} className="ml-1"><X className="h-3 w-3" /></Button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Público-Alvo e Modelo */}
      <Card>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-2">
            <Target className="h-5 w-5 text-primary" />
            Público e Modelo de Negócio
          </h2>
        </div>
        <div>
          <div className="space-y-3">
            <Label>Público-Alvo</Label>
            <Textarea
              placeholder="Ex: Pequenas e médias empresas de e-commerce"
              maxLength={300}
              value={form.ai_target_audience}
              onChange={e => setForm(prev => ({ ...prev, ai_target_audience: e.target.value }))}
            />
            <p className="text-xs text-neutral-500">{form.ai_target_audience.length}/300 caracteres</p>
          </div>
          <div className="space-y-3">
            <Label>Modelo de Negócio</Label>
            <Select value={form.ai_business_model} onValueChange={v => setForm(prev => ({ ...prev, ai_business_model: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {BUSINESS_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Instruções Customizadas */}
      <Card>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Instruções Customizadas para IA
          </h2>
          <p className="text-sm text-neutral-500 mb-4">Adicione instruções específicas que a IA deve seguir ao gerar sugestões.</p>
        </div>
        <div>
          <Textarea
            placeholder="Ex: Sempre sugira soluções escaláveis. Foque em ROI. Use tom informal."
            maxLength={1000}
            value={customInstructions}
            onChange={e => setForm(prev => ({
              ...prev,
              ai_services: { ...prev.ai_services, custom_instructions: e.target.value },
            }))}
            className="min-h-[100px]"
          />
          <p className="text-xs text-neutral-500 mt-1">{customInstructions.length}/1000 caracteres</p>
        </div>
      </Card>

      {/* Preview */}
      <Card>
        <div className="mb-4"> setShowPreview(!showPreview)}>
          <h2 className="text-2xl font-semibold mb-2">
            <Eye className="h-5 w-5 text-primary" />
            Preview do Contexto
            <span className="text-xs text-neutral-500">(clique para {showPreview ? 'ocultar' : 'expandir'})</span>
          </h2>
        </div>
        {showPreview && (
          <div>
            <pre className="whitespace-pre-wrap text-xs bg-muted p-4 rounded-md max-h-60 overflow-auto">
              {getFormattedContext() || 'Preencha os campos acima para visualizar o contexto.'}
            </pre>
          </div>
        )}
      </Card>

      {/* Salvar */}
      <div className="flex justify-end">
        <Button onClick={() => save(form)} disabled={saving}>
          {saving ? 'Salvando...' : '💾 Salvar Contexto da IA'}
        </Button>
      </div>
    </div>
  );
}
