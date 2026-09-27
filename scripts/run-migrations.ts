import { AppDataSource } from "../src/database/data-source.ts";

const showOnly = Deno.args.includes("--show");

try {
  await AppDataSource.initialize();

  if (showOnly) {
    const hasPendingMigrations = await AppDataSource.showMigrations();
    if (hasPendingMigrations) {
      console.log(
        "Pending migrations:",
        AppDataSource.migrations.map((migration) => migration.name).join(", "),
      );
    } else {
      console.log("No pending migrations.");
    }
  } else {
    const migrations = await AppDataSource.runMigrations();
    if (migrations.length === 0) {
      console.log("No migrations were run.");
    } else {
      console.log(
        `Ran migrations: ${
          migrations.map((migration) => migration.name).join(", ")
        }`,
      );
    }
  }
} finally {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
