export interface DashboardCardConfig {
  id: string;
  title: string;
  description: string;
  defaultPosition: number;
  defaultVisible: boolean;
  group: 'leads' | 'financeiro' | 'tarefas' | 'clientes' | 'pipeline' | 'analytics' | 'executivo';
}

export const DASHBOARD_CARDS: DashboardCardConfig[] = [
  // Grupo: Executivo
  { id: 'executive_metrics',   title: 'Resumo Executivo',        description: 'Métricas consolidadas de faturamento, presença, alertas e integrações', defaultPosition: 0,  defaultVisible: true,  group: 'executivo' },
  { id: 'quick_actions',       title: 'Ações Rápidas',           description: 'Atalhos para tarefas frequentes do executivo',                 defaultPosition: 1,  defaultVisible: true,  group: 'executivo' },
  { id: 'sales_detailed',      title: 'Vendas Detalhadas',       description: 'Gráfico de status de vendas e ticket médio',                    defaultPosition: 2,  defaultVisible: true,  group: 'executivo' },
  { id: 'attendance_detailed', title: 'Presença Detalhada',      description: 'Engajamento de alunos e taxa de presença',                     defaultPosition: 3,  defaultVisible: true,  group: 'executivo' },
  { id: 'alerts_summary',      title: 'Sumário de Alertas',      description: 'Visão geral de alertas críticos, médios e baixos',             defaultPosition: 4,  defaultVisible: true,  group: 'executivo' },
  { id: 'integration_status',  title: 'Status de Integração',    description: 'Conectividade e última sincronização das plataformas',         defaultPosition: 5,  defaultVisible: true,  group: 'executivo' },

  // Grupo: Leads
  { id: 'metrics_grid',        title: 'Cards de Métricas',       description: 'Total de leads, clientes, conversão, receita e ticket médio', defaultPosition: 6,  defaultVisible: true,  group: 'leads' },
  { id: 'leads_por_estagio',   title: 'Leads por Estágio',       description: 'Gráfico de barras com distribuição dos leads no funil de vendas',     defaultPosition: 7,  defaultVisible: true,  group: 'leads' },
  { id: 'leads_por_origem',    title: 'Leads por Origem',        description: 'Gráfico de pizza com leads por canal de origem',               defaultPosition: 8,  defaultVisible: true,  group: 'leads' },

  // Grupo: Financeiro
  { id: 'receita_por_produto', title: 'Receita por Produto',     description: 'Gráfico de barras com receita por produto',                    defaultPosition: 9,  defaultVisible: true,  group: 'financeiro' },
  { id: 'top_produtos',        title: 'Top 5 Produtos',          description: 'Ranking dos 5 produtos com maior receita',                     defaultPosition: 10, defaultVisible: true,  group: 'financeiro' },
  { id: 'vendas_recentes',     title: 'Vendas Recentes',         description: 'Evolução das vendas no período selecionado',                   defaultPosition: 11, defaultVisible: true,  group: 'financeiro' },

  // Grupo: Tarefas
  { id: 'tarefas_metricas',    title: 'Tarefas Vencidas e Pendentes', description: 'Cards com tarefas vencidas e pendentes da organização', defaultPosition: 12, defaultVisible: true,  group: 'tarefas' },

  // Grupo: Pipeline
  { id: 'leads_parados',       title: 'Leads Parados',           description: 'Alerta de leads sem atividade recente no funil de vendas',            defaultPosition: 13, defaultVisible: true,  group: 'pipeline' },
  { id: 'metricas_estagio',    title: 'Métricas por Etapa',      description: 'Tempo médio e taxa de conversão por etapa do funil',           defaultPosition: 14, defaultVisible: true,  group: 'pipeline' },

  // Grupo: Analytics
  { id: 'resumo_ia',           title: 'Resumo Semanal IA',       description: 'Análise inteligente semanal gerada por IA',                   defaultPosition: 15, defaultVisible: true,  group: 'analytics' },
  { id: 'insights_produtos',   title: 'Insights de Produtos',    description: 'Análise detalhada de performance dos produtos',                defaultPosition: 16, defaultVisible: true,  group: 'analytics' },
];

export const GROUP_LABELS: Record<string, string> = {
  executivo: '💼 Executivo',
  leads: '📊 Leads',
  financeiro: '💰 Financeiro',
  tarefas: '✅ Tarefas',
  clientes: '👥 Clientes',
  pipeline: '🔄 Funil de Vendas',
  analytics: '🤖 Analytics',
};
