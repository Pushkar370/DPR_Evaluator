/**
 * Theme Constants
 * Centralized color palette, dimensions, and design tokens
 */

// Brand Colors
export const COLORS = {
  // Primary Government Colors
  primary: '#0f2c59',
  secondary: '#ff9933',
  
  // Status Colors
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  
  // Chart Colors
  chartPrimary: '#0f2c59',
  chartSecondary: '#ff9933',
  chartTertiary: '#138808',
  
  // Risk Level Colors
  riskHigh: '#d32f2f',
  riskMedium: '#ed6c02',
  riskLow: '#2e7d32',
  
  // UI Colors
  background: '#f8f9fa',
  backgroundLight: '#f5f7fa',
  border: '#e0e0e0',
  text: '#333',
  textSecondary: '#757575',
  
  // Government Branding
  govBlue: '#0B3C5D',
  govSaffron: '#ff9933',
  govGreen: '#138808',
} as const;

// Layout Dimensions
export const DIMENSIONS = {
  sidebarWidth: 260,
  sidebarCollapsedWidth: 65,
  headerHeight: 64,
  footerHeight: 60,
} as const;

// Z-Index Layers
export const Z_INDEX = {
  drawer: 1200,
  modal: 1300,
  chatbot: 1400,
  tooltip: 1500,
} as const;

// Border Radius
export const BORDER_RADIUS = {
  small: 1,
  medium: 2,
  large: 3,
  circle: '50%',
} as const;

// Shadows
export const SHADOWS = {
  card: '0 4px 20px 0 rgba(0,0,0,0.05)',
  cardHover: '0 8px 25px 0 rgba(0,0,0,0.1)',
  small: '0 2px 10px rgba(0,0,0,0.05)',
} as const;

// Transitions
export const TRANSITIONS = {
  default: 'all 0.2s',
  slow: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fast: 'all 0.15s',
} as const;
