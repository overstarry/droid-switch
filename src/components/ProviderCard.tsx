import { useTranslation } from "react-i18next";
import type { Preset } from "@/types";
import { Button } from "@/components/ui/Button";
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
        "group cursor-pointer rounded-md border bg-card px-3 py-2.5 transition-colors",
        selected ? "border-accent ring-1 ring-accent" : "border-border hover:border-muted-foreground/50",
        active ? "shadow-[inset_3px_0_0_0_hsl(var(--accent))]" : ""
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{preset.label}</span>
            {active ? (
              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                {t("details.active")}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{m.model}</div>
          <div className="truncate text-[11px] text-muted-foreground/70">{m.baseUrl}</div>
        </div>
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
          {m.provider}
        </span>
      </div>
      <div className="mt-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        {!active ? (
          <Button
            size="sm"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              onSwitch();
            }}
          >
            {t("list.switch")}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          {t("list.delete")}
        </Button>
      </div>
    </div>
  );
}
