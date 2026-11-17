import {
  DefaultChatTransport,
  type HttpChatTransportInitOptions,
  type UIMessage,
} from 'ai';
import type { AuthService } from './auth.service';

/**
 * Transport custom del chat. Inyecta el token de `AuthService` en el header
 * `authorization` de cada request. Acepta las mismas opciones que
 * `DefaultChatTransport` (excepto `headers`, que es responsabilidad de la
 * autenticación); queda como punto de extensión para personalizar
 * requests/responses en el futuro.
 */
export class AppChatTransport<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends DefaultChatTransport<UI_MESSAGE> {
  constructor(
    auth: AuthService,
    options: Omit<HttpChatTransportInitOptions<UI_MESSAGE>, 'headers'>,
  ) {
    super({
      ...options,
      headers: () => ({ authorization: `Bearer ${auth.token}` }),
    });
  }
}
