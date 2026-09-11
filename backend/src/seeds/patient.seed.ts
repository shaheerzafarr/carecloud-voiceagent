import { Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { Patient } from '../resources/patients/entities/patient.entity';
import { SEX } from '../resources/patients/enums/patient.enum';

const logger = new Logger('PatientSeed');

export const patientSeed = async (patientModel: Model<Patient>): Promise<void> => {
  const existingCount = await patientModel.countDocuments();
  if (existingCount > 0) {
    logger.log('Patients already seeded. Skipping.');
    return;
  }

  const samplePatients = [
    {
      first_name: 'John',
      middle_name: 'Robert',
      last_name: 'Smith',
      date_of_birth: '1985-06-15',
      sex: SEX.MALE,
      phone_number: '+15551234567',
      email: 'john.smith@example.com',
      address_line1: '123 Main Street',
      address_line2: 'Apt 4B',
      city: 'Miami',
      state: 'FL',
      zip_code: '33101',
      emergency_contact_name: 'Jane Smith',
      emergency_contact_relationship: 'Spouse',
      emergency_contact_phone: '+15559876543',
      insurance_provider: 'Blue Cross Blue Shield',
      insurance_policy_number: 'BCBS-994821',
      registered_via: 'Voice AI Agent',
      is_active: true,
      is_deleted: false,
    },
    {
      first_name: 'Emily',
      last_name: 'Davis',
      date_of_birth: '1992-11-20',
      sex: SEX.FEMALE,
      phone_number: '+15552345678',
      email: 'emily.davis@example.com',
      address_line1: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      zip_code: '62704',
      emergency_contact_name: 'Mark Davis',
      emergency_contact_relationship: 'Father',
      emergency_contact_phone: '+15558765432',
      insurance_provider: 'Aetna',
      insurance_policy_number: 'AET-771239',
      registered_via: 'Voice AI Agent',
      is_active: true,
      is_deleted: false,
    },
    {
      first_name: 'Carlos',
      middle_name: 'Antonio',
      last_name: 'Rodriguez',
      date_of_birth: '1978-03-30',
      sex: SEX.MALE,
      phone_number: '+15553456789',
      email: 'carlos.rodriguez@example.com',
      address_line1: '450 Ocean Drive',
      address_line2: 'Suite 12',
      city: 'Miami Beach',
      state: 'FL',
      zip_code: '33139',
      emergency_contact_name: 'Maria Rodriguez',
      emergency_contact_relationship: 'Wife',
      emergency_contact_phone: '+15557654321',
      insurance_provider: 'UnitedHealthcare',
      insurance_policy_number: 'UHC-449102',
      registered_via: 'Voice AI Agent',
      is_active: true,
      is_deleted: false,
    },
  ];

  await patientModel.insertMany(samplePatients);
  logger.log(`Successfully seeded ${samplePatients.length} sample patients.`);
};
