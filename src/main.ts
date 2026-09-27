import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module.ts";
import { HealthService } from "./health/health.service.ts";

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.getHttpAdapter().getInstance().get(
    "/health",
    async (_request: unknown, response: {
      json: (body: unknown) => void;
    }) => {
      response.json(await app.get(HealthService).check());
    },
  );
  return app;
}

if (import.meta.main) {
  const app = await createApp();
  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 3000);
  await app.listen(port, "0.0.0.0");
  console.log(`webOTP-server listening on port ${port}`);
}
