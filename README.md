# 🎓 StudyPal — AI Learning Buddy & Scholarship Platform

> **Project Repository**: [https://github.com/SarthakH0607/studypal](https://github.com/SarthakH0607/studypal)

 
 SITE IS LIVE AT (https://sarthakh0607.github.io/studypal/)

StudyPal is an end-to-end, privacy-focused AI learning companion and educational equity platform designed for students, parents, and educators. It combines multimodal AI tutoring (voice, vision, text), gamified curriculum paths, adaptive exam generation, semantic document search (RAG), and a privacy-first Indian scholarship discovery and eligibility matching engine.

---

## ✨ Key Features

### 1. 🎯 Scholarship & Eligibility Matcher (Privacy-First)
* **Real Government & Private Schemes**: Database of 35+ verified Indian scholarships sourced from the National Scholarship Portal (NSP), state welfare departments (Maharashtra, UP, Bihar, WB, Tamil Nadu, etc.), and private foundations (Reliance Foundation, Tata Trusts Vidyasaarathi, HDFC Parivartan, Aditya Birla, Kotak Kanya).
* **Deterministic Matching Engine**: Evaluates criteria including income ceilings, grade level, stream, state residency, caste categories (General/OBC/SC/ST/EWS), minority status, disability status, gender, and minimum marks percentages.
* **Transparent "Why You Qualify" Insights**: Every match provides explicit explanations of why the student qualifies (e.g. *"Matches: Income below ₹2.5L, SC category, Class 10, Maharashtra"*).
* **"Almost Eligible" Near-Miss Detection**: Highlights schemes that missed by only 1 condition with specific guidance on the exact blocker.
* **Zero-Leakage Privacy Architecture**: Sensitive eligibility criteria (income, caste, disability, minority status) are stored strictly in client-side storage, never sent to the backend, and completely isolated from parent/teacher views.

### 2. 🤖 Multimodal Socratic AI Tutor
* **Voice-First Interactive Tutoring**: Real-time spoken dialogue using automated speech processing and Gemini Neural Text-to-Speech (TTS).
* **Visual Problem Solving & Diagrams**: Analyzes handwritten formulas and textbook diagrams; generates custom step-by-step visual conceptual aids.
* **Socratic Dialogue Mode**: Guides students to answers through hints and thought-provoking questions rather than direct spoon-feeding.

### 3. 📸 Snap & Learn (Homework Problem Solver)
* Direct camera and image upload interface to snap textbook questions, geometry problems, and chemical equations for instantaneous step-by-step explanations.

### 4. 🗺️ Adaptive Curriculum Paths & Gamified Mastery
* Structured prerequisite topic trees across Mathematics, Physics, Chemistry, and Biology from Middle School through University.
* Gamified study streaks, XP reward loops, subject mastery rings, and daily quest logs.

### 5. 📝 Adaptive Practice & Exam Generator
* Dynamic MCQ generator with customizable difficulty levels and question counts.
* Automatic mastery score updates, detailed post-exam analytical scorecards, and knowledge gap diagnostics.

### 6. 📄 Semantic Document Q&A (RAG)
* Upload custom PDFs, class notes, and syllabus documents for localized, vector-indexed semantic retrieval using dense embeddings.

### 7. 👨‍👩‍👧 Linked Parent Portal
* Dedicated parent portal with transparent study recaps, mastery progress rings, student strength areas, and actionable support recommendations.

### 8. 👩‍🏫 Teacher Dashboard & Active Flagging Agent
* Real-time class roster tracking, struggle diagnostics, and automated flagging alerts for students falling behind in specific concepts.

---

## 🛠️ Technology Stack

### **Frontend**
| Technology | Description |
| :--- | :--- |
| **React 19** | Modern UI components and reactive state |
| **Vite** | Blazing-fast build tool and development server |
| **Zustand** | Lightweight global state management |
| **React Router v7** | Client-side routing and protected route wrappers |
| **Lucide Icons** | Consistent, modern icon set |
| **Recharts** | Subject mastery rings and analytics charts |
| **React Hot Toast** | Non-intrusive interactive notifications |
| **Vanilla CSS & Tokens** | Custom design system with soft glassmorphism & pill UI |

### **Backend**
| Technology | Description |
| :--- | :--- |
| **FastAPI** | High-performance Python async web API framework |
| **Uvicorn** | ASGI web server implementation |
| **BAAI/bge-m3** | Multilingual dense embedding model for RAG & semantic search |
| **Google Gemini API** | Multimodal reasoning, Vision analysis, and Neural TTS |
| **Groq Llama-3** | Ultra-low latency chat inference for fast tutoring replies |
| **Supabase** | Cloud PostgreSQL database, Row-Level Security & Authentication |
| **PyTorch & HuggingFace** | Local embedding and transformer pipeline support |

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)
* **Git**

---

### 1. Clone the Repository
```bash
git clone https://github.com/SarthakH0607/studypal.git
cd studypal
```

---

### 2. Backend Setup
```bash
# Navigate to root directory
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit backend/.env and provide your API keys (Supabase, Gemini, Groq)

# Start backend server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend API will run at: `http://localhost:8000`
* Interactive API Documentation (Swagger): `http://localhost:8000/docs`

---

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install npm dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start development server
npm run dev
```
* Frontend Application will be accessible at: `http://localhost:5173`

---

## 📁 Project Structure

```
studypal/
├── backend/
│   ├── middleware/        # Authentication & security middleware
│   ├── routes/            # API Route handlers (Auth, Tutor, Exams, Scholarships, etc.)
│   ├── services/          # AI providers (Gemini, Groq, BGE-M3, RAG, Flagging)
│   ├── supabase/          # Database schemas and migrations
│   ├── config.py          # Environment settings loader
│   ├── main.py            # FastAPI application entrypoint
│   └── requirements.txt   # Python dependency manifest
├── frontend/
│   ├── public/            # Static assets and public images
│   ├── src/
│   │   ├── assets/        # Visual assets and illustrations
│   │   ├── components/    # Reusable UI, Layout, Tutor, and Header components
│   │   ├── hooks/         # Custom React hooks (useAuth, useScholarshipProfile, etc.)
│   │   ├── lib/           # API client, Scholarship Database & Matcher
│   │   ├── pages/         # Page views (Dashboard, Scholarships, Tutor, Exams, etc.)
│   │   ├── store/         # Zustand global state store
│   │   ├── App.jsx        # Route definitions
│   │   └── index.css      # StudyPal design system tokens
│   └── package.json       # Frontend dependencies and scripts
├── .gitignore             # Root git ignore rules
└── README.md              # Project overview and documentation
```

---

## 🔒 Privacy & Data Ethics

* **Confidential Scholarship Profiling**: Caste, minority status, disability status, and family income ranges remain solely on the student's browser device.
* **Child Safety**: AI responses are filtered with educational safety guardrails and Socratic pedagogical prompts.
* **Granular Role Isolation**: Separate, isolated portals for Students, Parents, and Teachers.

---

## 📄 License
This project is open-source and available under the **MIT License**.
