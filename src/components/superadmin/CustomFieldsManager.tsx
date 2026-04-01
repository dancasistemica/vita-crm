import { Alert, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Select, Switch, Table, ToggleGroup, ToggleGroupItem, Card } from "@/components/ui/ds";
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, X, Search, AlertTriangle, Globe, Loader } from 'lucide-react';

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
      toast.success('Campo removido');
      fetchFields();
    }
    setDeleteFieldId(null);
  };

  const handleDeleteGlobal = async () => {
    if (!deleteGlobalFieldName) return;
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
          <Label className="mb-1.5 block font-medium">Escopo de Gerenciamento</Label>
          <ToggleGroup
            type="single"
            value={scope}
            onValueChange={(val) => { if (val) setScope(val as 'specific' | 'all'); }}
            className="justify-start border rounded-md p-1 w-fit bg-neutral-50"
          >
            <ToggleGroupItem value="specific" className="text-xs sm:text-sm px-4 py-2 rounded-md data-[state=on]:bg-white data-[state=on]:shadow-sm">
              Organização específica
            </ToggleGroupItem>
            <ToggleGroupItem value="all" className="text-xs sm:text-sm px-4 py-2 rounded-md gap-1.5 data-[state=on]:bg-white data-[state=on]:shadow-sm">
              <Globe className="h-3.5 w-3.5" /> Todas as organizações
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {isGlobalMode && (
          <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Modo Global:</strong> Alterações afetarão <strong>TODAS as {totalOrgs} organizações</strong>. Tenha cuidado ao excluir ou alterar nomes de campos.
            </p>
          </div>
        )}

        {/* Org selector (specific mode only) */}
        {!isGlobalMode && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-white rounded-lg p-4 border border-neutral-200">
              <Label className="mb-2 block">Selecione a Organização</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <option value="">Selecione...</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* Search + Add button */}
        {(isGlobalMode || selectedOrgId) && (
          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Buscar campos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={openCreateModal} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar Campo
            </Button>
          </div>
        )}
      </div>

      {/* Tables Content */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
        {isGlobalMode ? (
          loading ? (
            <div className="flex justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredGlobalFields.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-sm">
              {globalFields.length === 0 ? 'Nenhum campo customizado criado.' : 'Nenhum campo encontrado.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Label</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nome interno</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Organizações</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredGlobalFields.map((field) => (
                    <tr key={field.field_name} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900">{field.field_label}</td>
                      <td className="px-6 py-4 text-sm text-neutral-500">{field.field_name}</td>
                      <td className="px-6 py-4 text-sm text-neutral-500">
                        <Badge variant="secondary" className="capitalize">
                          {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-neutral-500">
                        <Badge variant={field.org_count === totalOrgs ? 'primary' : 'secondary'} className="rounded-full">
                          {field.org_count}/{totalOrgs}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditGlobalModal(field)} className="h-8 w-8 p-0" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleApplyToAll(field)} className="h-8 w-8 p-0 text-primary" title="Aplicar a todas">
                            <Globe className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setDeleteGlobalFieldName(field.field_name); setDeleteGlobalFieldLabel(field.field_label); }} className="h-8 w-8 p-0 text-destructive" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          selectedOrgId && (
            loading ? (
              <div className="flex justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFields.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                {fields.length === 0 ? 'Nenhum campo customizado criado para esta organização.' : 'Nenhum campo encontrado.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-4 py-4 w-10"></th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Label</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nome interno</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Obrigatório</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredFields.map((field, index) => (
                      <tr 
                        key={field.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={e => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={cn("hover:bg-neutral-50 transition-colors", dragIndex === index && "opacity-50")}
                      >
                        <td className="px-4 py-4 cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4 text-neutral-300" />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-neutral-900">{field.field_label}</td>
                        <td className="px-6 py-4 text-sm text-neutral-500">{field.field_name}</td>
                        <td className="px-6 py-4 text-sm text-neutral-500">
                          <Badge variant="secondary" className="capitalize">
                            {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {field.is_required ? <Badge variant="primary" className="text-[10px]">Sim</Badge> : <span className="text-xs text-neutral-400">Não</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={field.is_active ? 'primary' : 'secondary'} className="text-[10px]">
                            {field.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEditModal(field)} className="h-8 w-8 p-0" title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteFieldId(field.id)} className="h-8 w-8 p-0 text-destructive" title="Excluir">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )
        )}
      </div>

      {/* Field Editor Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingField || editingGlobalField ? 'Editar Campo' : 'Novo Campo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-1">
              <Label htmlFor="label">Rótulo do Campo (Label)</Label>
              <Input id="label" value={fieldLabel} onChange={e => handleLabelChange(e.target.value)} placeholder="Ex: Tamanho da Camiseta" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">Nome do Campo (Internal Name)</Label>
              <Input id="name" value={fieldName} onChange={e => setFieldName(e.target.value)} disabled={!!editingField || !!editingGlobalField} placeholder="Ex: tamanho_camiseta" />
              <p className="text-[10px] text-neutral-400 uppercase font-medium">Usado internamente. Não pode ser alterado após a criação.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="type">Tipo de Campo</Label>
              <Select value={fieldType} onValueChange={setFieldType}>
                {FIELD_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </div>

            {fieldType === 'select' && (
              <div className="space-y-3 p-4 border rounded-lg bg-neutral-50">
                <Label className="text-sm font-semibold">Opções da Seleção</Label>
                <div className="flex gap-2">
                  <Input value={optionInput} onChange={e => setOptionInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOption()} placeholder="Nova opção..." />
                  <Button variant="secondary" onClick={addOption} size="sm">Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {fieldOptions.map(opt => (
                    <Badge key={opt} variant="secondary" className="gap-2 py-1 px-3">
                      {opt}
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeOption(opt)} />
                    </Badge>
                  ))}
                  {fieldOptions.length === 0 && <p className="text-xs text-neutral-400">Nenhuma opção adicionada.</p>}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="required" className="cursor-pointer">Campo obrigatório</Label>
                <Switch checked={isRequired} onCheckedChange={setIsRequired} id="required" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active" className="cursor-pointer">Campo ativo</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Campo'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      {deleteFieldId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <Card variant="default" padding="lg" className="w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-2">Excluir campo customizado?</h2>
            <p className="text-sm text-neutral-600 mb-6">
              Tem certeza que deseja excluir este campo? Todos os dados vinculados a este campo em leads desta organização serão perdidos permanentemente.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteFieldId(null)}>Cancelar</Button>
              <Button variant="error" className="flex-1" onClick={handleDelete}>
                Excluir
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Global Delete confirmation */}
      {deleteGlobalFieldName && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <Card variant="default" padding="lg" className="w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-2 text-error flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> EXCLUIR CAMPO GLOBAL
            </h2>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-neutral-600">Você está prestes a excluir o campo <strong>"{deleteGlobalFieldLabel}"</strong> de <strong>TODAS as organizações</strong>.</p>
              <p className="bg-error/10 text-error p-3 rounded-md font-bold uppercase text-xs">ESTA AÇÃO É IRREVERSÍVEL E APAGARÁ DADOS DE TODOS OS LEADS DO SISTEMA.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteGlobalFieldName(null)}>Cancelar</Button>
              <Button variant="error" className="flex-1" onClick={handleDeleteGlobal}>CONFIRMAR EXCLUSÃO GLOBAL</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
