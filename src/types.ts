export type ProviderKind = "anthropic" | "openai" | "generic-chat-completion-api";

export interface CustomModel {
  model: string;
  displayName: string;
  baseUrl: string;
  apiKey: string;
  provider: ProviderKind;
  maxOutputTokens?: number;
  noImageSupport?: boolean;
  extraArgs?: unknown;
  extraHeaders?: unknown;
}

export interface Preset {
  id: string;
  label: string;
  customModel: CustomModel;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  presets: Preset[];
  activeId?: string | null;
}

export interface FactoryMeta {
  exists: boolean;
  activeModel: string | null;
  customModelsCount: number;
}

export interface BackupInfo {
  filename: string;
  createdAt: string;
  size: number;
}
