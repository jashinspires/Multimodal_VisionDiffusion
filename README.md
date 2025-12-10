# 🎨 VisionDiffusion

> A full-stack application for AI-powered image analysis and generation

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)

---

## ✨ What is this?

VisionDiffusion is something I built to explore multimodal AI capabilities — basically, teaching computers to "see" images and create new ones from text. It combines image analysis (captioning, visual Q&A, OCR) with image generation (text-to-image, variations) in one clean interface.

The stack is pretty straightforward:
- **Frontend**: Next.js with a minimal black/white glassmorphism UI
- **Backend**: FastAPI handling all the AI orchestration
- **Database & Storage**: Supabase for persisting results and storing uploaded images
- **AI Services**: Groq (for vision tasks) and Pollinations (for image generation)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                            │
│                     (localhost:4000)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Upload    │  │   Display   │  │   State Management      │  │
│  │   Images    │  │   Results   │  │   (React Hooks)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                             │
│                     (localhost:8000)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ AIService   │  │ DBService   │  │ StorageService          │  │
│  │ (Groq API)  │  │ (Supabase)  │  │ (Supabase Storage)      │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                └──────────┬──────────┘
┌─────────────────┐                   ▼
│  External APIs  │        ┌─────────────────────┐
│  • Groq         │        │      Supabase       │
│  • Pollinations │        │  (Postgres + S3)    │
└─────────────────┘        └─────────────────────┘
```

The flow is simple: user uploads an image or enters a prompt → frontend sends it to the backend → backend calls the appropriate AI service → stores the result → returns it to the user. Nothing fancy, just clean separation of concerns.

---

## 🚀 Getting Started

### Prerequisites

Before diving in, make sure you have:

- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **A Groq account** — for the free vision API ([console.groq.com](https://console.groq.com))
- **A Supabase project** — for database and storage ([supabase.com](https://supabase.com))

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/jashinspires/Multimodal_VisionDiffusion.git
cd Multimodal_VisionDiffusion
```

---

### Step 2: Backend Setup

Navigate to the backend folder and create a virtual environment:

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Now create a `.env` file in the `backend` folder (you can copy from `.env.example`):

```bash
cp .env.example .env
```

Then fill in your keys:

```env
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

<details>
<summary>📝 Where to find these keys?</summary>

**Groq API Key:**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new key and copy it

**Supabase Keys:**
1. Go to your Supabase project dashboard
2. Click on Settings → API
3. Copy the `URL` and `anon/public` key

</details>

---

### Step 3: Database Setup

Head over to your Supabase dashboard, open the SQL Editor, and run the schema:

```sql
CREATE TABLE IF NOT EXISTS analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('caption', 'vqa', 'ocr')),
    result TEXT NOT NULL,
    prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    generation_type TEXT NOT NULL CHECK (generation_type IN ('text-to-image', 'variation')),
    prompt TEXT NOT NULL,
    result_url TEXT NOT NULL,
    source_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
```

Also create a storage bucket:
1. Go to Storage in Supabase
2. Create a new bucket called `images`
3. Set it to public (for demo purposes)

---

### Step 4: Frontend Setup

Open a new terminal and navigate to the frontend:

```bash
cd frontend

# Install dependencies
npm install
```

Create a `.env.local` file in the `frontend` folder (you can copy from `.env.example`):

```bash
cp .env.example .env.local
```

The file should contain:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### Step 5: Run Everything

You'll need two terminals running:

**Terminal 1 — Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev -- -p 4000
```

Now open [http://localhost:4000](http://localhost:4000) and you're good to go! 🎉

---

## 📡 API Reference

The backend exposes a simple REST API. Here's what you can do:

### Image Analysis

#### Caption an Image
```bash
curl -X POST http://localhost:8000/api/analyze/caption \
  -F "file=@your-image.jpg"
```

Response:
```json
{
  "success": true,
  "caption": "A golden retriever playing fetch in a sunny park...",
  "image_url": "https://...",
  "id": "uuid"
}
```

#### Visual Q&A
```bash
curl -X POST http://localhost:8000/api/analyze/vqa \
  -F "file=@your-image.jpg" \
  -F "question=What color is the car?"
```

Response:
```json
{
  "success": true,
  "question": "What color is the car?",
  "answer": "The car is red.",
  "image_url": "https://...",
  "id": "uuid"
}
```

#### OCR / Text Extraction
```bash
curl -X POST http://localhost:8000/api/analyze/ocr \
  -F "file=@screenshot.png"
```

Response:
```json
{
  "success": true,
  "extracted_text": "Hello World\nWelcome to VisionDiffusion",
  "image_url": "https://...",
  "id": "uuid"
}
```

---

### Image Generation

#### Text to Image
```bash
curl -X POST http://localhost:8000/api/generate/text-to-image \
  -F "prompt=A cyberpunk city at night with neon lights"
```

Response:
```json
{
  "success": true,
  "prompt": "A cyberpunk city at night with neon lights",
  "image_url": "https://image.pollinations.ai/prompt/...",
  "id": "uuid"
}
```

#### Image Variation
```bash
curl -X POST http://localhost:8000/api/generate/variation \
  -F "file=@original-image.jpg"
```

Response:
```json
{
  "success": true,
  "original_url": "https://...",
  "variation_url": "https://image.pollinations.ai/prompt/...",
  "id": "uuid"
}
```

---

## 🔧 Configuration Notes

### Switching AI Providers

The codebase is designed to make provider swaps easy. All AI logic lives in `backend/services/ai_service.py`. If you want to switch from Groq to OpenAI, for example, you'd only need to modify that one file.

### Running Without Supabase

If you don't want to set up Supabase, that's fine — the app gracefully degrades. You'll see a warning in the console, but everything still works. Results just won't be persisted.

### Production Considerations

This is a demo project. For production, you'd want to:
- Add proper authentication
- Implement rate limiting
- Use a CDN for generated images
- Add caching to reduce API calls
- Switch to higher-quality paid models

---

## 📁 Project Structure

```
Multimodal_VisionDiffusion/
├── backend/
│   ├── main.py              # FastAPI app & routes
│   ├── requirements.txt     # Python dependencies
│   ├── schema.sql           # Database schema
│   └── services/
│       ├── ai_service.py    # Groq & Pollinations integration
│       ├── database.py      # Supabase database ops
│       └── storage.py       # Supabase storage ops
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx     # Main page with tabs
│   │   │   ├── layout.tsx   # Root layout
│   │   │   └── globals.css  # Glassmorphism styles
│   │   └── components/
│   │       ├── ImageAnalysis.tsx    # Analysis UI
│   │       └── ImageGeneration.tsx  # Generation UI
│   ├── package.json
│   └── .env.local
│
└── README.md
```

---

## 🤝 Contributing

Found a bug? Have an idea? Feel free to open an issue or submit a PR. This is a learning project, so I'm open to suggestions.

---

## 📄 License

MIT — do whatever you want with it.

---

<p align="center">
  <sub>Built with ☕ and curiosity</sub>
</p>
