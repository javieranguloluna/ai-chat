import {
  DefaultChatTransport,
  type HttpChatTransportInitOptions,
  type UIMessage,
} from 'ai';
import type { AuthService } from './auth.service';
import { LoggingService } from './logging.service';

/**
 * Transport custom del chat. Agrega el token de `AuthService` a cada request
 * y registra las peticiones/respuestas del chat vía `LoggingService`
 * (incluido el stream completo, truncado). Hereda el resto del comportamiento
 * de `DefaultChatTransport`; queda como punto de extensión para ajustes
 * futuros.
 */
export class AppChatTransport<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends DefaultChatTransport<UI_MESSAGE> {
  constructor(
    auth: AuthService,
    private readonly logging: LoggingService,
    options: Omit<
      HttpChatTransportInitOptions<UI_MESSAGE>,
      'headers' | 'fetch'
    >,
  ) {
    super({
      ...options,
      headers: () => ({ authorization: `Bearer ${auth.token}` }),
      fetch: (input, init) => this.fetchConLog(input, init),
    });
  }

  private async fetchConLog(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    this.logging.log(`chat -> ${input}`, LoggingService.truncar(init?.body));
    const res = await fetch(input, init);
    this.logging.log(`chat <- ${res.status}`);
    // El stream se consume por el SDK; se registra una copia completa.
    void res
      .clone()
      .text()
      .then((texto) =>
        this.logging.log(
          `chat stream completo (${res.status})`,
          LoggingService.truncar(texto),
        ),
      )
      .catch(() => {
        // Stream cortado: se ignora la copia.
      });
    return res;
  }
}
