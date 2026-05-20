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
  icon: typeof Plus;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function SideAction({ icon: Icon, label, onClick, disabled }: SideActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-surface-elevated text-[11px] font-medium text-foreground transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Icon className="size-3" />
      {label}
    </button>
  );
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
        const s = await api.listPresets();
        if (s.presets.length === 0) {
          const imported = await api.importFromFactory();
          setStore(imported);
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

  const selected = useMemo(
    () => store.presets.find((p) => p.id === selectedId) ?? null,
    [store.presets, selectedId]
  );

  const editingPreset = useMemo<Preset | null>(() => {
    if (mode.kind === "edit") {
      return store.presets.find((p) => p.id === mode.id) ?? null;
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
      const p = store.presets.find((x) => x.id === id);
      if (!p) return;
      if (!confirm(t("confirm.delete", { label: p.label }))) return;
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

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Zap className="size-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">Droid Switch</p>
            <p className="truncate text-[11px] text-muted-foreground">{t("header.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {meta ? (
            meta.exists ? (
              <div className="hidden items-center gap-2 rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-[11px] sm:flex">
                <Terminal className="size-3 text-muted-foreground" />
                <span className="font-mono text-foreground">{meta.activeModel ?? "—"}</span>
                <span className="text-muted-foreground">
                  · {t("header.modelCount", { count: meta.customModelsCount })}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground">{t("header.noFactorySettings")}</span>
            )
          ) : (
            <span className="text-[11px] text-muted-foreground">{t("header.loading")}</span>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-72 shrink-0 flex-col gap-3 border-r border-border bg-surface px-3 pb-3 pt-4">
          <div className="flex shrink-0 items-center gap-1.5">
            <SideAction
              icon={Plus}
              label={t("sidebar.newShort")}
              onClick={() => {
                setSelectedId(null);
                setMode({ kind: "new" });
              }}
            />
            <SideAction
              icon={LayoutTemplate}
              label={t("sidebar.templates")}
              onClick={() => setShowPicker(true)}
            />
            <SideAction
              icon={Download}
              label={t("sidebar.import")}
              onClick={handleImport}
              disabled={busy}
            />
            <SideAction
              icon={Archive}
              label={t("sidebar.backups")}
              onClick={() => setShowBackups(true)}
            />
          </div>
          <div className="flex shrink-0 items-center justify-between px-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sidebar.presetsLabel")}
            </span>
            <span className="text-[11px] text-muted-foreground">{store.presets.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            {!didFirstImport ? (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">
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
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {mode.kind !== "idle" ? (
              <ProviderForm
                key={mode.kind === "edit" ? mode.id : "new"}
                initial={editingPreset}
                submitting={busy}
                onSubmit={handleSubmit}
                onCancel={() => setMode({ kind: "idle" })}
              />
            ) : selected ? (
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h2 className="truncate text-[20px] font-semibold leading-tight">
                        {selected.label}
                      </h2>
                      {activeIsSelected ? (
                        <span className="inline-flex items-center gap-1 rounded bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
                          <Check className="size-3" />
                          {t("details.active")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activeIsSelected
                        ? t("details.activeHint")
                        : t("details.inactiveHint")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!activeIsSelected ? (
                      <Button
                        size="md"
                        onClick={() => handleSwitch(selected.id)}
                        disabled={busy}
                      >
                        <ArrowRightLeft className="size-3.5" />
                        {t("details.switchToThis")}
                      </Button>
                    ) : null}
                    <Button
                      size="md"
                      variant="secondary"
                      onClick={() => setMode({ kind: "edit", id: selected.id })}
                    >
                      <Pencil className="size-3.5" />
                      {t("details.edit")}
                    </Button>
                    <Button
                      size="md"
                      variant="destructive"
                      onClick={() => handleDelete(selected.id)}
                    >
                      <Trash2 className="size-3.5" />
                      {t("details.delete")}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface-elevated p-6">
                  <div className="mb-4">
                    <h3 className="text-[13px] font-semibold leading-tight text-foreground">
                      {t("details.configuration")}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t("details.configurationHint")}
                    </p>
                  </div>
                  <dl className="grid grid-cols-[120px_1fr] text-xs">
                    <DetailRow label={t("details.provider")} value={selected.customModel.provider} />
                    <DetailRow label={t("details.displayName")} value={selected.customModel.displayName} />
                    <DetailRow label={t("details.modelId")} value={selected.customModel.model} mono />
                    <DetailRow label={t("details.baseUrl")} value={selected.customModel.baseUrl} mono />
                    <DetailRow label={t("details.apiKey")} value={selected.customModel.apiKey} mono />
                    {selected.customModel.maxOutputTokens != null && (
                      <DetailRow
                        label={t("details.maxOutputTokens")}
                        value={String(selected.customModel.maxOutputTokens)}
                        mono
                      />
                    )}
                    {selected.customModel.noImageSupport ? (
                      <DetailRow label={t("details.noImageSupport")} value={t("details.yes")} />
                    ) : null}
                    <DetailRow label={t("details.updated")} value={selected.updatedAt} mono last />
                  </dl>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                <div className="max-w-xs">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg border border-border bg-surface">
                    <Zap className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{t("empty.hint")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("empty.subHint")}</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <PresetPickerDialog
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onPick={handlePickTemplate}
      />
      <BackupDialog
        open={showBackups}
        onClose={() => setShowBackups(false)}
        onRestored={async () => {
          await refreshMeta();
          await refreshStore();
        }}
      />

      {toast ? (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground shadow-elevated">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-md border border-destructive/40 bg-destructive-soft px-3 py-2 text-xs text-destructive shadow-elevated">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label={t("common.dismiss")}
              className="shrink-0 rounded p-0.5 hover:bg-destructive/10"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  const borderClass = last ? "" : "border-b border-border";
  return (
    <>
      <dt className={`${borderClass} py-2.5 pr-4 text-[12px] font-medium text-muted-foreground`}>
        {label}
      </dt>
      <dd
        className={`${borderClass} break-all py-2.5 text-[12px] text-foreground ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </dd>
    </>
  );
}
