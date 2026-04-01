import { Alert, AlertDialog, Badge, Button, Dialog, Input, Label, Select, Switch, Table, ToggleGroup } from "@/components/ui/ds";
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, X, Search, AlertTriangle, Globe } from 'lucide-react';

interface CustomField {
  id: string;
  organization_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options: string[] | null;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  name: string;
}

interface GlobalFieldSummary {
  field_name: string;
  field_label: string;
  field_type: string;
  field_options: string[] | null;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  org_count: number;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Seleção' },
  { value: 'textarea', label: 'Área de texto' },
  { value: 'checkbox', label: 'Checkbox' },
];

function toSnakeCase(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function CustomFieldsManager() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [scope, setScope] = useState<'specific' | 'all'>('specific');
  const [fields, setFields] = useState<CustomField[]>([]);
  const [globalFields, setGlobalFields] = useState<GlobalFieldSummary[]>([]);
  const [totalOrgs, setTotalOrgs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [editingGlobalField, setEditingGlobalField] = useState<GlobalFieldSummary | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
  const [deleteGlobalFieldName, setDeleteGlobalFieldName] = useState<string | null>(null);
  const [deleteGlobalFieldLabel, setDeleteGlobalFieldLabel] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (scope === 'specific' && selectedOrgId) fetchFields();
  }, [selectedOrgId, scope]);

  useEffect(() => {
    if (scope === 'all') fetchGlobalFields();
  }, [scope]);

  const fetchOrganizations = async () => {
    const { data } = await supabase.from('organizations').select('id, name').order('name');
    if (data) {
      setOrganizations(data);
      setTotalOrgs(data.length);
    }
  };

  const fetchFields = async () => {
    if (!selectedOrgId) return;
    setLoading(true);
    console.log('[CustomFieldsManager] Carregando campos da organização:', selectedOrgId);
    const { data, error } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('organization_id', selectedOrgId)
      .order('display_order');
    if (error) {
      console.error('[CustomFieldsManager] Erro ao carregar:', error);
      toast.error('Erro ao carregar campos customizados');
    } else {
      setFields((data as unknown as CustomField[]) || []);
    }
    setLoading(false);
  };

  const fetchGlobalFields = async () => {
    setLoading(true);
    console.log('[CustomFieldsManager] Escopo selecionado: all_organizations');
    const { data, error } = await supabase
      .from('custom_fields')
      .select('field_name, field_label, field_type, field_options, is_required, is_active, display_order, organization_id');
    if (error) {
      console.error('[CustomFieldsManager] Erro ao carregar campos globais:', error);
      toast.error('Erro ao carregar campos globais');
      setLoading(false);
      return;
    }

    const allFields = (data || []) as unknown as CustomField[];
    const grouped = new Map<string, { field: CustomField; orgIds: Set<string> }>();
    for (const f of allFields) {
      const existing = grouped.get(f.field_name);
      if (existing) {
        existing.orgIds.add(f.organization_id);
      } else {
        grouped.set(f.field_name, { field: f, orgIds: new Set([f.organization_id]) });
      }
    }

    const summaries: GlobalFieldSummary[] = Array.from(grouped.entries()).map(([, { field, orgIds }]) => ({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      field_options: field.field_options,
      is_required: field.is_required,
      is_active: field.is_active,
      display_order: field.display_order,
      org_count: orgIds.size,
    }));

    summaries.sort((a, b) => a.display_order - b.display_order);
    setGlobalFields(summaries);
    setLoading(false);
  };

  const resetForm = () => {
    setFieldLabel('');
    setFieldName('');
    setFieldType('text');
    setFieldOptions([]);
    setOptionInput('');
    setIsRequired(false);
    setIsActive(true);
    setEditingField(null);
    setEditingGlobalField(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (field: CustomField) => {
    setEditingField(field);
    setEditingGlobalField(null);
    setFieldLabel(field.field_label);
    setFieldName(field.field_name);
    setFieldType(field.field_type);
    setFieldOptions(Array.isArray(field.field_options) ? field.field_options : []);
    setIsRequired(field.is_required);
    setIsActive(field.is_active);
    setModalOpen(true);
  };

  const openEditGlobalModal = (field: GlobalFieldSummary) => {
    setEditingField(null);
    setEditingGlobalField(field);
    setFieldLabel(field.field_label);
    setFieldName(field.field_name);
    setFieldType(field.field_type);
    setFieldOptions(Array.isArray(field.field_options) ? field.field_options : []);
    setIsRequired(field.is_required);
    setIsActive(field.is_active);
    setModalOpen(true);
  };

  const handleLabelChange = (val: string) => {
    setFieldLabel(val);
    if (!editingField && !editingGlobalField) {
      setFieldName(toSnakeCase(val));
    }
  };

  const addOption = () => {
    const trimmed = optionInput.trim();
    if (trimmed && !fieldOptions.includes(trimmed)) {
      setFieldOptions([...fieldOptions, trimmed]);
      setOptionInput('');
    }
  };

  const removeOption = (opt: string) => {
    setFieldOptions(fieldOptions.filter(o => o !== opt));
  };

  const handleSave = async () => {
    if (!fieldLabel.trim() || !fieldName.trim()) return;
    setSaving(true);

    const options = fieldType === 'select' ? fieldOptions : null;

    if (scope === 'all') {
      if (editingGlobalField) {
        // Update across all orgs
        console.log('[CustomFieldsManager] Editando campo global:', fieldName);
        const { error } = await supabase
          .from('custom_fields')
          .update({
            field_label: fieldLabel,
            field_type: fieldType,
            field_options: options,
            is_required: isRequired,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('field_name', editingGlobalField.field_name);
        if (error) {
          toast.error('Erro ao atualizar campo global');
          console.error(error);
        } else {
          toast.success('Campo atualizado em todas as organizações');
        }
      } else {
        // Create in all orgs
        console.log('[CustomFieldsManager] Criando campo global:', fieldName, 'em', organizations.length, 'orgs');
        const maxOrder = globalFields.length > 0 ? Math.max(...globalFields.map(f => f.display_order)) + 1 : 0;
        const inserts = organizations.map(org => ({
          organization_id: org.id,
          field_name: fieldName,
          field_label: fieldLabel,
          field_type: fieldType,
          field_options: options,
          is_required: isRequired,
          is_active: true,
          display_order: maxOrder,
        }));
        const { error } = await supabase.from('custom_fields').insert(inserts as any);
        if (error) {
          toast.error('Erro ao criar campo global');
          console.error(error);
        } else {
          toast.success(`Campo criado em ${organizations.length} organizações`);
        }
      }
      fetchGlobalFields();
    } else {
      if (!selectedOrgId) { setSaving(false); return; }
      const payload = {
        organization_id: selectedOrgId,
        field_name: fieldName,
        field_label: fieldLabel,
        field_type: fieldType,
        field_options: options,
        is_required: isRequired,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (editingField) {
        const { error } = await supabase
          .from('custom_fields')
          .update(payload as any)
          .eq('id', editingField.id);
        if (error) {
          toast.error('Erro ao atualizar campo');
          console.error(error);
        } else {
          console.log('[CustomFieldsManager] Campo salvo:', fieldName);
          toast.success('Campo atualizado');
        }
      } else {
        const maxOrder = fields.length > 0 ? Math.max(...fields.map(f => f.display_order)) + 1 : 0;
        const { error } = await supabase
          .from('custom_fields')
          .insert({ ...payload, display_order: maxOrder } as any);
        if (error) {
          toast.error('Erro ao criar campo');
          console.error(error);
        } else {
          console.log('[CustomFieldsManager] Campo salvo:', fieldName);
          toast.success('Campo criado');
        }
      }
      fetchFields();
    }

    setSaving(false);
    setModalOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteFieldId) return;
    const { error } = await supabase.from('custom_fields').delete().eq('id', deleteFieldId);
    if (error) {
      toast.error('Erro ao remover campo');
    } else {
      console.log('[CustomFieldsManager] Campo removido:', deleteFieldId);
      toast.success('Campo removido');
      fetchFields();
    }
    setDeleteFieldId(null);
  };

  const handleDeleteGlobal = async () => {
    if (!deleteGlobalFieldName) return;
    console.log('[CustomFieldsManager] Excluindo campo global:', deleteGlobalFieldName);
    const { error } = await supabase
      .from('custom_fields')
      .delete()
      .eq('field_name', deleteGlobalFieldName);
    if (error) {
      toast.error('Erro ao remover campo global');
    } else {
      toast.success('Campo removido de todas as organizações');
      fetchGlobalFields();
    }
    setDeleteGlobalFieldName(null);
    setDeleteGlobalFieldLabel('');
  };

  const handleApplyToAll = async (field: GlobalFieldSummary) => {
    const { data: allFields } = await supabase
      .from('custom_fields')
      .select('organization_id')
      .eq('field_name', field.field_name);
    const existingOrgIds = new Set((allFields || []).map((f: any) => f.organization_id));
    const missingOrgs = organizations.filter(o => !existingOrgIds.has(o.id));

    if (missingOrgs.length === 0) {
      toast.info('Campo já existe em todas as organizações');
      return;
    }

    const inserts = missingOrgs.map(org => ({
      organization_id: org.id,
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      field_options: field.field_options,
      is_required: field.is_required,
      is_active: field.is_active,
      display_order: field.display_order,
    }));

    const { error } = await supabase.from('custom_fields').insert(inserts as any);
    if (error) {
      toast.error('Erro ao aplicar campo');
      console.error(error);
    } else {
      toast.success(`Campo aplicado em mais ${missingOrgs.length} organizações`);
      fetchGlobalFields();
    }
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...fields];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setFields(reordered);
    setDragIndex(index);
  };

  const handleDragEnd = async () => {
    setDragIndex(null);
    const updates = fields.map((f, i) =>
      supabase.from('custom_fields').update({ display_order: i } as any).eq('id', f.id)
    );
    await Promise.all(updates);
  };

  const filteredFields = fields.filter(f =>
    f.field_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.field_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGlobalFields = globalFields.filter(f =>
    f.field_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.field_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isGlobalMode = scope === 'all';

  return (
    <div className="space-y-4">
      {/* Scope toggle */}
      <div className="flex flex-col gap-3">
        <div>
          <Label className="mb-1.5 block">Escopo</Label>
          <ToggleGroup
            type="single"
            value={scope}
            onValueChange={(val) => { if (val) setScope(val as 'specific' | 'all'); }}
            className="justify-start"
          >
            <ToggleGroupItem value="specific" className="text-xs sm:text-sm px-3 min-h-[44px]">
              Organização específica
            </ToggleGroupItem>
            <ToggleGroupItem value="all" className="text-xs sm:text-sm px-3 min-h-[44px] gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Todas as organizações
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {isGlobalMode && (
          <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
              Alterações afetarão <strong>TODAS as {totalOrgs} organizações</strong>
            </p>
          </div>
        )}

        {/* Org selector (specific mode only) */}
        {!isGlobalMode && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-white rounded-lg p-4 border border-neutral-200">
              <Label>Organização</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                
                  
                
                
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                
              </Select>
            </div>
          </div>
        )}

        {/* Search + Add button */}
        {(isGlobalMode || selectedOrgId) && (
          <div className="flex items-end gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Buscar campos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={openCreateModal} size="sm" className="gap-1.5 min-h-[44px]">
              <Plus className="h-4 w-4" /> Adicionar Campo
            </Button>
          </div>
        )}
      </div>

      {/* GLOBAL mode table */}
      {isGlobalMode && (
        loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filteredGlobalFields.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm">
            {globalFields.length === 0 ? 'Nenhum campo customizado criado.' : 'Nenhum campo encontrado.'}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Label</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nome interno</th>
                  {/* ... resto da tabela ... */}
                </tr>
              </thead>
            </table>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Orgs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{filteredGlobalFields.map((field) => (
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"><th className=\"px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider\">{field.field_label}</td>
                    <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">{field.field_name}</td>
                    <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap"><Badge variant="secondary" className="text-xs">
                        {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                      </Badge></td>
                    <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap"><Badge variant={field.org_count === totalOrgs ? 'primary' : 'secondary'} className="text-xs">
                        {field.org_count}/{totalOrgs}
                      </Badge></td>
                    <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap"><div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditGlobalModal(field)} className="h-8 w-8 p-0">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApplyToAll(field)}
                          className="h-8 w-8 p-0 text-primary-600"
                          title="Aplicar a todas as organizações"
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setDeleteGlobalFieldName(field.field_name); setDeleteGlobalFieldLabel(field.field_label); }}
                          className="h-8 w-8 p-0 text-error-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* SPECIFIC org mode table */}
      {!isGlobalMode && selectedOrgId && (
        loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm">
            {fields.length === 0 ? 'Nenhum campo customizado criado.' : 'Nenhum campo encontrado.'}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap"><td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap"><td className=\"px-4 py-4 text-sm text-neutral-900 whitespace-nowrap\"><table className="w-full border-collapse">Op</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Label</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nome interno</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Obrigatório</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <table className="w-full border-collapse">
                {filteredFields.map((field, index) => (
                  <tr className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                    key={field.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={dragIndex === index ? 'opacity-50' : ''}
                  >
                    <table className="w-full border-collapse">
                      <GripVertical className="h-4 w-4 text-neutral-500" /></td>
                    <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">{field.field_label}</td>
                    <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">{field.field_name}</td>
                    <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap"><Badge variant="secondary" className="text-xs">
                        {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                      </Badge></td>
                    <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap">{field.is_required ? <Badge variant="primary" className="text-xs">Sim</Badge> : <span className="text-xs text-neutral-500">Não</span>}</td>
                    <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap"><Badge variant={field.is_active ? 'primary' : 'secondary'} className="text-xs">
                        {field.is_active ? 'Ativo' : 'Inativo'}
                      </Badge></td>
                    <td className="px-4 py-4 text-sm text-neutral-900 whitespace-nowrap"><div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(field)} className="h-8 w-8 p-0">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteFieldId(field.id)} className="h-8 w-8 p-0 text-error-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Field Editor Modal */}
      <Dialog isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingField || editingGlobalField ? 'Editar Campo' : 'Novo Campo'}>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="label">Rótulo do Campo (Label)</Label>
            <Input id="label" value={fieldLabel} onChange={e => handleLabelChange(e.target.value)} placeholder="Ex: Tamanho da Camiseta" />
          </div>
          <div>
            <Label htmlFor="name">Nome do Campo (Internal Name)</Label>
            <Input id="name" value={fieldName} onChange={e => setFieldName(e.target.value)} disabled={!!editingField || !!editingGlobalField} placeholder="Ex: tamanho_camiseta" />
            <p className="text-[10px] text-neutral-500 mt-1 uppercase">USADO PARA INTEGRAÇÕES E CÁLCULOS. NÃO PODE SER ALTERADO APÓS CRIADO.</p>
          </div>
          <div>
            <Label htmlFor="type">Tipo de Campo</Label>
            <Select value={fieldType} onValueChange={setFieldType}>
              
                
              
              
                {FIELD_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              
            </Select>
          </div>

          {fieldType === 'select' && (
            <div className="space-y-3 p-3 border rounded-md bg-neutral-50">
              <Label>Opções da Seleção</Label>
              <div className="flex gap-2">
                <Input value={optionInput} onChange={e => setOptionInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOption()} placeholder="Nova opção..." />
                <Button variant="secondary" onClick={addOption} size="sm">Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {fieldOptions.map(opt => (
                  <Badge key={opt} variant="secondary" className="gap-1.5 py-1 px-2 text-sm">
                    {opt}
                    <X className="h-3 w-3 cursor-pointer hover:text-error-600" onClick={() => removeOption(opt)} />
                  </Badge>
                ))}
                {fieldOptions.length === 0 && <p className="text-xs text-neutral-500">Nenhuma opção adicionada.</p>}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={isRequired} onCheckedChange={setIsRequired} id="required" />
              <Label htmlFor="required" className="cursor-pointer">Campo obrigatório</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
              <Label htmlFor="active" className="cursor-pointer">Campo ativo</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Campo'}</Button>
        </DialogFooter>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteFieldId} onOpenChange={open => !open && setDeleteFieldId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campo customizado?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este campo? Todos os dados salvos neste campo em todos os leads desta organização serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="error" onClick={handleDelete}>Excluir</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Global Delete confirmation */}
      <AlertDialog open={!!deleteGlobalFieldName} onOpenChange={open => !open && setDeleteGlobalFieldName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-error-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> EXCLUIR CAMPO GLOBAL
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o campo <strong>"{deleteGlobalFieldLabel}"</strong> de <strong>TODAS as organizações</strong> ({totalOrgs}).
              <br /><br />
              <span className="text-error-600 font-bold uppercase">ESTA AÇÃO É IRREVERSÍVEL E APAGARÁ DADOS DE TODOS OS LEADS DO SISTEMA.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="error" onClick={handleDeleteGlobal}>CONFIRMAR EXCLUSÃO GLOBAL</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
