export interface Token {
  name: string;
  variable: string;
  value: string;
  description?: string;
}

export interface TokenGroup {
  id: string;
  label: string;
  type: "color" | "spacing" | "typography" | "radius" | "shadow" | "motion";
  tokens: Token[];
}

export const DARK_CHART_TOKENS: Token[] = [
  { name: "Chart Dark 1 (Blue)", variable: "--chart-cat-1-dark", value: "#60a5fa", description: "Blue 400 - 8.5:1 WCAG AA contrast on #020617 surface" },
  { name: "Chart Dark 2 (Emerald)", variable: "--chart-cat-2-dark", value: "#34d399", description: "Emerald 400 - 10.2:1 WCAG AA contrast on #020617 surface" },
  { name: "Chart Dark 3 (Amber)", variable: "--chart-cat-3-dark", value: "#fbbf24", description: "Amber 400 - 11.8:1 WCAG AA contrast on #020617 surface" },
  { name: "Chart Dark 4 (Violet)", variable: "--chart-cat-4-dark", value: "#a78bfa", description: "Violet 400 - 7.4:1 WCAG AA contrast on #020617 surface" },
  { name: "Chart Dark 5 (Rose)", variable: "--chart-cat-5-dark", value: "#f87171", description: "Rose 400 - 6.8:1 WCAG AA contrast on #020617 surface" },
  { name: "Chart Dark 6 (Cyan)", variable: "--chart-cat-6-dark", value: "#22d3ee", description: "Cyan 400 - 11.0:1 WCAG AA contrast on #020617 surface" },
  { name: "Chart Dark 7 (Orange)", variable: "--chart-cat-7-dark", value: "#fb923c", description: "Orange 400 - 8.9:1 WCAG AA contrast on #020617 surface" },
  { name: "Chart Dark 8 (Pink)", variable: "--chart-cat-8-dark", value: "#f472b6", description: "Pink 400 - 7.7:1 WCAG AA contrast on #020617 surface" },
];

export const LIGHT_CHART_TOKENS: Token[] = [
  { name: "Chart Light 1 (Blue)", variable: "--chart-cat-1-light", value: "#2563eb", description: "Blue 600 - 4.6:1 WCAG AA contrast on #ffffff surface" },
  { name: "Chart Light 2 (Emerald)", variable: "--chart-cat-2-light", value: "#059669", description: "Emerald 600 - 4.5:1 WCAG AA contrast on #ffffff surface" },
  { name: "Chart Light 3 (Amber)", variable: "--chart-cat-3-light", value: "#d97706", description: "Amber 600 - 3.1:1 WCAG AA contrast on #ffffff surface" },
  { name: "Chart Light 4 (Violet)", variable: "--chart-cat-4-light", value: "#7c3aed", description: "Violet 600 - 5.8:1 WCAG AA contrast on #ffffff surface" },
  { name: "Chart Light 5 (Red)", variable: "--chart-cat-5-light", value: "#dc2626", description: "Red 600 - 4.5:1 WCAG AA contrast on #ffffff surface" },
  { name: "Chart Light 6 (Cyan)", variable: "--chart-cat-6-light", value: "#0891b2", description: "Cyan 600 - 3.4:1 WCAG AA contrast on #ffffff surface" },
  { name: "Chart Light 7 (Orange)", variable: "--chart-cat-7-light", value: "#ea580c", description: "Orange 600 - 4.8:1 WCAG AA contrast on #ffffff surface" },
  { name: "Chart Light 8 (Pink)", variable: "--chart-cat-8-light", value: "#be185d", description: "Pink 600 - 5.5:1 WCAG AA contrast on #ffffff surface" },
];

