import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  log(userId: string, action: string, metadata: Record<string, unknown>): void {
    this.logger.log({ userId, action, metadata });
  }
}
