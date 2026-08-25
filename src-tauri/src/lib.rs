pub mod commands;
pub mod filesystem;
pub mod git;
pub mod logging;
pub mod processes;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::validate_workspace,
            commands::get_app_version,
        ])
        .run(tauri::generate_context!())
        .expect("error while running rAthena Studio tauri application");
}
