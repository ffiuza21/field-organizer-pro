import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronRight, CircleAlert, Copy, FileText, FolderOpen, Home,
  ImageUp, Info, Monitor, Moon, Palette, RotateCcw, Sparkles, Sun, Type,
  Wand2, X, XCircle, Users, Settings, Eye, Lock, Pencil, Plus,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  type BrandState, type Mode, type SemanticKey, DEFAULT_BRAND, FONTS, LIGHT_TOKENS, DARK_TOKENS,
  SEMANTIC_LABELS, resolveTheme, runChecks, contrast,
} from "@/lib/brand-theme";
import { activateProfile, createDefaultProfile, type BrandProfile } from "@/lib/brand-profiles";

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

const INITIAL_PROFILES: BrandProfile[] = [
  { id: "principal", name: "Identidade principal", state: { ...DEFAULT_BRAND, name: "Identidade principal" }, active: true, updatedAt: "Hoje, 12:40" },
  { id: "relatorios", name: "Relatórios institucionais", state: { ...DEFAULT_BRAND, name: "Relatórios institucionais", primary: "#0F3D5E", secondary: "#C08A2E" }, active: false, updatedAt: "8 out, 16:15" },
  { id: "projetos", name: "Projetos especiais", state: { ...DEFAULT_BRAND, name: "Projetos especiais", primary: "#1F5135", secondary: "#2E8B7A" }, active: false, updatedAt: "2 out, 09:30" },
];

const SECTIONS: { id: Section; label: string; desc: string; icon: typeof Palette; advanced?: boolean }[] = [
  { id: "brand", label: "Marca e tipografia", desc: "Logo, cores e fonte", icon: Palette },
  { id: "light", label: "Tema claro", desc: "Superfícies, textos e bordas", icon: Sun, advanced: true },
  { id: "dark", label: "Tema escuro", desc: "Um tema próprio, não inversão", icon: Moon, advanced: true },
  { id: "semantic", label: "Cores semânticas", desc: "Sucesso, alerta, erro…", icon: CircleAlert, advanced: true },
  { id: "preview", label: "Prévia de componentes", desc: "Visualização ampliada", icon: Eye },
];

