import { Body, Controller, Get, Post, Logger } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { VapiService } from './vapi.service';

/**
 * VapiController
 *
 * Handles Vapi webhook events for voice agent integration.
 *
 * Flow:
 * 1. Vapi receives phone call → processes STT → sends to LLM
 * 2. LLM decides to call a tool (e.g., createPatient)
 * 3. Vapi sends POST /vapi/webhook with the tool call details
 * 4. We process the tool call → return result to Vapi
 * 5. Vapi feeds result back to LLM → LLM generates speech → TTS plays to caller
 *
 * No authentication on this controller — Vapi needs direct access.
 * In production, you would validate Vapi's webhook signature.
 */
@ApiExcludeController()
@Controller('vapi')
export class VapiController {
  private readonly logger = new Logger(VapiController.name);

  constructor(private readonly vapiService: VapiService) {}

  /**
   * POST /vapi/webhook
   * Main webhook endpoint for all Vapi server events.
   */
  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    this.logger.log(`📨 Webhook received: ${JSON.stringify(body?.message?.type || 'unknown')}`);
    return await this.vapiService.handleWebhook(body);
  }

  /**
   * GET /vapi/health
   * Health check endpoint for Vapi webhook verification.
   */
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'CareCloud Voice Agent - Vapi Webhook',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /vapi/setup
   * Trigger assistant setup/update (one-time operation).
   * Call this after deployment to configure the Vapi assistant.
   */
  @Post('setup')
  async setupAssistant(@Body() body: { webhook_url: string }) {
    const webhookUrl = body.webhook_url;
    if (!webhookUrl) {
      return { error: 'webhook_url is required in request body' };
    }

    const result = await this.vapiService.setupAssistant(webhookUrl);
    return {
      data: {
        assistant_id: result.id,
        message: 'Assistant configured successfully. Save this assistant_id in your .env file.',
      },
      error: null,
    };
  }
}
