/**
 * Vapi Assistant Provisioning Script
 *
 * Automatically creates or updates the Voice AI Assistant on Vapi
 * configured with OpenAI GPT-4o-mini, US English voice,
 * and the patient registration function tools.
 *
 * Usage:
 *   npx ts-node scripts/setup-vapi.ts <SERVER_URL>
 * Example:
 *   npx ts-node scripts/setup-vapi.ts https://carecloud-voiceagent.onrender.com
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { getAssistantConfig } from '../src/resources/vapi/prompts/system-prompt';

const envDevPath = path.resolve(__dirname, '../env/.env.development');
if (fs.existsSync(envDevPath)) {
  dotenv.config({ path: envDevPath });
}
const envProdPath = path.resolve(__dirname, '../env/.env.production');
if (fs.existsSync(envProdPath)) {
  dotenv.config({ path: envProdPath });
}

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

  const assistantConfig = getAssistantConfig();
  const assistantPayload = {
    ...assistantConfig,
    server: {
      url: webhookUrl,
    },
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

    // Try to list and link phone numbers
    try {
      const phoneRes = await axios.get('https://api.vapi.ai/phone-number', {
        headers: { Authorization: `Bearer ${vapiApiKey}` },
      });
      const numbers = phoneRes.data || [];
      if (numbers.length > 0) {
        console.log('\n📞 Available Phone Numbers in your Vapi Account:');
        for (const num of numbers) {
          console.log(`   • ${num.number || num.id} (Current Assistant: ${num.assistantId || 'None'})`);
          if (num.assistantId !== assistantData.id) {
            console.log(`     🔗 Linking phone number ${num.number || num.id} to Assistant ${assistantData.id}...`);
            await axios.patch(
              `https://api.vapi.ai/phone-number/${num.id}`,
              { assistantId: assistantData.id },
              { headers: { Authorization: `Bearer ${vapiApiKey}` } }
            );
            console.log(`     ✅ Phone number successfully bound!`);
          } else {
            console.log(`     ✅ Already bound to this Assistant!`);
          }
        }
      }
    } catch (phoneErr: any) {
      console.warn('⚠️ Phone number auto-link warning:', phoneErr.message);
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
