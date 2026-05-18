import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card/60 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-sm font-semibold">Droid Switch</span>
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">
            {t("header.subtitle")}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {meta ? (
            meta.exists ? (
              <span>
                {t("header.factoryLabel")}{" "}
                <span className="font-mono text-foreground">{meta.activeModel ?? "—"}</span>{" "}
                · {t("header.modelCount", { count: meta.customModelsCount })}
              </span>
            ) : (
              <span>{t("header.noFactorySettings")}</span>
            )
          ) : (
            <span>{t("header.loading")}</span>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-background">
          <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-3 py-2">
            <Button
              size="sm"
              onClick={() => {
                setSelectedId(null);
                setMode({ kind: "new" });
              }}
            >
              {t("sidebar.new")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowPicker(true)}>
              {t("sidebar.templates")}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleImport} disabled={busy}>
              {t("sidebar.import")}
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={() => setShowBackups(true)}>
              {t("sidebar.backups")}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {!didFirstImport ? (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">{t("header.loading")}</div>
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

        <main className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="flex-1 overflow-hidden p-4">
            {mode.kind !== "idle" ? (
              <ProviderForm
                key={mode.kind === "edit" ? mode.id : "new"}
                initial={editingPreset}
                submitting={busy}
                onSubmit={handleSubmit}
                onCancel={() => setMode({ kind: "idle" })}
              />
            ) : selected ? (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{selected.label}</h2>
                    <p className="truncate text-xs text-muted-foreground">{selected.customModel.model}</p>
                  </div>
                  <div className="flex gap-2">
                    {store.activeId !== selected.id ? (
                      <Button size="sm" onClick={() => handleSwitch(selected.id)} disabled={busy}>
                        {t("details.switchToThis")}
                      </Button>
                    ) : (
                      <span className="rounded bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                        {t("details.active")}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setMode({ kind: "edit", id: selected.id })}
                    >
                      {t("details.edit")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(selected.id)}>
                      {t("details.delete")}
                    </Button>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-[140px_1fr] gap-y-2 text-xs">
                  <dt className="text-muted-foreground">{t("details.provider")}</dt>
                  <dd className="font-mono">{selected.customModel.provider}</dd>
                  <dt className="text-muted-foreground">{t("details.displayName")}</dt>
                  <dd>{selected.customModel.displayName}</dd>
                  <dt className="text-muted-foreground">{t("details.baseUrl")}</dt>
                  <dd className="break-all font-mono">{selected.customModel.baseUrl}</dd>
                  <dt className="text-muted-foreground">{t("details.apiKey")}</dt>
                  <dd className="break-all font-mono">{selected.customModel.apiKey}</dd>
                  {selected.customModel.maxOutputTokens != null && (
                    <>
                      <dt className="text-muted-foreground">{t("details.maxOutputTokens")}</dt>
                      <dd>{selected.customModel.maxOutputTokens}</dd>
                    </>
                  )}
                  {selected.customModel.noImageSupport ? (
                    <>
                      <dt className="text-muted-foreground">{t("details.noImageSupport")}</dt>
                      <dd>{t("details.yes")}</dd>
                    </>
                  ) : null}
                  <dt className="text-muted-foreground">{t("details.updated")}</dt>
                  <dd className="font-mono">{selected.updatedAt}</dd>
                </dl>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                <div>
                  <p>{t("empty.hint")}</p>
                  <p className="mt-1 text-xs">{t("empty.subHint")}</p>
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
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive shadow">
          <div className="flex items-start gap-2">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} aria-label={t("common.dismiss")} className="shrink-0">
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
