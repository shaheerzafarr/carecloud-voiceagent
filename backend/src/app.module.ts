import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnyExceptionFilter } from './common/filters/exception.filter';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { ConfigModule } from './config/config.module';
import { SharedModule } from './shared/shared.module';
import { PatientModule } from './resources/patients/patient.module';
import { VapiModule } from './resources/vapi/vapi.module';
import { CallLogModule } from './resources/call-logs/call-log.module';
import { AppointmentModule } from './resources/appointments/appointment.module';
import { DashboardModule } from './resources/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.register({ folder: './env' }),
    SharedModule,
    PatientModule,
    VapiModule,
    CallLogModule,
    AppointmentModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AnyExceptionFilter },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*path');
  }
}
