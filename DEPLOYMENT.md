# Deployment Guide: Chinna's Chess on Vercel

"Chinna's Chess" is a static-ready, client-side web application built with React, Expo web, and Supabase Realtime. It has zero server-side state requirements and connects directly to your Supabase project.

---

## 1. Local Development Setup

1. Copy `.env.local` or edit it with your real credentials from [Supabase Dashboard](https://supabase.com):
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

---

## 2. Deploying to Vercel

### Option A: Direct Git Integration (Recommended)
1. Push your repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com/new), select **Import Project** and choose your repository.
3. Configure **Project Settings**:
   - **Framework Preset**: `Vite` (or `Other`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the **Environment Variables** in Vercel (`Settings` -> `Environment Variables`):
   - `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase URL (e.g., `https://xyz.supabase.co`)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon public key
5. Click **Deploy**. Vercel will build the static bundle and assign a production URL.

### Option B: Deploying via Vercel CLI
If you want to deploy directly from your terminal:
```bash
# 1. Build the production static distribution
npm run build

# 2. Deploy the generated dist directory to Vercel Production
npx vercel --prod dist
```

---

## 3. Expo Web Static Export (Alternative)
If building via standard Expo CLI:
```bash
npx expo export -p web
# Generates dist directory with static HTML, CSS, and JS bundles
```
All variables starting with `EXPO_PUBLIC_` will be inlined into the client bundle at build time.
