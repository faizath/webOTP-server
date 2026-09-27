import {
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { AuditService } from "../common/services/audit.service.ts";
import { DATABASE_CONNECTION } from "../database/database.module.ts";
import { User } from "./entities/user.entity.ts";
import { UserPreferences } from "./entities/user-preferences.entity.ts";
import { PreferencesDto } from "./dto/preferences.dto.ts";

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly dataSource: DataSource | null,
    private readonly audit: AuditService,
  ) {}

  private async repository(): Promise<Repository<User>> {
    if (!this.dataSource) {
      throw new ServiceUnavailableException("Database is not configured");
    }
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
    return this.dataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await (await this.repository()).findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return await (await this.repository()).findOne({ where: { id } });
  }

  async create(
    email: string,
    passwordHash: string,
    displayName: string | null,
  ): Promise<User> {
    const repository = await this.repository();
    if (await this.findByEmail(email)) {
      throw new ConflictException("Email is already registered");
    }
    const user = repository.create({
      id: crypto.randomUUID(),
      email,
      passwordHash,
      displayName,
      isActive: true,
    });
    return await repository.save(user);
  }

  async profile(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new ServiceUnavailableException("User is unavailable");
    const preferences = await (await this.preferencesRepository()).findOneBy({
      userId,
    });
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      preferences: {
        theme: preferences?.theme ?? "default",
        lockTimeoutMinutes: preferences?.lockTimeoutMinutes ?? null,
        lockAction: preferences?.lockAction ?? "master",
      },
    };
  }

  async updatePreferences(userId: string, dto: PreferencesDto) {
    const repository = await this.preferencesRepository();
    let preferences = await repository.findOneBy({ userId });
    if (!preferences) {
      preferences = repository.create({
        userId,
        theme: "default",
        lockTimeoutMinutes: null,
        lockAction: "master",
      });
    }
    Object.assign(preferences, dto);
    const saved = await repository.save(preferences);
    return {
      theme: saved.theme,
      lockTimeoutMinutes: saved.lockTimeoutMinutes,
      lockAction: saved.lockAction,
    };
  }

  async remove(userId: string, ipAddress?: string): Promise<void> {
    const repository = await this.repository();
    if (!(await repository.findOneBy({ id: userId }))) {
      throw new ServiceUnavailableException("User is unavailable");
    }
    await this.audit.log({
      userId,
      action: "ACCOUNT_DELETE",
      ipAddress,
      metadata: {},
    });
    await repository.delete(userId);
  }

  private async preferencesRepository(): Promise<Repository<UserPreferences>> {
    if (!this.dataSource) {
      throw new ServiceUnavailableException("Database is not configured");
    }
    if (!this.dataSource.isInitialized) await this.dataSource.initialize();
    return this.dataSource.getRepository(UserPreferences);
  }
}
