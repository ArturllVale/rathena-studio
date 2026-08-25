use crate::filesystem::{inspect_rathena_workspace, WorkspaceValidationResult};

#[tauri::command]
pub fn validate_workspace(path: String) -> WorkspaceValidationResult {
    inspect_rathena_workspace(&path)
}

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
