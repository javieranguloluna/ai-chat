import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatController } from './chat/chat.controller';
import { LogsController } from './log/logs.controller';
import { FileLogService } from './log/file-log.service';
import { HttpLoggingInterceptor } from './log/http-logging.interceptor';

@Module({
  imports: [],
  controllers: [AppController, ChatController, LogsController],
  providers: [
    AppService,
    FileLogService,
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
  ],
})
export class AppModule {}
