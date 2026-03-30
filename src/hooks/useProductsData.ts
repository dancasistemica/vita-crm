import { useState, useEffect, useCallback } from 'react';
import { useDataAccess } from './useDataAccess';
import { toast } from 'sonner';

export interface ProductStageView {
  id: string;
  name: string;
  value: number;
  link: string;
  sale_type: 'unica' | 'mensalidade';
}

export interface ProductView {
  id: string;
  createdAt: string;
  name: string;
  type: string;
  description: string;
  notes: string;
  salesStages: ProductStageView[];
}

export type ProductInput = Omit<ProductView, "id" | "createdAt">;

export function useProductsData() {
  const dataAccess = useDataAccess();
  const [products, setProducts] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!dataAccess) return;
    setLoading(true);
    try {
      const data = await dataAccess.getProducts();
      const mapped: ProductView[] = (data || []).map((p: any) => ({
        id: p.id,
        createdAt: p.created_at,
        name: p.name || '',
        type: p.type || '',
        description: p.description || '',
        notes: p.notes || '',
        salesStages: (p.product_sales_stages || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          value: Number(s.value) || 0,
          link: s.link || '',
          sale_type: s.sale_type || 'unica',
        })),
      }));
      setProducts(mapped);
    } catch (err) {
      console.error('[useProductsData] fetchAll error:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [dataAccess]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createProduct = async (product: ProductInput) => {
    if (!dataAccess) return;
    try {
      const created = await dataAccess.createProduct({
        name: product.name,
        type: product.type,
        description: product.description,
        notes: product.notes,
      });
      if (created?.id && product.salesStages.length > 0) {
        await dataAccess.upsertProductStages(created.id, product.salesStages);
      }
      await fetchAll();
      toast.success('Produto criado!');
    } catch (err) {
      console.error('[useProductsData] createProduct error:', err);
      toast.error('Erro ao criar produto');
    }
  };

  const updateProduct = async (id: string, product: ProductInput) => {
    if (!dataAccess) return;
    try {
      await dataAccess.updateProduct(id, {
        name: product.name,
        type: product.type,
        description: product.description,
        notes: product.notes,
      });
      await dataAccess.upsertProductStages(id, product.salesStages);
      await fetchAll();
      toast.success('Produto atualizado!');
    } catch (err) {
      console.error('[useProductsData] updateProduct error:', err);
      toast.error('Erro ao atualizar produto');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!dataAccess) return;
    try {
      await dataAccess.deleteProduct(id);
      await fetchAll();
      toast.success('Produto removido!');
    } catch (err) {
      console.error('[useProductsData] deleteProduct error:', err);
      toast.error('Erro ao remover produto');
    }
  };

  return { products, loading, createProduct, updateProduct, deleteProduct, refetch: fetchAll };
}
