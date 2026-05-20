import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { cn } from "@/lib/cn";

const LANGS: { code: "en" | "zh-CN"; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "zh-CN", label: "中" },
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div
      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-elevated px-1.5 py-1"
      aria-label={t("common.language")}
    >
      <Languages className="size-3 text-muted-foreground" />
      {LANGS.map((l) => {
        const active = current === l.code || (l.code === "en" && current?.startsWith("en"));
        return (
          <button
            key={l.code}
            onClick={() => i18n.changeLanguage(l.code)}
            className={cn(
              "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
