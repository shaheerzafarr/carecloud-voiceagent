import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Patient API & Voice Agent Integration (e2e)', () => {
  let app: INestApplication;
  let createdPatientId: string;
  const testPhone = '555' + Math.floor(1000000 + Math.random() * 9000000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/v1/patients', () => {
    it('should return patient list envelope with array in data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/patients')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.error).toBeNull();
    });
  });

  describe('POST /api/v1/patients', () => {
    it('should reject invalid patient missing required fields with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .send({ first_name: 'John' })
        .expect(400);

      expect(res.body.data).toBeNull();
      expect(res.body).toHaveProperty('error');
    });

    it('should successfully register a valid new patient with 201', async () => {
      const newPatient = {
        first_name: 'Alice',
        last_name: 'Wonderland',
        date_of_birth: '1995-04-12',
        sex: 'Female',
        phone_number: testPhone,
        email: 'alice@example.com',
        address_line_1: '42 Rabbit Hole Way',
        city: 'Oxford',
        state: 'OH',
        zip_code: '45056',
        insurance_provider: 'Aetna',
        insurance_member_id: 'AETNA-12345',
        preferred_language: 'English',
        emergency_contact_name: 'White Rabbit',
        emergency_contact_phone: '5559876543',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .send(newPatient)
        .expect(201);

      expect(res.body.error).toBeNull();
      expect(res.body.data).toHaveProperty('patient_id');
      expect(res.body.data.first_name).toBe('Alice');
      expect(res.body.data.phone_number).toBe(testPhone);

      createdPatientId = res.body.data.patient_id;
    });

    it('should reject duplicate phone number registration with 409 Conflict', async () => {
      const duplicatePatient = {
        first_name: 'Bob',
        last_name: 'Wonderland',
        date_of_birth: '1990-01-01',
        sex: 'Male',
        phone_number: testPhone, // Same phone number
        address_line_1: '123 Test St',
        city: 'Columbus',
        state: 'OH',
        zip_code: '43004',
      };

      await request(app.getHttpServer())
        .post('/api/v1/patients')
        .send(duplicatePatient)
        .expect(409);
    });
  });

  describe('GET /api/v1/patients/:id', () => {
    it('should retrieve registered patient by UUID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/patients/${createdPatientId}`)
        .expect(200);

      expect(res.body.error).toBeNull();
      expect(res.body.data.patient_id).toBe(createdPatientId);
      expect(res.body.data.last_name).toBe('Wonderland');
    });

    it('should return 404 for non-existent patient UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/patients/non-existent-uuid-12345')
        .expect(404);
    });
  });

  describe('PUT /api/v1/patients/:id', () => {
    it('should partially update patient record', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/patients/${createdPatientId}`)
        .send({ city: 'Cincinnati' })
        .expect(200);

      expect(res.body.error).toBeNull();
      expect(res.body.data.city).toBe('Cincinnati');
    });
  });

  describe('DELETE /api/v1/patients/:id (Soft-Delete)', () => {
    it('should soft-delete patient record', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/patients/${createdPatientId}`)
        .expect(200);

      expect(res.body.error).toBeNull();

      // Subsequent fetch should return 404
      await request(app.getHttpServer())
        .get(`/api/v1/patients/${createdPatientId}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/vapi/webhook (Voice Agent Webhook)', () => {
    it('should handle checkExistingPatient tool call', async () => {
      const payload = {
        message: {
          type: 'tool-calls',
          toolCalls: [
            {
              id: 'tool_call_1',
              function: {
                name: 'checkExistingPatient',
                arguments: JSON.stringify({ phone_number: '5551234567' }),
              },
            },
          ],
        },
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/vapi/webhook')
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty('results');
      expect(Array.isArray(res.body.results)).toBe(true);
    });
  });
});
