import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  getFinancialTransactions, 
  getFinancialCategories, 
  deleteFinancialTransaction,
  FinancialTransactionWithJoins,
  FinancialCategory 
} from '@/services/financialService';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from "@/components/ui/ds";
import { Plus, Filter, Trash2, Edit2, TrendingUp, TrendingDown, Wallet, Activity } from "lucide-react";
import { toast } from 'sonner';
import { FinancialTransactionModal } from '@/components/financial/FinancialTransactionModal';
import { FinancialCategoryModal } from '@/components/financial/FinancialCategoryModal';

export default function FinanceiroPage() {
  const { organizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<FinancialTransactionWithJoins[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalMode, setCatModalMode] = useState<'category' | 'subcategory'>('category');
  const [selectedTx, setSelectedTx] = useState<FinancialTransactionWithJoins | undefined>();

  const [filters, setFilters] = useState({
    type: '' as any,
    status: '',
    startDate: '',
    endDate: '',
  });

  const loadData = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [txs, cats] = await Promise.all([
        getFinancialTransactions(organizationId, {
          type: filters.type || undefined,
          status: filters.status || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        }),
        getFinancialCategories(organizationId)
      ]);
      setTransactions(txs);
      setCategories(cats);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId, filters]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    try {
      await deleteFinancialTransaction(id);
      toast.success('Transação excluída');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totals = transactions.reduce((acc, tx) => {
    if (tx.status === 'cancelado') return acc;
    if (tx.type === 'receita') {
      if (tx.status === 'pago') acc.received += tx.amount;
      else acc.toReceive += tx.amount;
    } else {
      if (tx.status === 'pago') acc.paidExpenses += tx.amount;
      else acc.pendingExpenses += tx.amount;
    }
    return acc;
  }, { received: 0, toReceive: 0, paidExpenses: 0, pendingExpenses: 0 });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago': return <Badge variant="success">Pago</Badge>;
      case 'pendente': return <Badge variant="secondary">Pendente</Badge>;
      case 'atrasado': return <Badge variant="error">Atrasado</Badge>;
      case 'cancelado': return <Badge variant="ghost">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Controle Financeiro</h1>
          <p className="text-slate-500">Fluxo de caixa unificado: Vendas, Mensalidades e Despesas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="secondary" 
            onClick={() => { setCatModalMode('category'); setIsCatModalOpen(true); }}
            icon={<Plus className="h-4 w-4" />}
          >
            Categoria
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => { setCatModalMode('subcategory'); setIsCatModalOpen(true); }}
            icon={<Plus className="h-4 w-4" />}
          >
            Subcategoria
          </Button>
          <Button 
            onClick={() => { setSelectedTx(undefined); setIsTxModalOpen(true); }}
            icon={<Plus className="h-4 w-4" />}
          >
            Nova Transação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.received)}</div>
            <p className="text-xs text-slate-400 mt-1">Receitas confirmadas</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">A Receber</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totals.toReceive)}</div>
            <p className="text-xs text-slate-400 mt-1">Previsão (vendas/mensalidades)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.paidExpenses + totals.pendingExpenses)}</div>
            <p className="text-xs text-slate-400 mt-1">Pagas: {formatCurrency(totals.paidExpenses)}</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-slate-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Saldo Previsto</CardTitle>
            <Activity className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency((totals.received + totals.toReceive) - (totals.paidExpenses + totals.pendingExpenses))}
            </div>
            <p className="text-xs text-slate-400 mt-1">Considerando todos os lançamentos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <CardTitle className="text-lg">Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Tipo</label>
              <Select value={filters.type} onValueChange={(val) => setFilters({ ...filters, type: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Status</label>
              <Select value={filters.status} onValueChange={(val) => setFilters({ ...filters, status: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Início</label>
              <Input 
                type="date" 
                value={filters.startDate} 
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Fim</label>
              <Input 
                type="date" 
                value={filters.endDate} 
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Categoria / Sub</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Nenhuma transação encontrada</TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(tx.due_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{tx.description}</div>
                      <div className="text-xs text-slate-400">{tx.supplier_client_name}</div>
                    </TableCell>
                    <TableCell>
                      {tx.origin === 'manual' ? (
                        <Badge variant="ghost" className="bg-slate-100">Manual</Badge>
                      ) : tx.origin === 'venda' ? (
                        <Badge variant="ghost" className="bg-blue-50 text-blue-600 border-blue-100">Venda</Badge>
                      ) : (
                        <Badge variant="ghost" className="bg-purple-50 text-purple-600 border-purple-100">Assinatura</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{tx.category?.name || '-'}</div>
                      <div className="text-xs text-slate-400">{tx.subcategory?.name || ''}</div>
                    </TableCell>
                    <TableCell className={tx.type === 'receita' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {tx.type === 'receita' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {tx.origin === 'manual' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedTx(tx); setIsTxModalOpen(true); }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDelete(tx.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {tx.origin !== 'manual' && (
                          <span className="text-xs text-slate-400 italic">Sistema</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FinancialTransactionModal 
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={loadData}
        transaction={selectedTx}
        categories={categories}
      />

      <FinancialCategoryModal 
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        onSuccess={loadData}
        mode={catModalMode}
        categories={categories}
      />
    </div>
  );
}
