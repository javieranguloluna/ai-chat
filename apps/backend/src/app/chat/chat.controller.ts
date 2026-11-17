import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  convertToModelMessages,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { FileLogService } from '../log/file-log.service';

const DEFAULT_NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_NIM_MODEL = 'openai/gpt-oss-20b';
const DEFAULT_SYSTEM_PROMPT =
  'Eres un asistente útil. Responde de forma clara y concisa.';

type ChatRequestBody = {
  messages?: UIMessage[];
  /** Variables de inicio de conversación que el front integra al system prompt. */
  variables?: Record<string, unknown>;
};

@Controller('chat')
@UseGuards(DevAuthGuard)
export class ChatController {
  constructor(private readonly fileLog: FileLogService) {}

  @Post()
  async chat(
    @Body() body: ChatRequestBody,
    @Res() res: Response,
  ): Promise<void> {
    const { messages } = body ?? {};
    if (!Array.isArray(messages)) {
      throw new BadRequestException('Se requiere un array de "messages".');
    }

    // Variables del front (p. ej. nombre del usuario, idioma) integradas al
    // system prompt como contexto. Nota: es input del cliente, sin validar
    // más allá del tipo — asumible en un entorno de desarrollo.
    const base = process.env.SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT;
    const contexto = Object.entries(body?.variables ?? {})
      .filter(([, valor]) => typeof valor === 'string' && valor.trim())
      .map(([clave, valor]) => `- ${clave}: ${(valor as string).trim()}`)
      .join('\n');
    const systemPrompt = contexto
      ? `${base}

Contexto proporcionado por el usuario:
${contexto}`
      : base;

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

    const modelMessages = await convertToModelMessages(messages);

    // Log de la ventana de contexto completa hacia el provider a archivo
    // (system prompt + todo el historial convertido a ModelMessage).
    this.fileLog.write(
      'context.log',
      `=== ${new Date().toISOString()} ===\n${JSON.stringify(
        {
          model: process.env.NIM_MODEL ?? DEFAULT_NIM_MODEL,
          system: systemPrompt,
          messages: modelMessages,
        },
        null,
        2,
      )}`,
    );

    const result = streamText({
      model: nim(process.env.NIM_MODEL ?? DEFAULT_NIM_MODEL),
      system: systemPrompt,
      messages: modelMessages,
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
