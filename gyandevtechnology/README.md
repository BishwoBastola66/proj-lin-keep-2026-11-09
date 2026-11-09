# Gyanav Solutions

Premier Enterprise IT Consulting & Healthcare Technology Advisory Web Application.

## Technology Stack

- **Framework:** Next.js 16 (App Router with Turbopack)
- **Runtime:** Node.js 20+ (Universal Node.js / Linux / Docker compatible)
- **Database & Auth:** Supabase PostgreSQL with strict Row Level Security (RLS) and Supabase Auth
- **Security:** Content Security Policy, HSTS, X-Frame-Options, in-memory IP sliding-window rate limiting, database flood protection triggers
- **Typography & Styling:** Plus Jakarta Sans (`next/font/google`), Tailwind CSS, Vanilla CSS design tokens

## Getting Started

### 1. Environment Setup

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Production Build & Deployment

This application is infrastructure-agnostic and runs in any standard environment supporting Node.js.

### Option A: Standard Node.js Server / Linux VM

```bash
npm run build
npm run start
```

### Option B: Container / Docker

The app uses standard Next.js server execution (`next start`) with standalone compatibility. Build and run via Docker with Node.js 20+ base image.

### Option C: Any Cloud Platform (AWS, GCP Cloud Run, Fly.io, Vercel, DigitalOcean)

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables on your target hosting platform and run the standard build command `npm run build`.

