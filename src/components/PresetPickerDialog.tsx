import { useTranslation } from "react-i18next";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { presetTemplates, type PresetTemplate } from "@/lib/presets";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (template: PresetTemplate) => void;
}

export function PresetPickerDialog({ open, onClose, onPick }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} title={t("dialog.chooseTemplate")} width="max-w-md">
      <ul className="space-y-2">
        {presetTemplates.map((tpl) => (
          <li
            key={tpl.id}
            className="rounded-md border border-border p-3 transition-colors hover:border-accent/60"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t(tpl.labelKey)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(tpl.hintKey)}</p>
                <p className="mt-1 truncate text-[11px] text-muted-foreground/70">
                  {tpl.customModel.baseUrl}
                </p>
              </div>
              <Button size="sm" onClick={() => onPick(tpl)}>
                {t("dialog.use")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
