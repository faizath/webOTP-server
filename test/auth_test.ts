import { assert, assertEquals, assertRejects } from "@std/assert";
import bcrypt from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { validate } from "class-validator";
import { RegisterDto } from "../src/auth/dto/register.dto.ts";
import { RefreshDto } from "../src/auth/dto/refresh.dto.ts";

Deno.test("password hashes verify without exposing the source password", async () => {
  const password = "correct horse battery staple";
  const hash = await bcrypt.hash(password, 12);

  assert(hash !== password);
  assert(await bcrypt.compare(password, hash));
  assert(!(await bcrypt.compare("wrong password", hash)));
});

Deno.test("access JWT signs and verifies the expected claims", async () => {
  const jwt = new JwtService({ secret: "test-secret" });
  const token = await jwt.signAsync({ sub: "user-id", type: "access" });

  assertEquals(await jwt.verifyAsync(token), {
    sub: "user-id",
    type: "access",
    iat: (await jwt.decode(token) as { iat: number }).iat,
  });
});

Deno.test("DTO validation rejects invalid registration and refresh input", async () => {
  const register = new RegisterDto();
  register.email = "not-an-email";
  register.password = "short";
  const refresh = new RefreshDto();
  refresh.refreshToken = "";

  assert((await validate(register)).length > 0);
  await assertRejects(
    async () => {
      const errors = await validate(refresh);
      if (errors.length > 0) throw new Error("invalid");
    },
  );
});
