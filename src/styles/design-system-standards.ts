// DESIGN SYSTEM STANDARDS - Padrões únicos para toda a aplicação
// Use este arquivo como referência para TODAS as páginas e componentes

export const designSystemStandards = {
  // ═══════════════════════════════════════════════════════════════
  // TIPOGRAFIA - Hierarquia de Títulos e Textos
  // ═══════════════════════════════════════════════════════════════

  typography: {
    // TÍTULOS DE PÁGINA (h1)
    pageTitle: {
      className: 'text-4xl font-bold text-foreground',
      description: 'Título principal da página (ex: "Vendas", "Clientes", "SuperAdmin")',
      usage: 'Sempre no topo da página, antes de qualquer conteúdo',
    },

    // TÍTULOS DE SEÇÃO (h2)
    sectionTitle: {
      className: 'text-2xl font-semibold text-foreground',
      description: 'Título de seção dentro da página',
      usage: 'Agrupa conteúdo relacionado (ex: "Informações do Cliente", "Vendas")',
    },

    // SUBTÍTULOS (h3)
    subtitle: {
      className: 'text-lg font-semibold text-muted-foreground',
      description: 'Subtítulo ou título de subsseção',
      usage: 'Dentro de cards ou seções menores',
    },

    // LABELS DE FORMULÁRIO
    label: {
      className: 'text-sm font-medium text-muted-foreground',
      description: 'Label de input, select, textarea',
      usage: 'Sempre acima do campo, com asterisco se obrigatório',
    },

    // TEXTO DO CORPO
    body: {
      className: 'text-base text-foreground',
      description: 'Texto padrão de corpo',
      usage: 'Descrições, conteúdo principal',
    },

    // TEXTO PEQUENO
    bodySmall: {
      className: 'text-sm text-muted-foreground',
      description: 'Texto pequeno, helper text, captions',
      usage: 'Dicas, mensagens de ajuda, datas',
    },

    // TEXTO MUITO PEQUENO
    bodyXSmall: {
      className: 'text-xs text-neutral-500',
      description: 'Texto mínimo',
      usage: 'Timestamps, metadata',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // BOTÕES - Estilos e Posicionamento
  // ═══════════════════════════════════════════════════════════════

  buttons: {
    // BOTÃO PRIMÁRIO (Ação principal)
    primary: {
      className: 'bg-primary text-primary-foreground hover:opacity-90 active:opacity-80',
      usage: 'Ação principal da página (ex: "Criar Venda", "Salvar", "Confirmar")',
      sizes: {
        sm: 'px-3 py-2 text-sm font-medium rounded-md',
        md: 'px-4 py-2 text-base font-medium rounded-lg',
        lg: 'px-6 py-3 text-lg font-semibold rounded-lg',
      },
    },

    // BOTÃO SECUNDÁRIO (Ação alternativa)
    secondary: {
      className: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
      usage: 'Ação secundária (ex: "Cancelar", "Voltar")',
      sizes: {
        sm: 'px-3 py-2 text-sm font-medium rounded-md',
        md: 'px-4 py-2 text-base font-medium rounded-lg',
        lg: 'px-6 py-3 text-lg font-semibold rounded-lg',
      },
    },

    // BOTÃO DE SUCESSO
    success: {
      className: 'bg-success text-success-foreground hover:opacity-90 active:opacity-80',
      usage: 'Ação de confirmação/sucesso (ex: "Confirmar", "Aprovar")',
      sizes: {
        sm: 'px-3 py-2 text-sm font-medium rounded-md',
        md: 'px-4 py-2 text-base font-medium rounded-lg',
        lg: 'px-6 py-3 text-lg font-semibold rounded-lg',
      },
    },

    // BOTÃO DE ERRO/PERIGO
    error: {
      className: 'bg-destructive text-destructive-foreground hover:opacity-90 active:opacity-80',
      usage: 'Ação destrutiva (ex: "Deletar", "Remover", "Cancelar Venda")',
      sizes: {
        sm: 'px-3 py-2 text-sm font-medium rounded-md',
        md: 'px-4 py-2 text-base font-medium rounded-lg',
        lg: 'px-6 py-3 text-lg font-semibold rounded-lg',
      },
    },

    // BOTÃO GHOST (Apenas texto/ícone)
    ghost: {
      className: 'bg-transparent text-primary hover:bg-primary/10 active:bg-primary/20',
      usage: 'Ação terciária (ex: "Editar", "Ver Mais")',
      sizes: {
        sm: 'px-3 py-2 text-sm font-medium rounded-md',
        md: 'px-4 py-2 text-base font-medium rounded-lg',
        lg: 'px-6 py-3 text-lg font-semibold rounded-lg',
      },
    },

    // POSICIONAMENTO DE BOTÕES
    positioning: {
      primary: {
        description: 'Botão de ação principal (criar, salvar, confirmar)',
        position: 'Canto superior direito ou rodapé de modal',
        example: 'VendasPage: "+ Nova Venda" no topo direito',
      },
      secondary: {
        description: 'Botão de ação secundária (cancelar, voltar)',
        position: 'Ao lado do botão primário, sempre à direita',
        example: 'Modal: "Cancelar" à direita de "Salvar"',
      },
      destructive: {
        description: 'Botão de deletar/remover',
        position: 'Sempre à esquerda em modals, ou em linha com item',
        example: 'Card de venda: ícone de lixeira à esquerda do item',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // ESPAÇAMENTOS - Padding, Margin, Gap
  // ═══════════════════════════════════════════════════════════════

  spacing: {
    // CONTAINER PRINCIPAL
    pageContainer: {
      className: 'p-6 space-y-6',
      description: 'Padding padrão para páginas',
      mobile: 'p-4 space-y-4',
    },

    // CARD INTERNO
    cardPadding: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },

    // ESPAÇO ENTRE ELEMENTOS
    gap: {
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
    },

    // SEÇÕES
    sectionSpacing: {
      description: 'Espaço entre seções principais',
      className: 'space-y-6',
      mobile: 'space-y-4',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // LAYOUT PADRÃO - Estrutura de Página
  // ═══════════════════════════════════════════════════════════════

  layout: {
    // HEADER DE PÁGINA
    pageHeader: {
      structure: `
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Título da Página</h1>
            <p className="text-sm text-muted-foreground mt-1">Descrição opcional</p>
          </div>
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90">
            + Ação Principal
          </button>
        </div>
      `,
      description: 'Título à esquerda, botão de ação à direita',
      usage: 'Todas as páginas principais (Vendas, Clientes, etc)',
    },

    // FILTROS E BUSCA
    filterBar: {
      structure: `
        <div className="bg-card rounded-lg border border-border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Buscar..." />
            <Select label="Filtro 1" options={[...]} />
            <Select label="Filtro 2" options={[...]} />
          </div>
        </div>
      `,
      description: 'Card com filtros em grid responsivo',
      usage: 'Abaixo do header, antes da tabela/lista',
      positioning: 'Sempre ABAIXO do header, ACIMA do conteúdo',
    },

    // TABELA/LISTA
    contentArea: {
      structure: `
        <Card variant="elevated">
          <table className="w-full">
            {/* conteúdo */}
          </table>
        </Card>
      `,
      description: 'Conteúdo principal em card elevado',
      usage: 'Tabelas, listas, gráficos',
    },

    // MODAL/FORMULÁRIO
    modalLayout: {
      structure: `
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Título do Modal</h2>
              {/* formulário */}
              <div className="flex gap-3 pt-4 border-t">
                <button variant="secondary">Cancelar</button>
                <button variant="primary">Salvar</button>
              </div>
            </div>
          </Card>
        </div>
      `,
      description: 'Modal com título, conteúdo e botões',
      buttonOrder: 'Cancelar (esquerda) → Salvar (direita)',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // CORES - Uso Semântico
  // ═══════════════════════════════════════════════════════════════

  colors: {
    // TEXTO
    text: {
      primary: {
        className: 'text-foreground',
        usage: 'Texto principal, títulos e corpo',
      },
      secondary: {
        className: 'text-muted-foreground',
        usage: 'Subtítulos, labels e conteúdo de apoio',
      },
      muted: {
        className: 'text-muted-foreground/80',
        usage: 'Metadados, descrições curtas, placeholders',
      },
      subtle: {
        className: 'text-muted-foreground/60',
        usage: 'Notas discretas, timestamps',
      },
      inverse: {
        className: 'text-primary-foreground',
        usage: 'Texto sobre backgrounds escuros ou primários',
      },
    },

    // BACKGROUNDS
    background: {
      page: {
        className: 'bg-background',
        usage: 'Background global de páginas',
      },
      card: {
        className: 'bg-card',
        usage: 'Cards, filtros e áreas elevadas',
      },
      muted: {
        className: 'bg-muted',
        usage: 'Blocos secundários e painéis de apoio',
      },
      primarySoft: {
        className: 'bg-primary/10',
        usage: 'Destaques suaves e callouts informativos',
      },
      successSoft: {
        className: 'bg-success/10',
        usage: 'Mensagens de sucesso e confirmações',
      },
      warningSoft: {
        className: 'bg-warning/10',
        usage: 'Avisos e alertas não críticos',
      },
      errorSoft: {
        className: 'bg-destructive/10',
        usage: 'Erros e estados destrutivos',
      },
    },

    // BORDAS E DIVISORES
    border: {
      default: {
        className: 'border border-border',
        usage: 'Borda padrão de inputs, cards e tabelas',
      },
      strong: {
        className: 'border border-border/80',
        usage: 'Borda de destaque e componentes ativos',
      },
      subtle: {
        className: 'border border-border/40',
        usage: 'Divisores leves em listas e seções',
      },
      error: {
        className: 'border border-destructive',
        usage: 'Inputs e cards em estado de erro',
      },
    },

    // ESTADOS DE INTERAÇÃO
    state: {
      hover: {
        className: 'hover:bg-muted/50',
        usage: 'Hover em linhas de tabela e listas',
      },
      active: {
        className: 'active:bg-muted',
        usage: 'Press state de botões e itens interativos',
      },
      focus: {
        className: 'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
        usage: 'Focus visível em inputs e botões',
      },
      disabled: {
        className: 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed',
        usage: 'Componentes desabilitados',
      },
    },

    // STATUS/FEEDBACK
    status: {
      info: {
        className: 'bg-info/10 text-info border border-info/20',
        usage: 'Mensagens informativas e dicas',
      },
      success: {
        className: 'bg-success/10 text-success border border-success/20',
        usage: 'Feedback positivo e confirmações',
      },
      warning: {
        className: 'bg-warning/10 text-warning border border-warning/20',
        usage: 'Avisos e alertas moderados',
      },
      error: {
        className: 'bg-destructive/10 text-destructive border border-destructive/20',
        usage: 'Erros e ações destrutivas',
      },
    },
  },
};
