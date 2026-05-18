import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import type { BackupInfo } from "@/types";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onRestored?: () => void;
}

export function BackupDialog({ open, onClose, onRestored }: Props) {
  const { t } = useTranslation();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyFilename, setBusyFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listBackups();
      setBackups(list);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) reload();
  }, [open]);

  const handleRestore = async (filename: string) => {
    if (!confirm(t("confirm.restore", { filename }))) return;
    setBusyFilename(filename);
    setError(null);
    try {
      await api.restoreBackup(filename);
      onRestored?.();
      await reload();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyFilename(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={t("dialog.backups")} width="max-w-md">
      {loading ? (
        <div className="text-xs text-muted-foreground">{t("dialog.loading")}</div>
      ) : backups.length === 0 ? (
        <div className="text-xs text-muted-foreground">{t("dialog.noBackups")}</div>
      ) : (
        <ul className="space-y-1.5">
          {backups.map((b) => (
            <li
              key={b.filename}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-mono">{b.filename}</p>
                <p className="text-muted-foreground">{t("dialog.bytes", { count: b.size })}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={!!busyFilename}
                onClick={() => handleRestore(b.filename)}
              >
                {busyFilename === b.filename ? t("dialog.restoring") : t("dialog.restore")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error ? (
        <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      ) : null}
    </Dialog>
  );
}
