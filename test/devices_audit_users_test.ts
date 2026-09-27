import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { validate } from "class-validator";
import { AuditService } from "../src/common/services/audit.service.ts";
import { PreferencesDto } from "../src/users/dto/preferences.dto.ts";

Deno.test("audit metadata is JSON serialized and redacts secrets", async () => {
  let saved: Record<string, unknown> | undefined;
  const repository = {
    create(value: Record<string, unknown>) {
      return value;
    },
    save(value: Record<string, unknown>) {
      saved = value;
      return Promise.resolve(value);
    },
  };
  const dataSource = {
    isInitialized: true,
    getRepository: () => repository,
  };
  await new AuditService(dataSource as never).log({
    userId: "user-id",
    action: "LOGIN",
    metadata: { device: "Chrome", refreshToken: "never-store-me" },
  });
  assert(saved);
  assertStringIncludes(String(saved.metadata), '"device":"Chrome"');
  assert(!String(saved.metadata).includes("never-store-me"));
});

Deno.test("preferences DTO validates supported lock actions and ranges", async () => {
  const dto = new PreferencesDto();
  dto.theme = "dark";
  dto.lockTimeoutMinutes = 15;
  dto.lockAction = "master";
  assertEquals((await validate(dto)).length, 0);

  dto.lockAction = "invalid";
  dto.lockTimeoutMinutes = -1;
  assert((await validate(dto)).length > 0);
});
