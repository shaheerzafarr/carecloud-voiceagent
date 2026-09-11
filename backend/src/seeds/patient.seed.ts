import { Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { Patient } from '../resources/patients/entities/patient.entity';
import { SEX } from '../resources/patients/enums/patient.enum';

const logger = new Logger('PatientSeed');

export const patientSeed = async (patientModel: Model<Patient>): Promise<void> => {
  const existingCount = await patientModel.countDocuments({ deleted_at: null });
  if (existingCount > 0) {
    logger.log('Active patients already present. Skipping seed.');
    return;
  }

  const samplePatients = [
    {
      first_name: 'John',
      last_name: 'Smith',
      date_of_birth: new Date('1985-06-15'),
      sex: SEX.MALE,
      phone_number: '5551234567',
      email: 'john.smith@example.com',
      address_line_1: '123 Main Street',
      address_line_2: 'Apt 4B',
      city: 'Miami',
      state: 'FL',
      zip_code: '33101',
      emergency_contact_name: 'Jane Smith',
      emergency_contact_phone: '5559876543',
      insurance_provider: 'Blue Cross Blue Shield',
      insurance_member_id: 'BCBS-994821',
      preferred_language: 'English',
    },
    {
      first_name: 'Emily',
      last_name: 'Davis',
      date_of_birth: new Date('1992-11-20'),
      sex: SEX.FEMALE,
      phone_number: '5552345678',
      email: 'emily.davis@example.com',
      address_line_1: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      zip_code: '62704',
      emergency_contact_name: 'Mark Davis',
      emergency_contact_phone: '5558765432',
      insurance_provider: 'Aetna',
      insurance_member_id: 'AET-771239',
      preferred_language: 'English',
    },
    {
      first_name: 'Carlos',
      last_name: 'Rodriguez',
      date_of_birth: new Date('1978-03-30'),
      sex: SEX.MALE,
      phone_number: '5553456789',
      email: 'carlos.rodriguez@example.com',
      address_line_1: '450 Ocean Drive',
      address_line_2: 'Suite 12',
      city: 'Miami Beach',
      state: 'FL',
      zip_code: '33139',
      emergency_contact_name: 'Maria Rodriguez',
      emergency_contact_phone: '5557654321',
      insurance_provider: 'UnitedHealthcare',
      insurance_member_id: 'UHC-449102',
      preferred_language: 'Spanish',
    },
  ];

  await patientModel.create(samplePatients);
  logger.log(`Successfully seeded ${samplePatients.length} sample patients.`);
};
