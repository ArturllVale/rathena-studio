use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessStatus {
    Stopped,
    Starting,
    Running,
    Stopping,
    Errored(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessState {
    pub id: String,
    pub name: String,
    pub status: ProcessStatus,
    pub pid: Option<u32>,
    pub started_at: Option<u64>,
}
