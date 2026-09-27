import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { HealthService } from "./health.service.ts";

@Controller("health")
@ApiTags("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Check service health" })
  @ApiResponse({ status: 200, description: "Service health status" })
  getHealth() {
    return this.healthService.check();
  }
}
