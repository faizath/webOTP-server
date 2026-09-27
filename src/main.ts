import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module.ts";
import { HttpExceptionFilter } from "./common/filters/all-exceptions.filter.ts";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor.ts";
import { HealthService } from "./health/health.service.ts";

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  const config = app.get(ConfigService);
  const origins = config.get<string>("CORS_ORIGINS", "*").split(",").map(
    (origin) => origin.trim(),
  ).filter(Boolean);
  app.enableCors({
    origin: origins.includes("*") ? true : origins,
    credentials: !origins.includes("*"),
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  if (
    config.get<string>("NODE_ENV") !== "production" ||
    config.get<boolean>("SWAGGER_ENABLED", false)
  ) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("webOTP Server API")
      .setDescription("Zero-knowledge encrypted vault synchronization API")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, { useGlobalPrefix: false });
  }
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
