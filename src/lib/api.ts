import { invoke } from "@tauri-apps/api/core";
import type { BackupInfo, FactoryMeta, Preset, Store } from "@/types";

export const api = {
  listPresets: () => invoke<Store>("list_presets"),
  upsertPreset: (preset: Preset) => invoke<Store>("upsert_preset", { preset }),
  deletePreset: (id: string) => invoke<Store>("delete_preset", { id }),
  switchTo: (id: string) => invoke<Store>("switch_to", { id }),
  importFromFactory: () => invoke<Store>("import_from_factory"),
  readFactoryMeta: () => invoke<FactoryMeta>("read_factory_meta"),
  checkEnvVar: (name: string) => invoke<boolean>("check_env_var", { name }),
  listBackups: () => invoke<BackupInfo[]>("list_backups"),
  restoreBackup: (filename: string) => invoke<void>("restore_backup", { filename }),
};
