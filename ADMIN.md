# Admin and live gallery

Static frontend: `dist`. Node Functions: `api/admin.js`, `api/portfolio.js`. Neon stores photo metadata, categories, password hashes, sessions, login throttling, and upload records. Vercel Blob stores newly uploaded images. Sharp validates and converts uploads to WebP variants. Original photos stay at `/portfolio/` and are imported as records.

Visit `/admin`. Passwords are salted scrypt hashes, never included in client code. Secure HttpOnly SameSite cookies expire in 8 hours. Writes require same-origin requests. Admin supports upload, edit title/category/order, publish/hide, trash/restore, category creation/renaming and password changes. Gallery changes appear without deployment. Service card images remain curated static assets.

Environment: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, supplied by project integrations. `.env.local` is ignored. `npm ci` installs pinned dependencies; `npm test` tests hashing, origin checks, input validation and cookie parsing.

`node scripts/bootstrap.mjs` initializes tables and imports `dist/portfolio.json` idempotently. Initial password is read from hidden stdin; existing users are not reset. `node scripts/dev-server.mjs` serves port 4173. `node scripts/verify-admin.mjs [origin]` reads the test password from hidden stdin and checks real auth, upload, CRUD, publish/hide, delete/restore and logout; all temporary records and blobs are cleaned up.

Deploy via Vercel with framework Other, output `dist`, install `npm ci`, no build command. Keep API functions at repository root. Database migration is an explicit operation, not a public endpoint.
