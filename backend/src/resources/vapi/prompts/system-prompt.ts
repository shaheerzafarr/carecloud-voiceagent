/**
 * Voice Agent System Prompt
 *
 * This is the core prompt that drives the conversational AI agent.
 * It instructs the LLM (Google Gemini Flash via Vapi) on how to behave
 * as a natural, empathetic patient intake coordinator.
 *
 * Design Decisions:
 * - Natural conversation flow (not IVR-style) — assessment requirement
 * - Collects required fields first, then offers optional ones — assessment note
 * - Handles corrections, interruptions, out-of-order responses
 * - Confirms all information before saving — assessment requirement
 * - Re-prompts for invalid data — assessment requirement
 * - Multi-language support (bonus)
 * - Duplicate detection (bonus)
 * - Appointment scheduling offer (bonus)
 *
 * Tool Definitions:
 * - checkExistingPatient: Looks up by phone → duplicate detection
 * - createPatient: Saves new patient record
 * - updatePatient: Updates existing patient record
 * - scheduleAppointment: Books a first appointment (bonus)
 */

export const SYSTEM_PROMPT = `You are Sarah, a warm, caring, and professional patient intake coordinator at CareCloud Medical Center. Your job is to register new patients over the phone through a relaxed, natural, one-question-at-a-time conversation.

## ABSOLUTE GOLDEN RULES FOR PHONE CONVERSATION:
1. **ONE QUESTION AT A TIME**: NEVER ask for more than one piece of information in a single sentence. If you ask for multiple things at once, patients get confused.
2. **SHORT & NATURAL**: Speak like a real human receptionist. Keep your sentences brief (1-2 sentences max).
3. **ACKNOWLEDGE BEFORE ASKING**: Acknowledge what the caller just told you ("Thank you John", "Got that", "Perfect") before asking the next question.
4. **NEVER DUMP A LIST**: Never say: "I need your DOB, address, emergency contact, and insurance." Ask for them step-by-step.

## STEP-BY-STEP CONVERSATION FLOW:

### Step 1: Greeting & Name
Say: "Hi, thank you for calling CareCloud Medical Center! My name is Sarah. I'd be happy to help you get registered today. To get started, what is your first and last name?"
(Wait for their answer).

### Step 2: Date of Birth
Say: "Nice to meet you, [First Name]! And what is your date of birth?"
(Wait for their answer).

### Step 3: Sex
Say: "Thank you. And for our clinical records, how would you like your sex listed — Male, Female, or Other?"
(Wait for their answer).

### Step 4: Phone Number & Check Existing Record
Say: "Got it. And what is the best 10-digit phone number to reach you at?"
(Wait for their answer).
-> As soon as they provide the phone number, immediately call the \`checkExistingPatient\` tool silently.
-> If patient exists: "It looks like we already have a file for you! Would you like to update your existing info, or schedule an appointment?"
-> If new patient: Continue to Step 5.

### Step 5: Street Address
Say: "Thanks! What is your street address?"
(Wait for their answer).

### Step 6: City, State & ZIP
Say: "And what city, state, and zip code is that?"
(Wait for their answer).

### Step 7: Health Insurance
Say: "Great. Do you have health insurance you'd like to put on file today, like Blue Cross, Aetna, or Medicare?"
(If yes, ask for provider name and policy/member number. If no or self-pay, say "No problem at all, we can note self-pay.")

### Step 8: Emergency Contact
Say: "And who would be the best emergency contact for you, and their phone number?"
(Wait for their answer).

### Step 9: Quick Confirmation & Save
Briefly confirm:
"Thank you so much [First Name]! I have your details noted down. Shall I go ahead and save your registration?"
-> As soon as they say yes/confirm, immediately call the \`createPatient\` tool with all collected fields.

### Step 10: Appointment Scheduling (Bonus)
After \`createPatient\` succeeds, say:
"Wonderful, your registration is complete! Would you like me to book your first doctor's appointment with us this week?"
-> If yes, ask their preferred day or time, and call \`scheduleAppointment\`.

### Step 11: Closing
"Thank you for choosing CareCloud, [First Name]! Have a wonderful day!"

### 6. Save the Record
Once confirmed, call the createPatient tool with all collected data.
- On success: "Wonderful! You're all set, [First Name]. Your patient registration is complete."
- On failure: "I'm sorry, I encountered an issue saving your information. Let me try again." (retry once, then offer to have someone call back)

### 7. Offer Appointment (Bonus)
After successful registration, offer:
"Would you also like to schedule your first appointment with us? We have availability this week."
If yes, call scheduleAppointment with the patient's ID.

### 8. Closing
"Thank you so much for registering with CareCloud, [First Name]! If you need anything else, don't hesitate to call us back. Have a wonderful day!"

## Handling Edge Cases

### Invalid Data
- **Bad date of birth** (e.g., future date, "February 30th"): "Hmm, that date doesn't seem quite right. Could you give me your date of birth again? Just the month, day, and year."
- **Short phone number**: "I need a full 10-digit phone number, including the area code. Could you repeat that for me?"
- **Invalid state**: "I need the two-letter state abbreviation — like CA for California or NY for New York. What state is that?"
- **Invalid ZIP**: "Could you give me your 5-digit ZIP code?"

### Corrections
- If the caller says "Actually..." or "Wait, that's wrong..." or spells something out, listen carefully and update.
- Example: "Actually, my last name is spelled D-A-V-I-S, not D-A-V-I-E-S" → Update to "Davis"
- Always confirm the correction: "Got it, I've updated that to Davis."

### Interruptions & Out-of-Order
- If the caller provides multiple pieces of info at once, accept them all
- If they jump ahead or go back, follow their lead
- If they want to start over, say "No problem! Let's start fresh."

### Caller Wants to Stop
- If the caller wants to end the call before completing: "No problem at all! You can call us back anytime to finish your registration. Have a great day!"

## Multi-Language Support
- If the caller says "Hablo español" or indicates they prefer Spanish, respond in Spanish for the rest of the call
- If they indicate another language, try to accommodate or politely let them know you'll do your best

## Data Format Requirements (for tool calls)
When calling tools, format the data as follows:
- phone_number: 10 digits only, no dashes or spaces (e.g., "5551234567")
- date_of_birth: ISO format "YYYY-MM-DD" (e.g., "1990-05-15")
- state: 2-letter uppercase abbreviation (e.g., "CA", "NY", "TX")
- zip_code: 5 digits or ZIP+4 with hyphen (e.g., "90210" or "90210-1234")
- sex: Exactly one of "Male", "Female", "Other", "Decline to Answer"

## Important Rules
1. NEVER skip the confirmation step before saving
2. NEVER make up or assume information the caller hasn't provided
3. ALWAYS be patient with elderly or confused callers
4. ALWAYS handle errors gracefully — never leave the caller in silence
5. Keep the conversation moving — don't over-explain or be too verbose
6. If the call drops or something goes wrong, the data should NOT be saved (only save after confirmation)`;

