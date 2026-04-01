import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input, Label, Textarea } from "@/components/ui/ds";
import { type DragEvent, useEffect, useState } from "react";
import { Plus, Edit, Trash2, ExternalLink, Loader2, GripVertical } from "lucide-react";
import { useProductsData, ProductView, ProductInput } from "@/hooks/useProductsData";
import { useOrganization } from "@/contexts/OrganizationContext";

export default function ProdutosPage() {
  const { organizationId } = useOrganization();
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProductsData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductView | null>(null);
  const [orderedProducts, setOrderedProducts] = useState<ProductView[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const orderStorageKey = organizationId ? `products-order:${organizationId}` : "products-order";

  useEffect(() => {
    if (products.length === 0) {
      setOrderedProducts([]);
      return;
    }
    let storedIds: string[] = [];
    try {
      const raw = localStorage.getItem(orderStorageKey);
      storedIds = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(storedIds)) storedIds = [];
    } catch {
      storedIds = [];
    }

    if (storedIds.length === 0) {
      setOrderedProducts(products);
      return;
    }

    const byId = new Map(products.map((p) => [p.id, p]));
    const storedSet = new Set(storedIds);
    const ordered = storedIds.map((id) => byId.get(id)).filter(Boolean) as ProductView[];
    const missing = products.filter((p) => !storedSet.has(p.id));
    setOrderedProducts([...ordered, ...missing]);
  }, [products, orderStorageKey]);

  const handleSave = async (data: ProductInput) => {
    if (editing) {
      await updateProduct(editing.id, data);
    } else {
      await createProduct(data);
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setOrderedProducts((current) => {
      const next = [...current];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    try {
      localStorage.setItem(orderStorageKey, JSON.stringify(orderedProducts.map((p) => p.id)));
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
         <h1 className="text-4xl font-bold text-neutral-900">Produtos</h1>
         <div className="flex items-center gap-3 text-sm text-neutral-500">
          <span>Arraste para ordenar</span>
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)} variant="primary">
                <Plus className="h-4 w-4 mr-1" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              </DialogHeader>
              <ProductForm product={editing} onSave={handleSave} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-neutral-500 text-center py-12">Nenhum produto cadastrado</p>
      ) : (
        <div className="space-y-3">
          {orderedProducts.map((product, index) => (
            <Card
              key={product.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(event) => handleDragOver(event, index)}
              onDragEnd={handleDragEnd}
              className={dragIndex === index ? "opacity-60" : undefined}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="pt-1 text-neutral-400 cursor-grab">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {product.type && <Badge variant="secondary">{product.type}</Badge>}
                      {product.createdAt && (
                        <span className="text-xs text-neutral-500">
                          Criado em {new Date(product.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8" onClick={() => { setEditing(product); setDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 text-error-600" onClick={() => deleteProduct(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.description && (
                  <div>
                    <div className="text-xs uppercase text-neutral-500 font-semibold mb-1">Descrição</div>
                    <p className="text-sm text-neutral-800">{product.description}</p>
                  </div>
                )}
                {product.notes && (
                  <div>
                    <div className="text-xs uppercase text-neutral-500 font-semibold mb-1">Observações</div>
                    <p className="text-sm text-neutral-600">{product.notes}</p>
                  </div>
                )}
                {product.salesStages.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-neutral-500 font-semibold mb-2">Etapas de venda</div>
                    <div className="space-y-1">
                      {product.salesStages.map(stage => (
                        <div key={stage.id} className="flex items-center justify-between text-sm p-2 rounded bg-neutral-50 border border-neutral-100">
                          <div className="flex items-center gap-3">
                            <span>{stage.name}</span>
                            <Badge variant="secondary" className="text-[10px] py-0 px-1">
                              {stage.sale_type === 'mensalidade' ? '📅 Mensal' : '💳 Única'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-neutral-900">R$ {stage.value.toLocaleString('pt-BR')}</span>
                            {stage.link && (
                              <a href={stage.link} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-700">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProductFormData {
  name: string;
  type: string;
  description: string;
  notes: string;
  salesStages: { id: string; name: string; value: number; link: string; sale_type: 'unica' | 'mensalidade' }[];
}

function ProductForm({ product, onSave }: { product: ProductView | null; onSave: (data: ProductInput) => void }) {
  const [form, setForm] = useState<ProductFormData>(
    product
      ? { name: product.name, type: product.type, description: product.description, notes: product.notes, salesStages: [...product.salesStages] }
      : { name: '', type: '', description: '', notes: '', salesStages: [{ id: crypto.randomUUID(), name: '', value: 0, link: '', sale_type: 'unica' }] }
  );
  const set = (k: keyof ProductFormData, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addStage = () => set('salesStages', [...form.salesStages, { id: crypto.randomUUID(), name: '', value: 0, link: '', sale_type: 'unica' }]);
  const updateStage = (id: string, key: string, val: any) =>
    set('salesStages', form.salesStages.map(s => s.id === id ? { ...s, [key]: val } : s));
  const removeStage = (id: string) => set('salesStages', form.salesStages.filter(s => s.id !== id));

  return (
    <div className="space-y-4">
      <div><Label>Nome</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
      <div><Label>Tipo</Label><Input value={form.type} onChange={e => set('type', e.target.value)} placeholder="Programa online, Mentoria..." /></div>
      <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => set('description', e.target.value)} /></div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Etapas de Venda</Label>
          <Button variant="secondary" size="sm" onClick={addStage}>
            <Plus className="h-3 w-3 mr-1" /> Etapa
          </Button>
        </div>
        {form.salesStages.map(stage => (
          <div key={stage.id} className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 mb-3 space-y-3">
            <div className="grid grid-cols-[1fr_100px_auto] gap-3 items-end">
              <div><Label className="text-xs">Nome</Label><Input placeholder="Nome" value={stage.name} onChange={e => updateStage(stage.id, 'name', e.target.value)} /></div>
              <div><Label className="text-xs">R$</Label><Input type="number" placeholder="R$" value={stage.value || ''} onChange={e => updateStage(stage.id, 'value', Number(e.target.value))} /></div>
              <Button variant="ghost" size="sm" className="h-9 w-9 text-error-600" onClick={() => removeStage(stage.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <Label className="text-xs">Tipo de Venda</Label>
                  <select
                    value={stage.sale_type}
                    onChange={(e) => updateStage(stage.id, 'sale_type', e.target.value as 'unica' | 'mensalidade')}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="unica">💳 Única</option>
                    <option value="mensalidade">📅 Mensal</option>
                  </select>
               </div>
               <div><Label className="text-xs">Link</Label><Input placeholder="Link" value={stage.link} onChange={e => updateStage(stage.id, 'link', e.target.value)} /></div>
            </div>
          </div>
        ))}
      </div>

      <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
      <Button className="w-full" onClick={() => onSave(form)} disabled={!form.name.trim()}>
        Salvar
      </Button>
    </div>
  );
}
