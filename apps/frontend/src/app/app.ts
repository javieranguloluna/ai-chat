import { Component } from '@angular/core';
import { Chat } from '@ai-sdk/angular';
import { AppChatTransport } from './app-chat-transport';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly chat = new Chat({
    transport: new AppChatTransport({ api: '/api/chat' }),
  });

  protected input = '';

  protected send(event: Event): void {
    event.preventDefault();
    if (this.chat.status !== 'ready') return;
    const text = this.input.trim();
    if (!text) return;
    this.input = '';
    void this.chat.sendMessage({ text });
  }
}
