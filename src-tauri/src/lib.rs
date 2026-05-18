mod commands;
mod error;
mod factory_settings;
mod paths;
mod provider;
mod store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::list_presets,
            commands::upsert_preset,
            commands::delete_preset,
            commands::switch_to,
            commands::import_from_factory,
            commands::read_factory_meta,
            commands::check_env_var,
            commands::list_backups,
            commands::restore_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
