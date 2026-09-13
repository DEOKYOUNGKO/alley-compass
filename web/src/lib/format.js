export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const fmt = (n) => n.toLocaleString("en-US");

export const scoreClass = (s) => (s >= 75 ? "s-hi" : s >= 60 ? "s-mid" : "s-lo");

export const scoreColor = (s) =>
  s >= 75 ? "var(--good-ink)" : s >= 60 ? "var(--brand-deep)" : "var(--risk-ink)";
