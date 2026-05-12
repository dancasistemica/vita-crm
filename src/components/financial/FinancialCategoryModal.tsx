import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/ds";
import { createFinancialCategory, createFinancialSubcategory, FinancialCategory } from '@/services/financialService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface FinancialCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'category' | 'subcategory';
  categories?: FinancialCategory[];
}

export const FinancialCategoryModal = ({ isOpen, onClose, onSuccess, mode, categories }: FinancialCategoryModalProps) => {
  const { organizationId } = useOrganization();
  const [name, setName] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    if (!name) {
      toast.error('O nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'category') {
        await createFinancialCategory({
          name,
          type,
          organization_id: organizationId,
        });
        toast.success('Categoria criada com sucesso!');
      } else {
        if (!categoryId) {
          toast.error('Selecione uma categoria pai');
          setLoading(false);
          return;
        }
        await createFinancialSubcategory({
          name,
          category_id: categoryId,
        });
        toast.success('Subcategoria criada com sucesso!');
      }
      onSuccess();
      onClose();
      setName('');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'category' ? 'Nova Categoria' : 'Nova Subcategoria'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {mode === 'subcategory' && (
            <div className="space-y-2">
              <Label htmlFor="parent-category">Categoria Pai</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="parent-category">
                  <SelectValue placeholder="Selecione a categoria pai" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.type === 'receita' ? 'Receita' : 'Despesa'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Aluguel, Vendas, Marketing..."
            />
          </div>

          {mode === 'category' && (
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={(val: 'receita' | 'despesa') => setType(val)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
