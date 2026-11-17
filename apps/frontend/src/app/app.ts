import { Component, inject, signal } from '@angular/core';
import { Chat } from '@ai-sdk/angular';
import { AppChatTransport } from './app-chat-transport';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);

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
    this.input = '';
    void this.chat().sendMessage({ text });
  }

  /** Reestablece la conversación: nueva instancia de Chat desde cero. */
  protected nuevoChat(): void {
    this.chat.set(this.crearChat());
  }

  private crearChat(): Chat {
    return new Chat({
      transport: new AppChatTransport(this.auth, {
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
