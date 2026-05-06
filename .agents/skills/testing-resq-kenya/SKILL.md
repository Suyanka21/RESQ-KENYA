---
name: testing-resq-kenya
description: Test the RESQ-KENYA Expo + Firebase emergency-services app end-to-end. Use when verifying frontend changes (splash, landing, login, customer tabs, request flows, EmergencySOS FAB) or any change that needs a runtime visual smoke test.
---

# Testing RESQ-KENYA

## What this app is

RESQ-KENYA is an Expo SDK 54 app (entry: `expo-router/entry`) backed by Firebase (Auth phone-OTP, Firestore, RTDB, Functions) and M-Pesa (STK Push). The brand color is **`#FFA500`** (Voltage Orange), defined in `theme/voltage-premium.ts:183` (`interactive.default`). An earlier mistake reintroduced `#FFD60A` (yellow) in some places — when testing, always verify `rgb(255, 165, 0)` is rendered and `rgb(255, 214, 10)` is NOT.

## Devin Secrets Needed

All injected as environment variables (no `.env.local` needed — env vars take precedence):

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_DATABASE_URL`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`

Optional but useful: `GOOGLE_API_KEY`, `GOOGLE_MAPS_API_KEY`, `EXPO_TOKEN`.

M-Pesa keys (`MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`, `MPESA_CALLBACK_URL`) are sandbox-only and only needed for the Cloud Functions emulator, not the web client.

## Boot the web app

```bash
cd /home/ubuntu/repos/RESQ-KENYA
EXPO_PUBLIC_DEMO_MODE=true CI=1 npx expo start --web --port 8081 --no-dev --clear
```

The `EXPO_PUBLIC_DEMO_MODE=true` short-circuits Cloud Functions in `services/customer.service.ts` so request-creation works without the backend. **Note**: the demo-mode default is OFF (CR fix in PR #3) — you must pass it explicitly.

First bundle takes ~40s (2700 modules). Subsequent reloads are fast. Look for `Web Bundled NNNNms node_modules/expo-router/entry.js` in the Metro logs.

Then open `http://localhost:8081/` in Chrome.

## What you can test WITHOUT auth

These surfaces are reachable on a fresh load with no Firebase user:

1. **Splash screen** (`app/index.tsx:14–113`) — orange `#FFA500` background, RESQ logo with bolt, fade-in animation. Visible while `useAuth().isLoading === true`.
2. **LandingPage** (`app/index.tsx:115–229`) — orange `#FFA500` background, RESQ logo, charcoal Get Started CTA, Sign In · Sign Up links. Rendered when `EntryScreen` (line 235) sees `!isLoading && !isAuthenticated`.
3. **Login screen** (`app/(auth)/login.tsx`) — charcoal background, Welcome Back header, Kenya flag + +254 phone input, agreement checkbox, orange Continue CTA (disabled until valid phone + checkbox), Sign Up link. Reachable from LandingPage Sign In.
4. **Register screen** (`app/(auth)/register.tsx`) — same auth-stack pattern.

## What you CAN'T test without an OTP test phone

Login uses Firebase Auth phone-OTP (`app/(auth)/verify-otp.tsx`). Without a Firebase Auth test phone number you cannot reach:

- `/(customer)/*` routes (Home, History, Wallet, Profile, request flows)
- `EmergencySOS` FAB (mounted in `app/(customer)/_layout.tsx:122–124`)
- `RequestFormShell` chrome (`components/request/RequestFormShell.tsx`)
- Customer Home tile colors (Towing `#FFA500`, Battery `#FFCA28`)
- `/(provider)/*` routes
- The provider splash race fix (the actual case Phase 4 addresses)

**To unblock**: in Firebase Console → Authentication → Sign-in method → Phone → "Phone numbers for testing", add e.g. `+254700000000` with code `123456`. Then login with that phone in the app.

## Brand-color audit pattern

Don't eyeball orange-vs-yellow — use `getComputedStyle()` for pixel-deterministic verification. Run this in the Chrome devtools console (or via `computer(action="console", content=...)`):

```js
(() => {
  const allEls = Array.from(document.querySelectorAll('*'));
  const orange = allEls.filter(el => getComputedStyle(el).backgroundColor === 'rgb(255, 165, 0)');
  const wrongYellow = allEls.filter(el => {
    const bg = getComputedStyle(el).backgroundColor;
    const color = getComputedStyle(el).color;
    return bg === 'rgb(255, 214, 10)' || color === 'rgb(255, 214, 10)';
  });
  console.log({ orangeCount: orange.length, wrongYellowCount: wrongYellow.length });
})();
```

Pass criteria:
- LandingPage container: ≥1 element with `rgb(255, 165, 0)` bg.
- Login Continue button (when ENABLED): bg = `rgb(255, 165, 0)`. When disabled it's `rgb(122, 80, 0)` (= `#FFA500 × 0.48`, theme disabled state) — that's expected, not a bug.
- `wrongYellowCount` MUST be 0 on every page.

## Splash race fix verification (auth-resolved branch)

The Phase 4 fix gates splash navigation on `isLoading=false` instead of a fixed 1.5s timer (`app/index.tsx:52–88`). The unauth branch can be verified end-to-end without OTP:

1. Hard-refresh `http://localhost:8081/` (Ctrl+Shift+R).
2. Observe: orange splash → orange LandingPage. URL stays at `/`.
3. Pass: LandingPage with Get Started CTA renders. URL is `/` (NOT `/login`).
4. Fail: page jumps directly to `/login` (charcoal background) without showing LandingPage — means the splash's 1.5s `router.replace('/(auth)/login')` fired before EntryScreen unmounted it.

The authenticated-provider branch (the real fix target) needs an OTP test phone.

## Recording

Maximize the browser before recording so the full app is visible:

```bash
sudo apt-get install -y wmctrl 2>/dev/null; wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
```

Do NOT use `xdotool key super+Up` — that tiles to half-screen on the default Ubuntu window manager.

## What's already covered by unit tests (skip in runtime testing)

1,136 tests / 54 suites at HEAD cover:

- All `functions/src/shared/*` pure helpers (api.ts validators, crypto.ts HMAC, phone.ts, status.ts, wallet.ts ledger math).
- `customer-demo-mode.test.ts` regression suite (locks in default-OFF).
- `mpesa-helpers.test.ts`, `wallet-helpers.test.ts`.
- `use-step-flow.test.ts` for RequestFormShell logic.
- `tracking-lifecycle.test.ts` for Firestore → RTDB sync.

Don't re-run unit tests as part of an end-to-end runtime smoke test — focus on what changed visually.

## Out of scope for runtime testing

These need real Safaricom sandbox HTTP roundtrips (not just sandbox keys — actually getting a callback POST through to the emulator). They are NOT testable from `expo start --web`:

- M-Pesa STK push idempotency
- HMAC callback verification
- Atomic payment txns
- `resetDailyEarnings` paginated cron
- RTDB tracking transaction

Unit-tested only.
