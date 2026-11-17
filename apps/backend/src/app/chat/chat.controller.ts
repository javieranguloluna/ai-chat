import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  convertToModelMessages,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const DEFAULT_NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_NIM_MODEL = 'openai/gpt-oss-20b';
const DEFAULT_SYSTEM_PROMPT =
  'Eres un asistente útil. Responde de forma clara y concisa.';

@Controller('chat')
export class ChatController {
  @Post()
  async chat(
    @Body() body: { messages?: UIMessage[] },
    @Res() res: Response,
  ): Promise<void> {
    const { messages } = body ?? {};
    if (!Array.isArray(messages)) {
      throw new BadRequestException('Se requiere un array de "messages".');
    }

    const apiKey = process.env.NIM_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'NIM_API_KEY no está configurada.',
      );
    }

    const nim = createOpenAICompatible({
      name: 'nvidia-nim',
      baseURL: process.env.NIM_BASE_URL ?? DEFAULT_NIM_BASE_URL,
      apiKey,
    });

    const result = streamText({
      model: nim(process.env.NIM_MODEL ?? DEFAULT_NIM_MODEL),
      system: process.env.SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    });

    res.setHeader('content-type', 'text/event-stream');
    res.setHeader('cache-control', 'no-cache, no-transform');
    res.setHeader('connection', 'keep-alive');
    res.setHeader('x-vercel-ai-ui-message-stream', 'v1');
    res.flushHeaders();

    // `toUIMessageStream` emite objetos UIMessageChunk; el frameado SSE
    // (`data: <json>\n\n` + terminador `[DONE]`) lo hace normalmente
    // `createUIMessageStreamResponse`, que requiere fetch Response y no
    // está disponible en Express, así que se framea a mano aquí.
    try {
      for await (const chunk of toUIMessageStream({ stream: result.stream })) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    } catch {
      // El cliente abortó o el proveedor cortó el stream a mitad de emitir.
    } finally {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}
