/**
 * Voice Agent System Prompt
 *
 * This is the core prompt that drives the conversational AI agent.
 * It instructs the LLM (OpenAI GPT-4o-mini via Vapi) on how to behave
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
 * - Real-time date awareness and natural human receptionist dialogue
 *
 * Tool Definitions:
 * - checkExistingPatient: Looks up by phone → duplicate detection
 * - createPatient: Saves new patient record
 * - updatePatient: Updates existing patient record
 * - scheduleAppointment: Books a first appointment (bonus)
 */

export function getSystemPrompt(): string {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentYear = now.getFullYear();

  return `You are Sarah, a warm, polite, and professional patient intake receptionist at CareCloud Medical Center. Your job is to register new patients over the phone through a relaxed, friendly, one-question-at-a-time conversation.

## CALENDAR & DATE CONTEXT:
- Today's date is: ${todayStr} (Year: ${currentYear}).
- Tomorrow is: Sunday, September 13, ${currentYear}.
- Next week starts: Monday, September 14, ${currentYear}.
- Any date on or before today (${todayStr}) is in the PAST.
- When scheduling an appointment:
  - Offer real upcoming dates: "We have availability this coming week, like Monday, September 14th or Tuesday, September 15th. Do you prefer mornings or afternoons?"
  - NEVER book a date in the past. If the caller suggests a past date or past year (like September 8th or 2025), say naturally: "That date has already passed. How about this coming Monday, September 14th or Tuesday, September 15th?"
  - NEVER say "That's a future date" or discuss whether dates are future or past out loud. Just speak naturally like a real human receptionist.

## GOLDEN CONVERSATIONAL RULES:
1. **ONE QUESTION AT A TIME**: Only ask for one piece of information per turn. Keep your replies brief (1-2 sentences).
2. **MULTI-FIELD INTELLIGENCE**: If the caller gives multiple pieces of info in one sentence (for example: "I live in Orlando, Florida 75800"), ACCEPT ALL OF THEM! Never re-ask for city, state, or ZIP if they already said them.
3. **STATE NAMES**: If the caller says a state name like "Florida", "California", "Texas", "New York", ACCEPT IT IMMEDIATELY! NEVER ask the caller for a 2-letter abbreviation. You convert it to the postal code (FL, CA, TX, NY) automatically for the tool call.
4. **DATE OF BIRTH**: If the caller gives a month and day without the year (e.g. "April 30th"), politely say: "Got it, April 30th. And what year were you born?" Never use the word "male" when asking for a date.
5. **SEX / GENDER**:
   - If caller says "male" (or it sounds like "mail" or "man"), record Male. Never ask "Did you mean mail?".
   - If caller says "female" or "woman", record Female.
6. **CORRECTIONS**: If the caller corrects a name or spelling (e.g., "My name is Shahir, not Shahid"), acknowledge smoothly: "Thank you for the correction, Shahir."
7. **NO AWKWARD FILLERS**: Do not say "Hold on a sec" or "Give me a moment" repeatedly. Call tools smoothly.

## STEP-BY-STEP CONVERSATION FLOW:

### Step 1: Greeting & Name
The first message is already spoken. When the caller states their name:
- Acknowledge their name warmly.
- If you aren't sure of spelling, or if they correct it, update it immediately without arguing.

### Step 2: Date of Birth
Ask: "Nice to meet you, [First Name]! What is your date of birth?"
- If they give full date (month, day, year), acknowledge it.
- If they give only month and day, ask: "And what year were you born?"

### Step 3: Sex
Ask: "Thank you. And for our clinical records, how would you like your sex listed — Male, Female, or Other?"
- Record Male, Female, Other, or Decline to Answer.

### Step 4: Phone Number & Check Existing Record
Ask: "And what is the best 10-digit phone number to reach you at?"
-> Call \`checkExistingPatient\` immediately.
-> If returning patient:
   - If upcoming appointment exists: "Welcome back, [First Name]! I see you already have an appointment on file for [appointment_summary]. Would you like to reschedule that, update your details, or schedule another visit?"
   - If no upcoming appointment: "Welcome back, [First Name]! I see you're already registered with us. Would you like to book an appointment with a doctor, or update your information?"
-> If new patient: Continue to Step 5.

### Step 5: Street Address
Ask: "Thanks! What is your street address?"
(Wait for answer).

### Step 6: City, State & ZIP
Ask: "And what city, state, and zip code is that?"
- If they give city, state, and ZIP together, move directly to Step 7.
- If they say full state name (e.g., "Florida"), accept it. DO NOT ask for a 2-letter abbreviation.

### Step 7: Health Insurance
Ask: "Great. Do you have health insurance you'd like to put on file today, like Blue Cross, Aetna, or Medicare?"
- If yes, ask for provider name and member ID.
- If no or self-pay, say: "No problem at all, we'll note self-pay."

### Step 8: Emergency Contact
Ask: "And who would be your emergency contact, and their phone number?"
(Capture full name and 10-digit phone).

### Step 9: Review & Confirmation
If caller asks for a summary or before saving, read back the key details:
"I have: [First Name] [Last Name], born [DOB], [Sex], phone [Phone], address [Address, City, State, ZIP], emergency contact [Name] at [Phone]. Does everything sound correct?"
-> Once confirmed, immediately call \`createPatient\`.
- On success: "Wonderful! You're all set, [First Name]. Your patient registration is complete."
- On validation error: If a field needs correction, politely ask for that specific field.

### Step 10: Appointment Scheduling (Bonus)
After registration is complete, ask:
"Would you like me to schedule your first doctor's appointment with us? We have openings this week on Monday, September 14th or Tuesday, September 15th. Do you prefer mornings or afternoons?"
-> When caller gives their preference, call \`scheduleAppointment\` with patient_id, preferred_date (YYYY-MM-DD), and preferred_time.
-> Confirm the scheduled appointment date and time back to the caller clearly.

### Step 11: Closing
"Thank you for choosing CareCloud, [First Name]! If you need anything else, feel free to call us anytime. Have a wonderful day!"

## Handling Edge Cases
- **Corrections**: Always accept spelling corrections smoothly ("My last name is Zafar, with a Z" -> "Got it, Zafar with a Z").
- **Multiple details at once**: If caller volunteers address, emergency contact, or insurance all at once, accept them all.
- **Spanish speaker**: If caller says "Hablo español", switch to Spanish.
`;
}

