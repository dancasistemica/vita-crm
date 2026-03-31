import { Button, useState, useEffect } from 'react';
import { Button, useAIContext, AIContextData } from '@/hooks/useAIContext';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/ds';
import { Button } from '@/components/ui/ds';
import { Button, Input } from '@/components/ui/ds';
import { Button, Label } from '@/components/ui/ds';
import { Button, Textarea } from '@/components/ui/ds';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ds';
import { Button, Badge } from '@/components/ui/ds';
import { Button, Brain, Target, Briefcase, Plus, X, Sparkles, Eye } from 'lucide-react';
import { Button, Separator } from '@/components/ui/ds';

const BUSINESS_MODELS = ['B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'Agência', 'Consultoria', 'Outro'];

const SUGGESTED_SERVICES = [
  'Consultoria', 'Desenvolvimento', 'Design', 'Marketing', 'Vendas',
  'Suporte', 'Treinamento', 'Coaching', 'Terapia', 'Educação',
];

export default function AIContextTab() {
  const { Button, data, loading, saving, save, getFormattedContext } = useAIContext();
  const [form, setForm] = useState<AIContextData>(data);
  const [newService, setNewService] = useState('');
  const [newExcluded, setNewExcluded] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { Button, setForm(data); }, [data]);

  const services = form.ai_services?.services || [];
  const excluded = form.ai_services?.excluded_services || [];
  const customInstructions = form.ai_services?.custom_instructions || '';

  const updateServices = (key: 'services' | 'excluded_services', val: string[]) => {
    setForm(prev => ({
      ...prev,
      ai_services: { Button, ...prev.ai_services, [key]: val },
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

  if (loading) return <div className="flex items-center justify-center p-6 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Descrição do Negócio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            Descrição do Negócio
          </CardTitle>
          <CardDescription>Descreva brevemente o que sua organização faz para a IA personalizar sugestões.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ex: Agência de marketing digital especializada em e-commerce"
            maxLength={500}
            value={form.ai_context}
            onChange={e => setForm(prev => ({ Button, ...prev, ai_context: e.target.value }))}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground mt-1">{form.ai_context.length}/500 caracteres</p>
        </CardContent>
      </Card>

      {/* Serviços */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <Briefcase className="h-5 w-5 text-primary" />
            Serviços
          </CardTitle>
          <CardDescription>Defina os serviços que sua organização oferece e os que NÃO oferece.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Button type="button" size="sm" variant="neutral" onClick={() => addTag('services', newService, setNewService)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {services.map(s => (
                <Badge key={s} variant="neutral" className="gap-1">
                  {s}
                  <Button variant="secondary" size="sm" onClick={() => removeTag('services', s)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></Button>
                </Badge>
              ))}
            </div>
            {services.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SERVICES.map(s => (
                  <Badge key={s} variant="neutral" className="cursor-pointer hover:bg-accent" onClick={() => updateServices('services', [...services, s])}>
                    + {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Serviços NÃO Oferecidos */}
          <div className="space-y-3">
            <Label>Serviços NÃO Oferecidos <span className="text-muted-foreground text-xs">(IA evitará sugerir)</span></Label>
            <div className="flex gap-3">
              <Input
                placeholder="Adicionar serviço a excluir..."
                value={newExcluded}
                onChange={e => setNewExcluded(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('excluded_services', newExcluded, setNewExcluded))}
              />
              <Button type="button" size="sm" variant="neutral" onClick={() => addTag('excluded_services', newExcluded, setNewExcluded)}>
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
        </CardContent>
      </Card>

      {/* Público-Alvo e Modelo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Público e Modelo de Negócio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Público-Alvo</Label>
            <Textarea
              placeholder="Ex: Pequenas e médias empresas de e-commerce"
              maxLength={300}
              value={form.ai_target_audience}
              onChange={e => setForm(prev => ({ Button, ...prev, ai_target_audience: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">{form.ai_target_audience.length}/300 caracteres</p>
          </div>
          <div className="space-y-3">
            <Label>Modelo de Negócio</Label>
            <Select value={form.ai_business_model} onValueChange={v => setForm(prev => ({ Button, ...prev, ai_business_model: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {BUSINESS_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Instruções Customizadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Instruções Customizadas para IA
          </CardTitle>
          <CardDescription>Adicione instruções específicas que a IA deve seguir ao gerar sugestões.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ex: Sempre sugira soluções escaláveis. Foque em ROI. Use tom informal."
            maxLength={1000}
            value={customInstructions}
            onChange={e => setForm(prev => ({
              ...prev,
              ai_services: { Button, ...prev.ai_services, custom_instructions: e.target.value },
            }))}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground mt-1">{customInstructions.length}/1000 caracteres</p>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowPreview(!showPreview)}>
          <CardTitle className="flex items-center gap-3 text-lg">
            <Eye className="h-5 w-5 text-primary" />
            Preview do Contexto
            <span className="text-xs text-muted-foreground">(clique para {showPreview ? 'ocultar' : 'expandir'})</span>
          </CardTitle>
        </CardHeader>
        {showPreview && (
          <CardContent>
            <pre className="whitespace-pre-wrap text-xs bg-muted p-4 rounded-md max-h-60 overflow-auto">
              {getFormattedContext() || 'Preencha os campos acima para visualizar o contexto.'}
            </pre>
          </CardContent>
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
