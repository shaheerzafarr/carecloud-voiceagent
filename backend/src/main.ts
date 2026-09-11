import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { bgGreen, bgYellow } from 'cli-color';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { allowedPorts } from './common/helpers/data.helper';
import { exceptionFactoryFn } from './common/helpers/exception.helper';
import { ParamValidationPipe } from './common/pipes/param-validation.pipe';
import { ConfigService } from './config/config.service';
import { setupSwagger } from './swagger';
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  const configService = app.get(ConfigService);
  const PORT = configService.get('PORT') || 8000;

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Middleware to redirect base URL to /dashboard and support both prefixed and unprefixed routes
  app.use((req: Request, res: Response, next: any) => {
    if (req.path === '/' || req.path === '') {
      return res.redirect('/dashboard');
    }
    // Transparently rewrite unprefixed /patients, /vapi, and /appointments calls to /api/v1
    if (req.url.startsWith('/patients')) {
      req.url = `/api/v1${req.url}`;
    } else if (req.url.startsWith('/vapi')) {
      req.url = `/api/v1${req.url}`;
    } else if (req.url.startsWith('/appointments')) {
      req.url = `/api/v1${req.url}`;
    }
    next();
  });

  app.use(cookieParser());
  app.use(compression());

  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api/v1', {
    exclude: ['dashboard', 'dashboard/*path'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      validateCustomDecorators: true,

      exceptionFactory(errors) {
        console.log(errors);
        return exceptionFactoryFn(errors);
      },
    }),
    new ParamValidationPipe(),
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  setupSwagger(app, configService);

  await app.listen(PORT, () => {
    console.log(`${bgYellow('RUNNING ON PORT: ')}${bgGreen(PORT)}`);
  });

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap().catch((error) => console.log(error));
