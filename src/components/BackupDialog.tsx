import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Archive, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import type { BackupInfo } from "@/types";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onRestored?: () => void;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
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
    <Dialog
      open={open}
      onClose={onClose}
      title={t("dialog.backups")}
      description={t("dialog.backupsHint")}
      width="max-w-md"
    >
      <div className="px-1 py-1">
        {loading ? (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">{t("dialog.loading")}</div>
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <div className="flex size-10 items-center justify-center border border-border bg-surface">
              <Archive className="size-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{t("dialog.noBackups")}</p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {backups.map((b) => (
              <li
                key={b.filename}
                className="flex items-center justify-between gap-3 border border-transparent px-3 py-3 hover:border-border hover:bg-surface"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-foreground">{b.filename}</p>
                  <p className="text-[11px] text-muted-foreground">{formatBytes(b.size)}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!busyFilename}
                  onClick={() => handleRestore(b.filename)}
                >
                  {busyFilename === b.filename ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      {t("dialog.restoring")}
                    </>
                  ) : (
                    t("dialog.restore")
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {error ? (
          <div className="mx-2 mt-2 border border-destructive/40 bg-destructive-soft px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
