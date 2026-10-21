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

| Command | Action |
| :-- | :-- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create an optimized Next.js production build |
| `npm run start` | Run the production build locally |

## Poster direction

The poster builder is intended to replace the weekly request for a community
artist's poster. The target output is a 10-20 second animated poster containing
CCNYC, date, location, and 6-8pm. Generative backgrounds should vary each week
while typography, information hierarchy, and brand rules stay cohesive.

The rebuilt `/build-a-poster` studio includes twelve seeded animation families, three mark constructions per
family, seed comparison previews, twelve palettes and custom HEX color roles. Exact
geometry, warp/noise, texture, rotation and independent travel/deformation controls, Flow/Reverse/Ping-pong motion behavior combine with a
seed comparisons, locked randomization, local saves and versioned JSON import/
export. It also includes play/pause and scrubbing, editable event
details, 4:5 and 9:16 formats, and 10/15/20-second loops. Initial variations derive
from the event date. Download a PNG of the current frame or record a complete
1080px-wide video. The export button names the actual browser-supported MP4 or
WebM format; recording happens in real time and cancels if the tab is hidden.

Run the poster regression suites with Node.js 22.18+ or 24+:

```sh
node --test tests/latest-painter.test.mjs tests/poster-renderer.test.mjs
```

See `docs/custom-art.md` for the renderer API and export contract and
`docs/poster-animation-research.md` for the research behind the pattern choices.


The Custom code workspace supports isolated WebGL1 GLSL fragment shaders and real p5.js instance sketches inside the poster frame, including PNG/video export. Open `/build-a-poster#code-controls`. See `docs/custom-art.md` for the frame API, source persistence and limitations; `docs/studio-review.md` records the complete family/control audit and CCNYC UI branding changes.
