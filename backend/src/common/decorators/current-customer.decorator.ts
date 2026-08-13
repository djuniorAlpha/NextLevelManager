import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentCustomerPayload {
  sub: string;
  username: string;
}

export const CurrentCustomer = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentCustomerPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: CurrentCustomerPayload }>();
    return request.user;
  },
);
