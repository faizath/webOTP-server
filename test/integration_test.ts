import { assertEquals } from "@std/assert";
import { createApp } from "../src/main.ts";

const integrationEnabled = Deno.env.get("RUN_INTEGRATION_TESTS") === "true";

Deno.test({
  name: "MSSQL integration: register, login, and synchronize a vault",
  ignore: !integrationEnabled,
  async fn() {
    const app = await createApp();
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address();
    const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
    const email = `integration-${crypto.randomUUID()}@example.com`;
    const password = "integration-password";

    try {
      const registerResponse = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, deviceName: "CI" }),
      });
      assertEquals(registerResponse.status, 201);
      const registration = await registerResponse.json();
      assertEquals(typeof registration.accessToken, "string");

      const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, deviceName: "CI login" }),
      });
      assertEquals(loginResponse.status, 200);
      const login = await loginResponse.json();
      const authorization = { Authorization: `Bearer ${login.accessToken}` };
      const envelope = {
        version: 2,
        salt: "integration-salt",
        ciphertext: "integration-ciphertext",
      };

      const uploadResponse = await fetch(`${baseUrl}/vault`, {
        method: "PUT",
        headers: { ...authorization, "content-type": "application/json" },
        body: JSON.stringify({ envelope }),
      });
      assertEquals(uploadResponse.status, 200);
      const upload = await uploadResponse.json();
      assertEquals(upload.revision, 1);

      const downloadResponse = await fetch(`${baseUrl}/vault`, {
        headers: authorization,
      });
      assertEquals(downloadResponse.status, 200);
      const download = await downloadResponse.json();
      assertEquals(download.revision, 1);
      assertEquals(download.envelope, envelope);
    } finally {
      await app.close();
    }
  },
});
