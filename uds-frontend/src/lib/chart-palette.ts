/**
 * Categorical palette for charts, derived from the UDS brand and validated
 * with the dataviz palette checker against the light chart surface:
 *   lightness band PASS · chroma floor PASS · CVD separation PASS
 *   (worst adjacent ΔE 9.9 protan) · normal-vision floor PASS (ΔE 19.4)
 *
 * Order is fixed and must never be cycled or re-sorted by value — the hue
 * belongs to the entity, not to its rank. The ordering deliberately keeps the
 * olive away from the two reds, which is where CVD separation collapses.
 *
 * Gold sits at 2.56:1 against the surface, below the 3:1 relief threshold, so
 * every chart using it carries direct labels or an accompanying table.
 */
export const CHART_COLORS = [
  "#b43822", // brick red
  "#d2940f", // brand gold
  "#558532", // olive
  "#136eae", // blue
  "#a92d56", // maroon
  "#dd773c", // terracotta
] as const;

export const seriesColor = (i: number): string =>
  CHART_COLORS[i % CHART_COLORS.length];

/**
 * Status colours are reserved and never reused as categorical series.
 * Each is paired with a text label wherever it appears — never colour alone.
 */
export const STATUS_COLORS = {
  approved: "#3f7d3f",
  pending: "#d2940f",
  rejected: "#b43822",
  cancelled: "#8a8178",
  available: "#3f7d3f",
  "low-stock": "#d2940f",
  "checked-out": "#136eae",
  overdue: "#b43822",
} as const;

/** Recessive axis/grid ink so the data stays dominant. */
export const AXIS_INK = "hsl(18 18% 40%)";
export const GRID_INK = "hsl(29 32% 85%)";
