# UDK Cinematic Main Verification

This marker exists to run the complete pull-request quality pipeline against the exact cinematic rebuild currently present on `main`.

Required gates:

- workspace verification;
- ESLint;
- TypeScript;
- Vitest;
- Next.js production build;
- Vercel deployment check.
