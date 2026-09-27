import {
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { DATABASE_CONNECTION } from "../database/database.module.ts";
import { User } from "./entities/user.entity.ts";

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly dataSource: DataSource | null,
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
}
