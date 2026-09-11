import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnyExceptionFilter } from './common/filters/exception.filter';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { MediaModule } from './resources/media/media.module';
import { UsersModule } from './resources/users/users.module';
import { SharedModule } from './shared/shared.module';
import { CrudModule } from './resources/crud/crud.module';
import { AdminModule } from './resources/admin/admin.module';

@Module({
  imports: [
    ConfigModule.register({ folder: './env' }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: any) => [
        {
          ttl: seconds(config.get('THROTTLER_TTL_SECONDS')),
          limit: config.get('THROTTLER_LIMIT'),
        },
      ],
    }),
    SharedModule,
    UsersModule,
    MediaModule,
    CrudModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AnyExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*path');
  }
}