function BrandPage() {
  const [profiles, setProfiles] = useState<BrandProfile[]>(INITIAL_PROFILES);
  const [view, setView] = useState<"gallery" | "editor">(INITIAL_PROFILES.length === 0 ? "editor" : "gallery");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [published, setPublished] = useState<BrandState>(DEFAULT_BRAND);
  const [state, setState] = useState<BrandState>(DEFAULT_BRAND);
  const [lastSaved, setLastSaved] = useState<BrandState>(DEFAULT_BRAND);
  const [status, setStatus] = useState<Status>("clean");
  const [advanced, setAdvanced] = useState(true);
  const [section, setSection] = useState<Section>("brand");
  const [previewMode, setPreviewMode] = useState<Mode>("light");
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [baseId, setBaseId] = useState<"default" | string>("default");
  const [toast, setToast] = useState<string | null>(null);

  const checks = useMemo(() => runChecks(state), [state]);
  const blockers = checks.filter((c) => c.level === "block");
  const unpublished = JSON.stringify(state) !== JSON.stringify(published);
  const unsavedDraft = JSON.stringify(state) !== JSON.stringify(lastSaved);

  const set = (patch: Partial<BrandState>) => { setState((s) => ({ ...s, ...patch })); setStatus("dirty"); };
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2800); };
  const editingProfile = profiles.find((profile) => profile.id === editingId);
  const saveDraft = () => {
    if (!editingId) return;
    setProfiles((items) => items.map((profile) => profile.id === editingId ? { ...profile, name: state.name, state, updatedAt: "Agora" } : profile));
    setLastSaved(state); setStatus("saved"); flash("Perfil salvo na biblioteca.");
  };
  const publish = () => {
    if (!editingId) return;
    setProfiles((items) => activateProfile(items, editingId, state));
    setPublished(state); setLastSaved(state); setStatus("clean"); flash("Perfil aplicado para toda a organização.");
  };
  const restore = () => { setState(DEFAULT_BRAND); setStatus("restored"); setConfirmRestore(false); flash("Tema padrão do AuditFlow restaurado. Publique para aplicar."); };

  const openProfile = (profile: BrandProfile) => {
    setEditingId(profile.id); setState(profile.state); setLastSaved(profile.state);
    setPublished(profile.active ? profile.state : profiles.find((item) => item.active)?.state ?? DEFAULT_BRAND);
    setStatus("clean"); setSection("brand"); setView("editor");
  };
  const openCreate = (source: "default" | string = "default") => {
    const sourceProfile = profiles.find((profile) => profile.id === source);
    setBaseId(sourceProfile?.id ?? "default");
    setNewName(sourceProfile ? `Cópia de ${sourceProfile.name}` : "Nova identidade visual");
    setCreateOpen(true);
  };
  const createProfile = () => {
    const name = newName.trim() || "Nova identidade visual";
    const id = `perfil-${Date.now()}`;
    const source = profiles.find((profile) => profile.id === baseId)?.state;
    const profile = source
      ? { id, name, state: { ...source, name }, active: false, updatedAt: "Agora" }
      : createDefaultProfile(id, name);
    setProfiles((items) => [...items, profile]); setCreateOpen(false); openProfile(profile);
  };
  const leaveEditor = () => {
    if (unsavedDraft) { setConfirmLeave(true); return; }
    setView("gallery"); setEditingId(null);
  };

  const visibleSections = SECTIONS.filter((s) => advanced || !s.advanced);
  const current = visibleSections.some((s) => s.id === section) ? section : "brand";

  if (view === "gallery") return (
    <ProfileGallery profiles={profiles} onOpen={openProfile} onCreate={() => openCreate()} onDuplicate={openCreate}
      createDialog={<CreateProfileDialog open={createOpen} onOpenChange={setCreateOpen} profiles={profiles} baseId={baseId} setBaseId={setBaseId} name={newName} setName={setNewName} onCreate={createProfile} />} />
  );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Configurações</Link><ChevronRight className="h-3 w-3" />
              <button onClick={leaveEditor} className="hover:text-foreground">Identidade visual</button><ChevronRight className="h-3 w-3" />
              <span className="font-medium text-primary">{editingProfile?.name ?? state.name}</span>
            </nav>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="icon" onClick={leaveEditor} aria-label="Voltar para perfis" title="Voltar para perfis"><ArrowLeft /></Button>
              <h1 className="text-2xl font-semibold tracking-tight">{state.name}</h1>
              <StatusPill status={status} unpublished={unpublished} unsavedDraft={unsavedDraft} />
            </div>
            <p className="mt-0.5 pl-11 text-sm text-muted-foreground">Edite este perfil e aplique quando quiser usá-lo em toda a organização.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setConfirmRestore(true)} className="text-muted-foreground">
              <RotateCcw className="h-4 w-4" />Restaurar padrão
            </Button>
            <Button variant="outline" onClick={saveDraft} disabled={!unsavedDraft}>Salvar perfil</Button>
            <div className="relative group">
              <Button onClick={publish} disabled={blockers.length > 0 || (editingProfile?.active === true && !unpublished)}>
                {blockers.length > 0 && <Lock className="h-4 w-4" />}Aplicar à organização
              </Button>
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
      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Sair sem salvar?</AlertDialogTitle><AlertDialogDescription>As alterações feitas neste perfil serão descartadas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Continuar editando</AlertDialogCancel><AlertDialogAction onClick={() => { setConfirmLeave(false); setView("gallery"); setEditingId(null); }}>Descartar e sair</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProfileGallery({ profiles, onOpen, onCreate, onDuplicate, createDialog }: { profiles: BrandProfile[]; onOpen: (profile: BrandProfile) => void; onCreate: () => void; onDuplicate: (id: string) => void; createDialog: ReactNode }) {
  const active = profiles.find((profile) => profile.active);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-6 lg:px-10">
          <div><nav className="flex items-center gap-1.5 text-xs text-muted-foreground"><Link to="/" className="hover:text-foreground">Configurações</Link><ChevronRight className="h-3 w-3" /><span>Organização</span></nav><h1 className="mt-2 text-2xl font-semibold">Identidade visual</h1><p className="mt-1 text-sm text-muted-foreground">Escolha um perfil para editar ou crie uma nova identidade.</p></div>
          <Button onClick={onCreate}><Plus />Novo perfil</Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {active && (
          <section className="mb-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Em uso na organização</p>
            <ProfileRow profile={active} onOpen={onOpen} onDuplicate={onDuplicate} featured />
          </section>
        )}
        <section>
          <div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-semibold">Todos os perfis</h2><p className="text-sm text-muted-foreground">{profiles.length} {profiles.length === 1 ? "perfil salvo" : "perfis salvos"}</p></div></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => <ProfileCard key={profile.id} profile={profile} onOpen={onOpen} onDuplicate={onDuplicate} />)}
            <button onClick={onCreate} className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-input bg-card/40 p-6 text-center transition hover:border-primary hover:bg-primary-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary"><Plus className="h-5 w-5" /></span><span className="font-semibold">Criar novo perfil</span><span className="max-w-52 text-sm text-muted-foreground">Comece pelo padrão ou use um perfil existente como base.</span>
            </button>
          </div>
        </section>
      </main>
      {createDialog}
    </div>
  );
}

