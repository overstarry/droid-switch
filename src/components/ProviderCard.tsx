import { useTranslation } from "react-i18next";
import { ArrowRightLeft, Check, Trash2 } from "lucide-react";
import type { Preset } from "@/types";
import { cn } from "@/lib/cn";

interface Props {
  preset: Preset;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
  onSwitch: () => void;
  onDelete: () => void;
}

export function ProviderCard({ preset, active, selected, onSelect, onSwitch, onDelete }: Props) {
  const { t } = useTranslation();
  const m = preset.customModel;
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative cursor-pointer rounded-lg border px-3 py-3 transition-colors",
        active
          ? "border-border bg-surface-elevated"
          : "border-border bg-transparent hover:bg-surface-elevated/50",
        selected && !active && "ring-1 ring-accent/40",
        active && "border-l-2 border-l-accent pl-[10px]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-foreground">{preset.label}</span>
            {active ? (
              <span className="inline-flex items-center gap-0.5 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                <Check className="size-2.5" />
                {t("details.active")}
              </span>
            ) : null}
          </div>
        </div>
        <span className="shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {m.provider === "anthropic" ? "Anthropic" : m.provider === "openai" ? "OpenAI" : "Generic"}
        </span>
      </div>
      <div className="mt-1.5 truncate font-mono text-[11px] leading-snug text-muted-foreground">
        {m.model}
      </div>
      <div className="truncate font-mono text-[11px] leading-snug text-muted-foreground/80">
        {m.baseUrl}
      </div>
      <div className="mt-2 flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {!active ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwitch();
            }}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
            title={t("list.switch")}
          >
            <ArrowRightLeft className="size-3" />
            {t("list.switch")}
          </button>
        ) : null}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
          title={t("list.delete")}
        >
          <Trash2 className="size-3" />
          {t("list.delete")}
        </button>
      </div>
    </div>
  );
}
