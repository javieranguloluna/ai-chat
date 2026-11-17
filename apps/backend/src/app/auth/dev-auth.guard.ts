import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/** Autenticación hardcoded de momento. Debe coincidir con AuthService del front. */
export const DEV_AUTH_TOKEN = 'dev-token-123';

@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.headers['authorization'] !== `Bearer ${DEV_AUTH_TOKEN}`) {
      throw new UnauthorizedException('Token inválido o ausente.');
    }
    return true;
  }
}
