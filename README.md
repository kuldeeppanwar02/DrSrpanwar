# Panwar Clinic PWA Prototype

Hindi-first Next.js prototype for:

- appointment booking
- walk-in token generation
- patient queue status
- staff dashboard
- live waiting room TV screen
- offline-first PWA behavior for low-connectivity areas like Jaisalmer

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current architecture

This prototype now follows a cleaner 4-layer structure:

1. `src/app`
   Routes and page-level rendering only
2. `src/features/clinic/state`
   Global context for clinic session, queue state, refresh, and sync actions
3. `src/features/clinic/services`
   Business rules for token generation, queue movement, optimistic offline sync, and persistence orchestration
4. `src/services/api.ts`
   Dedicated Axios client with request/response interceptors for future backend integration

## Offline-first behavior

- IndexedDB is the primary browser persistence layer.
- If IndexedDB is unavailable, the prototype falls back to localStorage.
- Offline bookings and walk-ins get provisional tokens like `TEMP-001`.
- When internet returns, pending entries are auto-synced and replaced with final `A-###` or `T-###` tokens.
- The live TV page uses polling every 5 seconds instead of websocket-only behavior.

## Demo routes

- `/` Home + authority positioning
- `/book` Appointment booking
- `/walkin` Walk-in token
- `/status` Patient queue status
- `/staff` Staff dashboard
- `/live` Waiting room TV page
- `/offline` Offline fallback page

## Demo staff access

- Staff code: `2026`
- Session auto-expires after 15 minutes of inactivity

## Environment variables

Copy `.env.example` to `.env.local` if needed.

- `NEXT_PUBLIC_CLINIC_NAME`
  Clinic display name
- `NEXT_PUBLIC_API_BASE_URL`
  Future backend URL for queue sync and auth APIs

If `NEXT_PUBLIC_API_BASE_URL` is empty, sync stays local-only in prototype mode.

## Production path

Recommended next backend phase:

- Supabase Postgres for queue + bookings
- Row Level Security for patient-safe data access
- JWT-based auth for doctor/staff
- server-side token finalization to prevent collisions across devices
- blacklist/rotation strategy at backend or auth provider layer for secure logout

This prototype intentionally does not fake backend security features that require a real server.
