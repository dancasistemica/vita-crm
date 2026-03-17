import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, GripVertical, X, Search } from 'lucide-react';

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
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
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
    if (selectedOrgId) fetchFields();
  }, [selectedOrgId]);

  const fetchOrganizations = async () => {
    const { data } = await supabase.from('organizations').select('id, name').order('name');
    if (data) setOrganizations(data);
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

  const resetForm = () => {
    setFieldLabel('');
    setFieldName('');
    setFieldType('text');
    setFieldOptions([]);
    setOptionInput('');
    setIsRequired(false);
    setIsActive(true);
    setEditingField(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (field: CustomField) => {
    setEditingField(field);
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
    if (!editingField) {
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
    if (!fieldLabel.trim() || !fieldName.trim() || !selectedOrgId) return;
    setSaving(true);

    const payload = {
      organization_id: selectedOrgId,
      field_name: fieldName,
      field_label: fieldLabel,
      field_type: fieldType,
      field_options: fieldType === 'select' ? fieldOptions : null,
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

    setSaving(false);
    setModalOpen(false);
    resetForm();
    fetchFields();
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
    // Persist new order
    const updates = fields.map((f, i) =>
      supabase.from('custom_fields').update({ display_order: i } as any).eq('id', f.id)
    );
    await Promise.all(updates);
  };

  const filteredFields = fields.filter(f =>
    f.field_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.field_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Org selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Label>Organização</Label>
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger><SelectValue placeholder="Selecione uma organização" /></SelectTrigger>
            <SelectContent>
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedOrgId && (
          <div className="flex items-end gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar campos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={openCreateModal} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Adicionar Campo
            </Button>
          </div>
        )}
      </div>

      {/* Fields table */}
      {selectedOrgId && (
        loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {fields.length === 0 ? 'Nenhum campo customizado criado.' : 'Nenhum campo encontrado.'}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="hidden sm:table-cell">Nome interno</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Obrigatório</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFields.map((field, index) => (
                  <TableRow
                    key={field.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={dragIndex === index ? 'opacity-50' : ''}
                  >
                    <TableCell className="cursor-grab">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-medium">{field.field_label}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">{field.field_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {field.is_required ? <Badge variant="default" className="text-xs">Sim</Badge> : <span className="text-xs text-muted-foreground">Não</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={field.is_active ? 'default' : 'secondary'} className="text-xs">
                        {field.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(field)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteFieldId(field.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={open => { if (!open) { setModalOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Editar Campo' : 'Novo Campo Customizado'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Label do campo *</Label>
              <Input value={fieldLabel} onChange={e => handleLabelChange(e.target.value)} placeholder="Ex: Objetivo Terapêutico" />
            </div>
            <div>
              <Label>Nome interno</Label>
              <Input value={fieldName} onChange={e => setFieldName(e.target.value)} placeholder="objetivo_terapeutico" className="font-mono text-sm" disabled={!!editingField} />
              <p className="text-xs text-muted-foreground mt-1">Auto-gerado a partir do label</p>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={fieldType} onValueChange={setFieldType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {fieldType === 'select' && (
              <div>
                <Label>Opções</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={optionInput}
                    onChange={e => setOptionInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                    placeholder="Adicionar opção"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>+</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {fieldOptions.map(opt => (
                    <Badge key={opt} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeOption(opt)}>
                      {opt} <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>Obrigatório</Label>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !fieldLabel.trim() || !fieldName.trim()}>
              {saving ? 'Salvando...' : editingField ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteFieldId} onOpenChange={open => { if (!open) setDeleteFieldId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover campo customizado?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá o campo de todos os cadastros. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
