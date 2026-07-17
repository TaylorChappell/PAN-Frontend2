# PAN Frontend

Production React/Vite frontend for PAN, connected by default to:

```text
https://pan-backend-production-8d86.up.railway.app
```

## Included pages

- Email/password and Google sign-in
- Account creation with password validation
- Six-digit email verification, resend cooldown and change-email action
- Password reset request and reset-link handling
- Chat-style coin project workspace with project history
- Live coin details, image generation and launch review
- Post-launch coin stats and creator fee claiming
- Full-stack website builder with preview, code browser, ZIP and GitHub export
- Per-site backend environment variable management
- Credits, payment intents, two account wallets and ETH withdrawal
- Connected Ethereum wallet signing
- AI performance and terminal settings
- Three-open-ticket support system
- Administrator overview, user credit controls, tickets and operations

## Run locally

Requires Node.js 24.

```bash
npm ci
npm run dev
```

Create `.env` only when overriding the default backend:

```env
VITE_API_BASE_URL=https://pan-backend-production-8d86.up.railway.app
```

## Production checks

```bash
npm run check
npm run build
npm run preview
```

The production output is written to `dist/`.

## GitHub Pages deployment

This repository includes `.github/workflows/deploy-pages.yml`.

1. Push the files to the root of the frontend repository.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. In **Settings → Secrets and variables → Actions → Variables**, create:

   ```text
   VITE_API_BASE_URL=https://pan-backend-production-8d86.up.railway.app
   ```

4. Push to `main` or manually run **Deploy PAN Frontend** in Actions.

Vite uses `base: "./"`, and React uses `HashRouter`. Pages therefore work at any repository path without a custom Vite base. Routes look like:

```text
https://USERNAME.github.io/REPOSITORY/#/login
https://USERNAME.github.io/REPOSITORY/#/credits
https://USERNAME.github.io/REPOSITORY/#/builder
```

Do not navigate to `/login` before the `#`; GitHub Pages cannot rewrite that server path.

## Railway backend configuration

The backend must allow the exact GitHub Pages origin. An origin does not include a path:

```env
FRONTEND_URL=https://USERNAME.github.io/REPOSITORY
FRONTEND_ORIGIN=https://USERNAME.github.io
```

For cookie-based cross-site authentication, production cookies must use:

```text
Secure=true
SameSite=None
```

The frontend sends both `credentials: "include"` and a bearer token when the backend returns one.

## API integration

All backend routes are centralized in `src/api.js`. This is intentional: if a deployed backend route differs, update its single entry in `endpoints` instead of editing page components.

Never place Anthropic, OpenAI, wallet-encryption, Google client-secret or GitHub client-secret values in this frontend. Only `VITE_*` public values are safe in a GitHub Pages build.
