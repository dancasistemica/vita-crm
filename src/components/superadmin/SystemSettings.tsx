import { Accordion, Button, Card, Input, Label, Select, Slider } from "@/components/ui/ds";
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Upload, Trash2, Info, Palette, Image, Type } from 'lucide-react';

interface SystemSettingsMap {
  system_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  sidebar_bg_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  font_family: string;
  logo_size: string;
  logo_size_desktop: string;
  logo_size_mobile: string;
  // Advanced colors
  color_hover: string;
  color_active: string;
  color_selected_bg: string;
  color_selected_text: string;
  color_text_primary: string;
  color_text_secondary: string;
  color_background: string;
  color_card_bg: string;
  color_border: string;
  color_success: string;
  color_warning: string;
  color_error: string;
  color_info: string;
  color_button_text: string;
  color_sidebar_text: string;
  color_sidebar_hover: string;
  color_sidebar_selected: string;
}

const DEFAULTS: SystemSettingsMap = {
  system_name: 'Vita CRM',
  primary_color: '#C4707A',
  secondary_color: '#F3E8FF',
  accent_color: '#C026D3',
  sidebar_bg_color: '#1e1e2e',
  logo_url: null,
  favicon_url: null,
  font_family: 'DM Sans',
  logo_size: '32',
  logo_size_desktop: '40',
  logo_size_mobile: '32',
  color_hover: '#6d28d9',
  color_active: '#5b21b6',
  color_selected_bg: '#ede9fe',
  color_selected_text: '#5b21b6',
  color_text_primary: '#111827',
  color_text_secondary: '#6b7280',
  color_background: '#f9fafb',
  color_card_bg: '#ffffff',
  color_border: '#e5e7eb',
  color_success: '#10b981',
  color_warning: '#f59e0b',
  color_error: '#ef4444',
  color_info: '#3b82f6',
  color_button_text: '#ffffff',
  color_sidebar_text: '#f3f4f6',
  color_sidebar_hover: '#4c1d95',
  color_sidebar_selected: '#7c3aed',
};

