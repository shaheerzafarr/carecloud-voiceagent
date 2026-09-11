import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Model } from 'mongoose';
import { Role } from 'src/resources/users/role/entities/role.entity';
import { User } from 'src/resources/users/user/entities/user.entity';
import { AppModule } from '../app.module';
import { adminSeed } from './admin.seed';
import { rolesSeed } from './role.seed';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  const roleModel = app.get<Model<Role>>(getModelToken(Role.name));
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  await rolesSeed(roleModel);
  await adminSeed(userModel, roleModel);

  await app.close();
}

bootstrap();
