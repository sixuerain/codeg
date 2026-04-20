use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(SshHost::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(SshHost::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(SshHost::Name).string().not_null())
                    .col(ColumnDef::new(SshHost::Host).string().not_null())
                    .col(
                        ColumnDef::new(SshHost::Port)
                            .integer()
                            .not_null()
                            .default(22),
                    )
                    .col(ColumnDef::new(SshHost::Username).string().not_null())
                    .col(ColumnDef::new(SshHost::IdentityFile).string().null())
                    .col(ColumnDef::new(SshHost::CreatedAt).string().not_null())
                    .col(ColumnDef::new(SshHost::UpdatedAt).string().not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(SshHost::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum SshHost {
    Table,
    Id,
    Name,
    Host,
    Port,
    Username,
    IdentityFile,
    CreatedAt,
    UpdatedAt,
}
