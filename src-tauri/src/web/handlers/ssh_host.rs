use std::sync::Arc;

use axum::{extract::Extension, Json};
use serde::Deserialize;

use crate::app_error::AppCommandError;
use crate::app_state::AppState;
use crate::commands::ssh_host as ssh_host_commands;
use crate::models::SshHostInfo;

// ---------------------------------------------------------------------------
// Param structs
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSshHostParams {
    pub name: String,
    pub host: String,
    pub port: i32,
    pub username: String,
    pub identity_file: Option<String>,
    pub shell_init: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSshHostParams {
    pub id: i32,
    pub name: String,
    pub host: String,
    pub port: i32,
    pub username: String,
    pub identity_file: Option<String>,
    pub shell_init: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SshHostIdParams {
    pub id: i32,
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

pub async fn list_ssh_hosts(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<Vec<SshHostInfo>>, AppCommandError> {
    let result = ssh_host_commands::list_ssh_hosts_core(&state.db).await?;
    Ok(Json(result))
}

pub async fn create_ssh_host(
    Extension(state): Extension<Arc<AppState>>,
    Json(params): Json<CreateSshHostParams>,
) -> Result<Json<SshHostInfo>, AppCommandError> {
    let result = ssh_host_commands::create_ssh_host_core(
        &state.db,
        params.name,
        params.host,
        params.port,
        params.username,
        params.identity_file,
        params.shell_init,
    )
    .await?;
    Ok(Json(result))
}

pub async fn update_ssh_host(
    Extension(state): Extension<Arc<AppState>>,
    Json(params): Json<UpdateSshHostParams>,
) -> Result<Json<SshHostInfo>, AppCommandError> {
    let result = ssh_host_commands::update_ssh_host_core(
        &state.db,
        params.id,
        params.name,
        params.host,
        params.port,
        params.username,
        params.identity_file,
        params.shell_init,
    )
    .await?;
    Ok(Json(result))
}

pub async fn delete_ssh_host(
    Extension(state): Extension<Arc<AppState>>,
    Json(params): Json<SshHostIdParams>,
) -> Result<Json<()>, AppCommandError> {
    ssh_host_commands::delete_ssh_host_core(&state.db, params.id).await?;
    Ok(Json(()))
}
