import { assert, assertEquals, assertRejects } from "@std/assert";
import { validate } from "class-validator";
import { AuditService } from "../src/common/services/audit.service.ts";
import { createApp } from "../src/main.ts";
import { UploadVaultDto } from "../src/vault/dto/upload-vault.dto.ts";
import { VaultService } from "../src/vault/vault.service.ts";

class FakeRepository {
  snapshot: Record<string, unknown> | undefined;

  findOneBy() {
    return Promise.resolve(this.snapshot);
  }

  create(value: Record<string, unknown>) {
    return value;
  }

  save(value: Record<string, unknown>) {
    this.snapshot = { ...value, updatedAt: new Date() };
    return Promise.resolve(this.snapshot);
  }
}

function serviceWith(repository: FakeRepository): VaultService {
  const dataSource = {
    isInitialized: true,
    getRepository: () => repository,
  };
  return new VaultService(dataSource as never, new AuditService());
}

function uploadDto(ciphertext = "encrypted-payload"): UploadVaultDto {
  const dto = new UploadVaultDto();
  dto.envelope = { version: 2, salt: "salt", ciphertext };
  return dto;
}

Deno.test("vault upload computes a SHA-256 content hash", async () => {
  const result = await serviceWith(new FakeRepository()).upload(
    "user-id",
    uploadDto(),
    "0",
  );

  assertEquals(
    result.contentHash,
    "6e42a7af7c34c60bc27ca06b1928a4d1327160c8e5349c4ac5f2ebf0a7edf4f2",
  );
});

Deno.test("vault upload rejects stale or missing If-Match revisions", async () => {
  const repository = new FakeRepository();
  await serviceWith(repository).upload("user-id", uploadDto(), "0");

  await assertRejects(
    () => serviceWith(repository).upload("user-id", uploadDto("next"), "0"),
    "ConflictException",
  );
  await assertRejects(
    () => serviceWith(repository).upload("user-id", uploadDto("next")),
    "ConflictException",
  );
});

Deno.test("vault DTO validation rejects invalid envelopes", async () => {
  const dto = uploadDto();
  dto.envelope.version = 1;
  assert((await validate(dto)).length > 0);
  dto.envelope.version = 2;
  dto.envelope.ciphertext = "";
  assert((await validate(dto)).length > 0);
});

Deno.test("vault routes require JWT authentication", async () => {
  Deno.env.set("NODE_ENV", "test");
  Deno.env.delete("DB_HOST");
  const app = await createApp();
  await app.listen(0, "127.0.0.1");
  const port = app.getHttpServer().address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/vault`);
  assertEquals(response.status, 401);
  await app.close();
});
