export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  instagram: string;
  city: string;
  entryDate: string;
  origin: string;
  interestLevel: 'frio' | 'morno' | 'quente';
  mainInterest: string;
  tags: string[];
  painPoint: string;
  bodyTensionArea: string;
  emotionalGoal: string;
  pipelineStage: string;
  responsible: string;
  notes: string;
}

export interface Interaction {
  id: string;
  leadId: string;
  date: string;
  type: 'mensagem' | 'observação' | 'reunião' | 'aula_gratuita' | 'proposta';
  note: string;
}

export interface Task {
  id: string;
  leadId: string;
  title: string;
  dueDate: string;
  completed: boolean;
  type: 'responder' | 'enviar_aula' | 'enviar_proposta' | 'follow_up' | 'outro';
}

export interface Sale {
  id: string;
  leadId: string;
  productId: string;
  value: number;
  date: string;
  paymentMethod: string;
  status: 'ativo' | 'concluído' | 'cancelado' | 'pendência';
}

export interface Product {
  id: string;
  name: string;
  type: string;
  description: string;
  salesStages: SalesStage[];
  notes: string;
}

export interface SalesStage {
  id: string;
  name: string;
  value: number;
  link: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
}

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: '1', name: 'Novo contato', order: 1 },
  { id: '2', name: 'Conexão inicial', order: 2 },
  { id: '3', name: 'Interessada', order: 3 },
  { id: '4', name: 'Experiência com o método', order: 4 },
  { id: '5', name: 'Oferta enviada', order: 5 },
  { id: '6', name: 'Em decisão', order: 6 },
  { id: '7', name: 'Cliente', order: 7 },
  { id: '8', name: 'Não avançou', order: 8 },
];

export const DEFAULT_ORIGINS = [
  'Instagram – direct',
  'Instagram – Comentário',
  'Aula gratuita',
  'Grupo VIP',
  'Landing page',
  'Indicação',
  'Evento',
  'Link da bio',
];

export const INTEREST_LEVELS = ['frio', 'morno', 'quente'] as const;

export const INTERACTION_TYPES = [
  { value: 'mensagem', label: 'Mensagem enviada' },
  { value: 'observação', label: 'Observação' },
  { value: 'reunião', label: 'Reunião' },
  { value: 'aula_gratuita', label: 'Envio de aula gratuita' },
  { value: 'proposta', label: 'Envio de proposta' },
] as const;

export const TASK_TYPES = [
  { value: 'responder', label: 'Responder' },
  { value: 'enviar_aula', label: 'Enviar aula gratuita' },
  { value: 'enviar_proposta', label: 'Enviar proposta' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'outro', label: 'Outro' },
] as const;
