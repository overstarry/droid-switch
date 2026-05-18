import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";

const LANGS: { code: "en" | "zh-CN"; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "zh-CN", label: "中文" },
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border" aria-label={t("common.language")}>
      {LANGS.map((l) => {
        const active = current === l.code || (l.code === "en" && current?.startsWith("en"));
        return (
          <Button
            key={l.code}
            size="sm"
            variant={active ? "primary" : "ghost"}
            className="h-7 rounded-none border-0 px-2 text-[11px]"
            onClick={() => i18n.changeLanguage(l.code)}
          >
            {l.label}
          </Button>
        );
      })}
    </div>
  );
}
