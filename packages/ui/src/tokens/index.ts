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

export type SemanticColorToken = keyof typeof semanticColorTokens;
export type OperationalStatusToken = keyof typeof operationalStatusTokens;
export type DensityToken = keyof typeof densityTokens;
