import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Model } from 'mongoose';
import { Patient } from 'src/resources/patients/entities/patient.entity';
import { AppModule } from '../app.module';
import { patientSeed } from './patient.seed';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  const patientModel = app.get<Model<Patient>>(getModelToken(Patient.name));
  await patientSeed(patientModel);

  await app.close();
}

bootstrap();
