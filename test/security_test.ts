import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  sanitizeException,
} from "../src/common/filters/all-exceptions.filter.ts";
import { redactSensitive } from "../src/common/interceptors/logging.interceptor.ts";
import { createApp } from "../src/main.ts";

Deno.test("request redaction strips password and token fields", () => {
  const value = redactSensitive({
    password: "secret",
    refreshToken: "token",
    nested: { authorization: "Bearer secret", keep: "visible" },
  });
  assertEquals(value, {
    password: "[REDACTED]",
    refreshToken: "[REDACTED]",
    nested: { authorization: "[REDACTED]", keep: "visible" },
  });
});

Deno.test("exception filter uses a generic production message", () => {
  const result = sanitizeException(
    new Error("database password leaked"),
    "/api/v1/test",
    true,
  );
  assertEquals(result.message, "Internal server error");
  assertEquals(result.statusCode, 500);
  assertStringIncludes(result.path, "/api/v1/test");
});

Deno.test("application starts with Helmet security headers", async () => {
  Deno.env.set("NODE_ENV", "test");
  Deno.env.delete("DB_HOST");
  const app = await createApp();
  await app.listen(0, "127.0.0.1");
  const port = app.getHttpServer().address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("x-content-type-options"), "nosniff");
  await app.close();
});
