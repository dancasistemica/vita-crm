import { Alert, Button, Card, Input, Label, Select, Slider } from "@/components/ui/ds";
import { useState, useRef, useCallback } from 'react';
import { useBrand, DEFAULT_BRAND, BrandSettings } from '@/contexts/BrandContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Trash2, RotateCcw, Save, Palette, Image, Type, Globe, Info } from 'lucide-react';

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
  const [globalConfirmOpen, setGlobalConfirmOpen] = useState(false);
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
    if (!organizationId) {
      toast.error('Organização não encontrada. Faça login novamente.');
      return;
    }
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
      const path = `${organizationId}/${type}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
      const urlWithCache = `${publicUrl}?t=${Date.now()}`;
      const key = type === 'logo' ? 'logo_url' : 'favicon_url';
      updateLocalBrand({ [key]: urlWithCache });
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} carregado com sucesso!`);
    } catch (e: any) {
      console.error('Upload error:', e);
      toast.error('Erro no upload: ' + (e.message || 'Tente novamente'));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'logo' | 'favicon') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file, type);
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

  const applyGlobalColors = async () => {
    console.log('[BrandCustomizer] Carregando cores globais do sistema');
    const { data: sysSettings } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['primary_color', 'secondary_color', 'accent_color', 'sidebar_bg_color']);
    const sysMap: Record<string, string> = {};
    for (const row of (sysSettings || [])) {
      sysMap[row.setting_key] = row.setting_value || '';
    }
    const globalColors: Partial<BrandSettings> = {
      primary_color: sysMap['primary_color'] || DEFAULT_BRAND.primary_color,
      secondary_color: sysMap['secondary_color'] || DEFAULT_BRAND.secondary_color,
      accent_color: sysMap['accent_color'] || DEFAULT_BRAND.accent_color,
      sidebar_color: sysMap['sidebar_bg_color']
        ? (sysMap['sidebar_bg_color'].startsWith('#') ? hexToHSLString(sysMap['sidebar_bg_color']) : sysMap['sidebar_bg_color'])
        : DEFAULT_BRAND.sidebar_color,
    };
    console.log('[BrandCustomizer] Cores globais aplicadas:', globalColors);
    updateLocalBrand(globalColors);
    toast.info('Cores globais aplicadas. Clique em Salvar para confirmar.');
    setGlobalConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-neutral-900">🎨 Personalizar</h1>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleReset} disabled={saving}>
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
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-2"><Image className="h-5 w-5" /> Logomarca</h2>
            </div>
            <div>
              <div>
                <Label>Logo principal</Label>
                <p className="text-xs text-neutral-500 mb-2">PNG, SVG ou WebP, fundo transparente recomendado (máx. 2MB)</p>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, 'logo')}
                  onClick={() => logoInputRef.current?.click()}
                >
                  <input ref={logoInputRef} type="file" accept="image/png,image/svg+xml,image/webp" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'logo'); e.target.value = ''; }} />
                  {brand.logo_url ? (
                    <div className="space-y-3">
                      <div className="flex justify-center gap-4">
                        <div className="p-4 rounded-lg bg-card border">
                          <img src={brand.logo_url} alt="Logo claro" className="h-10 object-contain" />
                        </div>
                        <div className="p-4 rounded-lg bg-sidebar border">
                          <img src={brand.logo_url} alt="Logo escuro" className="h-10 object-contain" />
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
                {brand.logo_url && (
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeLogo(); }} className="text-destructive mt-2">
                    <Trash2 className="h-4 w-4 mr-1" /> Remover logo
                  </Button>
                )}
                {brand.logo_url && (
                  <div className="mt-3 space-y-4">
                    <Label className="text-sm font-medium">Tamanho da Logomarca</Label>
                    
                    {/* Desktop */}
                    <div className="space-y-1">
                      <Label className="text-xs text-neutral-500">🖥️ Desktop</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[brand.logo_size_desktop]}
                          onValueChange={([v]) => {
                            console.log('[BrandCustomizer] Salvando logo_size_desktop da org:', v);
                            updateLocalBrand({ logo_size_desktop: v });
                          }}
                          min={24}
                          max={200}
                          step={4}
                          className="flex-1"
                        />
                        <span className="text-sm text-neutral-500 w-12 text-right">{brand.logo_size_desktop}px</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-500">
                        <span>24px</span><span>200px</span>
                      </div>
                      {brand.logo_size_desktop > 120 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">⚠️ Logo grande pode afetar o layout em telas médias</p>
                      )}
                    </div>

                    {/* Mobile */}
                    <div className="space-y-1">
                      <Label className="text-xs text-neutral-500">📱 Mobile</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[brand.logo_size_mobile]}
                          onValueChange={([v]) => {
                            console.log('[BrandCustomizer] Salvando logo_size_mobile da org:', v);
                            updateLocalBrand({ logo_size_mobile: v });
                          }}
                          min={20}
                          max={80}
                          step={4}
                          className="flex-1"
                        />
                        <span className="text-sm text-neutral-500 w-12 text-right">{brand.logo_size_mobile}px</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-500">
                        <span>20px</span><span>80px</span>
                      </div>
                      {brand.logo_size_mobile > 56 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">⚠️ Logo grande pode comprimir outros elementos no mobile</p>
                      )}
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
                <p className="text-xs text-neutral-500 mb-2">PNG, ICO ou SVG</p>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors inline-block"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, 'favicon')}
                  onClick={() => faviconInputRef.current?.click()}
                >
                  <input ref={faviconInputRef} type="file" accept="image/png,image/x-icon,image/svg+xml,image/vnd.microsoft.icon" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'favicon'); e.target.value = ''; }} />
                  {brand.favicon_url ? (
                    <div className="flex items-center gap-3">
                      <img src={brand.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
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

          {/* Colors Section */}
          <Card>
            <div className="mb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-semibold mb-2"><Palette className="h-5 w-5" /> Cores</h2>
                <Button variant="secondary" size="sm" className="min-h-[44px] gap-3" onClick={() => setGlobalConfirmOpen(true)}>
                  <Globe className="h-4 w-4" /> Usar Cores Globais
                </Button>
              </div>
            </div>
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorPicker label="Cor Primária" description="Botões e elementos de destaque"
                  value={brand.primary_color} onChange={v => handleColorChange('primary_color', v)} />
                <ColorPicker label="Cor Secundária" description="Backgrounds suaves e hovers"
                  value={brand.secondary_color} onChange={v => handleColorChange('secondary_color', v)} />
                <ColorPicker label="Cor de Destaque" description="Tags, chips e badges"
                  value={brand.accent_color} onChange={v => handleColorChange('accent_color', v)} />
                <SidebarColorPicker
                  label="Fundo do Menu Lateral"
                  description="Cor de fundo da sidebar"
                  hslValue={brand.sidebar_color}
                  onChange={v => {
                    console.log('[BrandCustomizer] Salvando sidebarBgColor:', v);
                    updateLocalBrand({ sidebar_color: v });
                  }}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Paletas prontas</Label>
                <div className="flex flex-wrap gap-3">
                  {PALETTES.map(p => (
                    <Button variant="secondary" size="sm" key={p.name} onClick={() => handlePalette(p)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg border hover:border-primary transition-colors bg-card">
                      <div className="flex gap-1">
                        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: p.primary }} />
                        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: p.secondary }} />
                        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: p.accent }} />
                      </div>
                      <span className="text-xs font-medium">{p.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
              {/* Info about global colors */}
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-3 mt-4">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  ℹ️ As demais cores do sistema (hover, tipografia, layout, feedback) seguem o padrão global definido nas Configurações do Sistema pelo SuperAdmin.
                </p>
              </div>
            </div>
          </Card>

          {/* Typography Section */}
          <Card>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-2"><Type className="h-5 w-5" /> Tipografia</h2>
            </div>
            <div>
              <Label>Fonte do CRM</Label>
              <Select value={brand.font_family} onValueChange={v => updateLocalBrand({ font_family: v })}>
                
                  
                
                
                  {FONTS.map(f => (
                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                  ))}
                
              </Select>
            </div>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-700">Preview ao vivo</h3>

          {/* Sidebar preview */}
          <Card className="overflow-hidden">
            <div className="p-4 rounded-t-lg" style={{ backgroundColor: `hsl(${brand.sidebar_color})` }}>
              <div className="flex items-center gap-3 mb-4">
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
                {['Dashboard', 'Leads', 'Funil de Vendas'].map((item, i) => (
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
            <div>
              <p className="text-xs text-neutral-500">Card de lead</p>
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Maria Silva</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: brand.accent_color }}>Quente</span>
                </div>
                <p className="text-xs text-neutral-500">Interessada em dança terapêutica</p>
              </div>
            </div>
          </Card>

          {/* preview */}
          <Card>
            <div>
              <p className="text-xs text-neutral-500">Botão primário</p>
              <Button variant="secondary" size="sm" className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: brand.primary_color }}>
                Salvar alterações
              </Button>
              <div className="flex gap-3 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: brand.accent_color }}>Tag 1</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: brand.secondary_color }}>Tag 2</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Global Colors Confirmation */}
      {globalConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <Card variant="default" padding="lg" className="w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-2">Aplicar cores globais?</h2>
            <p className="text-sm text-neutral-600 mb-6">
              Isso substituirá as cores atuais da organização pelas cores globais do sistema. Deseja continuar?
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setGlobalConfirmOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={applyGlobalColors}>Aplicar Cores Globais</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ColorPicker({ label, description, value, onChange }: {
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

function hslStringToHex(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  if (parts.length < 3) return '#1e1e2e';
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHSLString(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '240 10% 10%';
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function SidebarColorPicker({ label, description, hslValue, onChange }: {
  label: string; description: string; hslValue: string; onChange: (hsl: string) => void;
}) {
  const hexValue = hslStringToHex(hslValue);
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <p className="text-xs text-neutral-500">{description}</p>
      <div className="flex items-center gap-3 mt-1">
        <input type="color" value={hexValue} onChange={e => onChange(hexToHSLString(e.target.value))}
          className="w-10 h-10 rounded-lg border cursor-pointer p-0.5" />
        <Input value={hexValue} onChange={e => {
          if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(hexToHSLString(e.target.value));
        }}
          className="h-9 w-28 font-mono text-xs uppercase" maxLength={7} />
      </div>
    </div>
  );
}
