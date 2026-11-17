import { Component } from '@angular/core';
import { Chat } from '@ai-sdk/angular';
import { DefaultChatTransport } from 'ai';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly chat = new Chat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
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
