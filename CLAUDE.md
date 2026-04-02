# Villa Elara Backend

## Stack
Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (Railway), JWT auth, Zod validation, Nodemailer + Brevo SMTP, Cloudinary.

## Commands
- `npm run dev` — Start dev server with nodemon
- `npm run build` — Compile TypeScript
- `npm start` — Run compiled server
- `npm run seed` — Seed database (villa + admin)
- `npx prisma migrate dev` — Run migrations
- `npx prisma generate` — Regenerate Prisma client

## Conventions
- All monetary values use `Decimal` (never Float)
- Error responses: `{ errors: [{ field, message }] }`
- Success responses: `{ data: { ... } }`
- Check-out date is NOT a blocked night
- Booking reference format: VE + YYMM + zero-padded seq (e.g. VE26060001)
- Booking status flow: pending -> confirmed -> completed, or pending/confirmed -> cancelled
- Tourist tax is per night, NOT per guest
- Pricing rules: higher priority wins on overlap, fallback to basePricePerNight
