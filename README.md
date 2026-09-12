# CareCloud Voice AI Agent — Patient Registration & Clinical Portal

A production-ready **Voice AI Telephony & Patient Intake System** designed for the CareCloud technical assessment. The system conducts conversational intake with patients over a live U.S. telephone line, captures all 17 required demographic and insurance fields, performs duplicate detection, persists records into MongoDB Atlas, and provides an ultra-premium Web Dashboard for clinical staff.

---

## 🚀 Live Demo & Submission Details

* **GitHub Repository**: [https://github.com/shaheerzafarr/carecloud-voiceagent](https://github.com/shaheerzafarr/carecloud-voiceagent)
* **Inbound Phone Number**: **`+1 (571) 386-0275`** *(Dialable U.S. line, powered by Deepgram Nova-3 + GPT-4o-mini)*
* **Live Clinical Web Portal**: [https://carecloud-voiceagent-yzij.onrender.com/](https://carecloud-voiceagent-yzij.onrender.com/)
* **Server-Rendered Dashboard**: [https://carecloud-voiceagent-yzij.onrender.com/dashboard](https://carecloud-voiceagent-yzij.onrender.com/dashboard)
* **REST API Base URL**: `https://carecloud-voiceagent-yzij.onrender.com/api/v1`
* **Interactive Swagger Docs**: [https://carecloud-voiceagent-yzij.onrender.com/docs](https://carecloud-voiceagent-yzij.onrender.com/docs)
* **Testing Notes**: No login credentials required. Dialing the phone number immediately initiates registration. Calling back from the same number triggers duplicate detection and returning caller flow.

---

## 🏗️ Repository Architecture

The project is cleanly decoupled into two focused directories:

```text
carecloud-voiceagent/
├── backend/                           # NestJS REST API & Voice Agent Engine
│   ├── env/
│   │   ├── .env.development           # Clean minimal dev credentials
│   │   ├── .env.production            # Production environment template
│   │   └── .env.test                  # Automated test environment
│   ├── src/
│   │   ├── resources/
│   │   │   ├── patients/              # All 17 demographic fields, CRUD, duplicate detection
│   │   │   ├── appointments/          # Appointment scheduling & patient linkage
│   │   │   ├── call-logs/             # Transcripts & call session recordings
│   │   │   ├── dashboard/             # REST aggregate endpoints & legacy EJS views
│   │   │   └── vapi/                  # Vapi webhook dispatcher & tool call execution
│   │   ├── seeds/                     # Automated patient seeder (John Smith, Carlos, Emily)
│   │   └── main.ts                    # NestJS bootstrapper, CORS, dual-routing middleware
│   └── test/                          # Comprehensive Jest E2E integration test suite
│
├── frontend/                          # Standalone Modern Clinical Web Dashboard
│   ├── index.html                     # Semantic HTML5 clinical portal layout
│   ├── vite.config.js                 # Reverse proxy mapping /api & /patients to backend
│   ├── package.json                   # Vite dev server & production bundler
│   └── src/
│       ├── style.css                  # Glassmorphism dark medical theme & micro-animations
│       └── app.js                     # Live search, filters, slide-over drawer, modals
│
└── README.md                          # Architecture & setup guide
```

---

## ⚙️ Minimal Environment Configuration

All unnecessary third-party keys (AWS, Stripe, SMTP, JWT) have been removed. Only the variables needed for this assessment are kept:

Inside `backend/env/.env.development`:

```env
PORT=5006
API_PREFIX=api/v1
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/carecloud-voiceagent?retryWrites=true&w=majority
MONGODB_PASSWORD=your_atlas_db_password
VAPI_API_KEY=your_vapi_private_api_key
VAPI_ASSISTANT_ID=your_vapi_assistant_uuid
GEMINI_API_KEY=your_gemini_api_key
WEB_HOSTED_URL=http://localhost:5006
API_HOSTED_URL=http://localhost:5006
```

---

## 🏃 Quick Start Guide

### 1. Run the Backend API

```bash
cd backend
npm install
npm run seed        # Seeds active test patients
npm run start:dev   # Runs NestJS on http://localhost:5006
```

- **Swagger Documentation**: [http://localhost:5006/docs](http://localhost:5006/docs)
- **Direct Patients API**: [http://localhost:5006/api/v1/patients](http://localhost:5006/api/v1/patients)
- **Dashboard Stats**: [http://localhost:5006/dashboard/stats](http://localhost:5006/dashboard/stats)

### 2. Run the Standalone Frontend Dashboard

```bash
cd frontend
npm install
npm run dev         # Launches Vite dashboard on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Live Search & Filter**: Search patients in real time by name, phone, or email.
- **Slide-Over Chart Drawer**: Click any patient row to open a full clinical chart displaying all 17 demographic fields, scheduled appointments, and voice call transcripts.
- **Register Patient Modal**: Manually test patient creation with instant validation and duplicate phone detection.
- **Schedule Appointment**: Link appointments to patient UUIDs directly from the dashboard.

---

## 🧪 Automated Testing

The backend includes a comprehensive end-to-end integration test suite verifying every requirement:

```bash
cd backend
npm run test:e2e
```

**What the tests verify:**
- `GET /api/v1/patients`: Verifies `{ data, total, error: null }` envelope structure.
- `POST /api/v1/patients` (Validation): Verifies missing fields return `400 Bad Request`.
- `POST /api/v1/patients` (Success): Registers a patient with all 17 demographic fields.
- `POST /api/v1/patients` (Duplicate Detection): Rejects registration with duplicate phone number with `409 Conflict`.
- `GET /api/v1/patients/:id`: Retrieves patient by UUID.
- `GET /api/v1/patients/:id` (404): Returns `404 Not Found` for non-existent IDs.
- `PUT /api/v1/patients/:id`: Updates fields partially.
- `DELETE /api/v1/patients/:id` (Soft Delete): Sets `deleted_at` timestamp and excludes patient from active lists.
- `POST /api/v1/vapi/webhook`: Verifies voice agent tool call execution (`checkExistingPatient`).

---

## 📞 Voice Agent Telephony Specs

- **Inbound US Phone Number**: Configured via Vapi.ai with Twilio carrier integration (`+1 (571) 386-0275`).
- **LLM Reasoning**: OpenAI GPT-4o-mini via Vapi orchestrator.
- **Transcriber**: Deepgram Nova-3 with custom acoustic keyword boosting.
  1. `checkExistingPatient(phone_number)`: Queries Atlas database by caller ID. If found, retrieves name and existing records.
  2. `registerPatient(...)`: Collects all 17 demographic fields and creates new patient record with conflict checks.
  3. `scheduleAppointment(...)`: Schedules appointments linked to the patient record.