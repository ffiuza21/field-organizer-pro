import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlignLeft, ArrowDown, ArrowUp, Calendar, CheckSquare, ChevronRight, Coins, Eye, EyeOff,
  FileText, GripVertical, Hash, Link2, ListChecks, Lock, Mail, Paperclip, Phone, Plus,
  Sparkles, Trash2, Type, User, Building2, X, Library, Info,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Configurar campos da aba — AuditFlow" },
      { name: "description", content: "Configure os campos de cada aba do template de auditoria AuditFlow." },
      { property: "og:title", content: "Configurar campos da aba — AuditFlow" },
      { property: "og:description", content: "Configure os campos de cada aba do template de auditoria AuditFlow." },
    ],
  }),
  component: Index,
});

type FieldType =
  | "short" | "long" | "number" | "currency" | "date" | "bool" | "choice"
  | "url" | "email" | "phone" | "cpf" | "cnpj" | "file";

const TYPES: { id: FieldType; label: string; icon: typeof Type }[] = [
  { id: "short", label: "Texto curto", icon: Type },
  { id: "long", label: "Texto longo", icon: AlignLeft },
  { id: "number", label: "Número", icon: Hash },
  { id: "currency", label: "Moeda", icon: Coins },
  { id: "date", label: "Data", icon: Calendar },
  { id: "bool", label: "Sim/Não", icon: CheckSquare },
  { id: "choice", label: "Múltipla escolha", icon: ListChecks },
  { id: "url", label: "Link/URL", icon: Link2 },
  { id: "email", label: "E-mail", icon: Mail },
  { id: "phone", label: "Telefone", icon: Phone },
  { id: "cpf", label: "CPF", icon: User },
  { id: "cnpj", label: "CNPJ", icon: Building2 },
  { id: "file", label: "Arquivo adicional", icon: Paperclip },
];
const typeOf = (t: FieldType) => TYPES.find((x) => x.id === t)!;
const isText = (t: FieldType) => t === "short" || t === "long";

type Field = {
  id: string; name: string; type: FieldType; origin: "standard" | "custom";
  structural?: boolean | undefined; required: boolean; visible: boolean;
  min?: number | undefined; max?: number | undefined; options?: string[] | undefined;
};

const STANDARD: Omit<Field, "id" | "required" | "visible">[] = [
  { name: "Recebido?", type: "bool", origin: "standard", structural: true },
  { name: "Descrição", type: "short", origin: "standard" },
  { name: "Observações", type: "long", origin: "standard" },
  { name: "Tipo de documento", type: "choice", origin: "standard", structural: true },
  { name: "Data de emissão", type: "date", origin: "standard", structural: true },
  { name: "Vencimento", type: "date", origin: "standard", structural: true },
];

const INITIAL: Field[] = [
  { id: "f1", name: "Tipo de documento", type: "choice", origin: "standard", structural: true, required: true, visible: true, options: ["Certidão negativa de débitos", "Certidão trabalhista", "Certidão de protesto"] },
  { id: "f2", name: "Data de emissão", type: "date", origin: "standard", structural: true, required: false, visible: true },
  { id: "f3", name: "Vencimento", type: "date", origin: "standard", structural: true, required: false, visible: true },
  { id: "f4", name: "Órgão emissor", type: "short", origin: "custom", required: true, visible: true, min: 3, max: 120 },
  { id: "f5", name: "Observações do auditor", type: "long", origin: "custom", required: false, visible: true, max: 2000 },
];

