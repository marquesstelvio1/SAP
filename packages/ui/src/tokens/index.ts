export const semanticColorTokens = {
  background: "var(--background)",
  foreground: "var(--foreground)",
  card: "var(--card)",
  cardForeground: "var(--card-foreground)",
  popover: "var(--popover)",
  popoverForeground: "var(--popover-foreground)",
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  secondary: "var(--secondary)",
  secondaryForeground: "var(--secondary-foreground)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  accent: "var(--accent)",
  accentForeground: "var(--accent-foreground)",
  destructive: "var(--destructive)",
  destructiveForeground: "var(--destructive-foreground)",
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",
} as const;

export const operationalStatusTokens = {
  success: "var(--success)",
  successForeground: "var(--success-foreground)",
  warning: "var(--warning)",
  warningForeground: "var(--warning-foreground)",
  risk: "var(--risk)",
  riskForeground: "var(--risk-foreground)",
  info: "var(--info)",
  infoForeground: "var(--info-foreground)",
} as const;

export const typographyTokens = {
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
  numeric: "var(--font-numeric)",
  headingTracking: "var(--tracking-heading)",
  labelTracking: "var(--tracking-label)",
} as const;

export const densityTokens = {
  comfortable: {
    controlHeight: "var(--density-comfortable-control-height)",
    rowHeight: "var(--density-comfortable-row-height)",
    panelPadding: "var(--density-comfortable-panel-padding)",
  },
  compact: {
    controlHeight: "var(--density-compact-control-height)",
    rowHeight: "var(--density-compact-row-height)",
    panelPadding: "var(--density-compact-panel-padding)",
  },
  operational: {
    controlHeight: "var(--density-operational-control-height)",
    rowHeight: "var(--density-operational-row-height)",
    panelPadding: "var(--density-operational-panel-padding)",
  },
} as const;

export const radiusTokens = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
} as const;

export const elevationTokens = {
  panel: "var(--shadow-panel)",
  overlay: "var(--shadow-overlay)",
  command: "var(--shadow-command)",
  sticky: "var(--shadow-sticky)",
} as const;

export const spacingTokens = {
  0: "var(--space-0)",
  0.5: "var(--space-0\\.5)",
  1: "var(--space-1)",
  1.5: "var(--space-1\\.5)",
  2: "var(--space-2)",
  2.5: "var(--space-2\\.5)",
  3: "var(--space-3)",
  3.5: "var(--space-3\\.5)",
  4: "var(--space-4)",
  5: "var(--space-5)",
  6: "var(--space-6)",
  7: "var(--space-7)",
  8: "var(--space-8)",
  9: "var(--space-9)",
  10: "var(--space-10)",
  11: "var(--space-11)",
  12: "var(--space-12)",
  14: "var(--space-14)",
  16: "var(--space-16)",
  20: "var(--space-20)",
  24: "var(--space-24)",
  28: "var(--space-28)",
  32: "var(--space-32)",
} as const;

export const motionTokens = {
  durationFast: "var(--motion-duration-fast)",
  durationNormal: "var(--motion-duration-normal)",
  durationSlow: "var(--motion-duration-slow)",
  easeLinear: "var(--motion-ease-linear)",
  easeIn: "var(--motion-ease-in)",
  easeOut: "var(--motion-ease-out)",
  easeInOut: "var(--motion-ease-in-out)",
} as const;

export const zIndexTokens = {
  base: "var(--z-base)",
  dropdown: "var(--z-dropdown)",
  sticky: "var(--z-sticky)",
  overlay: "var(--z-overlay)",
  modal: "var(--z-modal)",
  popover: "var(--z-popover)",
  toast: "var(--z-toast)",
  command: "var(--z-command)",
} as const;

export type SemanticColorToken = keyof typeof semanticColorTokens;
export type OperationalStatusToken = keyof typeof operationalStatusTokens;
export type DensityToken = keyof typeof densityTokens;
