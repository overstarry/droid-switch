import type { CustomModel } from "@/types";

export interface PresetTemplate {
  id: string;
  labelKey: string;
  hintKey: string;
  customModel: CustomModel;
}

export const presetTemplates: PresetTemplate[] = [
  {
    id: "anthropic",
    labelKey: "presets.anthropic.label",
    hintKey: "presets.anthropic.hint",
    customModel: {
      model: "claude-sonnet-4-6",
      displayName: "Claude Sonnet 4.6",
      baseUrl: "https://api.anthropic.com",
      apiKey: "${ANTHROPIC_API_KEY}",
      provider: "anthropic",
      maxOutputTokens: 8192,
    },
  },
  {
    id: "openai",
    labelKey: "presets.openai.label",
    hintKey: "presets.openai.hint",
    customModel: {
      model: "gpt-4o",
      displayName: "GPT-4o",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "${OPENAI_API_KEY}",
      provider: "openai",
    },
  },
  {
    id: "openrouter",
    labelKey: "presets.openrouter.label",
    hintKey: "presets.openrouter.hint",
    customModel: {
      model: "anthropic/claude-sonnet-4",
      displayName: "OpenRouter / Claude Sonnet 4",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: "${OPENROUTER_API_KEY}",
      provider: "generic-chat-completion-api",
    },
  },
  {
    id: "deepseek",
    labelKey: "presets.deepseek.label",
    hintKey: "presets.deepseek.hint",
    customModel: {
      model: "deepseek-chat",
      displayName: "DeepSeek Chat",
      baseUrl: "https://api.deepseek.com/v1",
      apiKey: "${DEEPSEEK_API_KEY}",
      provider: "generic-chat-completion-api",
    },
  },
  {
    id: "ollama",
    labelKey: "presets.ollama.label",
    hintKey: "presets.ollama.hint",
    customModel: {
      model: "llama3.1",
      displayName: "Ollama llama3.1",
      baseUrl: "http://localhost:11434/v1",
      apiKey: "ollama",
      provider: "generic-chat-completion-api",
      noImageSupport: true,
    },
  },
];
