import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { DataSource, IsNull, MoreThan, Repository } from "typeorm";
import { DATABASE_CONNECTION } from "../database/database.module.ts";
import { AuditService } from "../common/services/audit.service.ts";
import { RefreshToken } from "../common/entities/refresh-token.entity.ts";
import { Device } from "./entities/device.entity.ts";

@Injectable()
export class DevicesService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly dataSource: DataSource | null,
    private readonly audit: AuditService,
  ) {}

  async registerDevice(
    userId: string,
    name: string | undefined,
    userAgent?: string,
  ): Promise<Device | null> {
    if (!name) return null;
    const repository = await this.repository();
    let device = await repository.findOne({
      where: { userId, name, revokedAt: IsNull() },
    });
    if (!device) {
      device = repository.create({
        id: crypto.randomUUID(),
        userId,
        name,
        userAgent: userAgent ?? null,
        lastSeenAt: new Date(),
        revokedAt: null,
      });
    } else {
      device.userAgent = userAgent ?? device.userAgent;
      device.lastSeenAt = new Date();
    }
    return await repository.save(device);
  }

  async touch(deviceId: string | null): Promise<void> {
    if (!deviceId) return;
    const device = await (await this.repository()).findOneBy({ id: deviceId });
    if (device && !device.revokedAt) {
      device.lastSeenAt = new Date();
      await (await this.repository()).save(device);
    }
  }

  async list(userId: string): Promise<Array<Record<string, unknown>>> {
    const devices = await (await this.repository()).find({
      where: { userId },
      order: { lastSeenAt: "DESC" },
    });
    const current = await this.currentDeviceId(userId);
    return devices.map((device) => ({
      id: device.id,
      name: device.name,
      userAgent: device.userAgent,
      lastSeenAt: device.lastSeenAt,
      createdAt: device.createdAt,
      revokedAt: device.revokedAt,
      isCurrent: device.id === current,
    }));
  }

  async revoke(
    userId: string,
    deviceId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const devices = await this.repository();
    const device = await devices.findOneBy({ id: deviceId, userId });
    if (!device) throw new NotFoundException("Device not found");
    device.revokedAt = new Date();
    await devices.save(device);
    const tokens = this.dataSource!.getRepository(RefreshToken);
    await tokens.update(
      { userId, deviceId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    await this.audit.log({
      userId,
      action: "DEVICE_REVOKE",
      ipAddress,
      userAgent,
      metadata: { deviceId },
    });
  }

  private async currentDeviceId(userId: string): Promise<string | null> {
    const token = await this.dataSource!.getRepository(RefreshToken).findOne({
      where: { userId, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { createdAt: "DESC" },
    });
    return token?.deviceId ?? null;
  }

  private async repository(): Promise<Repository<Device>> {
    if (!this.dataSource) {
      throw new ServiceUnavailableException("Database is not configured");
    }
    if (!this.dataSource.isInitialized) await this.dataSource.initialize();
    return this.dataSource.getRepository(Device);
  }
}
