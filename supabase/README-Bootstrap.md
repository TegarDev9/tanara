Bootstrap Supabase database (local/dev)

This repository includes `supabase/init.sql` — SQL to create the required tables.

Options to apply the SQL:

1) Supabase Dashboard
- Open your Supabase project -> SQL editor -> paste the contents of `supabase/init.sql` and run it.

2) Using psql (if you have DATABASE_URL)
```powershell
psql "$DATABASE_URL" -f supabase/init.sql
```

3) Using Supabase CLI (if installed)
```powershell
supabase db remote set $SUPABASE_DB_URL
supabase db push --sql-file supabase/init.sql
```

Notes
- Use Service Role key or a DB user with create privileges to run these statements.
- For Vercel deployment, run this once in your Supabase project's SQL editor; Vercel does not run these SQLs automatically.
