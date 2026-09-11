/**
 * Vapi Assistant Provisioning Script
 *
 * Automatically creates or updates the Voice AI Assistant on Vapi
 * configured with Google Gemini 1.5 Flash (free LLM), US English voice,
 * and the 3 patient registration function tools.
 *
 * Usage:
 *   npx ts-node scripts/setup-vapi.ts <SERVER_URL>
 * Example:
 *   npx ts-node scripts/setup-vapi.ts https://carecloud-voiceagent.onrender.com
 */

import axios from 'axios';
import { VAPI_ASSISTANT_CONFIG, VAPI_TOOLS } from '../src/resources/vapi/prompts/system-prompt';

async function main() {
  const vapiApiKey = process.env.VAPI_API_KEY;
  const serverUrl = process.argv[2] || process.env.WEB_HOSTED_URL || 'http://localhost:5006';

  if (!vapiApiKey) {
    console.error('❌ Error: VAPI_API_KEY environment variable is missing.');
    console.log('Set VAPI_API_KEY in your env or command line:');
    console.log('  export VAPI_API_KEY="your-vapi-api-key"');
    process.exit(1);
  }

  const webhookUrl = `${serverUrl.replace(/\/$/, '')}/api/v1/vapi/webhook`;

  console.log('🚀 Provisioning CareCloud Voice AI Agent on Vapi...');
  console.log(`📡 Server Webhook URL: ${webhookUrl}`);

  const assistantPayload = {
    ...VAPI_ASSISTANT_CONFIG,
    serverUrl: webhookUrl,
    model: {
      provider: 'google',
      model: 'gemini-1.5-flash',
      temperature: 0.2,
      systemPrompt: VAPI_ASSISTANT_CONFIG.model.systemPrompt,
      tools: VAPI_TOOLS,
    },
  };

  try {
    const response = await axios.post('https://api.vapi.ai/assistant', assistantPayload, {
      headers: {
        Authorization: `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('\n✅ Assistant Provisioned Successfully!');
    console.log(`🆔 Assistant ID: ${response.data.id}`);
    console.log(`📞 Next Step: Attach this Assistant ID to your Vapi Phone Number in the Vapi Dashboard.`);
    console.log(`   Vapi Dashboard -> Phone Numbers -> Assign Assistant -> ${response.data.id}`);
  } catch (error: any) {
    console.error('❌ Failed to provision assistant:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Details:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`  Error: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
