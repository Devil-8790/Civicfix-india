# 🏙️ CivicFix India 🇮🇳

**AI-Powered Municipal Grievance Triage & Contractor Audit System**

CivicFix India is an end-to-end, AI-augmented infrastructure management platform. It empowers citizens to report civic issues effortlessly, automates municipal triage using state-of-the-art AI, and prevents contractor fraud through multi-modal "Before & After" photographic auditing.

Built as a **"Centaur" architecture**, CivicFix acts as a highly efficient middleman between citizens, dispatchers, and field workers.

---

## ✨ Key Features

### 🧠 AI Triage Engine (Google Gemini)

Automatically analyzes citizen photos and descriptions to:

* Categorize the department (e.g., Water Board, Public Works)
* Identify the core issue
* Assign a severity score (1–10)
* Estimate repair costs

### 📱 Omni-Channel Ingestion

Citizens can report issues via:

* Dedicated Web App (supports voice notes & images)
* **WhatsApp** (powered by Twilio)

### 🕵️ AI Fraud Detection

* Compares "Before" and "After" images using multi-modal AI
* Verifies:

  * Work completion authenticity
  * Dimensions accuracy
  * Material usage legitimacy

### 🗺️ The Trinity Ecosystem

#### 👤 Citizen App

* Report issues easily
* Track complaint status

#### 🖥️ Admin Command Center

* View AI triage reports
* Monitor SLA deadlines
* Access Before/After audit reports

#### 👷 Field Worker App

* View assigned tasks
* Navigate via GPS
* Upload repair proof with dimensions

---

## 🛠️ Tech Stack

### Backend

* Python
* FastAPI
* SQLAlchemy
* SQLite (Development)

### AI & Machine Learning

* Google Gemini 2.5 Flash (Multimodal Vision & Text)

### Frontend

* Next.js
* React
* Tailwind CSS
* Lucide Icons

### Integrations

* Twilio (WhatsApp Webhooks)

### Deployment

* Render (Backend)
* Vercel (Frontends)

---

## 🚀 Getting Started (Local Development)

CivicFix India is structured as a **Monorepo** containing:

* Backend API
* Three frontend applications

---

## 🔧 Prerequisites

* Python 3.12+
* Node.js 18+
* Google Gemini API Key

---

## 1️⃣ Backend Setup (FastAPI)

Navigate to the backend directory and install dependencies:

```bash
cd backend
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\\Scripts\\activate

# Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### 🔐 Environment Variables

Create a `.env` file inside the backend folder:

```env
GEMINI_API_KEY=your_google_gemini_key_here
TWILIO_ACCOUNT_SID=your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_token_here
```

### ▶️ Run the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> The backend will automatically create the SQLite database and seed it with prototype field workers on startup.

---

## 2️⃣ Frontend Setup (Next.js)

Run each frontend app in a separate terminal:

```bash
cd admin-app   # or citizen-app / worker-app
npm install
npm run dev
```

> Frontends are pre-configured to use:

```
http://localhost:8000/api/v1
```

---

## 🌐 Deployment

### 🚀 Backend (Render)

* Deploy `backend` folder as a Python 3 Web Service
* Set environment variable:

  ```
  PYTHON_VERSION=3.12
  ```
* Add:

  ```
  GEMINI_API_KEY
  ```

### ⚡ Frontends (Vercel)

* Import repository **3 times** (one per app)
* Set root directory for each app
* Add environment variable:

  ```
  NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1
  ```

---

## 🔄 Architecture Flow

### 1️⃣ Ingest

Citizen sends:

* Image
* Location
  via Web App or WhatsApp

### 2️⃣ Analyze

* FastAPI sends data to Gemini 2.5 Flash
* AI performs contextual analysis

### 3️⃣ Dispatch

* Ticket appears in Admin Dashboard
* Assigned to Field Worker

### 4️⃣ Resolve

* Worker navigates to site
* Fixes issue
* Uploads "After" image + dimensions

### 5️⃣ Audit

* Gemini compares Before vs After
* Verifies work authenticity

### 6️⃣ Report

* Admin Dashboard shows full audit trail
* Closed-loop verification completed

---

## 🤝 Summary

CivicFix India bridges the gap between:

* Citizens
* Government bodies
* Field workers

By combining **AI automation + human execution**, it ensures:

* Faster grievance resolution
* Transparency
* Fraud prevention
