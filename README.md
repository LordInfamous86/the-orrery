# The Orrery

A personal celestial observatory for calculated planetary positions, natal chart exploration, and a private journal.

## Features

- Current geocentric ecliptic placements for the Sun, Moon, Mercury, Venus, Mars, Jupiter, and Saturn.
- Tropical zodiac conversion and major aspects calculated from longitudes.
- Natal chart entry with local birth date, time, and IANA time zone. Spring clock gaps are rejected; repeated fall clock times require choosing the first or second occurrence.
- Selectable chart wheel and traditional Sun, Moon, and planetary sign notes. Interpretations are labeled separately from astronomical measurements.
- Optional saved charts and journal entries protected by Supabase Auth and PostgreSQL row-level security.
- Without Supabase configuration, the journal works in local browser storage and is clearly labeled as local-only. This mode is for evaluation; it is not account-secured or synced.
- Existing local journal entries can be explicitly imported into the signed-in account; the browser copy is kept, and repeated imports do not create duplicates.

The Ascendant, houses, birthplace-based chart features, and chart editing/deletion are outside the current release scope.

## Run locally

Requirements: Node.js 18 or later and npm.

```sh
npm ci
Copy-Item .env.example .env.local
npm run dev
```

The app opens at the Vite local URL. Without Supabase settings, the observatory and calculations work, and journal notes remain in that browser only.

## Configure Supabase

1. Create a Supabase project and copy its project URL and publishable key (or legacy anon key).
2. Put them in `.env.local` using the names shown in `.env.example`.
3. Run `supabase/migrations/0001_private_user_data.sql` in the Supabase SQL Editor.
4. In Supabase Auth settings, enable email/password sign-in and configure the local and production site URLs and redirect allowlist. If email confirmation is enabled, new users must confirm their email before signing in.
5. Restart Vite after changing environment values.

The browser uses only the Supabase publishable/anon key. Never put a Supabase secret or service-role key in a `VITE_` variable or browser code. The migration grants table access to authenticated users and relies on separate owner-only policies for every read, insert, update, and delete operation. Existing browser journal notes are not sent automatically; use the journal's **Import browser notes** action to review and confirm that transfer.

## Deploy to Render

The included `render.yaml` configures a static Vite site. Connect this repository to Render, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the service environment, and deploy. The build command runs `npm ci` and `npm run build`; the output directory is `dist`.

After deployment, add the production URL to Supabase Auth's Site URL and redirect allowlist. Test account creation, email confirmation, sign-in/out, chart saving/loading, and journal create/edit/delete with two separate users. Confirm that each user sees only their own saved data before sharing the app.

## Commands

```sh
npm run dev
npm test
npm run build
npm run preview
```

## Calculation notes

Astronomy Engine supplies apparent geocentric ecliptic positions. The app maps ecliptic longitude to twelve equal tropical zodiac signs. Major aspects use the stated angular orbs in `src/astro-logic.js`. Astrological descriptions are traditional interpretations and are not astronomical measurements. The calculation module intentionally does not claim to calculate houses or an Ascendant.
