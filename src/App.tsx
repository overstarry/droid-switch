import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Archive,
  ArrowRightLeft,
  Check,
  Download,
  LayoutTemplate,
  Pencil,
  Plus,
  Terminal,
  Trash2,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { FactoryMeta, Preset, Store } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ProviderList } from "@/components/ProviderList";
import { ProviderForm } from "@/components/ProviderForm";
import { PresetPickerDialog } from "@/components/PresetPickerDialog";
import { BackupDialog } from "@/components/BackupDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { PresetTemplate } from "@/lib/presets";

type Mode = { kind: "idle" } | { kind: "edit"; id: string } | { kind: "new"; seed?: Preset };

interface SideActionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function SideAction({ icon: Icon, label, onClick, disabled }: SideActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 items-center justify-center gap-1.5 border border-border px-2 font-mono text-[9px] font-semibold tracking-[0.08em] text-muted-foreground transition-colors hover:border-border-strong hover:bg-surface-elevated hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      <Icon className="size-3" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function providerName(provider: Preset["customModel"]["provider"]): string {
  switch (provider) {
    case "anthropic":
      return "Anthropic";
    case "openai":
      return "OpenAI";
    default:
      return "Generic API";
  }
}

export default function App() {
  const { t } = useTranslation();
  const [store, setStore] = useState<Store>({ presets: [], activeId: null });
  const [meta, setMeta] = useState<FactoryMeta | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [showPicker, setShowPicker] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [didFirstImport, setDidFirstImport] = useState(false);

  const refreshMeta = useCallback(async () => {
    try {
      setMeta(await api.readFactoryMeta());
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const refreshStore = useCallback(async () => {
    try {
      setStore(await api.listPresets());
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshStore();
      await refreshMeta();
      try {
        const nextStore = await api.listPresets();
        if (nextStore.presets.length === 0) {
          setStore(await api.importFromFactory());
        }
      } catch (e) {
        console.warn("auto-import failed", e);
      } finally {
        setDidFirstImport(true);
      }
    })();
  }, [refreshMeta, refreshStore]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    setSelectedId((current) => {
      if (current && store.presets.some((preset) => preset.id === current)) return current;
      return store.activeId ?? store.presets[0]?.id ?? null;
    });
  }, [store.activeId, store.presets]);

  const selected = useMemo(
    () => store.presets.find((preset) => preset.id === selectedId) ?? null,
    [store.presets, selectedId]
  );

  const editingPreset = useMemo<Preset | null>(() => {
    if (mode.kind === "edit") {
      return store.presets.find((preset) => preset.id === mode.id) ?? null;
    }
    if (mode.kind === "new" && mode.seed) {
      return mode.seed;
    }
    return null;
  }, [mode, store.presets]);

  const handleSubmit = useCallback(
    async (preset: Preset) => {
      setBusy(true);
      try {
        const next = await api.upsertPreset(preset);
        setStore(next);
        const idForSelect = preset.id || next.presets[next.presets.length - 1]?.id || null;
        setSelectedId(idForSelect);
        setMode({ kind: "idle" });
        setToast(preset.id ? t("toast.saved") : t("toast.created"));
      } finally {
        setBusy(false);
      }
    },
    [t]
  );

  const handleSwitch = useCallback(
    async (id: string) => {
      setBusy(true);
      setError(null);
      try {
        const next = await api.switchTo(id);
        setStore(next);
        setSelectedId(id);
        await refreshMeta();
        setToast(t("toast.switched"));
      } catch (e) {
        setError(String(e));
      } finally {
        setBusy(false);
      }
    },
    [refreshMeta, t]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const preset = store.presets.find((item) => item.id === id);
      if (!preset) return;
      if (!confirm(t("confirm.delete", { label: preset.label }))) return;
      setBusy(true);
      setError(null);
      try {
        const next = await api.deletePreset(id);
        setStore(next);
        if (selectedId === id) setSelectedId(null);
        if (mode.kind === "edit" && mode.id === id) setMode({ kind: "idle" });
        setToast(t("toast.deleted"));
      } catch (e) {
        setError(String(e));
      } finally {
        setBusy(false);
      }
    },
    [mode, selectedId, store.presets, t]
  );

  const handlePickTemplate = useCallback(
    (template: PresetTemplate) => {
      const now = new Date().toISOString();
      const seed: Preset = {
        id: "",
        label: t(template.labelKey),
        customModel: { ...template.customModel },
        createdAt: now,
        updatedAt: now,
      };
      setSelectedId(null);
      setMode({ kind: "new", seed });
      setShowPicker(false);
    },
    [t]
  );

  const handleImport = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const before = store.presets.length;
      const next = await api.importFromFactory();
      setStore(next);
      await refreshMeta();
      const added = next.presets.length - before;
      setToast(added > 0 ? t("toast.imported", { count: added }) : t("toast.importedNoChange"));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }, [refreshMeta, store.presets.length, t]);

  const activeIsSelected = !!selected && store.activeId === selected.id;
  const factoryHealthy = Boolean(meta?.exists);
  const factoryStatus = meta
    ? meta.exists
      ? t("console.connected")
      : t("console.notConnected")
    : t("header.loading");

  return (
    <div className="flex h-full min-h-[640px] flex-col overflow-hidden bg-background text-foreground">
      <header className="relative flex h-[76px] shrink-0 items-center border-b border-border bg-surface px-8">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-accent" />
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex size-[34px] shrink-0 items-center justify-center bg-accent text-accent-foreground">
            <Zap className="size-[17px]" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[14px] font-bold tracking-[0.08em] text-foreground">DROID / SWITCH</p>
            <p className="mt-1 truncate font-mono text-[9px] font-semibold tracking-[0.12em] text-muted-foreground">
              {t("console.providerControl")}
            </p>
          </div>
        </div>

        <div className="absolute left-1/2 hidden h-[42px] w-[410px] -translate-x-1/2 border border-border bg-surface-elevated xl:flex xl:items-center">
          <div className="h-full w-[3px] bg-accent" />
          <span className={`ml-3 size-2 rounded-full ${factoryHealthy ? "bg-success" : "bg-muted-foreground"}`} />
          <div className="ml-3 min-w-0">
            <p className="font-mono text-[9px] font-semibold tracking-[0.1em] text-muted-foreground">
              {t("console.factoryStatus")} / {factoryStatus}
            </p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-foreground">
              {meta?.activeModel ?? "—"} · {t("header.modelCount", { count: meta?.customModelsCount ?? 0 })}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden text-right lg:block">
            <p className="font-mono text-[9px] font-semibold tracking-[0.1em] text-muted-foreground">
              {t("console.lastSync")}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">—</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-surface px-6 py-6 max-lg:w-72 max-lg:px-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-muted-foreground">
              {t("console.presetRegistry")}
            </span>
            <span className="font-mono text-xs font-bold text-accent">{String(store.presets.length).padStart(2, "0")}</span>
          </div>

          <button
            onClick={() => {
              setSelectedId(null);
              setMode({ kind: "new" });
            }}
            className="mt-4 flex h-11 w-full items-center gap-3 bg-accent px-4 font-mono text-[11px] font-bold tracking-[0.09em] text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <Plus className="size-4" />
            <span>{t("sidebar.newShort")}</span>
            <span className="ml-auto text-[10px] opacity-60">⌘ N</span>
          </button>

          <div className="mt-5 grid grid-cols-3 border-y border-border py-3">
            <SideAction icon={LayoutTemplate} label={t("sidebar.templates")} onClick={() => setShowPicker(true)} />
            <SideAction icon={Download} label={t("sidebar.import")} onClick={handleImport} disabled={busy} />
            <SideAction icon={Archive} label={t("sidebar.backups")} onClick={() => setShowBackups(true)} />
          </div>

          <div className="mt-6 flex items-center justify-between border-b border-border pb-3">
            <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-muted-foreground">
              {t("console.savedProfiles")}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">{store.presets.length}</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {!didFirstImport ? (
              <div className="py-8 text-center font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
                {t("header.loading")}
              </div>
            ) : (
              <ProviderList
                presets={store.presets}
                activeId={store.activeId}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setMode({ kind: "idle" });
                }}
                onSwitch={handleSwitch}
                onDelete={handleDelete}
              />
            )}
          </div>

          <button
            onClick={() => setShowBackups(true)}
            className="relative mt-5 border border-border bg-surface-elevated px-4 py-4 text-left transition-colors hover:border-border-strong"
          >
            <span className="absolute inset-y-0 left-0 w-[3px] bg-success" />
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 size-4 shrink-0 text-success" />
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-semibold tracking-[0.1em] text-muted-foreground">
                  {t("console.backupHistory")}
                </p>
                <p className="mt-1 text-[12px] font-semibold text-foreground">{t("dialog.backupsHint")}</p>
                <p className="mt-1 font-mono text-[9px] text-muted-foreground">{t("console.openBackups")}</p>
              </div>
            </div>
          </button>
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden bg-background">
          <div className="h-full overflow-y-auto px-10 py-8 max-xl:px-8 max-lg:px-6">
            {mode.kind !== "idle" ? (
              <ProviderForm
                key={mode.kind === "edit" ? mode.id : "new"}
                initial={editingPreset}
                submitting={busy}
                onSubmit={handleSubmit}
                onCancel={() => setMode({ kind: "idle" })}
              />
            ) : selected ? (
              <div className="mx-auto flex max-w-[1040px] flex-col pb-8">
                <section className="border-t border-border pt-7">
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-accent">
                        {t("console.activePreset")}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <h1 className="truncate text-[30px] font-bold tracking-[-0.04em] text-foreground">{selected.label}</h1>
                        {activeIsSelected ? (
                          <span className="inline-flex items-center gap-2 border border-success/30 bg-success-soft px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.08em] text-success">
                            <span className="size-1.5 rounded-full bg-success" />
                            {t("details.active")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-[13px] text-muted-foreground">
                        {activeIsSelected ? t("details.activeHint") : t("details.inactiveHint")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!activeIsSelected ? (
                        <Button onClick={() => handleSwitch(selected.id)} disabled={busy}>
                          <ArrowRightLeft className="size-3.5" />
                          {t("details.switchToThis")}
                        </Button>
                      ) : null}
                      <Button variant="secondary" onClick={() => setMode({ kind: "edit", id: selected.id })}>
                        <Pencil className="size-3.5 text-accent" />
                        {t("console.editConfig")}
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="relative mt-8 border border-border bg-surface px-5 py-4">
                  <span className="absolute inset-y-0 left-0 w-1 bg-accent" />
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <h2 className="font-mono text-[10px] font-semibold tracking-[0.12em] text-muted-foreground">
                      {t("console.activeRoute")}
                    </h2>
                    <p className="font-mono text-[9px] text-muted-foreground/70">{t("console.atomicSnapshot")}</p>
                  </div>
                  <div className="mt-5 flex flex-col gap-2 xl:flex-row xl:items-center">
                    <RouteNode icon={Terminal} title={t("console.factoryCli")} detail={t("console.userConfig")} />
                    <span className="hidden h-px flex-1 bg-border-strong xl:block" />
                    <RouteNode
                      icon={ArrowRightLeft}
                      title={providerName(selected.customModel.provider)}
                      detail={t("console.providerGateway")}
                    />
                    <span className="hidden h-px flex-1 bg-border-strong xl:block" />
                    <RouteNode icon={Zap} title={selected.customModel.displayName} detail={t("console.modelRuntime")} />
                    <div
                      className={`flex min-w-[220px] items-center gap-3 border px-4 py-3 xl:ml-2 ${
                        factoryHealthy
                          ? "border-success/30 bg-success-soft text-success"
                          : "border-destructive/30 bg-destructive-soft text-destructive"
                      }`}
                    >
                      {factoryHealthy ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
                      <div>
                        <p className="font-mono text-[9px] font-bold tracking-[0.09em]">
                          {factoryHealthy ? t("console.configurationHealthy") : t("console.configurationPending")}
                        </p>
                        <p className="mt-1 font-mono text-[9px] opacity-80">{factoryStatus}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="mt-8 flex items-center justify-between border-b border-border pb-3">
                  <h2 className="font-mono text-[10px] font-semibold tracking-[0.12em] text-muted-foreground">
                    {t("details.configuration")}
                  </h2>
                  <span className="font-mono text-[9px] text-muted-foreground">{selected.updatedAt}</span>
                </div>

                <div className="mt-4 grid gap-7 xl:grid-cols-[minmax(0,1fr)_342px]">
                  <section className="border border-border bg-surface">
                    <div className="border-b border-border px-5 py-4">
                      <h3 className="text-[14px] font-semibold text-foreground">{t("console.providerAccess")}</h3>
                      <p className="mt-1 font-mono text-[9px] tracking-[0.04em] text-muted-foreground">
                        {t("console.readOnlySnapshot")}
                      </p>
                    </div>
                    <dl>
                      <DetailRow
                        label={t("details.provider")}
                        value={providerName(selected.customModel.provider)}
                        detail={selected.customModel.provider === "generic-chat-completion-api" ? "GENERIC API" : "OFFICIAL API"}
                      />
                      <DetailRow label={t("details.displayName")} value={selected.customModel.displayName} detail={t("console.displayLabel")} />
                      <DetailRow label={t("details.modelId")} value={selected.customModel.model} detail={t("console.modelReference")} />
                      <DetailRow label={t("details.baseUrl")} value={selected.customModel.baseUrl} detail={t("console.endpoint")} last />
                    </dl>
                  </section>

                  <div className="flex flex-col gap-5">
                    <section className="border border-border bg-surface">
                      <div className="border-b border-border px-5 py-4">
                        <h3 className="text-[14px] font-semibold text-foreground">{t("console.runtimePolicy")}</h3>
                      </div>
                      <div className="space-y-5 px-5 py-5">
                        <Metric label={t("details.maxOutputTokens")} value={selected.customModel.maxOutputTokens?.toLocaleString() ?? "—"} />
                        <Metric
                          label={t("console.visionInput")}
                          value={selected.customModel.noImageSupport ? t("console.disabled") : t("console.enabled")}
                          status={selected.customModel.noImageSupport ? "muted" : "success"}
                        />
                      </div>
                    </section>

                    <section className="relative border border-border bg-surface px-5 py-4">
                      <span className="absolute inset-y-0 left-0 w-[3px] bg-success" />
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-[14px] font-semibold text-foreground">{t("console.environmentIntegrity")}</h3>
                        <span className="bg-success-soft px-2 py-1 font-mono text-[8px] font-bold tracking-[0.08em] text-success">
                          {t("console.storedReference")}
                        </span>
                      </div>
                      <div className="mt-4 border-t border-border pt-4">
                        <p className="font-mono text-[9px] font-semibold tracking-[0.08em] text-muted-foreground">
                          {t("console.credentialReference")}
                        </p>
                        <p className="mt-1.5 break-all font-mono text-[11px] text-foreground">{selected.customModel.apiKey}</p>
                      </div>
                      <button
                        onClick={() => setShowBackups(true)}
                        className="mt-5 flex w-full items-center gap-2 border-t border-border pt-4 text-left font-mono text-[9px] font-bold tracking-[0.08em] text-accent transition-colors hover:text-foreground"
                      >
                        <Archive className="size-3.5" />
                        {t("console.openBackups")}
                      </button>
                    </section>
                  </div>
                </div>

                <footer className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border border-border bg-surface px-5 py-4">
                  <div className="mr-auto flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-success" />
                    <span>
                      {t("console.configurationVerified")} · {activeIsSelected ? t("console.readyToApply") : t("console.readyToSwitch")}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowBackups(true)}
                    className="font-mono text-[9px] font-bold tracking-[0.08em] text-accent transition-colors hover:text-foreground"
                  >
                    {t("console.openBackups")}
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-[0.08em] text-destructive transition-colors hover:text-foreground"
                  >
                    <Trash2 className="size-3.5" />
                    {t("details.delete")}
                  </button>
                </footer>
              </div>
            ) : (
              <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center border-y border-border text-center">
                <div className="flex size-14 items-center justify-center border border-border-strong bg-surface">
                  <Terminal className="size-5 text-accent" />
                </div>
                <p className="mt-5 text-[15px] font-semibold text-foreground">{t("empty.hint")}</p>
                <p className="mt-2 text-xs text-muted-foreground">{t("empty.subHint")}</p>
                <Button
                  className="mt-6"
                  onClick={() => {
                    setSelectedId(null);
                    setMode({ kind: "new" });
                  }}
                >
                  <Plus className="size-3.5" />
                  {t("sidebar.newShort")}
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <PresetPickerDialog open={showPicker} onClose={() => setShowPicker(false)} onPick={handlePickTemplate} />
      <BackupDialog
        open={showBackups}
        onClose={() => setShowBackups(false)}
        onRestored={async () => {
          await refreshMeta();
          await refreshStore();
        }}
      />

      {toast ? (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 border border-border-strong bg-surface-elevated px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.06em] text-foreground shadow-dialog">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm border border-destructive/40 bg-destructive-soft px-4 py-3 text-xs text-destructive shadow-dialog">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label={t("common.dismiss")}
              className="shrink-0 p-0.5 hover:bg-destructive/10"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RouteNode({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="flex min-w-[160px] flex-1 items-center gap-3 border border-border bg-surface-elevated px-3 py-3">
      <Icon className="size-4 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-foreground">{title}</p>
        <p className="mt-1 truncate font-mono text-[8px] font-semibold tracking-[0.09em] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, detail, last }: { label: string; value: string; detail: string; last?: boolean }) {
  return (
    <div className={`grid grid-cols-[minmax(110px,0.72fr)_minmax(0,2fr)] gap-5 px-5 py-4 ${last ? "" : "border-b border-border"}`}>
      <dt className="font-mono text-[9px] font-semibold tracking-[0.1em] text-muted-foreground">{label}</dt>
      <dd className="min-w-0">
        <p className="break-all font-mono text-[12px] text-foreground">{value}</p>
        <p className="mt-1 font-mono text-[8px] font-semibold tracking-[0.08em] text-muted-foreground">{detail}</p>
      </dd>
    </div>
  );
}

function Metric({ label, value, status = "default" }: { label: string; value: string; status?: "default" | "success" | "muted" }) {
  const valueClass = status === "success" ? "text-success" : status === "muted" ? "text-muted-foreground" : "text-foreground";
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-[9px] font-semibold tracking-[0.1em] text-muted-foreground">{label}</span>
      <span className={`font-mono text-[12px] font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}
