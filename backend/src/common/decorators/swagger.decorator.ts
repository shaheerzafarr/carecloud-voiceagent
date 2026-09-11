import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

export function ApiAuth(summary: string) {
  return applyDecorators(ApiBearerAuth(), ApiOperation({ summary }));
}
