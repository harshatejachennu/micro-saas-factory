# Next.js + Stripe + Cloudflare Tool Template

A starter template for safe, within-bounds micro-tools that process user-uploaded data.

## Default flow
Upload → Preview → Pay (Stripe Payment Link) → Unlock full export.

## Local dev
1) Copy `.env.example` to `.env.local`
2) Set your Stripe Payment Link
3) Install + run:
   - `npm install`
   - `npm run dev`

## Deploy (Cloudflare Pages)
- Framework: Next.js
- Build command: `npm run build`
- Env vars:
  - NEXT_PUBLIC_APP_NAME
  - NEXT_PUBLIC_STRIPE_PAYMENT_LINK

## Note
This template simulates unlock locally. Real payment verification should be done server-side (Worker + webhook) once you’re ready.
