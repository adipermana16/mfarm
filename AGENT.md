# AGENT.md

## Project Overview

- `mfarm` is an Expo/React Native app for SmartDrip irrigation monitoring and scheduling.
- The actual app entrypoint is `expo-router` via `app/`.
- Most screen logic still lives in `src/screens/*`, and the files in `app/` are mostly thin route wrappers.
- The app talks to a separate Flask backend expected at `../backend` and exposed on port `5000`.

## Architecture

- `app/_layout.tsx` sets up the root stack, splash flow, and `AppPreferencesProvider`.
- `app/(tabs)/*` defines the file-based tab routes, but delegates rendering to `src/screens/*`.
- `src/context/AppPreferencesContext.tsx` owns theme mode and profile loading/saving.
- `src/services/api.js` centralizes API base URL resolution and all backend requests.
- `src/styles/globalStyles.js` contains the shared color/type/style tokens used across legacy screens.
- `src/components/*` and `src/components/dashboard/*` contain reusable UI pieces.

## API Behavior

- Preferred backend base URL comes from `EXPO_PUBLIC_API_BASE_URL`.
- If that env var is absent, `src/services/api.js` derives the host from the Expo runtime and falls back to:
- Android emulator: `10.0.2.2`
- Other platforms: `127.0.0.1`
- Default API root is `http://<host>:5000/api/drip`.
- If `EXPO_PUBLIC_API_BASE_URL` is set to just the host or to `.../api`, `src/services/api.js` normalizes it to `.../api/drip`.

## Common Commands

- Install dependencies: `npm install`
- Start Expo: `npm start`
- Start Expo for Android: `npm run android`
- Start Expo for iOS: `npm run ios`
- Start Expo for web: `npm run web`
- Run lint: `npm run lint`
- Start backend + frontend together: `npm run dev`

## Backend Assumptions

- `scripts/run_dev.py` starts:
- Flask backend from `../backend/app.py`
- Expo frontend from this repo root
- README documents these main endpoints:
- `GET /api/drip/health`
- `GET /api/drip/farm-summary`
- `GET /api/drip/iot/readings`
- `POST /api/drip/iot/readings`
- `GET /api/drip/schedules`
- `POST /api/drip/schedules`
- `PATCH /api/drip/schedules/<id>`
- `GET /api/drip/history`
- `GET /api/drip/profile`
- `PUT /api/drip/profile`

## Conventions For Future Changes

- Treat `app/` as the routing layer and `src/screens/` as the current feature implementation layer unless doing a deliberate migration.
- Reuse `src/services/api.js` for all backend communication instead of adding ad hoc `fetch` calls inside screens.
- Reuse `AppPreferencesContext` for profile/theme state instead of duplicating global state.
- Preserve the existing Indonesian product copy unless the task explicitly changes language.
- Keep styling aligned with `globalStyles` and the current visual language instead of introducing a second design system.
- Prefer updating the existing JS/TS mix in place rather than forcing broad TypeScript conversions.

## Known Project State

- The repo is mid-transition: Expo Router and TypeScript are in place, but several core screens/components are still JavaScript.
- `tsconfig.json` enables strict mode and defines the `@/*` alias.
- ESLint uses `eslint-config-expo`.
- There is no dedicated automated test suite configured in `package.json` right now.
- `package.json` includes a Windows-style `backend` script (`python ..\\backend\\app.py`), while `scripts/run_dev.py` is cross-platform on Unix-like systems.

## Practical Guidance For Agents

- Before moving files, check whether the active route is imported from `app/` or directly used from `src/`.
- When changing API behavior, verify both the env-var override path and the Expo host auto-detection path.
- When editing theme-sensitive UI, inspect both `globalStyles` and `AppPreferencesContext` theme colors.
- If a task mentions navigation, inspect both the route file under `app/` and the backing screen under `src/screens/`.
