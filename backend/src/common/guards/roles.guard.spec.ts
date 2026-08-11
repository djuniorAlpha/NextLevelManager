import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function contextWithUser(user: any) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('permite quando a rota não exige roles específicas', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(contextWithUser({ role: 'attendant' }))).toBe(
      true,
    );
  });

  it('permite quando o role do usuário está na lista exigida', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['owner']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(contextWithUser({ role: 'owner' }))).toBe(true);
  });

  it('lança ForbiddenException quando o role do usuário não está na lista exigida', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['owner']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() =>
      guard.canActivate(contextWithUser({ role: 'attendant' })),
    ).toThrow(ForbiddenException);
  });

  it('lança ForbiddenException quando não há usuário no request', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['owner']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(contextWithUser(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
