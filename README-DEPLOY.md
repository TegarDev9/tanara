Deployment to Vercel

This project is a Next.js app using Prisma + PostgreSQL for server persistence.

Quick steps to deploy to Vercel

1. Create a Vercel project and connect this Git repository (owner: TegarDev9, repo: tanara).
2. In Vercel project settings, set the environment variable `DATABASE_URL` to your Postgres connection string (e.g. `postgresql://user:pass@host:5432/dbname`).
3. Optionally set a Vercel secret `database_url` (used in `vercel.json`).
4. Deploy. Vercel will run `npm install` and build the Next.js app.

Local setup (recommended before deploying)

1. Install dependencies:

```powershell
npm install
```

2. Create a `.env` file in project root with:

```text
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
```

3. Generate Prisma client and run migration:

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

4. Run locally:

```powershell
npm run dev
```

Notes

- If you plan to use Telegram account sync, the app currently accepts `telegramId` in API requests as an MVP. Consider implementing proper OAuth or Telegram login flow for production.
- Vercel automatically injects environment variables at build/runtime. Ensure `DATABASE_URL` is set in the project settings.
- If using serverless functions, keep the Prisma client singleton pattern in `src/lib/prisma.ts` to avoid connection storms.

Vercel-specific steps (migrations & seed)

1. In Vercel dashboard, open your project -> Settings -> Environment Variables and add `DATABASE_URL` and `BOT_TOKEN`.
2. In Project > General > Build & Development Settings, set the Build Command to:

```
npx prisma generate && npx prisma migrate deploy && npm run build
```

3. (Optional) Add a Post-build step to run the seed script, or run it once manually via a server with access to the DB:

```
npx prisma db seed --preview-feature
node prisma/seed.js
```

Notes: `prisma migrate deploy` is safe for production deploys; `prisma migrate dev` is for local development only.
