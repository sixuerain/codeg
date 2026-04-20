use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshHostInfo {
    pub id: i32,
    pub name: String,
    pub host: String,
    pub port: i32,
    pub username: String,
    pub identity_file: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<crate::db::entities::ssh_host::Model> for SshHostInfo {
    fn from(m: crate::db::entities::ssh_host::Model) -> Self {
        Self {
            id: m.id,
            name: m.name,
            host: m.host,
            port: m.port,
            username: m.username,
            identity_file: m.identity_file,
            created_at: m.created_at.to_rfc3339(),
            updated_at: m.updated_at.to_rfc3339(),
        }
    }
}
