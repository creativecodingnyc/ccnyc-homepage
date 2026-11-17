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

## Production observability

- `/api/health` checks the public calendar sheet and presentation-signup endpoint
  with five-second timeouts and returns HTTP 503 when either dependency fails.
- Browser errors and unhandled promise rejections are sent to
  `/api/observability/client-error` with payload limits and basic rate limiting.
- Set `OBSERVABILITY_WEBHOOK_URL` in the production environment to forward client
  errors to a Slack-compatible or generic JSON webhook.
- Set the GitHub repository variable `PRODUCTION_URL` to the deployed site origin,
  such as `https://ccnyc.space`. GitHub Actions checks it every 15 minutes and
  opens one issue when health checks fail.
- Failed GitHub deployment-status events also open a deployment alert issue.

## Commands

| Command                    | Action                                                 |
| :------------------------- | :----------------------------------------------------- |
| `npm run dev`              | Start the local development server                     |
| `npm run build`            | Create an optimized Next.js production build           |
| `npm run start`            | Run the production build locally                       |
| `npm run lint`             | Run ESLint with zero warnings allowed                  |
| `npm run format:check`     | Verify formatting without changing files               |
| `npm run test:unit`        | Run deterministic date and sheet-logic tests           |
| `npm run test:e2e`         | Run Chromium and mobile WebKit browser tests           |
| `npm run test:lighthouse`  | Audit the production build with Lighthouse CI          |
| `npm run profile:homepage` | Record a five-minute homepage memory/CPU profile       |
| `npm run check`            | Run formatting, lint, unit tests, and production build |

Lighthouse CI audits the homepage three times using a simulated mobile device.
It fails CI if accessibility, best-practices, or SEO scores fall below 90, or
if cumulative layout shift exceeds 0.1. Performance scores below 70 and largest
contentful paint above four seconds are reported as warnings because those
measurements can vary between CI runners. The full HTML and JSON reports are
available as a `lighthouse-reports` artifact on each GitHub Actions run.
The audit uses Playwright's pinned Chromium build, so run
`npx playwright install chromium` once if the browser is not already installed
locally.

## Homepage performance verification

The homepage pauses its animation frames, p5 draw loop, and image rotation when
the document is hidden. Reduced-motion visitors receive the completed static
homepage without downloading p5. Small screens and devices reporting four or
fewer CPU cores or 4 GB or less of memory use lower canvas density, fewer WebGL
segments, smaller textures, and a slower image rotation.

Playwright runs the complete browser suite in desktop Chromium and an iPhone 13
WebKit profile on every push. Install both local browsers with:

```sh
npx playwright install chromium webkit
```

To record the sustained five-minute profile, run the production server in one
terminal and the profiler in another:

```sh
npm run build
npm run start -- --hostname 127.0.0.1 --port 4173
npm run profile:homepage
```

The report is written to `artifacts/performance/homepage-profile.json` and lists
console errors plus changes in heap use, DOM nodes, event listeners, and main
thread task time. Set `PROFILE_DURATION_MS` or `PROFILE_URL` to override the
duration or target.

Before a major release, also check one physical iPhone and one older Android
phone for a five-minute session: load and skip the intro, open each menu panel,
background and restore the browser, rotate the device, and confirm that the
page remains responsive without visible canvas corruption or unusual battery
heating. Browser emulation cannot validate physical GPU drivers or thermals.
