export default {
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
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
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
        // Template Flor de Menina colors - EXATAMENTE como na web
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
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
        body: 'var(--font-body)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        full: '9999px',
      },
    }
  },
  plugins: []
}

