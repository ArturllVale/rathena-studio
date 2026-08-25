use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitRepoStatus {
    pub is_git_repository: bool,
    pub branch: Option<String>,
    pub clean: bool,
    pub modified_files: Vec<String>,
}
