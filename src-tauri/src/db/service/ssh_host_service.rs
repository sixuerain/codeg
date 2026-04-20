use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait, QueryOrder,
};

use crate::db::entities::ssh_host::{ActiveModel, Column, Entity, Model};
use crate::db::error::DbError;

pub async fn list(conn: &DatabaseConnection) -> Result<Vec<Model>, DbError> {
    Ok(Entity::find()
        .order_by_asc(Column::Id)
        .all(conn)
        .await?)
}

pub async fn get(conn: &DatabaseConnection, id: i32) -> Result<Option<Model>, DbError> {
    Ok(Entity::find_by_id(id).one(conn).await?)
}

pub async fn create(
    conn: &DatabaseConnection,
    name: String,
    host: String,
    port: i32,
    username: String,
    identity_file: Option<String>,
) -> Result<Model, DbError> {
    let now = Utc::now();
    Ok(ActiveModel {
        name: Set(name),
        host: Set(host),
        port: Set(port),
        username: Set(username),
        identity_file: Set(identity_file),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    }
    .insert(conn)
    .await?)
}

pub async fn update(
    conn: &DatabaseConnection,
    id: i32,
    name: String,
    host: String,
    port: i32,
    username: String,
    identity_file: Option<String>,
) -> Result<Model, DbError> {
    let model = Entity::find_by_id(id)
        .one(conn)
        .await?
        .ok_or_else(|| DbError::Migration(format!("ssh_host #{id} not found")))?;
    let mut active: ActiveModel = model.into();
    active.name = Set(name);
    active.host = Set(host);
    active.port = Set(port);
    active.username = Set(username);
    active.identity_file = Set(identity_file);
    active.updated_at = Set(Utc::now());
    Ok(active.update(conn).await?)
}

pub async fn delete(conn: &DatabaseConnection, id: i32) -> Result<(), DbError> {
    Entity::delete_by_id(id).exec(conn).await?;
    Ok(())
}
