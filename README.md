# Glass Pomodoro Timer

A Pomodoro timer with a glassmorphism-style UI: focus / short break / long break, task list, simple reports, and optional sign-in in order to save your data.

## Stack

**Frontend** — React 19 and TypeScript, bundled with Vite. Styling is Tailwind v4 (via the Vite plugin). The frosted panels use [`liquid-glass-react`](https://www.npmjs.com/package/liquid-glass-react) on npm. Supabase’s JS client handles auth and data from the browser.

**Backend** — Small Express server in TypeScript, run with `tsx`. It uses the same Supabase client where it needs server-side access; `cors` and `dotenv` are wired for local dev.

