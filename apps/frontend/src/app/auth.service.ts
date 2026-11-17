import { Injectable } from '@angular/core';

/**
 * Proveedor del token de autenticación hardcoded de momento. Debe coincidir
 * con `DEV_AUTH_TOKEN` del backend (apps/backend/src/app/chat/chat.controller.ts).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly token = 'dev-token-123';
}
