import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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
      const entries = Object.entries(settings) as [string, string | null][];
      for (const [key, value] of entries) {
        const { error } = await supabase
          .from('system_settings')
          .update({ setting_value: value, updated_at: new Date().toISOString() } as any)
          .eq('setting_key', key);
        if (error) throw error;
        console.log('[SystemSettings] Configurações salvas:', key);
      }
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
          <strong>Configurações padrão globais.</strong> Cada organização pode substituir individualmente logo, favicon, nome e cores nas configurações da própria organização.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="h-5 w-5" /> Identidade do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <p className="text-xs text-muted-foreground mb-2">PNG, SVG ou WebP (máx. 2MB)</p>
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
                      <p className="text-xs text-muted-foreground">Clique ou arraste para trocar</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Clique ou arraste a logo aqui</p>
                    </div>
                  )}
                </div>
                {settings.logo_url && (
                  <Button variant="ghost" size="sm" onClick={() => updateSetting('logo_url', null)} className="text-destructive mt-2">
                    <Trash2 className="h-4 w-4 mr-1" /> Remover logo
                  </Button>
                )}
                {settings.logo_url && (
                  <div className="mt-3 space-y-2">
                    <Label className="text-sm">Tamanho da Logomarca</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[Number(settings.logo_size) || 32]}
                        onValueChange={([v]) => {
                          console.log('[SystemSettings] Salvando logo_size global:', v);
                          updateSetting('logo_size', String(v));
                        }}
                        min={24}
                        max={200}
                        step={4}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12 text-right">{settings.logo_size || '32'}px</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>24px</span><span>200px</span>
                    </div>
                    {Number(settings.logo_size) > 120 && (
                      <p className="text-xs text-warning flex items-center gap-1 mt-1">⚠️ Logo grande pode afetar o layout em telas menores</p>
                    )}
                  </div>
                )}
              </div>

              {/* Favicon upload */}
              <div>
                <Label>Favicon do Sistema (32x32px)</Label>
                <p className="text-xs text-muted-foreground mb-2">PNG, ICO ou SVG</p>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors inline-block"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0], 'favicon'); }}
                  onClick={() => faviconRef.current?.click()}
                >
                  <input ref={faviconRef} type="file" accept="image/png,image/x-icon,image/svg+xml,image/vnd.microsoft.icon" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'favicon'); e.target.value = ''; }} />
                  {settings.favicon_url ? (
                    <div className="flex items-center gap-2">
                      <img src={settings.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
                      <span className="text-xs text-muted-foreground">Clique para trocar</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Upload favicon</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5" /> Cores Padrão do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Type className="h-5 w-5" /> Tipografia Padrão
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Preview do sistema</h3>
          <Card className="overflow-hidden">
            <div className="p-4 rounded-t-lg" style={{ backgroundColor: `hsl(${settings.sidebar_bg_color})` }}>
              <div className="flex items-center gap-2 mb-4">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="h-8 object-contain" />
                ) : (
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: settings.primary_color, color: '#fff' }}>⚙</div>
                )}
                <span className="text-sm font-medium" style={{ color: '#d4d4d8' }}>
                  {settings.system_name || 'Vita CRM'}
                </span>
              </div>
              <div className="space-y-1">
                {['Dashboard', 'Leads', 'Pipeline'].map((item, i) => (
                  <div key={item} className={`px-3 py-1.5 rounded text-xs ${i === 0 ? 'font-medium' : ''}`}
                    style={{
                      backgroundColor: i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: i === 0 ? settings.primary_color : '#a1a1aa',
                    }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Botão primário</p>
              <button className="px-4 py-2 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: settings.primary_color }}>
                Salvar alterações
              </button>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: settings.accent_color }}>Tag 1</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: settings.secondary_color }}>Tag 2</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || uploading} className="min-h-[44px] gap-2">
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
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex items-center gap-2 mt-1">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border cursor-pointer p-0.5" />
        <Input value={value} onChange={e => onChange(e.target.value)}
          className="h-9 w-28 font-mono text-xs uppercase" maxLength={7} />
      </div>
    </div>
  );
}
