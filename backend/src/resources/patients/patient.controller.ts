import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { QueryPatientDto } from './dto/query-patient.dto';

/**
 * PatientController
 *
 * REST API endpoints for patient CRUD operations.
 * Assessment requirements:
 * - Return proper HTTP status codes (200, 201, 400, 404, 422, 500)
 * - Validate all inputs server-side
 * - Return JSON responses with consistent envelope: { "data": {...}, "error": null }
 *
 * All endpoints are PUBLIC (no auth required) — the voice agent needs direct access.
 */
@ApiTags('Patients')
@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  /**
   * POST /patients
   * Create a new patient. Returns the created record with patient_id.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new patient' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Duplicate phone number' })
  async createPatient(@Body() createPatientDto: CreatePatientDto) {
    const patient = await this.patientService.createPatient(createPatientDto);

    return { data: patient, error: null };
  }

  /**
   * GET /patients
   * List all patients. Support optional query params: ?last_name=, ?date_of_birth=, ?phone_number=
   */
  @Get()
  @ApiOperation({ summary: 'List all patients with optional filters' })
  @ApiQuery({ name: 'last_name', required: false, description: 'Filter by last name' })
  @ApiQuery({ name: 'date_of_birth', required: false, description: 'Filter by date of birth' })
  @ApiQuery({ name: 'phone_number', required: false, description: 'Filter by phone number' })
  @ApiResponse({ status: 200, description: 'List of patients' })
  async getAllPatients(@Query() query: QueryPatientDto) {
    const result = await this.patientService.getAllPatients(query);

    return { data: result, error: null };
  }

  /**
   * GET /patients/:id
   * Retrieve a single patient by patient_id (UUID).
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single patient by ID' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient found' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async getPatient(@Param('id') id: string) {
    const patient = await this.patientService.getPatient(id);

    return { data: patient, error: null };
  }

  /**
   * GET /patients/phone/:phone
   * Find a patient by phone number (for duplicate detection).
   */
  @Get('phone/:phone')
  @ApiOperation({ summary: 'Find patient by phone number (duplicate detection)' })
  @ApiParam({ name: 'phone', description: '10-digit US phone number' })
  @ApiResponse({ status: 200, description: 'Patient found or null' })
  async findByPhone(@Param('phone') phone: string) {
    const patient = await this.patientService.findByPhone(phone);

    return { data: patient, error: null };
  }

  /**
   * PUT /patients/:id
   * Update an existing patient record. Partial updates allowed.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a patient (partial updates allowed)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async updatePatient(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    const patient = await this.patientService.updatePatient(id, updatePatientDto);

    return { data: patient, error: null };
  }

  /**
   * DELETE /patients/:id
   * Soft-delete a patient record (set deleted_at timestamp; do not hard-delete).
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a patient record' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient soft-deleted' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async deletePatient(@Param('id') id: string) {
    const patient = await this.patientService.deletePatient(id);

    return { data: patient, error: null };
  }
}
