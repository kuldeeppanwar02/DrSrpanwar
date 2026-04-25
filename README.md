# Panwar SmartCare Hub

Hindi-first multi-clinic Next.js PWA for:

- Dr. Satta Ram Panwar Clinic
- Dhandev Dental Clinic
- Associated Pharmacy

It includes:

- appointment booking
- QR walk-in token generation
- patient queue status by mobile number
- staff dashboard with next / hold / skip / reschedule
- live waiting-room screen
- offline-safe provisional entries with local sync retry

## Tech Stack

- Next.js 16 App Router
- Tailwind CSS 4
- Firebase Authentication (staff login)
- Firebase Firestore via server-side Admin SDK routes
- IndexedDB/localStorage fallback for offline-safe patient flows

## Routes

- `/` home portal
- `/book?clinic=surgery|dental|pharmacy`
- `/walkin?clinic=surgery|dental|pharmacy`
- `/status?clinic=surgery|dental|pharmacy`
- `/staff?clinic=surgery|dental|pharmacy`
- `/live?clinic=surgery|dental|pharmacy`
- `/offline`

## Local Run

```bash
npm install
npm run dev
```

## Required Environment Variables

Copy `.env.example` to `.env.local` for local testing.

Public Firebase web config:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_APP_BASE_URL`

Server-only values:

- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `STAFF_ALLOWED_EMAILS`

## Manual Firebase Setup

Follow these steps in order. Yehi woh manual work hai jo aapko karna padega:

1. Firebase console mein naya project banao.
2. `Build > Authentication > Sign-in method` mein `Email/Password` enable karo.
3. `Authentication > Users` mein staff users manually add karo.
4. `Build > Firestore Database` mein database create karo.
5. Firestore rules ko client-side access ke liye lock kar do, because app database ko server API routes se use karta hai:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. `Project settings > General` mein web app add karo aur Firebase web config copy karo.
7. `Project settings > Service accounts` se service account JSON generate karo.
8. `Authentication > Settings > Authorized domains` mein apna Vercel domain add karo.

## Manual Vercel Setup

Vercel project mein ye env vars add karo:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_APP_BASE_URL`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `STAFF_ALLOWED_EMAILS`

Notes:

- `NEXT_PUBLIC_APP_BASE_URL` mein final deployed URL dalo, for example `https://dr-srpanwar.vercel.app`
- `FIREBASE_SERVICE_ACCOUNT_JSON` mein poora JSON paste karo
- `STAFF_ALLOWED_EMAILS` comma-separated list honi chahiye

## First Live Test Checklist

1. Home page open karo.
2. `?clinic=surgery`, `?clinic=dental`, `?clinic=pharmacy` teenon flows check karo.
3. Booking create karo aur status page se mobile number search karo.
4. Walk-in token generate karo.
5. Staff login karo.
6. `Next Token Call करें` click karke `/live` screen verify karo.
7. Internet off karke provisional booking / walk-in test karo.
8. Internet on karke sync verify karo.

## Current Architecture

1. `src/app`
   Routes and route handlers
2. `src/features/clinic/state`
   Client provider for clinic state, refresh, and offline/online transitions
3. `src/features/clinic/services`
   Queue engine and client orchestration
4. `src/lib/firebase`
   Firebase client/admin setup, staff auth verification, Firestore queue store
5. `src/services/api.ts`
   Axios client with bearer-token forwarding for staff actions

## Notes

- Public patient actions use same-origin API routes.
- Staff actions require Firebase ID token verification on the server.
- If Firebase env vars are missing, patient-side local fallback still works for prototype-style testing.
