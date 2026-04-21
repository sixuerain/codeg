use crate::app_error::AppCommandError;
use crate::db::service::ssh_host_service;
use crate::db::AppDatabase;
use crate::models::SshHostInfo;

// ---------------------------------------------------------------------------
// Shared core functions (used by both Tauri commands and web handlers)
// ---------------------------------------------------------------------------

pub async fn list_ssh_hosts_core(db: &AppDatabase) -> Result<Vec<SshHostInfo>, AppCommandError> {
    let rows = ssh_host_service::list(&db.conn)
        .await
        .map_err(AppCommandError::from)?;
    Ok(rows.into_iter().map(SshHostInfo::from).collect())
}

pub async fn create_ssh_host_core(
    db: &AppDatabase,
    name: String,
    host: String,
    port: i32,
    username: String,
    identity_file: Option<String>,
    shell_init: Option<String>,
) -> Result<SshHostInfo, AppCommandError> {
    if !(1..=65535).contains(&port) {
        return Err(AppCommandError::invalid_input("port must be between 1 and 65535"));
    }
    if name.trim().is_empty() || host.trim().is_empty() || username.trim().is_empty() {
        return Err(AppCommandError::invalid_input(
            "name, host, and username must not be empty",
        ));
    }

    let model =
        ssh_host_service::create(&db.conn, name, host, port, username, identity_file, shell_init)
            .await
            .map_err(AppCommandError::from)?;
    Ok(SshHostInfo::from(model))
}

pub async fn update_ssh_host_core(
    db: &AppDatabase,
    id: i32,
    name: String,
    host: String,
    port: i32,
    username: String,
    identity_file: Option<String>,
    shell_init: Option<String>,
) -> Result<SshHostInfo, AppCommandError> {
    if !(1..=65535).contains(&port) {
        return Err(AppCommandError::invalid_input("port must be between 1 and 65535"));
    }
    if name.trim().is_empty() || host.trim().is_empty() || username.trim().is_empty() {
        return Err(AppCommandError::invalid_input(
            "name, host, and username must not be empty",
        ));
    }

    let model = ssh_host_service::update(
        &db.conn,
        id,
        name,
        host,
        port,
        username,
        identity_file,
        shell_init,
    )
    .await
    .map_err(AppCommandError::from)?;
    Ok(SshHostInfo::from(model))
}

pub async fn delete_ssh_host_core(db: &AppDatabase, id: i32) -> Result<(), AppCommandError> {
    ssh_host_service::delete(&db.conn, id)
        .await
        .map_err(AppCommandError::from)
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

#[cfg(feature = "tauri-runtime")]
#[tauri::command]
pub async fn list_ssh_hosts(
    db: tauri::State<'_, AppDatabase>,
) -> Result<Vec<SshHostInfo>, AppCommandError> {
    list_ssh_hosts_core(&db).await
}

#[cfg(feature = "tauri-runtime")]
#[tauri::command]
pub async fn create_ssh_host(
    db: tauri::State<'_, AppDatabase>,
    name: String,
    host: String,
    port: i32,
    username: String,
    identity_file: Option<String>,
    shell_init: Option<String>,
) -> Result<SshHostInfo, AppCommandError> {
    create_ssh_host_core(&db, name, host, port, username, identity_file, shell_init).await
}

#[cfg(feature = "tauri-runtime")]
#[tauri::command]
pub async fn update_ssh_host(
    db: tauri::State<'_, AppDatabase>,
    id: i32,
    name: String,
    host: String,
    port: i32,
    username: String,
    identity_file: Option<String>,
    shell_init: Option<String>,
) -> Result<SshHostInfo, AppCommandError> {
    update_ssh_host_core(&db, id, name, host, port, username, identity_file, shell_init).await
}

#[cfg(feature = "tauri-runtime")]
#[tauri::command]
pub async fn delete_ssh_host(
    db: tauri::State<'_, AppDatabase>,
    id: i32,
) -> Result<(), AppCommandError> {
    delete_ssh_host_core(&db, id).await
}
