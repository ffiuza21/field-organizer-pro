import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle, Check, CheckCircle2, ChevronRight, CircleAlert, FileText, FolderOpen, Home,
  ImageUp, Info, Monitor, Moon, Palette, RotateCcw, Sparkles, Sun, Type,
  Wand2, X, XCircle, Users, Settings, Eye, Lock, Pencil,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  type BrandState, type Mode, type SemanticKey, DEFAULT_BRAND, FONTS, LIGHT_TOKENS, DARK_TOKENS,
  SEMANTIC_LABELS, resolveTheme, runChecks, contrast,
} from "@/lib/brand-theme";

export const Route = createFileRoute("/identidade-visual")({
  head: () => ({
    meta: [
      { title: "Identidade visual — AuditFlow" },
      { name: "description", content: "Configure logo, cores, tipografia e temas claro e escuro da sua organização no AuditFlow." },
      { property: "og:title", content: "Identidade visual — AuditFlow" },
      { property: "og:description", content: "Personalize a aparência da sua organização com prévia em tempo real." },
    ],
  }),
  component: BrandPage,
});

type Section = "brand" | "light" | "dark" | "semantic" | "preview";
type Status = "clean" | "dirty" | "saved" | "restored";

const SECTIONS: { id: Section; label: string; desc: string; icon: typeof Palette; advanced?: boolean }[] = [
  { id: "brand", label: "Marca e tipografia", desc: "Logo, cores e fonte", icon: Palette },
  { id: "light", label: "Tema claro", desc: "Superfícies, textos e bordas", icon: Sun, advanced: true },
  { id: "dark", label: "Tema escuro", desc: "Um tema próprio, não inversão", icon: Moon, advanced: true },
  { id: "semantic", label: "Cores semânticas", desc: "Sucesso, alerta, erro…", icon: CircleAlert, advanced: true },
  { id: "preview", label: "Prévia de componentes", desc: "Visualização ampliada", icon: Eye },
];

