import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Machine } from '@prisma/client';

export const CurrentMachine = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Machine => {
    const request = ctx.switchToHttp().getRequest<{ machine: Machine }>();
    return request.machine;
  },
);
