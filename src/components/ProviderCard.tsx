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

function providerLabel(provider: Preset["customModel"]["provider"]): string {
  if (provider === "anthropic") return "ANTHROPIC";
  if (provider === "openai") return "OPENAI";
  return "GENERIC";
}

export function ProviderCard({ preset, active, selected, onSelect, onSwitch, onDelete }: Props) {
  const { t } = useTranslation();
  const model = preset.customModel;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative mt-3 min-h-[84px] cursor-pointer overflow-hidden border px-3 py-3 transition-colors",
        active ? "border-border-strong bg-surface-elevated" : "border-border bg-surface hover:border-border-strong hover:bg-surface-elevated",
        selected && !active && "border-accent/60",
        selected && "ring-1 ring-accent/20"
      )}
    >
      {active ? <span className="absolute inset-y-0 left-0 w-[3px] bg-accent" /> : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn("size-1.5 shrink-0 rounded-full", active ? "bg-success" : "bg-muted-foreground")} />
            <span className="truncate text-[12px] font-semibold text-foreground">{preset.label}</span>
            {active ? (
              <span className="inline-flex shrink-0 items-center gap-1 bg-success-soft px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-[0.08em] text-success">
                <Check className="size-2.5" />
                {t("details.active")}
              </span>
            ) : null}
          </div>
          <p className="mt-2 truncate font-mono text-[9px] font-semibold tracking-[0.08em] text-muted-foreground">
            {providerLabel(model.provider)}
          </p>
          <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{model.model}</p>
        </div>
        <span className="mt-0.5 font-mono text-[9px] text-muted-foreground/60">›</span>
      </div>

      <div className="absolute bottom-2 right-2 flex items-center gap-1 border border-border bg-surface-elevated px-1 py-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {!active ? (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onSwitch();
            }}
            className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:bg-accent-soft hover:text-accent"
            title={t("list.switch")}
            aria-label={t("list.switch")}
          >
            <ArrowRightLeft className="size-3" />
          </button>
        ) : null}
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive"
          title={t("list.delete")}
          aria-label={t("list.delete")}
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    </div>
  );
}