function BrandPage() {
  const [published, setPublished] = useState<BrandState>(DEFAULT_BRAND);
  const [state, setState] = useState<BrandState>(DEFAULT_BRAND);
  const [lastSaved, setLastSaved] = useState<BrandState>(DEFAULT_BRAND);
  const [status, setStatus] = useState<Status>("clean");
  const [advanced, setAdvanced] = useState(true);
  const [section, setSection] = useState<Section>("brand");
  const [previewMode, setPreviewMode] = useState<Mode>("light");
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const checks = useMemo(() => runChecks(state), [state]);
  const blockers = checks.filter((c) => c.level === "block");
  const unpublished = JSON.stringify(state) !== JSON.stringify(published);
  const unsavedDraft = JSON.stringify(state) !== JSON.stringify(lastSaved);

  const set = (patch: Partial<BrandState>) => { setState((s) => ({ ...s, ...patch })); setStatus("dirty"); };
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2800); };
  const saveDraft = () => { setLastSaved(state); setStatus("saved"); flash("Rascunho salvo. Só você e outros administradores veem estas mudanças."); };
  const publish = () => { setPublished(state); setLastSaved(state); setStatus("clean"); flash("Identidade publicada para toda a organização."); };
  const restore = () => { setState(DEFAULT_BRAND); setStatus("restored"); setConfirmRestore(false); flash("Tema padrão do AuditFlow restaurado. Publique para aplicar."); };

  const visibleSections = SECTIONS.filter((s) => advanced || !s.advanced);
  const current = visibleSections.some((s) => s.id === section) ? section : "brand";

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Configurações</Link><ChevronRight className="h-3 w-3" />
              <span>Organização</span><ChevronRight className="h-3 w-3" />
              <span className="font-medium text-primary">Identidade visual</span>
            </nav>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">Identidade visual</h1>
              <StatusPill status={status} unpublished={unpublished} unsavedDraft={unsavedDraft} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">As alterações valem para todas as pessoas da organização <strong className="font-medium text-foreground">Mendes & Prado Advogados</strong>, após publicadas.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setConfirmRestore(true)} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <RotateCcw className="h-4 w-4" />Restaurar padrão
            </button>
            <button onClick={saveDraft} disabled={!unsavedDraft} className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40">
              Salvar rascunho
            </button>
            <div className="relative group">
              <button onClick={publish} disabled={!unpublished || blockers.length > 0}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
                {blockers.length > 0 && <Lock className="h-4 w-4" />}Publicar alterações
              </button>
              {blockers.length > 0 && (
                <div role="tooltip" className="pointer-events-none absolute right-0 top-full z-40 mt-2 w-64 rounded-md bg-foreground p-3 text-xs text-background opacity-0 shadow-lg transition group-hover:opacity-100">
                  Publicação bloqueada: {blockers.length} {blockers.length === 1 ? "problema de legibilidade" : "problemas de legibilidade"} para corrigir.
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-8 px-6 py-8 lg:grid-cols-[230px_1fr] lg:px-10 2xl:grid-cols-[230px_1fr_520px]">
        {/* Section nav */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="mb-4 rounded-lg border border-border bg-card p-1" role="radiogroup" aria-label="Nível de detalhe">
            <div className="grid grid-cols-2 gap-1">
              {[{ v: false, l: "Essencial" }, { v: true, l: "Avançado" }].map((o) => (
                <button key={o.l} role="radio" aria-checked={advanced === o.v} onClick={() => setAdvanced(o.v)}
                  className={cn("rounded-md py-1.5 text-sm font-medium transition", advanced === o.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{o.l}</button>
              ))}
            </div>
            <p className="px-2 pb-1 pt-2 text-[11px] leading-snug text-muted-foreground">
              {advanced ? "Todos os tokens visíveis." : "Só o essencial. Mude a qualquer momento — nada é perdido."}
            </p>
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Seções">
            {visibleSections.map((s) => (
              <button key={s.id} onClick={() => setSection(s.id)} aria-current={current === s.id}
                className={cn("flex shrink-0 items-start gap-3 rounded-md border-l-2 px-3 py-2.5 text-left transition",
                  current === s.id ? "border-primary bg-primary-soft text-primary" : "border-transparent text-foreground hover:bg-muted")}>
                <s.icon className="mt-0.5 h-4 w-4 shrink-0" />
                <span><span className="block text-sm font-medium">{s.label}</span><span className="hidden text-xs text-muted-foreground lg:block">{s.desc}</span></span>
              </button>
            ))}
          </nav>

          {checks.length > 0 && (
            <div className="mt-6 hidden space-y-2 lg:block">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verificações</p>
              {checks.map((c) => (
                <div key={c.id} className={cn("flex gap-2 rounded-md p-2.5 text-xs", c.level === "block" ? "bg-destructive/10 text-destructive" : "bg-warning-soft text-warning-foreground")}>
                  {c.level === "block" ? <XCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}{c.title}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Config */}
        <main className={cn("min-w-0 space-y-6", current === "preview" && "2xl:col-span-2")}>
          {checks.filter((c) => c.level === "warn").map((c) => (
            <Banner key={c.id} tone="warn" title={c.title}>{c.message}</Banner>
          ))}
          {blockers.map((c) => (
            <Banner key={c.id} tone="block" title={c.title}>{c.message}</Banner>
          ))}
          {status === "restored" && <Banner tone="info" title="Tema padrão restaurado">Os valores originais do AuditFlow foram recuperados. Publique para aplicar à organização ou desfaça carregando o rascunho salvo.</Banner>}

          {current === "brand" && <BrandSection state={state} set={set} advanced={advanced} />}
          {current === "light" && <TokensSection mode="light" state={state} set={set} />}
          {current === "dark" && <TokensSection mode="dark" state={state} set={set} />}
          {current === "semantic" && <SemanticSection state={state} set={set} />}
          {current === "preview" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <PreviewPanel state={state} mode="light" fixed />
              <PreviewPanel state={state} mode="dark" fixed />
            </div>
          )}
        </main>

        {/* Live preview */}
        {current !== "preview" && (
          <aside className="lg:col-start-2 2xl:col-start-3 2xl:row-start-1 2xl:sticky 2xl:top-28 2xl:self-start">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Prévia ao vivo</p>
                <p className="text-xs text-muted-foreground">Como a organização verá o AuditFlow</p>
              </div>
              <div className="flex rounded-md border border-border bg-card p-0.5">
                {(["light", "dark"] as Mode[]).map((m) => (
                  <button key={m} onClick={() => setPreviewMode(m)} aria-pressed={previewMode === m}
                    className={cn("flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium", previewMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                    {m === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}{m === "light" ? "Claro" : "Escuro"}
                  </button>
                ))}
              </div>
            </div>
            <PreviewPanel state={state} mode={previewMode} />
            <p className="mt-3 text-xs text-muted-foreground">Em telas menores, a prévia aparece abaixo das configurações e a navegação vira uma faixa rolável no topo.</p>
          </aside>
        )}
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-foreground px-4 py-2.5 text-sm text-background shadow-lg">{toast}</div>}

      <AlertDialog open={confirmRestore} onOpenChange={setConfirmRestore}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar o tema padrão do AuditFlow?</AlertDialogTitle>
            <AlertDialogDescription>Logo, cores, tipografia e todos os tokens personalizados voltarão ao padrão. Nada muda para a organização até você publicar.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter como está</AlertDialogCancel>
            <AlertDialogAction onClick={restore}>Restaurar padrão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusPill({ status, unpublished, unsavedDraft }: { status: Status; unpublished: boolean; unsavedDraft: boolean }) {
  if (!unpublished) return <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"><Check className="h-3.5 w-3.5" />Publicado · nenhuma alteração pendente</span>;
  if (status === "saved" && !unsavedDraft) return <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-foreground"><span className="h-1.5 w-1.5 rounded-full bg-accent" /><span className="text-foreground">Rascunho salvo · pronto para publicar</span></span>;
  return <span className="inline-flex items-center gap-1.5 rounded-md bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-foreground"><span className="h-1.5 w-1.5 rounded-full bg-warning" />Alterações não publicadas</span>;
}

function Banner({ tone, title, children }: { tone: "warn" | "block" | "info"; title: string; children: ReactNode }) {
  const Icon = tone === "block" ? XCircle : tone === "warn" ? AlertTriangle : Info;
  return (
    <div className={cn("flex gap-3 rounded-lg border p-4",
      tone === "block" && "border-destructive/30 bg-destructive/5",
      tone === "warn" && "border-warning/40 bg-warning-soft",
      tone === "info" && "border-accent/30 bg-accent-soft")}>
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone === "block" ? "text-destructive" : tone === "warn" ? "text-warning-foreground" : "text-accent")} />
      <div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-sm text-muted-foreground">{children}</p></div>
    </div>
  );
}

function Card({ title, desc, children, aside }: { title: string; desc?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><h2 className="text-base font-semibold">{title}</h2>{desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}</div>{aside}
      </div>
      {children}
    </section>
  );
}

function ColorField({ label, hint, value, onChange, swatches }: { label: string; hint?: string; value: string; onChange: (v: string) => void; swatches?: string[] }) {
  const [text, setText] = useState(value);
  const valid = /^#[0-9a-fA-F]{6}$/.test(text);
  useEffect(() => { setText((t) => (t.toLowerCase() === value.toLowerCase() ? t : value)); }, [value]);
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2 flex items-center gap-2">
        <label className="relative h-10 w-12 shrink-0 cursor-pointer overflow-hidden rounded-md border border-input" style={{ background: value }}>
          <input type="color" value={value} onChange={(e) => { onChange(e.target.value); setText(e.target.value); }} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`Escolher ${label}`} />
        </label>
        <div className="relative flex-1">
          <input data-hex={label} value={text.toUpperCase()} onChange={(e) => { const v = e.target.value; setText(v); if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v); }}
            className={cn("w-full rounded-md border bg-card px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/30", valid ? "border-input focus:border-ring" : "border-destructive")} />
        </div>
      </div>
      {!valid && <p className="mt-1 text-xs text-destructive">Use o formato #RRGGBB</p>}
      {swatches && (
        <div className="mt-2 flex gap-1.5">
          {swatches.map((s) => (
            <button key={s} onClick={() => { onChange(s); setText(s); }} title={s} aria-label={`Usar ${s}`}
              className={cn("h-6 w-6 rounded border border-border", value.toLowerCase() === s.toLowerCase() && "ring-2 ring-ring ring-offset-1")} style={{ background: s }} />
          ))}
        </div>
      )}
    </div>
  );
}

function BrandSection({ state, set, advanced }: { state: BrandState; set: (p: Partial<BrandState>) => void; advanced: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const ratio = contrast(state.primary, "#FFFFFF");
  return (
    <>
      <Card title="Logo e nome" desc="Aparece na navegação, no login e em relatórios exportados.">
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div>
            <button onClick={() => fileRef.current?.click()} className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/50 hover:border-primary/50 hover:bg-primary-soft">
              {state.logo ? <img src={state.logo} alt="Logo da organização" className="max-h-20 max-w-[200px] object-contain" /> : (
                <><ImageUp className="h-6 w-6 text-muted-foreground" /><span className="text-sm font-medium">Enviar logo</span><span className="text-xs text-muted-foreground">SVG ou PNG transparente · até 2 MB</span></>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/svg+xml" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => set({ logo: String(r.result) }); r.readAsDataURL(f);
            }} />
            {state.logo && (
              <div className="mt-2 flex gap-3 text-xs"><button onClick={() => fileRef.current?.click()} className="font-medium text-primary hover:underline">Substituir</button><button onClick={() => set({ logo: null })} className="text-muted-foreground hover:text-destructive">Remover</button></div>
            )}
          </div>
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium">Nome da identidade visual</span>
              <input value={state.name} onChange={(e) => set({ name: e.target.value })} className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
              <span className="mt-1 block text-xs text-muted-foreground">Uso interno, para identificar esta versão.</span>
            </label>
            <div>
              <p className="text-sm font-medium">Aparência padrão</p>
              <p className="text-xs text-muted-foreground">Como o AuditFlow abre para quem ainda não escolheu.</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([["light", "Claro", Sun], ["dark", "Escuro", Moon], ["system", "Seguir sistema", Monitor]] as const).map(([v, l, I]) => (
                  <button key={v} onClick={() => set({ appearance: v })} aria-pressed={state.appearance === v}
                    className={cn("flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium", state.appearance === v ? "border-primary bg-primary-soft text-primary" : "border-border hover:border-primary/40")}>
                    <I className="h-4 w-4" />{l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Cores da marca" desc="Tudo o mais é calculado automaticamente a partir delas."
        aside={<ContrastBadge ratio={ratio} label="Texto branco sobre a principal" />}>
        <div className={cn("grid gap-6", advanced ? "md:grid-cols-3" : "md:grid-cols-2")}>
          <ColorField label="Cor principal" hint="Botões, seleção e navegação" value={state.primary} onChange={(v) => set({ primary: v })} swatches={["#41215F", "#0F3D5E", "#1F5135", "#B3261E", "#E7C33B"]} />
          <ColorField label="Cor secundária" hint="Destaques e links" value={state.secondary} onChange={(v) => set({ secondary: v })} swatches={["#2AACE2", "#C08A2E", "#2E8B7A"]} />
          {advanced && <ColorField label="Cor de foco" hint="Contorno ao navegar pelo teclado" value={state.focus} onChange={(v) => set({ focus: v })} />}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><Wand2 className="h-3.5 w-3.5" />Experimente o vermelho ou o amarelo acima para ver como o AuditFlow protege as cores de erro e de alerta.</p>
      </Card>

      <Card title="Tipografia" desc="Presets testados para leitura em telas de auditoria. Fontes livres não são permitidas.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {FONTS.map((f) => {
            const active = state.font === f.id;
            return (
              <button key={f.id} onClick={() => set({ font: f.id })} aria-pressed={active}
                className={cn("relative rounded-lg border p-4 text-left transition", active ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40")}>
                {active && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>}
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</p>
                <p className="mt-2 text-xl font-semibold leading-tight" style={{ fontFamily: f.heading }}>Due diligence 2026</p>
                <p className="mt-1 text-sm" style={{ fontFamily: f.body }}>Revisar certidões pendentes</p>
                <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: f.body }}>Atualizado há 2 h · 14 documentos</p>
              </button>
            );
          })}
        </div>
      </Card>
    </>
  );
}

function ContrastBadge({ ratio, label }: { ratio: number; label: string }) {
  const level = ratio >= 7 ? "Excelente" : ratio >= 4.5 ? "Boa leitura" : ratio >= 3 ? "Só para textos grandes" : "Leitura difícil";
  const ok = ratio >= 4.5;
  return (
    <div className={cn("shrink-0 rounded-md px-2.5 py-1.5 text-right", ok ? "bg-muted" : "bg-destructive/10")} title={`${label}: ${ratio.toFixed(1)}:1`}>
      <p className={cn("flex items-center justify-end gap-1 text-xs font-semibold", ok ? "text-foreground" : "text-destructive")}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}{level}
      </p>
      <p className="text-[11px] text-muted-foreground">{label} · {ratio.toFixed(1)}:1</p>
    </div>
  );
}

function TokensSection({ mode, state, set }: { mode: Mode; state: BrandState; set: (p: Partial<BrandState>) => void }) {
  const defs = mode === "light" ? LIGHT_TOKENS : DARK_TOKENS;
  const overrides = mode === "light" ? state.light : state.dark;
  const theme = resolveTheme(state, mode);
  const key = mode === "light" ? "light" : "dark";
  const groups = Array.from(new Set(defs.map((d) => d.group)));
  const customCount = Object.keys(overrides).length;
  return (
    <Card title={mode === "light" ? "Tema claro" : "Tema escuro"}
      desc={mode === "light" ? "Valores calculados a partir da marca. Personalize apenas o que precisar." : "Desenhado separadamente para ambientes com pouca luz — não é uma inversão do tema claro."}
      aside={<div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />Automático</span><span className="flex items-center gap-1 text-primary"><Pencil className="h-3.5 w-3.5" />Personalizado ({customCount})</span></div>}>
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g}</p>
            <div className="divide-y divide-border rounded-lg border border-border">
              {defs.filter((d) => d.group === g).map((d) => {
                const custom = d.id in overrides;
                const value = theme[d.id];
                return (
                  <div key={d.id} className="flex items-center gap-4 px-4 py-3">
                    <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded border border-border" style={{ background: value }}>
                      <input type="color" value={value} aria-label={d.label} className="absolute inset-0 opacity-0" onChange={(e) => set({ [key]: { ...overrides, [d.id]: e.target.value } } as Partial<BrandState>)} />
                    </label>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{d.label}</p>
                      <p className="text-xs text-muted-foreground">{d.hint}</p>
                    </div>
                    <span className="hidden font-mono text-xs text-muted-foreground sm:block">{value.toUpperCase()}</span>
                    {custom ? (
                      <button onClick={() => { const n = { ...overrides }; delete n[d.id]; set({ [key]: n } as Partial<BrandState>); }}
                        className="flex w-32 items-center justify-end gap-1 text-xs font-medium text-primary hover:underline" title="Voltar ao valor automático">
                        <Pencil className="h-3 w-3" />Personalizado <X className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="flex w-32 items-center justify-end gap-1 text-xs text-muted-foreground"><Sparkles className="h-3 w-3" />Automático</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SemanticSection({ state, set }: { state: BrandState; set: (p: Partial<BrandState>) => void }) {
  return (
    <Card title="Cores semânticas" desc="Usadas em badges, alertas, validações de campos, mensagens e ações destrutivas. Mantêm o significado independentemente da cor da marca.">
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(SEMANTIC_LABELS) as SemanticKey[]).map((k) => {
          const c = state.semantic[k];
          const update = (p: Partial<typeof c>) => set({ semantic: { ...state.semantic, [k]: { ...c, ...p } } });
          const r = contrast(c.fg, c.bg);
          return (
            <div key={k} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{SEMANTIC_LABELS[k].label}</p>
                <span className={cn("text-[11px]", r >= 4.5 ? "text-muted-foreground" : "text-destructive")}>{r >= 4.5 ? "Boa leitura" : "Leitura difícil"} · {r.toFixed(1)}:1</span>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm" style={{ background: c.bg, color: c.fg }}>
                <span className="h-2 w-2 rounded-full" style={{ background: c.main }} />{SEMANTIC_LABELS[k].sample}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {([["main", "Principal"], ["bg", "Fundo"], ["fg", "Texto/ícone"]] as const).map(([f, l]) => (
                  <label key={f} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-muted">
                    <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded border border-border" style={{ background: c[f] }}>
                      <input type="color" value={c[f]} onChange={(e) => update({ [f]: e.target.value })} className="absolute inset-0 opacity-0" aria-label={`${SEMANTIC_LABELS[k].label} ${l}`} />
                    </span>{l}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- Preview: realistic mini AuditFlow (colors come from user's theme data) ---------- */
function PreviewPanel({ state, mode, fixed }: { state: BrandState; mode: Mode; fixed?: boolean }) {
  const t = resolveTheme(state, mode);
  const font = FONTS.find((f) => f.id === state.font)!;
  const s = state.semantic;
  const [modal, setModal] = useState(false);
  const [toggle, setToggle] = useState(true);
  const st = {
    root: { background: t.bg, color: t.text, fontFamily: font.body, borderColor: t.border },
    card: { background: t.card, borderColor: t.border },
    field: { background: t.field, borderColor: t.border, color: t.text },
  };
  const btn = "rounded-[5px] px-3 py-1.5 text-xs font-semibold";
  return (
    <div className="relative overflow-hidden rounded-xl border shadow-sm" style={st.root}>
      {fixed && <div className="border-b px-4 py-2 text-xs font-semibold" style={{ borderColor: t.border, color: t.textSecondary }}>{mode === "light" ? "Tema claro" : "Tema escuro"}</div>}
      <div className="flex">
        {/* nav */}
        <div className="w-36 shrink-0 space-y-1 p-3" style={{ background: t.nav }}>
          <div className="mb-4 flex h-8 items-center px-1">
            {state.logo ? <img src={state.logo} alt="" className="max-h-6 max-w-[110px] object-contain" /> : <span className="text-sm font-bold" style={{ fontFamily: font.heading, color: t.navText }}>AuditFlow</span>}
          </div>
          {[[Home, "Início"], [FolderOpen, "Auditorias"], [FileText, "Documentos"], [Users, "Equipe"], [Settings, "Ajustes"]].map(([I, l], i) => {
            const Icon = I as typeof Home;
            return (
              <div key={l as string} className="flex items-center gap-2 rounded-[5px] px-2 py-1.5 text-[11px] font-medium"
                style={i === 1 ? { background: t.navSelected, color: t.navText } : { color: t.navText, opacity: 0.75 }}>
                <Icon className="h-3.5 w-3.5" />{l as string}
              </div>
            );
          })}
        </div>
        {/* content */}
        <div className="min-w-0 flex-1 space-y-3 p-4">
          <div>
            <p className="text-[10px]" style={{ color: t.textAux }}>Auditorias / Aquisição Grupo Sul</p>
            <p className="text-base font-semibold" style={{ fontFamily: font.heading }}>Due diligence 2026</p>
          </div>
          {/* tabs */}
          <div className="flex gap-4 border-b text-[11px] font-medium" style={{ borderColor: t.border }}>
            <span className="border-b-2 pb-1.5" style={{ borderColor: t.brand, color: t.brand }}>Certidões</span>
            <span className="pb-1.5" style={{ color: t.textSecondary }}>Societário</span>
            <span className="pb-1.5" style={{ color: t.textSecondary }}>Financeiro</span>
          </div>
          {/* card */}
          <div className="space-y-2.5 rounded-lg border p-3" style={st.card}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Certidão negativa de débitos</p>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: s.success.bg, color: s.success.fg }}>Recebido</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <PField label="Em repouso" style={st.field} value="Receita Federal" />
              <PField label="Hover" style={{ ...st.field, borderColor: t.borderStrong }} value="12/03/2026" />
              <PField label="Foco" style={{ ...st.field, borderColor: state.focus, boxShadow: `0 0 0 2px ${state.focus}40` }} value="Digitando…|" />
              <PField label="Desabilitado" style={{ ...st.field, background: t.subtle, color: t.textDisabled }} value="Automático" />
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <button onClick={() => setToggle(!toggle)} aria-label="Toggle de exemplo" className="relative h-4 w-7 rounded-full transition" style={{ background: toggle ? t.brand : t.borderStrong }}>
                <span className="absolute top-0.5 h-3 w-3 rounded-full bg-card transition-all" style={{ left: toggle ? 14 : 2, background: t.card }} />
              </button>
              Obrigatório
              <span className="relative ml-2 h-4 w-7 rounded-full" style={{ background: t.borderStrong }}><span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full" style={{ background: t.card }} /></span>
              <span style={{ color: t.textSecondary }}>Inativo</span>
            </div>
          </div>
          {/* buttons */}
          <div className="flex flex-wrap gap-1.5">
            <button className={btn} style={{ background: t.brand, color: t.onBrand }} onClick={() => setModal(true)}>Primário</button>
            <button className={cn(btn, "border")} style={{ borderColor: t.brand, color: t.brand }}>Contorno</button>
            <button className={btn} style={{ background: t.selected, color: t.brand }}>Tonal</button>
            <button className={btn} style={{ color: state.secondary }}>Terciário</button>
            <button className={btn} style={{ background: s.danger.main, color: "#FFFFFF" }}>Excluir</button>
            <button className={btn} style={{ background: t.subtle, color: t.textDisabled }} disabled>Desabilitado</button>
          </div>
          {/* alerts */}
          <div className="grid grid-cols-2 gap-1.5">
            {(["success", "info", "warning", "danger"] as SemanticKey[]).map((k) => (
              <div key={k} className="flex items-center gap-1.5 rounded-[5px] border-l-2 px-2 py-1.5 text-[10px] font-medium" style={{ background: s[k].bg, color: s[k].fg, borderColor: s[k].main }}>
                {SEMANTIC_LABELS[k].sample}
              </div>
            ))}
          </div>
          {/* list */}
          <div className="overflow-hidden rounded-lg border text-[11px]" style={st.card}>
            {["Matrícula 45.210", "Contrato social", "Balanço 2025"].map((l, i) => (
              <div key={l} className="flex items-center justify-between border-b px-3 py-1.5 last:border-0" style={{ borderColor: t.border, background: i === 1 ? t.hover : undefined }}>
                <span>{l}{i === 1 && <span className="ml-1" style={{ color: t.textAux }}>(hover)</span>}</span>
                {i === 0 && <span className="relative">
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: s.warning.bg, color: s.warning.fg }}>Vence em 5 dias</span>
                  <span className="absolute -top-7 right-0 whitespace-nowrap rounded px-2 py-1 text-[10px]" style={{ background: t.tooltip, color: t.tooltipText }}>Tooltip: renovar até 18/10</span>
                </span>}
                {i === 2 && <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: s.neutral.bg, color: s.neutral.fg }}>Rascunho</span>}
              </div>
            ))}
          </div>
          <button onClick={() => setModal(true)} className="text-[11px] font-medium underline" style={{ color: state.secondary }}>Ver modal com overlay</button>
        </div>
      </div>
      {modal && (
        <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: `${t.overlay}99` }} onClick={() => setModal(false)}>
          <div className="w-64 rounded-lg border p-4 shadow-xl" style={st.card} onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold" style={{ fontFamily: font.heading }}>Concluir aba Certidões?</p>
            <p className="mt-1 text-[11px]" style={{ color: t.textSecondary }}>Os auditores serão notificados.</p>
            <div className="mt-3 flex justify-end gap-1.5">
              <button className={btn} style={{ color: t.textSecondary }} onClick={() => setModal(false)}>Cancelar</button>
              <button className={btn} style={{ background: t.brand, color: t.onBrand }} onClick={() => setModal(false)}>Concluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PField({ label, value, style }: { label: string; value: string; style: CSSProperties }) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] opacity-70">{label}</p>
      <div className="rounded-[5px] border px-2 py-1 text-[11px]" style={style}>{value}</div>
    </div>
  );
}

