This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Project

A social football score-prediction app (Turkish Süper Lig first, friend rooms, national ranking). It is NOT a betting app: no money, prizes, coupons or odds, and those words must not appear in the UI. Read `docs/ARCHITECTURE.md` for decisions and `docs/ROADMAP.md` for the current phase and open items before starting work.

## How to work with the owner

- Work proceeds in phases (FAZ 0–20, see `docs/ROADMAP.md`). Finish one phase, update the roadmap, then ask "FAZ N tamamlandı. FAZ N+1'e geçelim mi?" and wait for approval. Do not add features outside the MVP list.
- The owner is not an advanced developer and works on Windows + VS Code with an iPhone. Reply in Turkish. Give terminal commands one at a time, full file paths, and explain errors in plain language.
- Recommend instead of asking "what should we do?". Research instead of assuming on security, money, legal, store policy, API terms and user data.
- The owner runs git themselves to learn it: after each phase give `git add`, `git commit` (meaningful `feat:` / `fix:` message) and `git push` as commands.
- Fix a reported bug before building anything new.

## Project rules

- Security lives in the database, never only in the app: predictions are written through a server-side function that checks server time; users cannot write points, matches or rankings.
- The app only talks to Supabase. The football API key and the Supabase secret key exist only in Edge Functions.
- Every schema change is a numbered SQL file in `supabase/migrations/`.
- Colors come from the tokens in `src/global.css`; do not hardcode hex values in screens.
- NativeWind: never toggle `shadow-*` or `opacity-*` through a conditional `className` (use inline `style`), and never combine `contentContainerClassName` with `contentContainerStyle` on one `ScrollView`.
- Tab screens stay mounted across logout/login: clear cached server data on sign-out.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
