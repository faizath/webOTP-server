import { assertEquals, assertFalse } from "@std/assert";
import { AuditService } from "../src/common/services/audit.service.ts";
import { createApp } from "../src/main.ts";
import { UploadVaultDto } from "../src/vault/dto/upload-vault.dto.ts";
import { VaultRevision } from "../src/vault/entities/vault-revision.entity.ts";
import { VaultSnapshot } from "../src/vault/entities/vault-snapshot.entity.ts";
import { VaultService } from "../src/vault/vault.service.ts";

class SnapshotRepository {
  snapshot: VaultSnapshot | undefined;

  findOneBy() {
    return Promise.resolve(this.snapshot);
  }

  create(value: Partial<VaultSnapshot>) {
    return value as VaultSnapshot;
  }

  save(value: VaultSnapshot) {
    this.snapshot = { ...value, updatedAt: new Date() };
    return Promise.resolve(this.snapshot);
  }
}

class RevisionRepository {
  revisions: VaultRevision[] = [];

  find(options: { where: { userId: string } }) {
    return Promise.resolve(
      this.revisions
        .filter((revision) => revision.userId === options.where.userId)
        .sort((a, b) => Number(b.revision) - Number(a.revision)),
    );
  }

  findOneBy(criteria: { userId: string; revision: number }) {
    return Promise.resolve(
      this.revisions.find((revision) =>
        revision.userId === criteria.userId &&
        Number(revision.revision) === criteria.revision
      ),
    );
  }

  save(value: Partial<VaultRevision>) {
    const revision = {
      ...value,
      createdAt: new Date(),
    } as VaultRevision;
    this.revisions.push(revision);
    return Promise.resolve(revision);
  }

  remove(values: VaultRevision[]) {
    const ids = new Set(values.map((value) => value.id));
    this.revisions = this.revisions.filter((value) => !ids.has(value.id));
    return Promise.resolve(values);
  }
}

function serviceWith(
  snapshots = new SnapshotRepository(),
  revisions = new RevisionRepository(),
) {
  const dataSource = {
    isInitialized: true,
    getRepository: (entity: typeof VaultSnapshot | typeof VaultRevision) =>
      entity === VaultSnapshot ? snapshots : revisions,
    transaction: (
      work: (manager: {
        getRepository: (
          entity: typeof VaultSnapshot | typeof VaultRevision,
        ) => SnapshotRepository | RevisionRepository;
      }) => Promise<unknown>,
    ) =>
      work({
        getRepository: (entity) =>
          entity === VaultSnapshot ? snapshots : revisions,
      }),
  };
  return {
    service: new VaultService(dataSource as never, new AuditService()),
    snapshots,
    revisions,
  };
}

function uploadDto(ciphertext: string): UploadVaultDto {
  const dto = new UploadVaultDto();
  dto.envelope = { version: 2, salt: "salt", ciphertext };
  return dto;
}

Deno.test("vault history keeps at most 20 archived revisions", async () => {
  const { service, revisions } = serviceWith();
  await service.upload("user-id", uploadDto("ciphertext-1"), "0");
  for (let revision = 1; revision <= 21; revision++) {
    await service.upload(
      "user-id",
      uploadDto(`ciphertext-${revision + 1}`),
      String(revision),
    );
  }

  assertEquals(revisions.revisions.length, 20);
  assertEquals(
    revisions.revisions.map((value) => Number(value.revision)),
    Array.from({ length: 20 }, (_, index) => index + 2),
  );
});

Deno.test("vault history list excludes ciphertext", async () => {
  const { service } = serviceWith();
  await service.upload("user-id", uploadDto("ciphertext-1"), "0");
  await service.upload("user-id", uploadDto("ciphertext-2"), "1");

  const history = await service.history("user-id");
  assertEquals(history.length, 1);
  assertEquals(history[0].revision, 1);
  assertFalse("ciphertext" in history[0]);
});

Deno.test("vault history routes require JWT authentication", async () => {
  Deno.env.set("NODE_ENV", "test");
  Deno.env.delete("DB_HOST");
  const app = await createApp();
  await app.listen(0, "127.0.0.1");
  const port = app.getHttpServer().address().port;
  const paths = [
    "/api/v1/vault/history",
    "/api/v1/vault/history/1",
    "/api/v1/vault/history/1/restore",
  ];
  for (const path of paths) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: path.endsWith("restore") ? "POST" : "GET",
    });
    assertEquals(response.status, 401);
  }
  await app.close();
});
