import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Lead, Interaction, Task, Sale, Product, PipelineStage, DEFAULT_PIPELINE_STAGES, DEFAULT_ORIGINS } from '@/types/crm';

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'vendedora' | 'usuario';
  active: boolean;
}

export interface CRMTag {
  id: string;
  name: string;
  color: string;
}

export interface InterestLevel {
  id: string;
  value: string;
  label: string;
}

const DEFAULT_INTEREST_LEVELS: InterestLevel[] = [
  { id: '1', value: 'frio', label: 'Frio' },
  { id: '2', value: 'morno', label: 'Morno' },
  { id: '3', value: 'quente', label: 'Quente' },
];

const DEFAULT_TAGS: CRMTag[] = [
  { id: crypto.randomUUID(), name: 'aula assistida', color: 'hsl(var(--primary))' },
  { id: crypto.randomUUID(), name: 'veio do direct', color: 'hsl(var(--accent))' },
  { id: crypto.randomUUID(), name: 'interessada na comunidade', color: 'hsl(var(--warm))' },
  { id: crypto.randomUUID(), name: 'alta prioridade', color: 'hsl(var(--hot))' },
  { id: crypto.randomUUID(), name: 'follow-up', color: 'hsl(var(--cold))' },
];

const DEFAULT_USERS: CRMUser[] = [
  { id: crypto.randomUUID(), name: 'Francelle', email: 'francelle@email.com', phone: '5511999999999', role: 'admin', active: true },
];

interface CRMState {
  leads: Lead[];
  interactions: Interaction[];
  tasks: Task[];
  sales: Sale[];
  products: Product[];
  pipelineStages: PipelineStage[];
  origins: string[];
  productTypes: string[];
  saleStatuses: string[];
  users: CRMUser[];
  tags: CRMTag[];
  interestLevels: InterestLevel[];

