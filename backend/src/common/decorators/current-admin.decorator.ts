import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentAdminPayload {
  sub: string;
  username: string;
  role: 'owner' | 'attendant';
}

export const CurrentAdmin = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentAdminPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: CurrentAdminPayload }>();
    return request.user;
  },
);
