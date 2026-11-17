import { Component, inject, signal } from '@angular/core';
import { Chat } from '@ai-sdk/angular';
import { AppChatTransport } from './app-chat-transport';
import { AuthService } from './auth.service';
import { LoggingService } from './logging.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly logging = inject(LoggingService);

  /** Variables de inicio de conversación; se envían al backend en cada request. */
  readonly chatVariables = {
    userName: '',
    language: '',
  };

  readonly chat = signal<Chat>(this.crearChat());

  protected input = '';

  protected send(event: Event): void {
    event.preventDefault();
    if (this.chat().status !== 'ready') return;
    const text = this.input.trim();
    if (!text) return;
    this.logging.log('enviar mensaje', { text });
    this.input = '';
    void this.chat().sendMessage({ text });
  }

  /** Reestablece la conversación: nueva instancia de Chat desde cero. */
  protected nuevoChat(): void {
    this.logging.log('nuevo chat');
    this.chat.set(this.crearChat());
  }

  private crearChat(): Chat {
    return new Chat({
      transport: new AppChatTransport(this.auth, this.logging, {
        api: '/api/chat',
        body: () => ({
          variables: {
            userName: this.chatVariables.userName,
            language: this.chatVariables.language,
          },
        }),
      }),
    });
  }
}
