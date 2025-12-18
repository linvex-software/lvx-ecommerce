/**
 * Design System Tokens - White Label Admin
 *
 * Design system profissional baseado em Shopify/Vercel/Stripe Dashboard.
 * Suporta apenas Light Mode (white) e Dark Mode (true black).
 */

// ============================================
// CORES - LIGHT MODE
// ============================================
export const lightColors = {
  // Backgrounds
  background: '#FFFFFF',
  surface: '#FAFAFA',
  surface2: '#F5F5F5',

  // Borders
  border: '#E5E5E5',
  borderHover: '#D0D0D0',

  // Text
  textPrimary: '#111111',
  textSecondary: '#555555',
  textTertiary: '#999999',

  // Inputs
  inputBackground: '#FFFFFF',
  inputBorder: '#D0D0D0',
  inputBorderFocus: '#3B82F6',

  // Hover
  hover: 'rgba(0, 0, 0, 0.04)',
  hoverStrong: 'rgba(0, 0, 0, 0.08)',
} as const

// ============================================
// CORES - DARK MODE (TRUE BLACK)
// ============================================
export const darkColors = {
  // Backgrounds
  background: '#000000',
  surface: '#0A0A0A',
  surface2: '#111111',

  // Borders
  border: '#222222',
  borderHover: '#2A2A2A',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1A1',
  textTertiary: '#666666',

  // Inputs
  inputBackground: '#0F0F0F',
  inputBorder: '#2A2A2A',
  inputBorderFocus: '#3B82F6',

  // Hover
  hover: 'rgba(255, 255, 255, 0.05)',
  hoverStrong: 'rgba(255, 255, 255, 0.1)',
} as const

// ============================================
// CORES - BRAND & SUPPORT
// ============================================
export const brandColors = {
  primary: '#3B82F6',      // Azul SaaS
  primaryHover: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryDark: '#1E40AF',

  error: '#EF4444',
  errorHover: '#DC2626',
  errorLight: '#FEE2E2',
  errorDark: '#B91C1C',

  warning: '#F59E0B',
  warningHover: '#D97706',
  warningLight: '#FEF3C7',
  warningDark: '#B45309',

  success: '#10B981',
  successHover: '#059669',
  successLight: '#D1FAE5',
  successDark: '#047857',
} as const

// ============================================
// ESPAÇAMENTOS
// ============================================
export const spacing = {
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
} as const

// ============================================
// TIPOGRAFIA
// ============================================
export const typography = {
  fontFamily: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },

  fontSize: {
    titleXL: '28px',      // H1
    titleL: '22px',       // H2
    subtitle: '16px',    // Subtitle
    body: '15px',         // Body
    label: '14px',       // Label
    small: '13px',        // Small
  },

  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    titleXL: '1.2',
    titleL: '1.3',
    subtitle: '1.5',
    body: '1.5',
    label: '1.4',
    small: '1.4',
  },
} as const

// ============================================
// BORDAS
// ============================================
export const borderRadius = {
  none: '0',
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '16px',
  full: '9999px',
} as const

// ============================================
// SOMBRAS
// ============================================
export const shadows = {
  light: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  },
  dark: {
    // No dark mode, não usamos sombras - apenas contraste por cor
    sm: 'none',
    base: 'none',
    md: 'none',
    lg: 'none',
  },
} as const

// ============================================
// TRANSIÇÕES
// ============================================
export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
  },
} as const

// ============================================
// Z-INDEX
// ============================================
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const
