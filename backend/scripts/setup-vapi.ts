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
  };

  const assistantId = process.env.VAPI_ASSISTANT_ID;

  try {
    let assistantData: any;
    if (assistantId) {
      console.log(`🔄 Updating existing Assistant ID: ${assistantId}...`);
      const response = await axios.patch(
        `https://api.vapi.ai/assistant/${assistantId}`,
        assistantPayload,
        {
          headers: {
            Authorization: `Bearer ${vapiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      assistantData = response.data;
      console.log('\n✅ Assistant Updated Successfully!');
    } else {
      console.log('🆕 Creating new Assistant...');
      const response = await axios.post('https://api.vapi.ai/assistant', assistantPayload, {
        headers: {
          Authorization: `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      assistantData = response.data;
      console.log('\n✅ Assistant Provisioned Successfully!');
    }

    console.log(`🆔 Assistant ID: ${assistantData.id}`);

    // Try to list phone numbers to help the candidate
    try {
      const phoneRes = await axios.get('https://api.vapi.ai/phone-number', {
        headers: { Authorization: `Bearer ${vapiApiKey}` },
      });
      const numbers = phoneRes.data || [];
      if (numbers.length > 0) {
        console.log('\n📞 Available Phone Numbers in your Vapi Account:');
        for (const num of numbers) {
          console.log(`   • ${num.number || num.id} (Current Assistant: ${num.assistantId || 'None'})`);
        }
      } else {
        console.log('\n⚠️ No phone numbers found in your Vapi account yet.');
        console.log('👉 Go to Vapi Dashboard -> Phone Numbers -> Buy Phone Number (Free)');
      }
    } catch {
      // ignore phone listing error
    }

    console.log('\n📋 Next Steps:');
    console.log(`1. Add VAPI_ASSISTANT_ID="${assistantData.id}" to your backend/env/.env.development`);
    console.log(`2. In Vapi Dashboard (https://dashboard.vapi.ai/phone-numbers), assign this assistant to your US phone number.`);
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
