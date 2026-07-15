import { useTranslation } from "react-i18next";
import { Bot, HardDrive, Route, Search, Sparkles, type LucideIcon } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { presetTemplates, type PresetTemplate } from "@/lib/presets";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (template: PresetTemplate) => void;
}

const ICONS: Record<string, LucideIcon> = {
  anthropic: Sparkles,
  openai: Bot,
  openrouter: Route,
  deepseek: Search,
  ollama: HardDrive,
};

export function PresetPickerDialog({ open, onClose, onPick }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("dialog.chooseTemplate")}
      description={t("dialog.chooseTemplateHint")}
      width="max-w-md"
    >
      <ul className="flex flex-col gap-0.5 p-1">
        {presetTemplates.map((tpl) => {
          const Icon = ICONS[tpl.id] ?? Sparkles;
          return (
            <li
              key={tpl.id}
              className="flex items-center gap-3 border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-surface"
            >
              <div className="flex size-8 shrink-0 items-center justify-center border border-border bg-surface text-foreground">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-medium text-foreground">{t(tpl.labelKey)}</p>
                </div>
                <p className="truncate text-[11px] text-muted-foreground">{t(tpl.hintKey)}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground/80">
                  {tpl.customModel.baseUrl}
                </p>
              </div>
              <Button size="sm" onClick={() => onPick(tpl)} className="shrink-0">
                {t("dialog.use")}
              </Button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
