# CareCloud Voice AI Agent — Patient Registration System

A production-grade **Voice AI Agent** built for CareCloud's technical assessment. The system collects U.S. patient demographic information through natural telephone conversation, persists structured data to MongoDB Atlas, and exposes the records via a NestJS REST API and a real-time server-rendered Web Dashboard.

---

## 🚀 Key Features

- **Telephony & Voice AI Integration**: Powered by [Vapi.ai](https://vapi.ai) with a real U.S. phone number.
- **Natural Conversational Flow**: Powered by **Google Gemini 1.5 Flash** (completely free tier) acting as an empathetic patient intake coordinator.
- **Full Patient Demographic Model**: Stores all 17 standard fields required by CareCloud (First Name, Middle Name, Last Name, DOB, Sex, Phone, Email, Address 1 & 2, City, State, Zip, Emergency Contact Name, Relationship, Phone, Insurance Provider, Policy #).
- **Duplication & Validation Safeguards**: Detects existing patients by phone number, validates names, DOBs, ZIP codes, and state abbreviations.
- **RESTful API**: Full CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE`) with query filters (`last_name`, `date_of_birth`, `phone_number`).
- **Live Patient Dashboard**: Built with EJS templates & modern dark CSS styling for real-time monitoring of registered patients.
- **Bonus Features Included**:
  - **Appointment Scheduling Tool**: Voice agent can schedule appointments during the same call.
  - **Call Transcripts & Audio Recordings**: Full transcript and call metrics saved per patient.
  - **1-Click Vapi Provisioning Script**: Automated tool definition and prompt deployment to Vapi.

---

## 🛠️ Architecture & Tech Stack

| Component | Technology | Cost Tier |
|---|---|---|
| **Telephony & Voice Orchestration** | Vapi.ai | Free ($10 free trial credits included) |
| **LLM Reasoning Engine** | Google Gemini 1.5 Flash | Free (Google AI Studio key) |
| **Backend Framework** | NestJS (Node.js) | Open Source |
| **Database** | MongoDB Atlas | Free (M0 Shared Cluster) |
| **Web Dashboard** | Express + EJS Views + Vanilla CSS | Open Source |
| **Deployment / Hosting** | Render / Docker | Free Tier |

---

## 📁 Repository Structure

```text
carecloud-voiceagent/
├── backend/
│   ├── src/
│   │   ├── main.ts                    # NestJS entry point & view engine setup
│   │   ├── app.module.ts              # Root application module
│   │   ├── resources/
│   │   │   ├── patients/              # Patient Entity, DTOs, Repository, Service, Controller
│   │   │   ├── vapi/                  # Vapi webhook handler, system prompt & tool specs
│   │   │   ├── call-logs/             # Transcripts & call history repository
│   │   │   ├── appointments/          # Appointment scheduling resource
│   │   │   └── dashboard/             # EJS Dashboard controller & routing
│   │   └── seeds/                     # Database seeders (Admin, Roles, Patients)
│   ├── views/                         # Server-rendered EJS templates (layout, dashboard, detail)
│   ├── public/css/                    # Custom CSS styling (dark mode, dynamic animations)
│   ├── scripts/setup-vapi.ts          # Script to provision Vapi Voice Assistant
│   └── Dockerfile                     # Production container spec
├── render.yaml                        # Render 1-click deployment blueprint
└── README.md                          # Comprehensive documentation
```

---

## ⚙️ Environment Configuration

Create a `.env.development` file inside `backend/env/`:

```env
PORT=5006
API_PREFIX=api/v1
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/carecloud-voiceagent
VAPI_API_KEY=your_vapi_private_api_key
GEMINI_API_KEY=your_google_ai_studio_gemini_key
WEB_HOSTED_URL=http://localhost:5006
```

---

## 🏃 Local Setup & Running

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Seed Database
Populate sample data for immediate dashboard viewing:
```bash
npm run seed
```

### 3. Start Development Server
```bash
npm run start:dev
```
Access points:
- **Dashboard**: [http://localhost:5006/dashboard](http://localhost:5006/dashboard)
- **API Base**: [http://localhost:5006/api/v1/patients](http://localhost:5006/api/v1/patients)
- **Swagger Docs**: [http://localhost:5006/docs](http://localhost:5006/docs)

---

## 📞 Vapi Setup Guide (Connecting Phone Number)

1. **Sign Up on Vapi**: Go to [vapi.ai](https://vapi.ai) and sign up (gives $10 free credits).
2. **Buy a Phone Number**: In Vapi Dashboard -> **Phone Numbers** -> **Buy Phone Number** (Select US Number).
3. **Provision Assistant**: Run the automated setup script to deploy the prompt and function tools:
   ```bash
   export VAPI_API_KEY="your-vapi-api-key"
   npm run setup:vapi https://your-app.railway.app
   ```
4. **Assign Assistant**: In Vapi Dashboard -> Phone Numbers -> Select your US phone number -> Set **Assistant** to the newly provisioned assistant.

---

## 📡 REST API Documentation

### **Patients Endpoints** (`/api/v1/patients`)

- **`GET /api/v1/patients`**: List all patients.
  - Query parameters: `?last_name=Smith&date_of_birth=1985-06-15&phone_number=%2B15551234567`
- **`GET /api/v1/patients/:id`**: Get single patient by ID or UUID.
- **`POST /api/v1/patients`**: Create a new patient record manually.
- **`PUT /api/v1/patients/:id`**: Update existing patient fields.
- **`DELETE /api/v1/patients/:id`**: Soft-delete a patient.

### **Vapi Webhook Endpoint** (`/api/v1/vapi/webhook`)

- **`POST /api/v1/vapi/webhook`**: Endpoint called by Vapi for tool calls (`register_patient`, `check_existing_patient`, `schedule_appointment`) and end-of-call transcript logging.

---

## 🚢 Deployment (Render & Docker)

### Render (Blueprint)
1. Push this repository to GitHub.
2. Log into [Render.com](https://render.com) -> New -> **Blueprint**.
3. Connect your repository (`carecloud-voiceagent`).
4. Fill in `MONGODB_URI` environment variable when prompted.
5. Click **Deploy**.

---

## 🧪 Testing

Run automated end-to-end integration tests:
```bash
npm run test:e2e
```