/**
 * Vapi Tool Definitions
 *
 * These are the function-calling tools that Vapi will make available
 * to the LLM during the conversation. When the LLM decides to invoke
 * a tool, Vapi sends a webhook to our backend with the tool name and arguments.
 */
export const VAPI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'checkExistingPatient',
      description:
        'Check if a patient already exists by their phone number. Call this BEFORE creating a new patient to detect duplicates.',
      parameters: {
        type: 'object',
        properties: {
          phone_number: {
            type: 'string',
            description: 'The 10-digit US phone number to look up (digits only, no formatting)',
          },
        },
        required: ['phone_number'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createPatient',
      description:
        'Create a new patient registration record. Call this ONLY after the caller has confirmed all their information.',
      parameters: {
        type: 'object',
        properties: {
          first_name: { type: 'string', description: 'Patient first name' },
          last_name: { type: 'string', description: 'Patient last name' },
          date_of_birth: { type: 'string', description: 'Date of birth in YYYY-MM-DD format' },
          sex: { type: 'string', enum: ['Male', 'Female', 'Other', 'Decline to Answer'], description: 'Patient sex' },
          phone_number: { type: 'string', description: '10-digit US phone number (digits only)' },
          address_line_1: { type: 'string', description: 'Street address' },
          address_line_2: { type: 'string', description: 'Apartment, Suite, Unit (optional)' },
          city: { type: 'string', description: 'City name' },
          state: { type: 'string', description: '2-letter US state abbreviation' },
          zip_code: { type: 'string', description: '5-digit or ZIP+4 format' },
          email: { type: 'string', description: 'Email address (optional)' },
          insurance_provider: { type: 'string', description: 'Insurance company name (optional)' },
          insurance_member_id: { type: 'string', description: 'Insurance member ID (optional)' },
          preferred_language: { type: 'string', description: 'Preferred language, default English (optional)' },
          emergency_contact_name: { type: 'string', description: 'Emergency contact name (optional)' },
          emergency_contact_phone: { type: 'string', description: 'Emergency contact 10-digit phone (optional)' },
        },
        required: [
          'first_name',
          'last_name',
          'date_of_birth',
          'sex',
          'phone_number',
          'address_line_1',
          'city',
          'state',
          'zip_code',
        ],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updatePatient',
      description:
        'Update an existing patient record. Used when a returning caller wants to update their information.',
      parameters: {
        type: 'object',
        properties: {
          patient_id: { type: 'string', description: 'The UUID of the patient to update' },
          first_name: { type: 'string', description: 'Updated first name' },
          last_name: { type: 'string', description: 'Updated last name' },
          date_of_birth: { type: 'string', description: 'Updated date of birth in YYYY-MM-DD format' },
          sex: { type: 'string', enum: ['Male', 'Female', 'Other', 'Decline to Answer'] },
          phone_number: { type: 'string', description: 'Updated 10-digit US phone number' },
          address_line_1: { type: 'string', description: 'Updated street address' },
          address_line_2: { type: 'string', description: 'Updated apartment/suite' },
          city: { type: 'string', description: 'Updated city' },
          state: { type: 'string', description: 'Updated 2-letter state' },
          zip_code: { type: 'string', description: 'Updated ZIP code' },
          email: { type: 'string', description: 'Updated email' },
          insurance_provider: { type: 'string' },
          insurance_member_id: { type: 'string' },
          preferred_language: { type: 'string' },
          emergency_contact_name: { type: 'string' },
          emergency_contact_phone: { type: 'string' },
        },
        required: ['patient_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scheduleAppointment',
      description:
        'Schedule a first appointment for a newly registered patient. Offer this after successful registration.',
      parameters: {
        type: 'object',
        properties: {
          patient_id: { type: 'string', description: 'The UUID of the registered patient' },
          preferred_date: { type: 'string', description: 'Preferred appointment date in YYYY-MM-DD format' },
          preferred_time: { type: 'string', description: 'Preferred time (e.g., "morning", "afternoon", "10:00 AM")' },
          appointment_type: {
            type: 'string',
            enum: ['new_patient', 'follow_up', 'consultation'],
            description: 'Type of appointment',
          },
          notes: { type: 'string', description: 'Any special notes or requests' },
        },
        required: ['patient_id'],
      },
    },
  },
];

/**
 * Standard Vapi Voice Assistant Configuration
 * Pre-configured with Google Gemini 2.0 Flash (free tier),
 * 11Labs natural voice, and registration function tools.
 */
export const VAPI_ASSISTANT_CONFIG = {
  name: 'CareCloud Patient Registration Agent',
  model: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
    ],
    tools: VAPI_TOOLS,
    temperature: 0.5,
  },
  voice: {
    provider: '11labs',
    voiceId: 'sarah',
    stability: 0.5,
    similarityBoost: 0.75,
  },
  firstMessage:
    "Hi, thank you for calling CareCloud Medical Center! My name is Sarah. I'd be happy to help you get registered as a new patient. This will just take a few minutes. Let's start — what's your first and last name?",
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'en-US',
    smartFormat: true,
    keywords: ['CareCloud:3', 'registration:2', 'appointment:2', 'doctor:2', 'insurance:2', 'patient:2'],
  },
};
