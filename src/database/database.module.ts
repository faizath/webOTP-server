import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDataSource } from "./data-source.ts";

export const DATABASE_CONNECTION = "DATABASE_CONNECTION";

@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (!config.get<string>("DB_HOST")) {
          return null;
        }
        const dataSource = createDataSource();
        return dataSource;
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
