use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(SshHost::Table)
                    .add_column(ColumnDef::new(SshHost::ShellInit).string().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(SshHost::Table)
                    .drop_column(SshHost::ShellInit)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum SshHost {
    Table,
    ShellInit,
}
