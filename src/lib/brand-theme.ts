export type Mode = "light" | "dark";
export type SemanticKey = "success" | "info" | "warning" | "danger" | "neutral";
export type SemanticColor = { main: string; bg: string; fg: string };

export type BrandState = {
  name: string;
  logo: string | null;
  primary: string;
  secondary: string;
  focus: string;
  appearance: "light" | "dark" | "system";
  font: string;
  light: Record<string, string>;
  dark: Record<string, string>;
  semantic: Record<SemanticKey, SemanticColor>;
};

export const FONTS = [
  { id: "institucional", label: "Institucional", heading: "'IBM Plex Sans', sans-serif", body: "'IBM Plex Sans', sans-serif" },
  { id: "moderno", label: "Moderno", heading: "'Manrope', sans-serif", body: "'Manrope', sans-serif" },
  { id: "contemporaneo", label: "Contemporâneo", heading: "'Sora', sans-serif", body: "'IBM Plex Sans', sans-serif" },
  { id: "tecnico", label: "Técnico", heading: "'IBM Plex Mono', monospace", body: "'IBM Plex Sans', sans-serif" },
  { id: "editorial", label: "Editorial jurídico", heading: "'Libre Baskerville', serif", body: "'Source Sans 3', sans-serif" },
];

export const SEMANTIC_LABELS: Record<SemanticKey, { label: string; sample: string }> = {
  success: { label: "Sucesso", sample: "Documento validado" },
  info: { label: "Informação", sample: "Nova versão disponível" },
  warning: { label: "Alerta", sample: "Certidão vence em breve" },
  danger: { label: "Erro ou perigo", sample: "Assinatura inválida" },
  neutral: { label: "Neutro", sample: "Aguardando revisão" },
};

export const DEFAULT_BRAND: BrandState = {
  name: "AuditFlow Padrão",
  logo: null,
  primary: "#41215F",
  secondary: "#2AACE2",
  focus: "#2AACE2",
  appearance: "system",
  font: "institucional",
  light: {},
  dark: {},
  semantic: {
    success: { main: "#1F9D55", bg: "#E7F6EE", fg: "#14653A" },
    info: { main: "#2A7DE1", bg: "#E8F1FC", fg: "#1A4F91" },
    warning: { main: "#D99A00", bg: "#FDF4DD", fg: "#7A5300" },
    danger: { main: "#C62828", bg: "#FCEAEA", fg: "#9A1C1C" },
    neutral: { main: "#6B6475", bg: "#F0EEF3", fg: "#4A4453" },
  },
};

type TokenDef = { id: string; label: string; hint: string; group: string };
const DEFS: TokenDef[] = [
  { id: "brand", label: "Cor de marca no tema", hint: "Botões primários e seleção", group: "Marca" },
  { id: "bg", label: "Fundo da aplicação", hint: "Atrás de todas as telas", group: "Superfícies" },
  { id: "card", label: "Superfície de card", hint: "Cards, painéis e modais", group: "Superfícies" },
  { id: "field", label: "Superfície de campo", hint: "Interior de campos de formulário", group: "Superfícies" },
  { id: "subtle", label: "Superfície sutil", hint: "Áreas secundárias e desabilitadas", group: "Superfícies" },
  { id: "hover", label: "Estado de hover", hint: "Ao passar o mouse em listas", group: "Seleção e hover" },
  { id: "selected", label: "Estado de seleção", hint: "Linhas e opções selecionadas", group: "Seleção e hover" },
  { id: "text", label: "Texto principal", hint: "Títulos e conteúdo", group: "Textos" },
  { id: "textSecondary", label: "Texto secundário", hint: "Descrições", group: "Textos" },
  { id: "textAux", label: "Texto auxiliar", hint: "Metadados e dicas", group: "Textos" },
  { id: "textDisabled", label: "Texto desabilitado", hint: "Ações indisponíveis", group: "Textos" },
  { id: "border", label: "Borda padrão", hint: "Cards e divisores", group: "Bordas" },
  { id: "borderStrong", label: "Borda forte", hint: "Campos em hover e separações", group: "Bordas" },
  { id: "tooltip", label: "Tooltip", hint: "Fundo das dicas flutuantes", group: "Sobreposições" },
  { id: "overlay", label: "Overlay de modal", hint: "Escurece o fundo atrás de modais", group: "Sobreposições" },
  { id: "nav", label: "Navegação lateral", hint: "Fundo do menu principal", group: "Navegação" },
  { id: "navSelected", label: "Item selecionado da navegação", hint: "Página atual no menu", group: "Navegação" },
];
export const LIGHT_TOKENS = DEFS;
export const DARK_TOKENS = DEFS;

