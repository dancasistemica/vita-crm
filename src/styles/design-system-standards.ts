// DESIGN SYSTEM STANDARDS - Padrões únicos para toda a aplicação
// Use este arquivo como referência para TODAS as páginas e componentes

export const designSystemStandards = {
  // ═══════════════════════════════════════════════════════════════
  // TIPOGRAFIA - Hierarquia de Títulos e Textos
  // ═══════════════════════════════════════════════════════════════

  typography: {
    // TÍTULOS DE PÁGINA (h1)
    pageTitle: {
      className: 'text-4xl font-bold text-neutral-900',
      description: 'Título principal da página (ex: "Vendas", "Clientes", "SuperAdmin")',
      usage: 'Sempre no topo da página, antes de qualquer conteúdo',
    },

    // TÍTULOS DE SEÇÃO (h2)
    sectionTitle: {
      className: 'text-2xl font-semibold text-neutral-900',
      description: 'Título de seção dentro da página',
      usage: 'Agrupa conteúdo relacionado (ex: "Informações do Cliente", "Vendas")',
    },

    // SUBTÍTULOS (h3)
    subtitle: {
      className: 'text-lg font-semibold text-neutral-700',
      description: 'Subtítulo ou título de subsseção',
      usage: 'Dentro de cards ou seções menores',
    },

    // LABELS DE FORMULÁRIO
    label: {
      className: 'text-sm font-medium text-neutral-700',
      description: 'Label de input, select, textarea',
      usage: 'Sempre acima do campo, com asterisco se obrigatório',
    },

    // TEXTO DO CORPO
    body: {
      className: 'text-base text-neutral-900',
      description: 'Texto padrão de corpo',
      usage: 'Descrições, conteúdo principal',
    },

    // TEXTO PEQUENO
    bodySmall: {
      className: 'text-sm text-neutral-600',
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
      className: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
      usage: 'Ação principal da página (ex: "Criar Venda", "Salvar", "Confirmar")',
      sizes: {
        sm: 'px-3 py-2 text-sm font-medium rounded-md',
        md: 'px-4 py-2 text-base font-medium rounded-lg',
        lg: 'px-6 py-3 text-lg font-semibold rounded-lg',
      },
    },

    // BOTÃO SECUNDÁRIO (Ação alternativa)
    secondary: {
      className: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 active:bg-neutral-400',
      usage: 'Ação secundária (ex: "Cancelar", "Voltar")',
      sizes: {
        sm: 'px-3 py-2 text-sm font-medium rounded-md',
        md: 'px-4 py-2 text-base font-medium rounded-lg',
        lg: 'px-6 py-3 text-lg font-semibold rounded-lg',
      },
    },

    // BOTÃO DE SUCESSO
    success: {
      className: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800',
      usage: 'Ação de confirmação/sucesso (ex: "Confirmar", "Aprovar")',
      sizes: {
        sm: 'px-3 py-2 text-sm font-medium rounded-md',
        md: 'px-4 py-2 text-base font-medium rounded-lg',
        lg: 'px-6 py-3 text-lg font-semibold rounded-lg',
      },
    },

    // BOTÃO DE ERRO/PERIGO
    error: {
      className: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800',
      usage: 'Ação destrutiva (ex: "Deletar", "Remover", "Cancelar Venda")',
      sizes: {
        sm: 'px-3 py-2 text-sm font-medium rounded-md',
        md: 'px-4 py-2 text-base font-medium rounded-lg',
        lg: 'px-6 py-3 text-lg font-semibold rounded-lg',
      },
    },

    // BOTÃO GHOST (Apenas texto/ícone)
    ghost: {
      className: 'bg-transparent text-primary-600 hover:bg-primary-50 active:bg-primary-100',
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
            <h1 className="text-4xl font-bold text-neutral-900">Título da Página</h1>
            <p className="text-sm text-neutral-600 mt-1">Descrição opcional</p>
          </div>
          <button className="bg-primary-600 text-white px-6 py-3 rounded-lg">
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
        <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
        className: 'text-neutral-900',
        usage: 'Texto principal, títulos e corpo',
      },
      secondary: {
        className: 'text-neutral-700',
        usage: 'Subtítulos, labels e conteúdo de apoio',
      },
      muted: {
        className: 'text-neutral-600',
        usage: 'Metadados, descrições curtas, placeholders',
      },
      subtle: {
        className: 'text-neutral-500',
        usage: 'Notas discretas, timestamps',
      },
      inverse: {
        className: 'text-white',
        usage: 'Texto sobre backgrounds escuros ou primários',
      },
    },

    // BACKGROUNDS
    background: {
      page: {
        className: 'bg-neutral-50',
        usage: 'Background global de páginas',
      },
      card: {
        className: 'bg-white',
        usage: 'Cards, filtros e áreas elevadas',
      },
      muted: {
        className: 'bg-neutral-100',
        usage: 'Blocos secundários e painéis de apoio',
      },
      primarySoft: {
        className: 'bg-primary-50',
        usage: 'Destaques suaves e callouts informativos',
      },
      successSoft: {
        className: 'bg-success-50',
        usage: 'Mensagens de sucesso e confirmações',
      },
      warningSoft: {
        className: 'bg-warning-50',
        usage: 'Avisos e alertas não críticos',
      },
      errorSoft: {
        className: 'bg-error-50',
        usage: 'Erros e estados destrutivos',
      },
    },

    // BORDAS E DIVISORES
    border: {
      default: {
        className: 'border border-neutral-200',
        usage: 'Borda padrão de inputs, cards e tabelas',
      },
      strong: {
        className: 'border border-neutral-300',
        usage: 'Borda de destaque e componentes ativos',
      },
      subtle: {
        className: 'border border-neutral-100',
        usage: 'Divisores leves em listas e seções',
      },
      error: {
        className: 'border border-error-500',
        usage: 'Inputs e cards em estado de erro',
      },
    },

    // ESTADOS DE INTERAÇÃO
    state: {
      hover: {
        className: 'hover:bg-neutral-50',
        usage: 'Hover em linhas de tabela e listas',
      },
      active: {
        className: 'active:bg-neutral-100',
        usage: 'Press state de botões e itens interativos',
      },
      focus: {
        className: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        usage: 'Focus visível em inputs e botões',
      },
      disabled: {
        className: 'bg-neutral-100 text-neutral-500',
        usage: 'Componentes desabilitados',
      },
    },

    // STATUS/FEEDBACK
    status: {
      info: {
        className: 'bg-primary-50 text-primary-700 border border-primary-200',
        usage: 'Mensagens informativas e dicas',
      },
      success: {
        className: 'bg-success-50 text-success-700 border border-success-200',
        usage: 'Feedback positivo e confirmações',
      },
      warning: {
        className: 'bg-warning-50 text-warning-700 border border-warning-200',
        usage: 'Avisos e alertas moderados',
      },
      error: {
        className: 'bg-error-50 text-error-700 border border-error-200',
        usage: 'Erros e ações destrutivas',
      },
    },
  },
};
