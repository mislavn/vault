use anyhow::{Context, Result};

use nitor_vault::Vault;

use cli::{Args, Command};

mod cli;

#[tokio::main]
async fn main() -> Result<()> {
    let args: Args = cli::parse_args().await;

    let client = Vault::new(None, args.region.as_deref())
        .await
        .with_context(|| "Failed to create vault.".to_string())?;

    if args.all {
        return cli::list_all(&client).await;
    } else if args.describestack {
        println!("{:#?}", client.stack_info());
        return Ok(());
    } else if args.info {
        client.test();
        return Ok(());
    }

    if let Some(key) = args.lookup.as_deref() {
        return cli::lookup(&client, key).await;
    }

    match &args.command {
        Some(Command::Delete { key }) => cli::delete(&client, key).await,
        Some(Command::DescribeStack {}) => Ok(println!("{:#?}", client.stack_info())),
        Some(Command::Exists { key }) => cli::exists(&client, key).await,
        Some(Command::List {}) => cli::list_all(&client).await,
        Some(Command::Load { key }) => cli::lookup(&client, key).await,
        Some(Command::Store {
            key,
            value,
            overwrite,
            file,
        }) => cli::store(&client, key, value, file, overwrite).await,
        None => Ok(()),
    }
}