/* ---- color math ---- */
const toRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const; };
const toHex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
/** mix a toward b by t (0 = a, 1 = b) */
export const mix = (a: string, b: string, t: number) => { const x = toRgb(a), y = toRgb(b); return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); };
const lum = (h: string) => { const c = toRgb(h).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!; };
export const contrast = (a: string, b: string) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
const hue = (h: string) => { const [r, g, b] = toRgb(h).map((v) => v / 255) as [number, number, number]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return { h: 0, s: 0 }; let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; if (hh < 0) hh += 360; return { h: hh, s: d / (1 - Math.abs(mx + mn - 1)) }; };
export const isSimilar = (a: string, b: string) => { const x = hue(a), y = hue(b); const dh = Math.min(Math.abs(x.h - y.h), 360 - Math.abs(x.h - y.h)); return x.s > 0.35 && y.s > 0.35 && dh < 22; };

export function autoTheme(p: string, mode: Mode): Record<string, string> {
  if (mode === "light") return {
    brand: p, bg: mix(p, "#FFFFFF", 0.965), card: "#FFFFFF", field: "#FFFFFF", subtle: mix(p, "#FFFFFF", 0.94),
    hover: mix(p, "#FFFFFF", 0.93), selected: mix(p, "#FFFFFF", 0.87), text: mix(p, "#140F1A", 0.8),
    textSecondary: mix(p, "#4F4A57", 0.85), textAux: "#837D8C", textDisabled: "#B6B1BD",
    border: mix(p, "#E4E1E8", 0.9), borderStrong: mix(p, "#BDB7C4", 0.85), tooltip: mix(p, "#140F1A", 0.7),
    overlay: mix(p, "#000000", 0.7), nav: mix(p, "#000000", 0.1), navSelected: mix(p, "#FFFFFF", 0.18),
  };
  const lifted = contrast(p, "#17131C") < 3 ? mix(p, "#FFFFFF", 0.45) : p;
  return {
    brand: lifted, bg: mix(p, "#0E0C11", 0.9), card: mix(p, "#17141B", 0.88), field: mix(p, "#1D1A22", 0.86), subtle: mix(p, "#141118", 0.85),
    hover: mix(p, "#26222C", 0.8), selected: mix(p, "#26222C", 0.55), text: "#F2EFF6", textSecondary: "#C3BCCD",
    textAux: "#8E8799", textDisabled: "#5C5666", border: mix(p, "#2D2934", 0.85), borderStrong: mix(p, "#4A4553", 0.8),
    tooltip: "#F2EFF6", overlay: "#000000", nav: mix(p, "#0A080D", 0.85), navSelected: mix(p, "#2A2530", 0.4),
  };
}

export function resolveTheme(s: BrandState, mode: Mode) {
  const t = { ...autoTheme(s.primary, mode), ...(mode === "light" ? s.light : s.dark) } as Record<string, string>;
  return {
    ...t,
    onBrand: contrast(t.brand!, "#FFFFFF") >= contrast(t.brand!, "#140F1A") ? "#FFFFFF" : "#140F1A",
    navText: contrast(t.nav!, "#FFFFFF") >= 4.5 ? "#FFFFFF" : "#140F1A",
    tooltipText: contrast(t.tooltip!, "#FFFFFF") >= 4.5 ? "#FFFFFF" : "#140F1A",
  } as Record<string, string> & { onBrand: string };
}

export type Check = { id: string; level: "warn" | "block"; title: string; message: string };

export function runChecks(s: BrandState): Check[] {
  const out: Check[] = [];
  if (isSimilar(s.primary, s.semantic.danger.main)) out.push({ id: "c-danger", level: "warn", title: "Cor principal próxima da cor de erro", message: "A cor principal está próxima da cor de erro. O AuditFlow manterá uma variação semântica própria para preservar a clareza das ações." });
  if (isSimilar(s.primary, s.semantic.success.main)) out.push({ id: "c-success", level: "warn", title: "Cor principal próxima da cor de sucesso", message: "Confirmações e ações principais podem parecer iguais. Considere ajustar o tom de sucesso nas cores semânticas." });
  if (isSimilar(s.primary, s.semantic.warning.main)) out.push({ id: "c-warning", level: "warn", title: "Cor principal próxima da cor de alerta", message: "Avisos podem se confundir com a marca. O AuditFlow reforçará os alertas com ícones." });
  (["light", "dark"] as Mode[]).forEach((m) => {
    const t = resolveTheme(s, m);
    const name = m === "light" ? "tema claro" : "tema escuro";
    if (contrast(t.brand!, t.onBrand) < 4.5) out.push({ id: `b-btn-${m}`, level: "block", title: `Texto ilegível nos botões (${name})`, message: `O texto dos botões principais não tem contraste suficiente com a cor de marca no ${name}. Escureça ou clareie a cor para publicar.` });
    if (contrast(t.text!, t.bg!) < 4.5 || contrast(t.text!, t.card!) < 4.5) out.push({ id: `b-text-${m}`, level: "block", title: `Texto principal com pouco contraste (${name})`, message: `O texto principal ficaria difícil de ler sobre o fundo no ${name}. Ajuste "Texto principal" ou as superfícies.` });
  });
  return out;
}
