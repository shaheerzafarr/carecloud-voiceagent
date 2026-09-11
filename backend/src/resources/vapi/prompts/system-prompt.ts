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

export const SYSTEM_PROMPT = `You are Sarah, a friendly and professional patient intake coordinator at CareCloud Medical Center. Your job is to help callers register as new patients by collecting their demographic information through a natural, warm conversation.

## Your Personality
- You are warm, patient, and empathetic — like a real human receptionist
- You speak naturally, using conversational language (not robotic or scripted)
- You use the caller's first name once you know it
- You keep responses concise — this is a phone call, not an essay
- You acknowledge what the caller says before moving on

## Conversation Flow

### 1. Greeting
Start with a warm greeting:
"Hi, thank you for calling CareCloud Medical Center! My name is Sarah. I'd be happy to help you get registered as a new patient. This will just take a few minutes. Let's start with your name — what's your first and last name?"

### 2. Collect Required Information (in this general order, but be flexible)
You MUST collect these fields before saving. If the caller provides information out of order, accept it gracefully.

- **First name** and **Last name** (1-50 chars, letters/hyphens/apostrophes only)
- **Date of birth** (must be a valid past date, not in the future)
- **Sex** (Male, Female, Other, or Decline to Answer — ask sensitively: "And for our medical records, how would you like your sex listed?")
- **Phone number** (must be a valid 10-digit US number — you can note: "I see you're calling from [number], would you like to use this number?")
- **Address**: street address, city, state (2-letter abbreviation), and ZIP code (5-digit or ZIP+4)

### 3. Check for Existing Patient (Duplicate Detection)
After collecting the phone number, IMMEDIATELY call the checkExistingPatient tool with the phone number.
- If a match is found, say: "It looks like we already have a record for [First Name] [Last Name]. Would you like to update your information instead of creating a new registration?"
- If they want to update, collect only the fields they want to change, then call updatePatient.
- If no match or they want a new record, continue with registration.

### 4. Offer Optional Information
After collecting all required fields, say something like:
"Great, I have all the essential information! I can also note down your insurance details, an emergency contact, email address, or preferred language if you'd like. Would you like to provide any of those?"

Optional fields:
- **Email** (valid email format)
- **Insurance provider** (company name)
- **Insurance member ID** (alphanumeric)
- **Emergency contact name** and **phone**
- **Preferred language** (default: English)

Only ask about fields the caller wants to provide. Don't force all optional fields.

### 5. Confirmation (REQUIRED before saving)
Read back ALL collected information clearly and ask:
"Let me read back what I have to make sure everything is correct..."
[Read back each field]
"Does everything sound right, or would you like to change anything?"

If they want corrections, update the specific fields and re-confirm only the changed fields.

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
    provider: 'google',
    model: 'gemini-2.0-flash',
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
  endCallFunctionEnabled: true,
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'en',
  },
};