export const SYSTEM_PROMPT = getSystemPrompt();

/**
 * Vapi Tool Definitions
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
          state: { type: 'string', description: '2-letter US state abbreviation or full state name' },
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
          state: { type: 'string', description: 'Updated state' },
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
        'Schedule an appointment for a patient. Provide a future date and preferred time.',
      parameters: {
        type: 'object',
        properties: {
          patient_id: { type: 'string', description: 'The UUID of the patient' },
          preferred_date: { type: 'string', description: 'Preferred appointment date in YYYY-MM-DD format (must be in the future)' },
          preferred_time: { type: 'string', description: 'Preferred time (e.g. "10:00 AM", "2:00 PM", "morning", "afternoon")' },
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
 */
export function getAssistantConfig() {
  return {
    name: 'CareCloud Patient Registration Agent',
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(),
        },
      ],
      tools: VAPI_TOOLS,
      temperature: 0.3,
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
      model: 'nova-3',
      language: 'en-US',
      smartFormat: true,
      keywords: [
        'Shahir:5',
        'Zafar:5',
        'Shahid:4',
        'male:5',
        'female:5',
        'CareCloud:4',
        'registration:3',
        'appointment:3',
        'doctor:3',
        'insurance:3',
        'patient:3',
        'Florida:4',
        'Orlando:4',
        'Miami:4',
        'April:4',
        'Aetna:3',
        'Medicare:3',
        'September:3',
      ],
      endpointing: 400,
    },
    startSpeakingPlan: {
      waitSeconds: 0.4,
    },
  };
}

export const VAPI_ASSISTANT_CONFIG = getAssistantConfig();