const FONTS = ['DM Sans', 'Inter', 'Poppins', 'Nunito'];

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettingsMap>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    console.log('[SystemSettings] Carregando configurações globais do sistema');
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value');
    if (error) {
      console.error('[SystemSettings] Erro:', error);
      toast.error('Erro ao carregar configurações do sistema');
      setLoading(false);
      return;
    }
    const map = { ...DEFAULTS };
    for (const row of (data || [])) {
      const key = row.setting_key as keyof SystemSettingsMap;
      if (key in map) {
        (map as any)[key] = row.setting_value;
      }
    }
    setSettings(map);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      }));
      console.log('[SystemSettings] Salvando configurações avançadas:', settingsToSave.length, 'campos');
      const { error } = await supabase
        .from('system_settings')
        .upsert(settingsToSave, { onConflict: 'setting_key' });
      if (error) throw error;
      toast.success('Configurações do sistema salvas com sucesso');
    } catch (e: any) {
      console.error('[SystemSettings] Erro ao salvar:', e);
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File, type: 'logo' | 'favicon') => {
    const allowedTypes = ['image/png', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use PNG, SVG ou WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx. 2MB)');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `system/${type}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('system-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('system-assets').getPublicUrl(path);
      const urlWithCache = `${publicUrl}?t=${Date.now()}`;
      const key = type === 'logo' ? 'logo_url' : 'favicon_url';
      setSettings(prev => ({ ...prev, [key]: urlWithCache }));
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} carregado!`);
    } catch (e: any) {
      toast.error('Erro no upload: ' + (e.message || 'Tente novamente'));
    } finally {
      setUploading(false);
    }
  };

  const updateSetting = useCallback((key: keyof SystemSettingsMap, value: string | null) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info card */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Configurações padrão globais.</strong> Cada organização pode substituir individualmente logo, favicon, nome e cores básicas. As cores avançadas (hover, tipografia, layout, feedback) são exclusivas do SuperAdmin e aplicam-se globalmente.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Identity */}
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-2">
                <Image className="h-5 w-5" /> Identidade do Sistema
              </h2>
            </div>
            <div>
              <div>
                <Label>Nome do Sistema</Label>
                <Input
                  value={settings.system_name}
                  onChange={e => updateSetting('system_name', e.target.value)}
                  placeholder="Vita CRM"
                  className="mt-1"
                />
              </div>

              {/* Logo upload */}
              <div>
                <Label>Logo do Sistema</Label>
                <p className="text-xs text-neutral-500 mb-2">PNG, SVG ou WebP (máx. 2MB)</p>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0], 'logo'); }}
                  onClick={() => logoRef.current?.click()}
                >
                  <input ref={logoRef} type="file" accept="image/png,image/svg+xml,image/webp" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'logo'); e.target.value = ''; }} />
                  {settings.logo_url ? (
                    <div className="space-y-3">
                      <div className="flex justify-center gap-4">
                        <div className="p-4 rounded-lg bg-card border">
                          <img src={settings.logo_url} alt="Logo claro" className="h-10 object-contain" />
                        </div>
                        <div className="p-4 rounded-lg bg-sidebar border">
                          <img src={settings.logo_url} alt="Logo escuro" className="h-10 object-contain" />
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500">Clique ou arraste para trocar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-8 w-8 mx-auto text-neutral-500" />
                      <p className="text-sm text-neutral-500">Clique ou arraste a logo aqui</p>
                    </div>
                  )}
                </div>
                {settings.logo_url && (
                  <Button variant="ghost" size="sm" onClick={() => updateSetting('logo_url', null)} className="text-destructive mt-2">
                    <Trash2 className="h-4 w-4 mr-1" /> Remover logo
                  </Button>
                )}
                {settings.logo_url && (
                  <div className="mt-3 space-y-4">
                    <Label className="text-sm font-medium">Tamanho da Logomarca</Label>
                    
                    {/* Desktop */}
                    <div className="space-y-1">
                      <Label className="text-xs text-neutral-500">🖥️ Desktop</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[Number(settings.logo_size_desktop) || 40]}
                          onValueChange={([v]) => {
                            console.log('[SystemSettings] Salvando logo_size_desktop:', v);
                            updateSetting('logo_size_desktop', String(v));
                          }}
                          min={24}
                          max={200}
                          step={4}
                          className="flex-1"
                        />
                        <span className="text-sm text-neutral-500 w-12 text-right">{settings.logo_size_desktop || '40'}px</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-500">
                        <span>24px</span><span>200px</span>
                      </div>
                      {Number(settings.logo_size_desktop) > 120 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">⚠️ Logo grande pode afetar o layout em telas médias</p>
                      )}
                    </div>

                    {/* Mobile */}
                    <div className="space-y-1">
                      <Label className="text-xs text-neutral-500">📱 Mobile</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[Number(settings.logo_size_mobile) || 32]}
                          onValueChange={([v]) => {
                            console.log('[SystemSettings] Salvando logo_size_mobile:', v);
                            updateSetting('logo_size_mobile', String(v));
                          }}
                          min={20}
                          max={80}
                          step={4}
                          className="flex-1"
                        />
                        <span className="text-sm text-neutral-500 w-12 text-right">{settings.logo_size_mobile || '32'}px</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-500">
                        <span>20px</span><span>80px</span>
                      </div>
                      {Number(settings.logo_size_mobile) > 56 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">⚠️ Logo grande pode comprimir outros elementos no mobile</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Favicon upload */}
              <div>
                <Label>Favicon do Sistema (32x32px)</Label>
                <p className="text-xs text-neutral-500 mb-2">PNG, ICO ou SVG</p>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors inline-block"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0], 'favicon'); }}
                  onClick={() => faviconRef.current?.click()}
                >
                  <input ref={faviconRef} type="file" accept="image/png,image/x-icon,image/svg+xml,image/vnd.microsoft.icon" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'favicon'); e.target.value = ''; }} />
                  {settings.favicon_url ? (
                    <div className="flex items-center gap-3">
                      <img src={settings.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
                      <span className="text-xs text-neutral-500">Clique para trocar</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-neutral-500" />
                      <span className="text-sm text-neutral-500">Upload favicon</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Basic Colors */}
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-2">
                <Palette className="h-5 w-5" /> Cores Padrão do Sistema
              </h2>
            </div>
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SystemColorPicker label="Cor Primária" description="Botões e elementos de destaque"
                  value={settings.primary_color} onChange={v => updateSetting('primary_color', v)} />
                <SystemColorPicker label="Cor Secundária" description="Backgrounds suaves"
                  value={settings.secondary_color} onChange={v => updateSetting('secondary_color', v)} />
                <SystemColorPicker label="Cor de Destaque" description="Tags e badges"
                  value={settings.accent_color} onChange={v => updateSetting('accent_color', v)} />
                <SystemColorPicker label="Cor de Fundo do Menu Lateral" description="Background do sidebar"
                  value={settings.sidebar_bg_color} onChange={v => {
                    console.log('[SystemSettings] Salvando sidebar_bg_color:', v);
                    updateSetting('sidebar_bg_color', v);
                  }} />
              </div>
            </div>
          </Card>

          {/* Advanced Colors */}
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-2">
                <Palette className="h-5 w-5" /> Cores Avançadas do Sistema
              </h2>
            </div>
            <div>
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 mb-4">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Estas cores são <strong>exclusivas do SuperAdmin</strong> e aplicam-se globalmente a todo o sistema. Organizações não podem sobrescrevê-las.
                </p>
              </div>

              <Accordion type="multiple" defaultValue={['brand', 'selected', 'typography', 'layout', 'sidebar', 'feedback']}>
                {/* Brand Colors */}
                <AccordionItem value="brand">
                  <AccordionTrigger className="text-sm font-medium">🎨 Cores de Marca</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SystemColorPicker label="Cor de Hover" description="Efeito ao passar o mouse"
                        value={settings.color_hover} onChange={v => updateSetting('color_hover', v)} />
                      <SystemColorPicker label="Cor Ativa/Clicada" description="Efeito ao clicar"
                        value={settings.color_active} onChange={v => updateSetting('color_active', v)} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Selected */}
                <AccordionItem value="selected">
                  <AccordionTrigger className="text-sm font-medium">📋 Seção Selecionada</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SystemColorPicker label="Fundo Selecionado" description="Background de itens selecionados"
                        value={settings.color_selected_bg} onChange={v => updateSetting('color_selected_bg', v)} />
                      <SystemColorPicker label="Texto Selecionado" description="Cor do texto quando selecionado"
                        value={settings.color_selected_text} onChange={v => updateSetting('color_selected_text', v)} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Typography */}
                <AccordionItem value="typography">
                  <AccordionTrigger className="text-sm font-medium">🔤 Tipografia</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SystemColorPicker label="Texto Principal" description="Cor principal dos textos"
                        value={settings.color_text_primary} onChange={v => updateSetting('color_text_primary', v)} />
                      <SystemColorPicker label="Texto Secundário" description="Textos de apoio e legendas"
                        value={settings.color_text_secondary} onChange={v => updateSetting('color_text_secondary', v)} />
                      <SystemColorPicker label="Texto dos Botões" description="Cor do texto nos botões primários"
                        value={settings.color_button_text} onChange={v => updateSetting('color_button_text', v)} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Layout */}
                <AccordionItem value="layout">
                  <AccordionTrigger className="text-sm font-medium">🏗️ Layout e Estrutura</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SystemColorPicker label="Fundo da Página" description="Cor de fundo geral"
                        value={settings.color_background} onChange={v => updateSetting('color_background', v)} />
                      <SystemColorPicker label="Fundo dos Cards" description="Background dos cartões"
                        value={settings.color_card_bg} onChange={v => updateSetting('color_card_bg', v)} />
                      <SystemColorPicker label="Cor das Bordas" description="Bordas e divisórias"
                        value={settings.color_border} onChange={v => updateSetting('color_border', v)} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Sidebar */}
                <AccordionItem value="sidebar">
                  <AccordionTrigger className="text-sm font-medium">🗂️ Menu Lateral</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SystemColorPicker label="Texto do Menu" description="Cor dos textos na sidebar"
                        value={settings.color_sidebar_text} onChange={v => updateSetting('color_sidebar_text', v)} />
                      <SystemColorPicker label="Hover do Menu" description="Efeito ao passar sobre itens"
                        value={settings.color_sidebar_hover} onChange={v => updateSetting('color_sidebar_hover', v)} />
                      <SystemColorPicker label="Item Selecionado" description="Item ativo no menu"
                        value={settings.color_sidebar_selected} onChange={v => updateSetting('color_sidebar_selected', v)} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Feedback */}
                <AccordionItem value="feedback">
                  <AccordionTrigger className="text-sm font-medium">🚦 Feedback e Status</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SystemColorPicker label="Sucesso" description="Ações concluídas com êxito"
                        value={settings.color_success} onChange={v => updateSetting('color_success', v)} />
                      <SystemColorPicker label="Aviso" description="Alertas e atenção"
                        value={settings.color_warning} onChange={v => updateSetting('color_warning', v)} />
                      <SystemColorPicker label="Erro" description="Falhas e erros"
                        value={settings.color_error} onChange={v => updateSetting('color_error', v)} />
                      <SystemColorPicker label="Informação" description="Dicas e informações"
                        value={settings.color_info} onChange={v => updateSetting('color_info', v)} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </Card>

          {/* Typography */}
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-2">
                <Type className="h-5 w-5" /> Tipografia Padrão
              </h2>
            </div>
            <div>
              <Label>Fonte do Sistema</Label>
              <Select value={settings.font_family} onValueChange={v => updateSetting('font_family', v)}>
                <SelectTrigger className="w-full max-w-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map(f => (
                    <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-700">Preview do sistema</h3>
          <Card className="overflow-hidden">
            <div className="p-4 rounded-t-lg" style={{ backgroundColor: settings.sidebar_bg_color.startsWith('#') ? settings.sidebar_bg_color : `hsl(${settings.sidebar_bg_color})` }}>
              <div className="flex items-center gap-3 mb-4">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="h-8 object-contain" />
                ) : (
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: settings.primary_color, color: '#fff' }}>⚙</div>
                )}
                <span className="text-sm font-medium" style={{ color: settings.color_sidebar_text }}>
                  {settings.system_name || 'Vita CRM'}
                </span>
              </div>
              <div className="space-y-1">
                {['Dashboard', 'Leads', 'Funil de Vendas'].map((item, i) => (
                  <div key={item} className={`px-3 py-1.5 rounded text-xs ${i === 0 ? 'font-medium' : ''}`}
                    style={{
                      backgroundColor: i === 0 ? settings.color_sidebar_selected : 'transparent',
                      color: i === 0 ? settings.color_sidebar_text : settings.color_sidebar_text + '99',
                    }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-xs" style={{ color: settings.color_text_secondary }}>Botão primário</p>
              <Button variant="secondary" size="sm" className="px-4 py-2 rounded-md text-sm font-medium"
                style={{ backgroundColor: settings.primary_color, color: settings.color_button_text }}>
                Salvar alterações
              </Button>
              <div className="flex gap-3 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: settings.accent_color }}>Tag 1</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: settings.secondary_color }}>Tag 2</span>
              </div>
              <div className="flex gap-3 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: settings.color_success }}>✓ Sucesso</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: settings.color_warning }}>⚠ Aviso</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: settings.color_error }}>✕ Erro</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: settings.color_info }}>ℹ Info</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || uploading} className="min-h-[44px] gap-3">
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações do Sistema'}
        </Button>
      </div>
    </div>
  );
}

function SystemColorPicker({ label, description, value, onChange }: {
  label: string; description: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <p className="text-xs text-neutral-500">{description}</p>
      <div className="flex items-center gap-3 mt-1">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border cursor-pointer p-0.5" />
        <Input value={value} onChange={e => onChange(e.target.value)}
          className="h-9 w-28 font-mono text-xs uppercase" maxLength={7} />
      </div>
    </div>
  );
}
