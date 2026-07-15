import { useTranslation } from "react-i18next";
import { Inbox } from "lucide-react";
import type { Preset } from "@/types";
import { ProviderCard } from "./ProviderCard";

interface Props {
  presets: Preset[];
  activeId?: string | null;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProviderList({ presets, activeId, selectedId, onSelect, onSwitch, onDelete }: Props) {
  const { t } = useTranslation();
  if (presets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-8 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="flex size-10 items-center justify-center border border-border bg-surface-elevated">
            <Inbox className="size-4" />
          </div>
          <p className="text-xs font-medium text-foreground">{t("list.empty")}</p>
          <p className="text-[11px] text-muted-foreground">{t("list.emptyHint")}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      {presets.map((p) => (
        <ProviderCard
          key={p.id}
          preset={p}
          active={activeId === p.id}
          selected={selectedId === p.id}
          onSelect={() => onSelect(p.id)}
          onSwitch={() => onSwitch(p.id)}
          onDelete={() => onDelete(p.id)}
        />
      ))}
    </div>
  );
}
