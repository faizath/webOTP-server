import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { DataSource } from "typeorm";
import bcrypt from "bcryptjs";
import { DATABASE_CONNECTION } from "../database/database.module.ts";
import { RefreshToken } from "../common/entities/refresh-token.entity.ts";
import { User } from "../users/entities/user.entity.ts";
import { UsersService } from "../users/users.service.ts";
import { LoginDto } from "./dto/login.dto.ts";
import { RegisterDto } from "./dto/register.dto.ts";

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; email: string; displayName: string | null };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(DATABASE_CONNECTION) private readonly dataSource: DataSource | null,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    const hash = await bcrypt.hash(
      dto.password,
      this.config.get<number>("BCRYPT_ROUNDS", 12),
    );
    const user = await this.users.create(email, hash, dto.displayName ?? null);
    return await this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email.toLowerCase());
    if (
      !user || !user.isActive ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return await this.issueTokens(user);
  }

  async refresh(rawToken: string): Promise<AuthResponse> {
    const repository = await this.refreshRepository();
    const token = await repository.findOne({
      where: { tokenHash: await this.hashToken(rawToken) },
      relations: ["user"],
    });
    if (
      !token || token.revokedAt || token.expiresAt <= new Date() ||
      !token.user.isActive
    ) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    token.revokedAt = new Date();
    await repository.save(token);
    return await this.issueTokens(token.user);
  }

  async logout(rawToken: string): Promise<void> {
    const repository = await this.refreshRepository();
    const token = await repository.findOne({
      where: { tokenHash: await this.hashToken(rawToken) },
    });
    if (token && !token.revokedAt) {
      token.revokedAt = new Date();
      await repository.save(token);
    }
  }

  private async issueTokens(user: User): Promise<AuthResponse> {
    const expiresIn = this.parseDuration(
      this.config.get<string>("JWT_ACCESS_TTL", "15m"),
    );
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      type: "access",
    }, { expiresIn });
    const refreshToken = this.randomToken();
    const ttl = this.parseDuration(
      this.config.get<string>("JWT_REFRESH_TTL", "30d"),
    );
    const repository = await this.refreshRepository();
    const tokenEntity = repository.create({
      id: crypto.randomUUID(),
      userId: user.id,
      deviceId: null,
      tokenHash: await this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + ttl * 1000),
      revokedAt: null,
    });
    await repository.save(tokenEntity);
    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    };
  }

  private async refreshRepository() {
    if (!this.dataSource) {
      throw new UnauthorizedException("Authentication database is unavailable");
    }
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
    return this.dataSource.getRepository(RefreshToken);
  }

  private randomToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");
  }

  private async hashToken(token: string): Promise<string> {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(token),
    );
    return Array.from(
      new Uint8Array(digest),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  private parseDuration(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) throw new Error(`Invalid duration: ${value}`);
    const units = { s: 1, m: 60, h: 3600, d: 86400 } as const;
    return Number(match[1]) * units[match[2] as keyof typeof units];
  }
}
