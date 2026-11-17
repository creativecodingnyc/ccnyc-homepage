# CCNYC homepage

The site uses Next.js App Router. Route files live in `src/app`, readable UI
sections live in `src/components`, and the specialized canvas/WebGL renderers
are isolated in `src/lib` and `public/scripts`.

## Local development

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in the values used by the site.

## Presentation signup setup

The homepage demo-signup panel uses a Google Sheet as a lightweight shared
store. It keeps up to 10 names and optional Instagram handles for each Tuesday
meetup. The current list remains visible through Monday and automatically
resets when the following Tuesday begins; older rows remain in the sheet as
history.

Presenters choose whether their Instagram handle appears in the public lineup.
They can separately give CCNYC permission to post their demo on Instagram; that
preference is stored only in the private sheet and is never returned by the
public lineup endpoint.

The panel explicitly requests the most recent Tuesday in New York time. On
Tuesday, that means the new Tuesday's list starts empty and remains empty until
someone signs up for that date.

1. Create or open the Google Sheet that should hold the signups.
2. In the sheet, open **Extensions → Apps Script**.
3. Replace the editor contents with
   `google-apps-script/presentation-signup.gs` from this repository and save.
4. Open **Project Settings → Script Properties**, add a property named
   `DEMO_SIGNUP_PASSWORD`, and set its value to the password shared at the
   meetup (for example, `ccnyc2026`).
5. Select **Deploy → New deployment → Web app**.
6. Set **Execute as** to **Me** and **Who has access** to **Anyone**, then deploy.
7. Copy the web app URL ending in `/exec`.
8. Add it to the production environment and local `.env` as:

   ```env
   NEXT_PUBLIC_PRESENTATION_SIGNUP_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
   ```

9. Rebuild and deploy the website.

When the Apps Script changes later, create a new deployment version from
**Deploy → Manage deployments** so the live endpoint receives the update.

## Commands

| Command                | Action                                                 |
| :--------------------- | :----------------------------------------------------- |
| `npm run dev`          | Start the local development server                     |
| `npm run build`        | Create an optimized Next.js production build           |
| `npm run start`        | Run the production build locally                       |
| `npm run lint`         | Run ESLint with zero warnings allowed                  |
| `npm run format:check` | Verify formatting without changing files               |
| `npm run test:unit`    | Run deterministic date and sheet-logic tests           |
| `npm run test:e2e`     | Run the Chromium browser tests against production      |
| `npm run check`        | Run formatting, lint, unit tests, and production build |