function Index() {
  const [open, setOpen] = useState(true);
  const [saved, setSaved] = useState<Field[]>(INITIAL);
  const [fields, setFields] = useState<Field[]>(INITIAL);
  const [selectedId, setSelectedId] = useState("f4");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Field | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dirty = JSON.stringify(saved) !== JSON.stringify(fields);
  const changes = useMemo(() => countChanges(saved, fields), [saved, fields]);
  const selected = fields.find((f) => f.id === selectedId) ?? null;
  const availableStandard = STANDARD.filter((s) => !fields.some((f) => f.name === s.name));

  const update = (id: string, patch: Partial<Field>) =>
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const move = (id: string, dir: -1 | 1) =>
    setFields((fs) => {
      const i = fs.findIndex((f) => f.id === id), j = i + dir;
      if (j < 0 || j >= fs.length) return fs;
      const c = [...fs]; [c[i], c[j]] = [c[j], c[i]]; return c;
    });
  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setFields((fs) => {
      const c = [...fs]; const from = c.findIndex((f) => f.id === dragId);
      const [item] = c.splice(from, 1); c.splice(c.findIndex((f) => f.id === targetId), 0, item); return c;
    });
  };
  const addCustom = () => {
    const id = "n" + Date.now();
    setFields((fs) => [...fs, { id, name: "Novo campo", type: "short", origin: "custom", required: false, visible: true }]);
    setSelectedId(id);
  };
  const addStandard = (s: (typeof STANDARD)[number]) => {
    const id = "s" + Date.now();
    setFields((fs) => [...fs, { ...s, id, required: false, visible: true, options: s.type === "choice" ? ["Opção 1"] : undefined }]);
    setSelectedId(id);
  };
  const apply = () => { setSaved(fields); flash("Alterações aplicadas ao template Certidões."); };
  const discard = () => { setFields(saved); setSelectedId(saved[0]?.id ?? ""); };
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };
  const tryClose = () => (dirty ? setConfirmClose(true) : setOpen(false));

  if (!open)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <button onClick={() => setOpen(true)} className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Configurar campos da aba
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="fixed inset-0 flex items-center justify-center bg-overlay p-4 sm:p-8">
        <div role="dialog" aria-modal="true" aria-labelledby="dlg-title" className="flex h-full max-h-[820px] w-full max-w-[1180px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-modal)]">
          {/* Header */}
          <header className="flex items-start justify-between gap-4 border-b border-border px-7 py-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span>Template de auditoria</span><ChevronRight className="h-3 w-3" /><span className="text-primary">Aba Certidões</span>
              </div>
              <h1 id="dlg-title" className="mt-1 text-xl font-semibold tracking-tight text-foreground">Configurar campos da aba</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Defina o que os auditores vão preencher na aba <strong className="font-medium text-foreground">Certidões</strong> · {fields.length} campos configurados
              </p>
            </div>
            <button onClick={tryClose} aria-label="Fechar" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[400px_1fr]">
            {/* List */}
            <aside className="flex min-h-0 flex-col border-r border-border bg-muted/60">
              <div className="flex items-center justify-between px-5 pb-2 pt-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campos, na ordem do formulário</h2>
              </div>
              <ol className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 pb-4">
                {fields.map((f, i) => {
                  const T = typeOf(f.type); const active = f.id === selectedId;
                  const isNew = !saved.some((s) => s.id === f.id);
                  return (
                    <li key={f.id}
                      draggable onDragStart={() => setDragId(f.id)}
                      onDragOver={(e) => { e.preventDefault(); setOverId(f.id); }}
                      onDrop={() => { dropOn(f.id); setDragId(null); setOverId(null); }}
                      onDragEnd={() => { setDragId(null); setOverId(null); }}
                      className={cn(
                        "group relative flex items-center gap-2 rounded-lg border bg-card px-2 py-2.5 transition",
                        active ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40",
                        dragId === f.id && "opacity-40",
                        overId === f.id && dragId !== f.id && "border-accent ring-1 ring-accent",
                        !f.visible && "bg-card/60",
                      )}>
                      <span className="cursor-grab text-muted-foreground/60 active:cursor-grabbing" aria-hidden><GripVertical className="h-4 w-4" /></span>
                      <button onClick={() => setSelectedId(f.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-current={active}>
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", active ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary")}>
                          <T.icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className={cn("flex items-center gap-1.5 truncate text-sm font-medium", f.visible ? "text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/40")}>
                            <span className="truncate">{f.name || "Sem nome"}</span>
                            {f.required && <span className="text-destructive" title="Obrigatório">*</span>}
                            {isNew && <span className="rounded bg-warning-soft px-1.5 text-[10px] font-semibold uppercase text-warning-foreground">Novo</span>}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            {T.label}<span aria-hidden>·</span>
                            {f.origin === "standard" ? <span className="inline-flex items-center gap-1"><Library className="h-3 w-3" />Padrão</span> : "Personalizado"}
                            {!f.visible && <><span aria-hidden>·</span><span>Oculto</span></>}
                          </span>
                        </span>
                      </button>
                      <div className={cn("flex items-center", active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100")}>
                        <IconBtn label="Mover para cima" disabled={i === 0} onClick={() => move(f.id, -1)}><ArrowUp className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn label="Mover para baixo" disabled={i === fields.length - 1} onClick={() => move(f.id, 1)}><ArrowDown className="h-3.5 w-3.5" /></IconBtn>
                      </div>
                      <IconBtn label={f.visible ? "Ocultar campo" : "Mostrar campo"} onClick={() => update(f.id, { visible: !f.visible })}>
                        {f.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-warning-foreground" />}
                      </IconBtn>
                    </li>
                  );
                })}
              </ol>

              {/* Add area */}
              <div className="border-t border-border bg-card p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adicionar campo</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={addCustom} className="flex items-center gap-2 rounded-lg border border-dashed border-primary/50 px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-primary-soft">
                    <Plus className="h-4 w-4" /><span>Personalizado<span className="block text-xs font-normal text-muted-foreground">Crie do zero</span></span>
                  </button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted">
                        <Library className="h-4 w-4 text-muted-foreground" /><span>Padrão do sistema<span className="block text-xs font-normal text-muted-foreground">{availableStandard.length} disponíveis</span></span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" side="top" className="w-72 p-1.5">
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">Campos prontos que ainda não estão nesta aba</p>
                      {availableStandard.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">Todos os campos padrão já foram adicionados.</p>}
                      {availableStandard.map((s) => { const T = typeOf(s.type); return (
                        <button key={s.name} onClick={() => addStandard(s)} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted">
                          <T.icon className="h-4 w-4 text-primary" />
                          <span className="flex-1 text-sm">{s.name}<span className="block text-xs text-muted-foreground">{T.label}</span></span>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>); })}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </aside>

            {/* Editor */}
            <section className="min-h-0 overflow-y-auto">
              {selected ? (
                <Editor key={selected.id} field={selected} onChange={(p) => update(selected.id, p)} onDelete={() => setConfirmDelete(selected)} />
              ) : (
                <div className="flex h-full items-center justify-center p-10 text-center text-sm text-muted-foreground">Selecione um campo à esquerda para editar.</div>
              )}
            </section>
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-between gap-4 border-t border-border bg-card px-7 py-4">
            <button onClick={dirty ? discard : tryClose} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              {dirty ? "Descartar alterações" : "Cancelar"}
            </button>
            <div className="flex items-center gap-4">
              {dirty ? (
                <span className="flex items-center gap-2 text-sm text-warning-foreground">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  {changes} {changes === 1 ? "alteração pendente" : "alterações pendentes"} · ainda não aplicadas
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Nenhuma alteração pendente</span>
              )}
              <button onClick={apply} disabled={!dirty} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
                Aplicar ao template
              </button>
            </div>
          </footer>
        </div>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-foreground px-4 py-2.5 text-sm text-background shadow-lg">{toast}</div>}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{confirmDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>O campo sairá desta aba quando você aplicar ao template. Se quiser apenas escondê-lo dos auditores, use “Ocultar”.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter campo</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
              const id = confirmDelete!.id; const rest = fields.filter((f) => f.id !== id);
              setFields(rest); setSelectedId(rest[0]?.id ?? ""); setConfirmDelete(null);
            }}>Excluir campo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem {changes} {changes === 1 ? "alteração" : "alterações"} não aplicadas</AlertDialogTitle>
            <AlertDialogDescription>Se sair agora, essas mudanças serão perdidas e o template continuará como estava.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { discard(); setOpen(false); }}>Sair sem aplicar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function countChanges(a: Field[], b: Field[]) {
  let n = 0;
  const ids = new Set([...a.map((f) => f.id), ...b.map((f) => f.id)]);
  ids.forEach((id) => {
    const x = a.find((f) => f.id === id), y = b.find((f) => f.id === id);
    if (!x || !y || JSON.stringify(x) !== JSON.stringify(y)) n++;
  });
  const order = (l: Field[]) => l.filter((f) => a.some((x) => x.id === f.id) && b.some((x) => x.id === f.id)).map((f) => f.id).join();
  if (order(a) !== order(b)) n++;
  return n;
}

function IconBtn({ label, children, onClick, disabled }: { label: string; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30">
      {children}
    </button>
  );
}

function Editor({ field, onChange, onDelete }: { field: Field; onChange: (p: Partial<Field>) => void; onDelete: () => void }) {
  const T = typeOf(field.type);
  return (
    <div className="grid gap-8 p-7 lg:grid-cols-[1fr_280px]">
      <div className="space-y-7">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary"><T.icon className="h-5 w-5" /></span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Editar campo</h2>
            <p className="text-xs text-muted-foreground">
              {field.origin === "standard" ? "Campo padrão do sistema" : "Campo personalizado"}
              {field.structural && " · estrutural"}
            </p>
          </div>
        </div>

        <Group title="Informações básicas">
          <Label text="Nome do campo" hint="É o que o auditor verá no formulário.">
            <input value={field.name} onChange={(e) => onChange({ name: e.target.value })} disabled={field.origin === "standard"}
              className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:bg-muted disabled:text-muted-foreground" />
          </Label>
          <Label text="Tipo de dado" hint={field.structural ? undefined : "Define como a informação será preenchida."}>
            {field.structural ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />{T.label}<span className="ml-auto text-xs">Não pode ser alterado: campo estrutural do sistema</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4">
                {TYPES.map((t) => (
                  <button key={t.id} type="button" onClick={() => onChange({ type: t.id, options: t.id === "choice" ? field.options ?? ["Opção 1", "Opção 2"] : field.options })}
                    aria-pressed={field.type === t.id}
                    className={cn("flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs font-medium transition",
                      field.type === t.id ? "border-primary bg-primary-soft text-primary" : "border-border text-foreground hover:border-primary/40")}>
                    <t.icon className="h-3.5 w-3.5 shrink-0" />{t.label}
                  </button>
                ))}
              </div>
            )}
          </Label>
        </Group>

        <Group title="Regras de preenchimento">
          <Toggle label="Obrigatório" desc="O auditor não conseguirá concluir a aba sem preencher." checked={field.required} onChange={(v) => onChange({ required: v })} />
          <Toggle label="Visível no formulário" desc="Campos ocultos continuam no template, mas não aparecem para os auditores." checked={field.visible} onChange={(v) => onChange({ visible: v })} />
          {isText(field.type) && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Label text="Mínimo de caracteres"><NumInput value={field.min} onChange={(v) => onChange({ min: v })} placeholder="Sem mínimo" /></Label>
              <Label text="Máximo de caracteres"><NumInput value={field.max} onChange={(v) => onChange({ max: v })} placeholder="Sem limite" /></Label>
            </div>
          )}
        </Group>

        {field.type === "choice" && (
          <Group title="Opções de escolha" desc="O auditor escolherá uma destas opções.">
            <div className="space-y-2">
              {(field.options ?? []).map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 text-right text-xs text-muted-foreground">{i + 1}</span>
                  <input value={o} onChange={(e) => onChange({ options: field.options!.map((x, j) => (j === i ? e.target.value : x)) })}
                    className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25" />
                  <IconBtn label="Remover opção" onClick={() => onChange({ options: field.options!.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></IconBtn>
                </div>
              ))}
              <button onClick={() => onChange({ options: [...(field.options ?? []), ""] })} className="ml-7 flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
                <Plus className="h-4 w-4" />Adicionar opção
              </button>
            </div>
          </Group>
        )}

        {field.structural ? (
          <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Este é um campo estrutural da auditoria e não pode ser excluído. Se não precisar dele, oculte-o.
          </p>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-destructive/25 px-4 py-3">
            <div><p className="text-sm font-medium text-foreground">Excluir campo</p><p className="text-xs text-muted-foreground">Remove o campo desta aba ao aplicar.</p></div>
            <button onClick={onDelete} className="flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="h-4 w-4" />Excluir
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      <aside className="lg:sticky lg:top-0 lg:self-start">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Sparkles className="h-3.5 w-3.5" />Prévia para o auditor</p>
        <div className={cn("rounded-lg border border-border bg-background p-4", !field.visible && "opacity-50")}>
          <label className="text-sm font-medium text-foreground">{field.name || "Sem nome"}{field.required && <span className="text-destructive"> *</span>}</label>
          <div className="mt-2"><PreviewInput field={field} /></div>
          {isText(field.type) && field.max && <p className="mt-1.5 text-right text-xs text-muted-foreground">0 / {field.max}</p>}
        </div>
        {!field.visible && <p className="mt-2 flex items-center gap-1.5 text-xs text-warning-foreground"><EyeOff className="h-3.5 w-3.5" />Oculto — não aparecerá no formulário</p>}
      </aside>
    </div>
  );
}

function PreviewInput({ field }: { field: Field }) {
  const box = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-muted-foreground";
  switch (field.type) {
    case "long": return <div className={cn(box, "h-20")}>Digite aqui…</div>;
    case "bool": return <div className="flex gap-2">{["Sim", "Não"].map((x) => <span key={x} className="rounded-md border border-input bg-card px-4 py-1.5 text-sm">{x}</span>)}</div>;
    case "choice": return <div className={cn(box, "flex justify-between")}>{field.options?.[0] || "Selecione"}<ChevronRight className="h-4 w-4 rotate-90" /></div>;
    case "date": return <div className={cn(box, "flex justify-between")}>dd/mm/aaaa<Calendar className="h-4 w-4" /></div>;
    case "file": return <div className={cn(box, "flex items-center gap-2 border-dashed")}><FileText className="h-4 w-4" />Anexar arquivo</div>;
    case "currency": return <div className={box}>R$ 0,00</div>;
    case "cpf": return <div className={box}>000.000.000-00</div>;
    case "cnpj": return <div className={box}>00.000.000/0000-00</div>;
    case "phone": return <div className={box}>(00) 00000-0000</div>;
    case "email": return <div className={box}>nome@exemplo.com</div>;
    case "url": return <div className={box}>https://</div>;
    default: return <div className={box}>Digite aqui…</div>;
  }
}

function Group({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div><h3 className="text-sm font-semibold text-foreground">{title}</h3>{desc && <p className="text-xs text-muted-foreground">{desc}</p>}</div>
      {children}
    </section>
  );
}
function Label({ text, hint, children }: { text: string; hint?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{text}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-6 rounded-lg border border-border px-4 py-3">
      <div><p className="text-sm font-medium text-foreground">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
function NumInput({ value, onChange, placeholder }: { value?: number | undefined; onChange: (v?: number) => void; placeholder: string }) {
  return (
    <input type="number" min={0} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25" />
  );
}
