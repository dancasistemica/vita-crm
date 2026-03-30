// Design Tokens Globais - Padrão para todas as organizações
export const designTokens = {
  // CORES PRIMÁRIAS
  colors: {
    // Paleta Principal (Azul Profissional)
    primary: {
      50: '#f0f7ff',
      100: '#e0effe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Cor primária
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c3d66',
    },
    
    // Paleta Secundária (Verde Sucesso)
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Verde sucesso
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#145231',
    },
    
    // Paleta de Aviso (Laranja)
    warning: {
      50: '#fff7ed',
      100: '#fee2e2',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // Laranja aviso
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    
    // Paleta de Erro (Vermelho)
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Vermelho erro
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Paleta Neutra (Cinza)
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    
    // Cores Especiais
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  },

  // TIPOGRAFIAS
  typography: {
    // Fontes
    fonts: {
      sans: [
        'Inter',
        'system-ui',
        '-apple-system',
        'sans-serif',
      ],
      mono: [
        'Fira Code',
        'monospace',
      ],
    },

    // Tamanhos de Fonte
    fontSizes: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },

    // Pesos de Fonte
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    // Alturas de Linha
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },

    // Estilos de Texto Pré-definidos
    styles: {
      // Títulos
      h1: {
        fontSize: '3rem',      // 48px
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontSize: '2.25rem',   // 36px
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontSize: '1.875rem',  // 30px
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h4: {
        fontSize: '1.5rem',    // 24px
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',   // 20px
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1.125rem',  // 18px
        fontWeight: 600,
        lineHeight: 1.5,
      },

      // Corpo de Texto
      body: {
        fontSize: '1rem',      // 16px
        fontWeight: 400,
        lineHeight: 1.5,
      },
      bodySmall: {
        fontSize: '0.875rem',  // 14px
        fontWeight: 400,
        lineHeight: 1.5,
      },
      bodyXSmall: {
        fontSize: '0.75rem',   // 12px
        fontWeight: 400,
        lineHeight: 1.5,
      },

      // Botões
      button: {
        fontSize: '1rem',      // 16px
        fontWeight: 600,
        lineHeight: 1.5,
      },
      buttonSmall: {
        fontSize: '0.875rem',  // 14px
        fontWeight: 600,
        lineHeight: 1.5,
      },

      // Labels
      label: {
        fontSize: '0.875rem',  // 14px
        fontWeight: 500,
        lineHeight: 1.5,
      },

      // Captions
      caption: {
        fontSize: '0.75rem',   // 12px
        fontWeight: 400,
        lineHeight: 1.5,
      },
    },
  },

  // ESPAÇAMENTOS
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // BORDAS
  borderRadius: {
    none: '0',
    sm: '0.25rem',  // 4px
    base: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // SOMBRAS
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },

  // TRANSIÇÕES
  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // BREAKPOINTS
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Tipos para TypeScript
export type DesignToken = typeof designTokens;