  addLead: (lead: Lead) => void;
  updateLead: (id: string, data: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  moveLead: (id: string, stage: string) => void;

  addInteraction: (interaction: Interaction) => void;
  deleteInteraction: (id: string) => void;

  addTask: (task: Task) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  addSale: (sale: Sale) => void;
  updateSale: (id: string, data: Partial<Sale>) => void;
  deleteSale: (id: string) => void;

  addProduct: (product: Product) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addOrigin: (origin: string) => void;
  removeOrigin: (origin: string) => void;
  updateOrigin: (oldOrigin: string, newOrigin: string) => void;
  addProductType: (type: string) => void;
  addPipelineStage: (stage: PipelineStage) => void;
  updatePipelineStage: (id: string, data: Partial<PipelineStage>) => void;
  removePipelineStage: (id: string) => void;

  addUser: (user: CRMUser) => void;
  updateUser: (id: string, data: Partial<CRMUser>) => void;

  addTag: (tag: CRMTag) => void;
  updateTag: (id: string, data: Partial<CRMTag>) => void;
  removeTag: (id: string) => void;

  addInterestLevel: (level: InterestLevel) => void;
  updateInterestLevel: (id: string, data: Partial<InterestLevel>) => void;
  removeInterestLevel: (id: string) => void;
}

const uid = () => crypto.randomUUID();

const sampleLeads: Lead[] = [
  { id: uid(), name: 'Maria Silva', phone: '5511999990001', email: 'maria@email.com', instagram: '@mariasilva', city: 'São Paulo', entryDate: '2026-03-01', origin: 'Instagram – direct', interestLevel: 'quente', mainInterest: 'Programa Dançar pra Curar', tags: ['aula assistida'], painPoint: 'Ansiedade', bodyTensionArea: 'Quadril', emotionalGoal: 'Leveza', pipelineStage: '3', responsible: 'Francelle', notes: '' },
  { id: uid(), name: 'Juliana Costa', phone: '5521988880002', email: 'juliana@email.com', instagram: '@jucosta', city: 'Rio de Janeiro', entryDate: '2026-03-03', origin: 'Aula gratuita', interestLevel: 'morno', mainInterest: 'Comunidade', tags: ['veio do direct'], painPoint: 'Bloqueio emocional', bodyTensionArea: 'Ombros', emotionalGoal: 'Reconexão', pipelineStage: '2', responsible: 'Francelle', notes: '' },
  { id: uid(), name: 'Fernanda Lima', phone: '5531977770003', email: 'fernanda@email.com', instagram: '@ferlima', city: 'Belo Horizonte', entryDate: '2026-03-05', origin: 'Landing page', interestLevel: 'frio', mainInterest: 'Imersão presencial', tags: [], painPoint: 'Tensão corporal', bodyTensionArea: 'Costas', emotionalGoal: 'Liberar emoções', pipelineStage: '1', responsible: '', notes: '' },
  { id: uid(), name: 'Camila Rocha', phone: '5541966660004', email: 'camila@email.com', instagram: '@camilarocha', city: 'Curitiba', entryDate: '2026-02-20', origin: 'Indicação', interestLevel: 'quente', mainInterest: 'Mentoria', tags: ['alta prioridade'], painPoint: 'Desconexão corpo', bodyTensionArea: 'Quadril', emotionalGoal: 'Leveza', pipelineStage: '5', responsible: 'Francelle', notes: '' },
  { id: uid(), name: 'Patrícia Santos', phone: '5551955550005', email: 'patricia@email.com', instagram: '@patsantos', city: 'Porto Alegre', entryDate: '2026-02-15', origin: 'Evento', interestLevel: 'quente', mainInterest: 'Programa Dançar pra Curar', tags: ['follow-up'], painPoint: 'Trauma emocional', bodyTensionArea: 'Ombros', emotionalGoal: 'Reconexão', pipelineStage: '7', responsible: 'Francelle', notes: '' },
];

const sampleProducts: Product[] = [
  { id: uid(), name: 'Programa Dançar pra Curar', type: 'Programa online', description: 'Programa completo de 8 semanas', salesStages: [{ id: uid(), name: 'Pré-venda', value: 497, link: '' }, { id: uid(), name: 'Lançamento', value: 597, link: '' }, { id: uid(), name: 'Padrão', value: 697, link: '' }], notes: '' },
  { id: uid(), name: 'Travessia', type: 'Mentoria', description: 'Mentoria individual de 3 meses', salesStages: [{ id: uid(), name: 'Padrão', value: 2997, link: '' }], notes: '' },
  { id: uid(), name: 'Comunidade Dança Sistêmica', type: 'Assinatura', description: 'Comunidade mensal por assinatura', salesStages: [{ id: uid(), name: 'Mensal', value: 97, link: '' }], notes: '' },
  { id: uid(), name: 'Imersão Presencial SP', type: 'Evento presencial', description: 'Imersão de um dia em São Paulo', salesStages: [{ id: uid(), name: 'Lote 1', value: 397, link: '' }, { id: uid(), name: 'Lote 2', value: 497, link: '' }], notes: '' },
];

const sampleSales: Sale[] = [
  { id: uid(), leadId: sampleLeads[4].id, productId: sampleProducts[0].id, value: 597, date: '2026-02-25', paymentMethod: 'Cartão', status: 'ativo' },
  { id: uid(), leadId: sampleLeads[4].id, productId: sampleProducts[2].id, value: 97, date: '2026-03-01', paymentMethod: 'Pix', status: 'ativo' },
];

const sampleInteractions: Interaction[] = [
  { id: uid(), leadId: sampleLeads[0].id, date: '2026-03-02', type: 'mensagem', note: 'Enviada mensagem de boas-vindas' },
  { id: uid(), leadId: sampleLeads[0].id, date: '2026-03-04', type: 'aula_gratuita', note: 'Enviado link da aula gratuita' },
  { id: uid(), leadId: sampleLeads[3].id, date: '2026-03-01', type: 'proposta', note: 'Enviada proposta do programa' },
];

const sampleTasks: Task[] = [
  { id: uid(), leadId: sampleLeads[0].id, title: 'Enviar aula gratuita', dueDate: '2026-03-10', completed: false, type: 'enviar_aula' },
  { id: uid(), leadId: sampleLeads[3].id, title: 'Follow-up da proposta', dueDate: '2026-03-09', completed: false, type: 'follow_up' },
  { id: uid(), leadId: sampleLeads[1].id, title: 'Responder mensagem', dueDate: '2026-03-11', completed: false, type: 'responder' },
];

export const useCRMStore = create<CRMState>()(
  persist(
    (set) => ({
      leads: sampleLeads,
      interactions: sampleInteractions,
      tasks: sampleTasks,
      sales: sampleSales,
      products: sampleProducts,
      pipelineStages: DEFAULT_PIPELINE_STAGES,
      origins: DEFAULT_ORIGINS,
      productTypes: ['Programa online', 'Mentoria', 'Assinatura', 'Evento presencial', 'Ebook', 'Aula online', 'Desafio online'],
      saleStatuses: ['ativo', 'concluído', 'cancelado', 'pendência'],
      users: DEFAULT_USERS,
      tags: DEFAULT_TAGS,
      interestLevels: DEFAULT_INTEREST_LEVELS,

      addLead: (lead) => set((s) => ({ leads: [...s.leads, lead] })),
      updateLead: (id, data) => set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, ...data } : l) })),
      deleteLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
      moveLead: (id, stage) => set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, pipelineStage: stage } : l) })),

      addInteraction: (i) => set((s) => ({ interactions: [...s.interactions, i] })),
      deleteInteraction: (id) => set((s) => ({ interactions: s.interactions.filter((i) => i.id !== id) })),

      addTask: (t) => set((s) => ({ tasks: [...s.tasks, t] })),
      updateTask: (id, data) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...data } : t) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t) })),

      addSale: (sale) => set((s) => ({ sales: [...s.sales, sale] })),
      updateSale: (id, data) => set((s) => ({ sales: s.sales.map((sl) => sl.id === id ? { ...sl, ...data } : sl) })),
      deleteSale: (id) => set((s) => ({ sales: s.sales.filter((sl) => sl.id !== id) })),

      addProduct: (p) => set((s) => ({ products: [...s.products, p] })),
      updateProduct: (id, data) => set((s) => ({ products: s.products.map((p) => p.id === id ? { ...p, ...data } : p) })),
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      addOrigin: (o) => set((s) => ({ origins: [...s.origins, o] })),
      removeOrigin: (o) => set((s) => ({ origins: s.origins.filter((x) => x !== o) })),
      updateOrigin: (oldOrigin, newOrigin) => set((s) => ({ origins: s.origins.map((o) => o === oldOrigin ? newOrigin : o) })),
      addProductType: (t) => set((s) => ({ productTypes: [...s.productTypes, t] })),
      addPipelineStage: (stage) => set((s) => ({ pipelineStages: [...s.pipelineStages, stage] })),
      updatePipelineStage: (id, data) => set((s) => ({ pipelineStages: s.pipelineStages.map((st) => st.id === id ? { ...st, ...data } : st) })),
      removePipelineStage: (id) => set((s) => ({ pipelineStages: s.pipelineStages.filter((st) => st.id !== id) })),

      addUser: (user) => set((s) => ({ users: [...s.users, user] })),
      updateUser: (id, data) => set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, ...data } : u) })),

      addTag: (tag) => set((s) => ({ tags: [...s.tags, tag] })),
      updateTag: (id, data) => set((s) => ({ tags: s.tags.map((t) => t.id === id ? { ...t, ...data } : t) })),
      removeTag: (id) => set((s) => ({ tags: s.tags.filter((t) => t.id !== id) })),

      addInterestLevel: (level) => set((s) => ({ interestLevels: [...s.interestLevels, level] })),
      updateInterestLevel: (id, data) => set((s) => ({ interestLevels: s.interestLevels.map((l) => l.id === id ? { ...l, ...data } : l) })),
      removeInterestLevel: (id) => set((s) => ({ interestLevels: s.interestLevels.filter((l) => l.id !== id) })),
    }),
    { name: 'danca-sistematica-crm' }
  )
);