export const TOKEN_GROUPS: TokenGroup[] = [
  {
    id: "colors",
    label: "Colors",
    type: "color",
    tokens: [
      { name: "Primary", variable: "--primary", value: "#3b82f6", description: "Brand primary blue" },
      { name: "Primary Hover", variable: "--primary-hover", value: "#2563eb", description: "Primary interactive state" },
      { name: "Text Main", variable: "--text-main", value: "#e5e7eb", description: "Primary text" },
      { name: "Text Muted", variable: "--text-muted", value: "#cbd5e1", description: "Secondary text, WCAG AA on dark bg" },
      { name: "Text Accent", variable: "--text-accent", value: "#38bdf8", description: "Accent/highlight text" },
      { name: "Error", variable: "--error", value: "#ef4444", description: "Error / destructive" },
      { name: "Success", variable: "--success", value: "#10b981", description: "Positive feedback" },
      { name: "Background", variable: "--bg-color", value: "#020617", description: "App background base" },
      { name: "Glass BG", variable: "--glass-bg", value: "rgba(15,23,42,0.85)", description: "Glassmorphic surface" },
      { name: "Glass BG Accent", variable: "--glass-bg-accent", value: "rgba(30,41,59,0.5)", description: "Elevated glass surface" },
      { name: "Glass Border", variable: "--glass-border", value: "rgba(148,163,184,0.15)", description: "Subtle border" },
      { name: "Glass Border Bright", variable: "--glass-border-bright", value: "rgba(148,163,184,0.35)", description: "Hover/active border" },
      { name: "DS Empty Icon BG", variable: "--ds-empty-icon-bg", value: "rgba(59,130,246,0.08)", description: "Empty state icon well" },
      { name: "DS Error Icon BG", variable: "--ds-error-icon-bg", value: "rgba(239,68,68,0.08)", description: "Error state icon well" },
      { name: "Chart Tooltip BG", variable: "--chart-tooltip-bg", value: "#0f172a", description: "Dark surface for chart tooltips" },
      { name: "Chart Tooltip FG", variable: "--chart-tooltip-fg", value: "#f8fafc", description: "High contrast tooltip text" },
      { name: "Chart Tooltip Border", variable: "--chart-tooltip-border", value: "#334155", description: "Visible border on dark surface" },
      { name: "Chart Axis Label", variable: "--chart-axis-label-color", value: "#94a3b8", description: "WCAG AA contrast for axis text" },
      { name: "Chart Cat 1", variable: "--chart-cat-1", value: "#60a5fa", description: "Active categorical hue 1 (Blue)" },
      { name: "Chart Cat 2", variable: "--chart-cat-2", value: "#34d399", description: "Active categorical hue 2 (Emerald)" },
      { name: "Chart Cat 3", variable: "--chart-cat-3", value: "#fbbf24", description: "Active categorical hue 3 (Amber)" },
      { name: "Chart Cat 4", variable: "--chart-cat-4", value: "#a78bfa", description: "Active categorical hue 4 (Violet)" },
      { name: "Chart Cat 5", variable: "--chart-cat-5", value: "#f87171", description: "Active categorical hue 5 (Rose)" },
      { name: "Chart Cat 6", variable: "--chart-cat-6", value: "#22d3ee", description: "Active categorical hue 6 (Cyan)" },
      { name: "Chart Cat 7", variable: "--chart-cat-7", value: "#fb923c", description: "Active categorical hue 7 (Orange)" },
      { name: "Chart Cat 8", variable: "--chart-cat-8", value: "#f472b6", description: "Active categorical hue 8 (Pink)" },
    ],
  },
  {
    id: "chart-colors-dark",
    label: "Chart Categorical Palette (Dark Mode)",
    type: "color",
    tokens: DARK_CHART_TOKENS,
  },
  {
    id: "chart-colors-light",
    label: "Chart Categorical Palette (Light Mode)",
    type: "color",
    tokens: LIGHT_CHART_TOKENS,
  },
  {
    id: "spacing",
    label: "Spacing",
    type: "spacing",
    tokens: [
      { name: "3XS", variable: "--spacing-3xs", value: "0.125rem", description: "2px" },
      { name: "2XS", variable: "--spacing-2xs", value: "0.25rem", description: "4px" },
      { name: "XS", variable: "--spacing-xs", value: "0.5rem", description: "8px" },
      { name: "SM", variable: "--spacing-sm", value: "0.75rem", description: "12px" },
      { name: "MD", variable: "--spacing-md", value: "1rem", description: "16px" },
      { name: "LG", variable: "--spacing-lg", value: "1.25rem", description: "20px" },
      { name: "XL", variable: "--spacing-xl", value: "1.5rem", description: "24px" },
      { name: "2XL", variable: "--spacing-2xl", value: "2rem", description: "32px" },
      { name: "3XL", variable: "--spacing-3xl", value: "3rem", description: "48px" },
      { name: "4XL", variable: "--spacing-4xl", value: "4rem", description: "64px" },
    ],
  },
  {
    id: "radius",
    label: "Border Radius",
    type: "radius",
    tokens: [
      { name: "XS", variable: "--radius-xs", value: "0.25rem", description: "4px" },
      { name: "SM", variable: "--radius-sm", value: "0.375rem", description: "6px" },
      { name: "MD", variable: "--radius-md", value: "0.5rem", description: "8px" },
      { name: "LG", variable: "--radius-lg", value: "0.75rem", description: "12px" },
      { name: "XL", variable: "--radius-xl", value: "1rem", description: "16px" },
      { name: "2XL", variable: "--radius-2xl", value: "1.5rem", description: "24px" },
      { name: "Full", variable: "--radius-full", value: "9999px", description: "Pill shape" },
    ],
  },
  {
    id: "typography",
    label: "Typography",
    type: "typography",
    tokens: [
      { name: "Size XS", variable: "--font-size-xs", value: "0.75rem", description: "12px" },
      { name: "Size SM", variable: "--font-size-sm", value: "0.875rem", description: "14px" },
      { name: "Size Base", variable: "--font-size-base", value: "1rem", description: "16px" },
      { name: "Size LG", variable: "--font-size-lg", value: "1.125rem", description: "18px" },
      { name: "Size XL", variable: "--font-size-xl", value: "1.25rem", description: "20px" },
      { name: "Size 2XL", variable: "--font-size-2xl", value: "1.5rem", description: "24px" },
      { name: "Size 3XL", variable: "--font-size-3xl", value: "1.875rem", description: "30px" },
      { name: "Size 4XL", variable: "--font-size-4xl", value: "2.25rem", description: "36px" },
      { name: "Size 5XL", variable: "--font-size-5xl", value: "3rem", description: "48px" },
      { name: "Chart Axis Size", variable: "--chart-axis-label-size", value: "0.75rem", description: "12px for axis text" },
      { name: "Weight Normal", variable: "--font-weight-normal", value: "400", description: "Regular" },
      { name: "Weight Medium", variable: "--font-weight-medium", value: "500", description: "Medium" },
      { name: "Weight Semibold", variable: "--font-weight-semibold", value: "600", description: "Semibold" },
      { name: "Weight Bold", variable: "--font-weight-bold", value: "700", description: "Bold" },
      { name: "Line Height Tight", variable: "--line-height-tight", value: "1.2", description: "Headings" },
      { name: "Line Height Snug", variable: "--line-height-snug", value: "1.375", description: "Subheadings" },
      { name: "Line Height Normal", variable: "--line-height-normal", value: "1.5", description: "Body" },
      { name: "Line Height Relaxed", variable: "--line-height-relaxed", value: "1.625", description: "Long-form" },
    ],
  },
  {
    id: "shadow",
    label: "Shadows / Elevation",
    type: "shadow",
    tokens: [
      { name: "Shadow SM", variable: "--shadow-sm", value: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)", description: "Subtle lift" },
      { name: "Shadow MD", variable: "--shadow-md", value: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)", description: "Card elevation" },
      { name: "Shadow LG", variable: "--shadow-lg", value: "0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)", description: "Modal elevation" },
      { name: "Shadow XL", variable: "--shadow-xl", value: "0 24px 80px rgba(0,0,0,0.45)", description: "Standardized card elevation" },
    ],
  },
  {
    id: "motion",
    label: "Motion",
    type: "motion",
    tokens: [
      { name: "Transition Fast", variable: "--transition-fast", value: "0.2s ease", description: "Micro-interactions" },
      { name: "Transition Base", variable: "--transition-base", value: "0.4s ease-out", description: "Fade in / page entry" },
      { name: "Duration KPI", variable: "--duration-kpi", value: "1.5s", description: "KPI numeric ticker duration" },
      { name: "Easing Bounce", variable: "--easing-bounce", value: "cubic-bezier(.36,.07,.19,.97)", description: "Shake animation" },
    ],
  },
];
