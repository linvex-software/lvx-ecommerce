/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../templates/**/*.{ts,tsx}',
    '../../apps/web/components/template/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Design System Colors
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'input-background': 'var(--input-background)',
        'input-border': 'var(--input-border)',
        'input-border-focus': 'var(--input-border-focus)',
        hover: 'var(--hover)',
        'hover-strong': 'var(--hover-strong)',

        // Brand Colors
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
        },

        // Support Colors
        error: {
          DEFAULT: 'var(--error)',
          hover: 'var(--error-hover)',
          light: 'var(--error-light)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          hover: 'var(--warning-hover)',
          light: 'var(--warning-light)',
        },
        success: {
          DEFAULT: 'var(--success)',
          hover: 'var(--success-hover)',
          light: 'var(--success-light)',
        },

        // Legacy compatibility
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        ring: 'var(--ring)',
        input: 'var(--input-border)',

        // Template colors (mantido para compatibilidade)
        'highlight-light': 'var(--color-hightlight-light)',
        'accent-light': 'var(--color-accent-light)',
        'primary-light': 'var(--color-primary-light)',
        'secondary-light': 'var(--color-secondary-light)',
        'primary-content': 'var(--color-primary-content)',
        'secondary-content': 'var(--color-secondary-content)',
        'accent-content': 'var(--color-accent-content)',
        'neutral-content': 'var(--color-neutral-content)',
        'base-100': 'var(--color-base-100)',
        'base-200': 'var(--color-base-200)',
        'base-300': 'var(--color-base-300)',
        'base-content': 'var(--color-base-content)',
        highlight: 'var(--color-highlight)',
        neutral: 'var(--color-neutral)',
        gold: 'hsl(var(--gold))',
        'gold-light': 'hsl(var(--gold-light))',
        wine: 'hsl(var(--wine))',
        'wine-dark': 'hsl(var(--wine-dark))',
        'wine-light': 'hsl(var(--wine-light))',
        cream: 'hsl(var(--cream))',
        beige: 'hsl(var(--beige))',
        charcoal: 'hsl(var(--charcoal))',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'title-xl': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'title-l': ['22px', { lineHeight: '1.3', fontWeight: '700' }],
        subtitle: ['16px', { lineHeight: '1.5', fontWeight: '500' }],
        body: ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        label: ['14px', { lineHeight: '1.4', fontWeight: '600' }],
        small: ['13px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        0: '0',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        base: '8px',
        md: '12px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
    }
  },
  plugins: []
}
