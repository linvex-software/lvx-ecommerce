export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
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
        accent: 'var(--color-accent)',
        neutral: 'var(--color-neutral)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
      },
    }
  },
  plugins: []
}

