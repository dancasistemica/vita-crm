import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useProductsData, ProductView, ProductInput } from "@/hooks/useProductsData";

export default function ProdutosPage() {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProductsData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductView | null>(null);
  const [sortOrder, setSortOrder] = useState("recent_desc");

  const handleSave = async (data: ProductInput) => {
    if (editing) {
      await updateProduct(editing.id, data);
    } else {
      await createProduct(data);
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const orderedProducts = [...products].sort((a, b) => {
    if (sortOrder === "name_asc") return a.name.localeCompare(b.name, "pt-BR");
    if (sortOrder === "name_desc") return b.name.localeCompare(a.name, "pt-BR");
    if (sortOrder === "recent_asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Produtos</h1>
        <div className="flex items-center gap-2">
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[210px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent_desc">Mais recentes</SelectItem>
              <SelectItem value="recent_asc">Mais antigos</SelectItem>
              <SelectItem value="name_asc">Nome A-Z</SelectItem>
              <SelectItem value="name_desc">Nome Z-A</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display">{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle></DialogHeader>
              <ProductForm product={editing} onSave={handleSave} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhum produto cadastrado</p>
      ) : (
        <div className="space-y-3">
          {orderedProducts.map(product => (
            <Card key={product.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-display">{product.name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {product.type && <Badge variant="secondary">{product.type}</Badge>}
                      {product.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          Criado em {new Date(product.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(product); setDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.description && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Descrição</div>
                    <p className="text-sm text-foreground/90">{product.description}</p>
                  </div>
                )}
                {product.notes && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Observações</div>
                    <p className="text-sm text-muted-foreground">{product.notes}</p>
                  </div>
                )}
                {product.salesStages.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-2">Etapas de venda</div>
                    <div className="space-y-1">
                      {product.salesStages.map(stage => (
                        <div key={stage.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                          <span>{stage.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">R$ {stage.value.toLocaleString('pt-BR')}</span>
                            {stage.link && (
                              <a href={stage.link} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3 text-primary" /></a>
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
  salesStages: { id: string; name: string; value: number; link: string }[];
}

function ProductForm({ product, onSave }: { product: ProductView | null; onSave: (data: ProductInput) => void }) {
  const [form, setForm] = useState<ProductFormData>(
    product
      ? { name: product.name, type: product.type, description: product.description, notes: product.notes, salesStages: [...product.salesStages] }
      : { name: '', type: '', description: '', notes: '', salesStages: [{ id: crypto.randomUUID(), name: '', value: 0, link: '' }] }
  );
  const set = (k: keyof ProductFormData, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addStage = () => set('salesStages', [...form.salesStages, { id: crypto.randomUUID(), name: '', value: 0, link: '' }]);
  const updateStage = (id: string, key: string, val: any) =>
    set('salesStages', form.salesStages.map(s => s.id === id ? { ...s, [key]: val } : s));
  const removeStage = (id: string) => set('salesStages', form.salesStages.filter(s => s.id !== id));

  return (
    <div className="space-y-3">
      <div><Label>Nome</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
      <div><Label>Tipo</Label><Input value={form.type} onChange={e => set('type', e.target.value)} placeholder="Programa online, Mentoria..." /></div>
      <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => set('description', e.target.value)} /></div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Etapas de Venda</Label>
          <Button variant="outline" size="sm" onClick={addStage}><Plus className="h-3 w-3 mr-1" /> Etapa</Button>
        </div>
        {form.salesStages.map(stage => (
          <div key={stage.id} className="grid grid-cols-[1fr_80px_1fr_auto] gap-2 mb-2 items-end">
            <div><Input placeholder="Nome" value={stage.name} onChange={e => updateStage(stage.id, 'name', e.target.value)} /></div>
            <div><Input type="number" placeholder="R$" value={stage.value || ''} onChange={e => updateStage(stage.id, 'value', Number(e.target.value))} /></div>
            <div><Input placeholder="Link" value={stage.link} onChange={e => updateStage(stage.id, 'link', e.target.value)} /></div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeStage(stage.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>

      <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
      <Button className="w-full" onClick={() => onSave(form)} disabled={!form.name.trim()}>Salvar</Button>
    </div>
  );
}
