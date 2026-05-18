use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CustomModel {
    pub model: String,
    #[serde(default)]
    pub display_name: String,
    pub base_url: String,
    pub api_key: String,
    pub provider: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub max_output_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub no_image_support: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub extra_args: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub extra_headers: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Preset {
    pub id: String,
    pub label: String,
    pub custom_model: CustomModel,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Store {
    pub presets: Vec<Preset>,
    #[serde(skip_serializing, default)]
    pub active_id: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FactoryMeta {
    pub exists: bool,
    pub active_model: Option<String>,
    pub custom_models_count: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfo {
    pub filename: String,
    pub created_at: String,
    pub size: u64,
}
