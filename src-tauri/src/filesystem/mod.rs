use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedPaths {
    pub db_path: Option<String>,
    pub conf_path: Option<String>,
    pub npc_path: Option<String>,
    pub login_server_path: Option<String>,
    pub char_server_path: Option<String>,
    pub map_server_path: Option<String>,
    pub import_db_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceValidationResult {
    pub is_valid: bool,
    pub is_rathena_root: bool,
    pub detected_paths: DetectedPaths,
    pub missing_crucial_paths: Vec<String>,
    pub warnings: Vec<String>,
}

pub fn inspect_rathena_workspace(root_path: &str) -> WorkspaceValidationResult {
    let root = Path::new(root_path);
    if !root.exists() || !root.is_dir() {
        return WorkspaceValidationResult {
            is_valid: false,
            is_rathena_root: false,
            detected_paths: DetectedPaths {
                db_path: None,
                conf_path: None,
                npc_path: None,
                login_server_path: None,
                char_server_path: None,
                map_server_path: None,
                import_db_path: None,
            },
            missing_crucial_paths: vec!["root_directory".to_string()],
            warnings: vec!["Path does not exist or is not a directory".to_string()],
        };
    }

    let db_dir = root.join("db");
    let conf_dir = root.join("conf");
    let npc_dir = root.join("npc");
    let import_db_dir = root.join("db").join("import");

    let mut missing = Vec::new();
    let mut warnings = Vec::new();

    let has_db = db_dir.is_dir();
    let has_conf = conf_dir.is_dir();
    let has_npc = npc_dir.is_dir();

    if !has_db {
        missing.push("db".to_string());
    }
    if !has_conf {
        missing.push("conf".to_string());
    }
    if !has_npc {
        warnings.push("npc directory not found in root".to_string());
    }

    let is_rathena_root = has_db || has_conf;

    WorkspaceValidationResult {
        is_valid: is_rathena_root,
        is_rathena_root,
        detected_paths: DetectedPaths {
            db_path: if has_db { Some(db_dir.to_string_lossy().to_string()) } else { None },
            conf_path: if has_conf { Some(conf_dir.to_string_lossy().to_string()) } else { None },
            npc_path: if has_npc { Some(npc_dir.to_string_lossy().to_string()) } else { None },
            login_server_path: None,
            char_server_path: None,
            map_server_path: None,
            import_db_path: if import_db_dir.is_dir() { Some(import_db_dir.to_string_lossy().to_string()) } else { None },
        },
        missing_crucial_paths: missing,
        warnings,
    }
}
