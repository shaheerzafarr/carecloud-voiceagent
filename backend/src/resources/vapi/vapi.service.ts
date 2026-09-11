import { Injectable, Logger } from '@nestjs/common';
import { PatientService } from '../patients/patient.service';
import { CallLogService } from '../call-logs/call-log.service';
import { AppointmentService } from '../appointments/appointment.service';
import { CALL_STATUS } from '../call-logs/entities/call-log.entity';
import axios from 'axios';
import { ConfigService } from 'src/config/config.service';
import { SYSTEM_PROMPT, VAPI_TOOLS } from './prompts/system-prompt';

/**
 * VapiService
 *
 * Handles Vapi webhook events and tool call routing.
 *
 * Architecture:
 * - Vapi sends webhook events when the LLM invokes a tool
 * - This service routes tool calls to the appropriate service (Patient, Appointment)
 * - Also handles end-of-call-report for transcript storage
 */
@Injectable()
export class VapiService {
  private readonly logger = new Logger(VapiService.name);

  constructor(
    private readonly patientService: PatientService,
    private readonly callLogService: CallLogService,
    private readonly appointmentService: AppointmentService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Handle incoming Vapi webhook events.
   * Vapi sends different message types depending on the event.
   */
  async handleWebhook(payload: any): Promise<any> {
    const { message } = payload;

    if (!message) {
      this.logger.warn('⚠️ Received webhook with no message');
      return { error: 'No message in payload' };
    }

    const messageType = message.type;
    this.logger.log(`📨 Vapi webhook received: ${messageType}`);

    switch (messageType) {
      case 'tool-calls':
        return this.handleToolCalls(message);

      case 'status-update':
        return this.handleStatusUpdate(message);

      case 'end-of-call-report':
        return this.handleEndOfCallReport(message);

      case 'hang':
        this.logger.log('📞 Call hanging/waiting');
        return {};

      case 'speech-update':
        return {};

      case 'transcript':
        return {};

      default:
        this.logger.log(`Unhandled message type: ${messageType}`);
        return {};
    }
  }

  /**
   * Route tool calls to the appropriate service.
   * Each tool call triggers a specific business operation.
   */
  private async handleToolCalls(message: any): Promise<any> {
    const toolCalls = message.toolCalls || message.toolCallList || [];
    const results: any[] = [];

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function?.name || toolCall.name;
      const args = toolCall.function?.arguments
        ? typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments
        : toolCall.arguments || {};

      this.logger.log(`🔧 Tool call: ${toolName} | Args: ${JSON.stringify(args)}`);

      let result: any;

      try {
        switch (toolName) {
          case 'checkExistingPatient':
            result = await this.handleCheckExistingPatient(args);
            break;

          case 'createPatient':
            result = await this.handleCreatePatient(args, message);
            break;

          case 'updatePatient':
            result = await this.handleUpdatePatient(args);
            break;

          case 'scheduleAppointment':
            result = await this.handleScheduleAppointment(args);
            break;

          default:
            result = { error: `Unknown tool: ${toolName}` };
        }
      } catch (error: any) {
        this.logger.error(`❌ Tool call error: ${toolName} | ${error.message}`);
        result = {
          success: false,
          error: error.message || 'An error occurred while processing your request',
        };
      }

      results.push({
        toolCallId: toolCall.id,
        result: JSON.stringify(result),
      });
    }

    return { results };
  }

  /**
   * Duplicate Detection (Bonus Feature)
   * Checks if a patient with the given phone number already exists.
   */
  private async handleCheckExistingPatient(args: any): Promise<any> {
    const patient = await this.patientService.findByPhone(args.phone_number);

    if (patient) {
      this.logger.log(
        `🔍 Existing patient found: ${patient.patient_id} | ${patient.first_name} ${patient.last_name}`,
      );
      return {
        exists: true,
        patient_id: patient.patient_id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        message: `Found existing patient: ${patient.first_name} ${patient.last_name}`,
      };
    }

    return {
      exists: false,
      message: 'No existing patient found with this phone number',
    };
  }

  /**
   * Create a new patient record.
   * Called after the caller confirms their information.
   */
  private async handleCreatePatient(args: any, message: any): Promise<any> {
    const patient = await this.patientService.createPatient(args);

    // Link call log to patient if we have a call ID
    const callId = message.call?.id;
    if (callId) {
      await this.callLogService.createOrUpdate({
        call_id: callId,
        patient_id: patient.patient_id,
        phone_number: args.phone_number,
      });
    }

    return {
      success: true,
      patient_id: patient.patient_id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      message: `Patient ${patient.first_name} ${patient.last_name} registered successfully with ID ${patient.patient_id}`,
    };
  }

