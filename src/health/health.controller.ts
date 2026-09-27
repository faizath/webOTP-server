import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service.ts";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.check();
  }
}
