import { DefaultChatTransport, type UIMessage } from 'ai';

/**
 * Transport custom del chat. De momento delega todo en
 * `DefaultChatTransport` (mismo comportamiento); queda como punto de
 * extensión para personalizar requests/responses en el futuro.
 */
export class AppChatTransport<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends DefaultChatTransport<UI_MESSAGE> {}
