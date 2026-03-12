import { useState, useRef, useCallback } from 'react';
import { useBrand, DEFAULT_BRAND, BrandSettings } from '@/contexts/BrandContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Trash2, RotateCcw, Save, Palette, Image, Type } from 'lucide-react';

const PALETTES = [
  { name: 'Rosa Terapêutico', primary: '#C4707A', secondary: '#F3E8FF', accent: '#C026D3' },
  { name: 'Terra e Movimento', primary: '#B45309', secondary: '#FEF3C7', accent: '#D97706' },
  { name: 'Oceano e Cura', primary: '#0891B2', secondary: '#E0F2FE', accent: '#0E7490' },
];

const FONTS = ['DM Sans', 'Inter', 'Poppins', 'Nunito'];

export default function CustomizePage() {
  const { brand, saveBrand, resetBrand, updateLocalBrand } = useBrand();
  const { organizationId } = useOrganization();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = useCallback((key: keyof BrandSettings, value: string) => {
    updateLocalBrand({ [key]: value });
  }, [updateLocalBrand]);

  const handlePalette = useCallback((palette: typeof PALETTES[0]) => {
    updateLocalBrand({
      primary_color: palette.primary,
      secondary_color: palette.secondary,
      accent_color: palette.accent,
    });
  }, [updateLocalBrand]);

  const handleUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (!organizationId) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx. 2MB)');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${organizationId}/${type}.${ext}`;
      const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
      const urlWithCache = `${publicUrl}?t=${Date.now()}`;
      const key = type === 'logo' ? 'logo_url' : 'favicon_url';
      updateLocalBrand({ [key]: urlWithCache });
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} carregado!`);
    } catch (e: any) {
      toast.error('Erro no upload: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    updateLocalBrand({ logo_url: null });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBrand(brand);
      toast.success('Personalização salva com sucesso ✨');
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Restaurar todas as configurações visuais para o padrão?')) return;
    setSaving(true);
    try {
      await resetBrand();
      toast.success('Configurações restauradas');
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">🎨 Personalizar</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-1" /> Restaurar padrões
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Image className="h-5 w-5" /> Logomarca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logo principal</Label>
                <p className="text-xs text-muted-foreground mb-2">PNG, SVG ou WebP, fundo transparente recomendado (máx. 2MB)</p>
                <div className="flex gap-3 items-center">
                  <input ref={logoInputRef} type="file" accept=".png,.svg,.webp" className="hidden"
                    onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')} />
                  <Button variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploading}>
                    <Upload className="h-4 w-4 mr-1" /> Upload logo
                  </Button>
                  {brand.logo_url && (
                    <Button variant="ghost" size="sm" onClick={removeLogo} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  )}
                </div>
                {brand.logo_url && (
                  <div className="flex gap-4 mt-3">
                    <div className="p-4 rounded-lg bg-card border">
                      <img src={brand.logo_url} alt="Logo claro" className="h-10 object-contain" />
                    </div>
                    <div className="p-4 rounded-lg bg-sidebar border">
                      <img src={brand.logo_url} alt="Logo escuro" className="h-10 object-contain" />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label>Nome da organização</Label>
                <Input
                  value={brand.org_display_name || ''}
                  onChange={e => updateLocalBrand({ org_display_name: e.target.value || null })}
                  placeholder="Exibido quando sem logo"
                />
              </div>
              <div>
                <Label>Favicon (32x32px)</Label>
                <input ref={faviconInputRef} type="file" accept=".png,.ico,.svg" className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'favicon')} />
                <Button variant="outline" size="sm" onClick={() => faviconInputRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-1" /> Upload favicon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Colors Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Palette className="h-5 w-5" /> Cores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorPicker label="Cor Primária" description="Botões e elementos de destaque"
                  value={brand.primary_color} onChange={v => handleColorChange('primary_color', v)} />
                <ColorPicker label="Cor Secundária" description="Backgrounds suaves e hovers"
                  value={brand.secondary_color} onChange={v => handleColorChange('secondary_color', v)} />
                <ColorPicker label="Cor de Destaque" description="Tags, chips e badges"
                  value={brand.accent_color} onChange={v => handleColorChange('accent_color', v)} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Paletas prontas</Label>
                <div className="flex flex-wrap gap-3">
                  {PALETTES.map(p => (
                    <button key={p.name} onClick={() => handlePalette(p)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:border-primary transition-colors bg-card">
                      <div className="flex gap-1">
                        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: p.primary }} />
                        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: p.secondary }} />
                        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: p.accent }} />
                      </div>
                      <span className="text-xs font-medium">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Type className="h-5 w-5" /> Tipografia</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Fonte do CRM</Label>
              <Select value={brand.font_family} onValueChange={v => updateLocalBrand({ font_family: v })}>
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

        {/* Right: Live Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Preview ao vivo</h3>

          {/* Sidebar preview */}
          <Card className="overflow-hidden">
            <div className="p-4 rounded-t-lg" style={{ backgroundColor: `hsl(${brand.sidebar_color})` }}>
              <div className="flex items-center gap-2 mb-4">
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt="Logo" className="h-8 object-contain" />
                ) : (
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: brand.primary_color, color: '#fff' }}>💃</div>
                )}
                <span className="text-sm font-medium" style={{ color: '#d4d4d8' }}>
                  {brand.org_display_name || 'Meu CRM'}
                </span>
              </div>
              <div className="space-y-1">
                {['Dashboard', 'Leads', 'Pipeline'].map((item, i) => (
                  <div key={item} className={`px-3 py-1.5 rounded text-xs ${i === 0 ? 'font-medium' : ''}`}
                    style={{
                      backgroundColor: i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: i === 0 ? brand.primary_color : '#a1a1aa',
                    }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Lead card preview */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Card de lead</p>
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Maria Silva</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: brand.accent_color }}>Quente</span>
                </div>
                <p className="text-xs text-muted-foreground">Interessada em dança terapêutica</p>
              </div>
            </CardContent>
          </Card>

          {/* Button preview */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Botão primário</p>
              <button className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: brand.primary_color }}>
                Salvar alterações
              </button>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: brand.accent_color }}>Tag 1</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: brand.secondary_color }}>Tag 2</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({ label, description, value, onChange }: {
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
