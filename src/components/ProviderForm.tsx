import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CustomModel, Preset, ProviderKind } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { api } from "@/lib/api";

interface Props {
  initial: Preset | null;
  onSubmit: (preset: Preset) => Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
}

const PROVIDERS: ProviderKind[] = ["anthropic", "openai", "generic-chat-completion-api"];

const emptyModel = (): CustomModel => ({
  model: "",
  displayName: "",
  baseUrl: "",
  apiKey: "",
  provider: "openai",
});

function extractEnvVars(s: string): string[] {
  const out = new Set<string>();
  const re = /\$\{([A-Z_][A-Z0-9_]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out.add(m[1]);
  return Array.from(out);
}

export function ProviderForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const { t } = useTranslation();
  const [label, setLabel] = useState("");
  const [model, setModel] = useState<CustomModel>(emptyModel());
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setLabel(initial.label);
      setModel(initial.customModel);
    } else {
      setLabel("");
      setModel(emptyModel());
    }
    setError(null);
  }, [initial?.id]);

  const envVars = useMemo(() => extractEnvVars(model.apiKey), [model.apiKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, boolean> = {};
      for (const name of envVars) {
        try {
          next[name] = await api.checkEnvVar(name);
        } catch {
          next[name] = false;
        }
      }
      if (!cancelled) setEnvStatus(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [envVars.join(",")]);

  const update = <K extends keyof CustomModel>(key: K, value: CustomModel[K]) => {
    setModel((m) => ({ ...m, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!label.trim()) return setError(t("form.errors.labelRequired"));
    if (!model.model.trim()) return setError(t("form.errors.modelRequired"));
    if (!model.displayName.trim()) return setError(t("form.errors.displayNameRequired"));
    if (!model.baseUrl.trim()) return setError(t("form.errors.baseUrlRequired"));
    if (!model.apiKey.trim()) return setError(t("form.errors.apiKeyRequired"));
    const now = new Date().toISOString();
    const preset: Preset = {
      id: initial?.id ?? "",
      label: label.trim(),
      customModel: {
        ...model,
        model: model.model.trim(),
        displayName: model.displayName.trim(),
        baseUrl: model.baseUrl.trim(),
        apiKey: model.apiKey.trim(),
      },
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await onSubmit(preset);
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        <div>
          <Label>{t("form.label")}</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("form.labelPlaceholder")}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("form.provider")}</Label>
            <Select
              value={model.provider}
              onChange={(e) => update("provider", e.target.value as ProviderKind)}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{t("form.displayName")}</Label>
            <Input
              value={model.displayName}
              onChange={(e) => update("displayName", e.target.value)}
              placeholder={t("form.displayNamePlaceholder")}
            />
          </div>
        </div>
        <div>
          <Label>{t("form.modelId")}</Label>
          <Input
            value={model.model}
            onChange={(e) => update("model", e.target.value)}
            placeholder={t("form.modelIdPlaceholder")}
          />
        </div>
        <div>
          <Label>{t("form.baseUrl")}</Label>
          <Input
            value={model.baseUrl}
            onChange={(e) => update("baseUrl", e.target.value)}
            placeholder={t("form.baseUrlPlaceholder")}
          />
        </div>
        <div>
          <Label>{t("form.apiKey")}</Label>
          <Input
            value={model.apiKey}
            onChange={(e) => update("apiKey", e.target.value)}
            placeholder={t("form.apiKeyPlaceholder")}
          />
          {envVars.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {envVars.map((v) => (
                <span
                  key={v}
                  className={
                    envStatus[v]
                      ? "inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400"
                      : "inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[11px] text-destructive"
                  }
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {v} {envStatus[v] ? t("form.envSet") : t("form.envMissing")}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("form.maxOutputTokens")}</Label>
            <Input
              type="number"
              min={0}
              value={model.maxOutputTokens ?? ""}
              onChange={(e) =>
                update(
                  "maxOutputTokens",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder=""
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={!!model.noImageSupport}
                onChange={(e) => update("noImageSupport", e.target.checked || undefined)}
              />
              {t("form.noImageSupport")}
            </label>
          </div>
        </div>
      </div>
      {error ? (
        <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      ) : null}
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("form.cancel")}
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {initial ? t("form.save") : t("form.create")}
        </Button>
      </div>
    </form>
  );
}
