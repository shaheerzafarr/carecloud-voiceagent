import { Controller, Get, Param, Render, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { PatientService } from '../patients/patient.service';
import { CallLogService } from '../call-logs/call-log.service';
import { AppointmentService } from '../appointments/appointment.service';

/**
 * DashboardController
 *
 * Server-rendered web dashboard for viewing registered patients.
 * Bonus feature: "Dashboard: A simple web UI that displays registered patients."
 *
 * Uses EJS templates (already configured in main.ts).
 */
@ApiExcludeController()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly patientService: PatientService,
    private readonly callLogService: CallLogService,
    private readonly appointmentService: AppointmentService,
  ) {}

  /**
   * GET /dashboard
   * Main dashboard page showing all patients, stats, and recent calls.
   */
  @Get()
  async dashboard(@Res() res: Response) {
    const [patientData, stats, recentCalls, todayCalls] = await Promise.all([
      this.patientService.getAllPatients({}),
      this.patientService.getStats(),
      this.callLogService.getRecentCalls(5),
      this.callLogService.countToday(),
    ]);

    return res.render('dashboard', {
      title: 'CareCloud Dashboard',
      patients: patientData.patients,
      totalPatients: stats.totalPatients,
      todayRegistrations: stats.todayRegistrations,
      todayCalls,
      recentCalls,
    });
  }

  /**
   * GET /dashboard/patients/:id
   * Patient detail page with call history and appointments.
   */
  @Get('patients/:id')
  async patientDetail(@Param('id') id: string, @Res() res: Response) {
    try {
      const [patient, callLogs, appointments] = await Promise.all([
        this.patientService.getPatient(id),
        this.callLogService.findByPatientId(id),
        this.appointmentService.findByPatientId(id),
      ]);

      return res.render('patient-detail', {
        title: `${patient.first_name} ${patient.last_name} - CareCloud`,
        patient,
        callLogs,
        appointments,
      });
    } catch {
      return res.redirect('/dashboard');
    }
  }
}
