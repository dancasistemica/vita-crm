import type { Config } from "tailwindcss";
import { designTokens } from './src/styles/design-tokens';

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "./index.html"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: designTokens.breakpoints,
    },
    extend: {
      colors: {
        ...designTokens.colors,
        // Aliases para Shadcn/ui (se usar)
        border: '#d4d4d4',
        input: '#e5e5e5',
        ring: '#0ea5e9',
        background: '#ffffff',
        foreground: '#171717',
        primary: {
          ...designTokens.colors.primary,
          DEFAULT: designTokens.colors.primary[500],
          foreground: '#ffffff',
        },
        secondary: {
          ...designTokens.colors.neutral,
          DEFAULT: designTokens.colors.neutral[200],
          foreground: designTokens.colors.foreground.default,
        },
        destructive: {
          ...designTokens.colors.error,
          DEFAULT: designTokens.colors.error[500],
          foreground: '#ffffff',
        },
        muted: {
          ...designTokens.colors.neutral,
          DEFAULT: designTokens.colors.neutral[100],
          foreground: designTokens.colors.foreground.secondary,
        },
        accent: {
          ...designTokens.colors.primary,
          DEFAULT: designTokens.colors.primary[500],
          foreground: '#ffffff',
        },
      },
      fontFamily: designTokens.typography.fonts,
      fontSize: designTokens.typography.fontSizes,
      fontWeight: designTokens.typography.fontWeights,
      lineHeight: designTokens.typography.lineHeights,
      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(8px)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(4px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "enter": "fade-in 0.3s ease-out, scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
