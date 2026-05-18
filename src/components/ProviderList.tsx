import { useTranslation } from "react-i18next";
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
      <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
        <div>
          <p>{t("list.empty")}</p>
          <p className="mt-1">{t("list.emptyHint")}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
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