  /**
   * Update an existing patient record.
   * Used when a returning caller wants to update their info.
   */
  private async handleUpdatePatient(args: any): Promise<any> {
    const { patient_id, ...updateData } = args;
    const patient = await this.patientService.updatePatient(patient_id, updateData);

    return {
      success: true,
      patient_id: patient.patient_id,
      message: `Patient ${patient.first_name} ${patient.last_name}'s information has been updated successfully`,
    };
  }

  /**
   * Schedule a first appointment (Bonus Feature).
   */
  private async handleScheduleAppointment(args: any): Promise<any> {
    const appointment = await this.appointmentService.scheduleAppointment(args);

    const dateStr = appointment.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      success: true,
      appointment_id: appointment.appointment_id,
      date: dateStr,
      time: appointment.time,
      provider: appointment.provider,
      message: `Appointment scheduled for ${dateStr} at ${appointment.time} with ${appointment.provider}`,
    };
  }

  /**
   * Handle call status updates.
   */
  private async handleStatusUpdate(message: any): Promise<void> {
    const status = message.status;
    const callId = message.call?.id;

    this.logger.log(`📞 Call status: ${status} | Call ID: ${callId}`);

    if (callId) {
      let callStatus: CALL_STATUS;
      switch (status) {
        case 'ended':
          callStatus = CALL_STATUS.COMPLETED;
          break;
        case 'in-progress':
          callStatus = CALL_STATUS.IN_PROGRESS;
          break;
        default:
          callStatus = CALL_STATUS.IN_PROGRESS;
      }

      await this.callLogService.createOrUpdate({
        call_id: callId,
        status: callStatus,
        phone_number: message.call?.customer?.number,
      });
    }
  }

  /**
   * Handle end-of-call-report (Bonus: Transcript Storage).
   * Stores the full transcript and summary linked to the call.
   */
  private async handleEndOfCallReport(message: any): Promise<void> {
    const callId = message.call?.id;

    if (!callId) {
      this.logger.warn('⚠️ End-of-call-report without call ID');
      return;
    }

    // Extract transcript from the report
    const transcript = message.artifact?.transcript || message.transcript || '';
    const summary = message.artifact?.summary || message.summary || '';
    const durationSeconds = message.durationSeconds || message.call?.duration || 0;

    this.logger.log(
      `📝 End-of-call report: Call ${callId} | Duration: ${durationSeconds}s | Transcript length: ${transcript.length}`,
    );

    // Observability: Log the final conversation data
    if (transcript) {
      this.logger.log(`📜 Call Transcript:\n${transcript}`);
    }

    await this.callLogService.createOrUpdate({
      call_id: callId,
      transcript: typeof transcript === 'string' ? transcript : JSON.stringify(transcript),
      summary,
      duration_seconds: durationSeconds,
      status: CALL_STATUS.COMPLETED,
      metadata: {
        endedReason: message.endedReason,
        cost: message.cost,
        messages: message.artifact?.messages?.length || 0,
      },
    });
  }

  /**
   * Setup or update the Vapi assistant.
   * Call this once to configure the assistant with our system prompt and tools.
   */
  async setupAssistant(webhookUrl: string): Promise<any> {
    const vapiApiKey = this.configService.get('VAPI_API_KEY');

    if (!vapiApiKey) {
      throw new Error('VAPI_API_KEY is not configured');
    }

    const assistantConfig = {
      name: 'CareCloud Patient Registration Agent',
      model: {
        provider: 'google',
        model: 'gemini-2.0-flash',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
        ],
        tools: VAPI_TOOLS,
        temperature: 0.7,
      },
      voice: {
        provider: '11labs',
        voiceId: 'sarah',
        stability: 0.5,
        similarityBoost: 0.75,
      },
      firstMessage:
        "Hi, thank you for calling CareCloud Medical Center! My name is Sarah. I'd be happy to help you get registered as a new patient. This will just take a few minutes. Let's start — what's your first and last name?",
      serverUrl: webhookUrl,
      endCallFunctionEnabled: true,
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en',
      },
    };

    try {
      // Try to update existing assistant first
      const assistantId = this.configService.get('VAPI_ASSISTANT_ID');

      if (assistantId) {
        const response = await axios.patch(
          `https://api.vapi.ai/assistant/${assistantId}`,
          assistantConfig,
          {
            headers: {
              Authorization: `Bearer ${vapiApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );
        this.logger.log(`✅ Vapi assistant updated: ${response.data.id}`);
        return response.data;
      }

      // Create new assistant
      const response = await axios.post(
        'https://api.vapi.ai/assistant',
        assistantConfig,
        {
          headers: {
            Authorization: `Bearer ${vapiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`✅ Vapi assistant created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to setup Vapi assistant: ${error.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }
}