function ThemeStrip({ state }: { state: BrandState }) {
  const light = resolveTheme(state, "light");
  return <div className="flex h-20 overflow-hidden border-b border-border"><div className="w-1/4" style={{ background: light.nav }} /><div className="flex flex-1 items-center gap-2 p-4" style={{ background: light.bg }}><span className="h-8 flex-1 rounded border" style={{ background: light.card, borderColor: light.border }} /><span className="h-8 w-16 rounded" style={{ background: light.brand }} /></div></div>;
}

function ProfileCard({ profile, onOpen, onDuplicate }: { profile: BrandProfile; onOpen: (profile: BrandProfile) => void; onDuplicate: (id: string) => void }) {
  return <article className="overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary/40 hover:shadow-sm"><ThemeStrip state={profile.state} /><div className="p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{profile.name}</h3>{profile.active && <span className="rounded bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">Em uso</span>}</div><p className="mt-1 text-xs text-muted-foreground">Atualizado {profile.updatedAt}</p></div><span className="h-6 w-6 rounded-full border-4 border-card" style={{ background: profile.state.primary }} /></div><div className="mt-6 flex gap-2"><Button className="flex-1" variant={profile.active ? "outline" : "default"} onClick={() => onOpen(profile)}>Editar perfil</Button><Button variant="ghost" size="icon" onClick={() => onDuplicate(profile.id)} aria-label={`Duplicar ${profile.name}`} title="Duplicar perfil"><Copy /></Button></div></div></article>;
}

function ProfileRow({ profile, onOpen, onDuplicate, featured }: { profile: BrandProfile; onOpen: (profile: BrandProfile) => void; onDuplicate: (id: string) => void; featured?: boolean }) {
  return <div className={cn("flex flex-col overflow-hidden rounded-lg border bg-card md:flex-row", featured ? "border-primary/40" : "border-border")}><div className="w-full md:w-72"><ThemeStrip state={profile.state} /></div><div className="flex flex-1 flex-wrap items-center justify-between gap-5 p-5"><div><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /><h2 className="font-semibold">{profile.name}</h2></div><p className="mt-1 pl-7 text-sm text-muted-foreground">Este é o visual que todas as pessoas veem atualmente.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => onDuplicate(profile.id)}><Copy />Usar como base</Button><Button onClick={() => onOpen(profile)}>Editar perfil</Button></div></div></div>;
}

function CreateProfileDialog({ open, onOpenChange, profiles, baseId, setBaseId, name, setName, onCreate }: { open: boolean; onOpenChange: (open: boolean) => void; profiles: BrandProfile[]; baseId: string; setBaseId: (id: string) => void; name: string; setName: (name: string) => void; onCreate: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Criar perfil de identidade</DialogTitle><DialogDescription>Escolha um ponto de partida. Você poderá alterar todas as configurações antes de aplicar.</DialogDescription></DialogHeader><div className="space-y-5 py-2"><label className="block"><span className="text-sm font-medium">Nome do perfil</span><Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} autoFocus /></label><div><p className="text-sm font-medium">Começar a partir de</p><div className="mt-2 max-h-64 space-y-2 overflow-y-auto"><button onClick={() => setBaseId("default")} className={cn("flex w-full items-center gap-3 rounded-md border p-3 text-left", baseId === "default" ? "border-primary bg-primary-soft" : "border-border hover:bg-muted")}><span className="flex h-9 w-9 items-center justify-center rounded bg-muted"><Sparkles className="h-4 w-4" /></span><span className="flex-1"><span className="block text-sm font-medium">Padrão do AuditFlow</span><span className="block text-xs text-muted-foreground">Cores e tipografia originais</span></span>{baseId === "default" && <Check className="h-4 w-4 text-primary" />}</button>{profiles.map((profile) => <button key={profile.id} onClick={() => setBaseId(profile.id)} className={cn("flex w-full items-center gap-3 rounded-md border p-3 text-left", baseId === profile.id ? "border-primary bg-primary-soft" : "border-border hover:bg-muted")}><span className="h-9 w-9 rounded border border-border" style={{ background: profile.state.primary }} /><span className="flex-1"><span className="block text-sm font-medium">{profile.name}</span><span className="block text-xs text-muted-foreground">Copiar todas as configurações</span></span>{baseId === profile.id && <Check className="h-4 w-4 text-primary" />}</button>)}</div></div></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={onCreate} disabled={!name.trim()}>Criar e editar</Button></DialogFooter></DialogContent></Dialog>;
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
          <div className="mt-6 rounded-lg border text-[11px]" style={st.card}>
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

