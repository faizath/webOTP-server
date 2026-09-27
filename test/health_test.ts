import { assertEquals, assertMatch } from "@std/assert";
import { createApp } from "../src/main.ts";

Deno.env.set("NODE_ENV", "test");
Deno.env.delete("DB_HOST");

Deno.test("health endpoint responds without a database", async () => {
  const app = await createApp();
  await app.listen(0, "127.0.0.1");
  const server = app.getHttpServer();
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/v1/health`,
  );
  const body = await response.json();
  const unprefixedResponse = await fetch(
    `http://127.0.0.1:${server.address().port}/health`,
  );

  assertEquals(response.status, 200);
  assertEquals(unprefixedResponse.status, 200);
  assertEquals(body.status, "ok");
  assertEquals(body.database, "down");
  assertMatch(body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  await app.close();
});
