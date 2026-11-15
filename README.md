# tyler-barr4.github.io

Personal research portfolio for Tyler Barr: spacecraft guidance, control, and autonomy.
Live at <https://tyler-barr4.github.io/> once GitHub Pages is switched on (see below).

Built with [Astro](https://astro.build), Tailwind CSS v4 and three.js. The output is a fully static site.

## Editing content

Almost everything you'd want to change lives in **`src/data/site.ts`**:

| What | Where in `site.ts` |
| --- | --- |
| Name, headline, links (GitHub, LinkedIn, ResearchGate, CV) | `person` |
| Research case studies (one page each under `/research/<slug>/`) | `caseStudies` |
| Homepage chapter for each project (story, two stats, related work, 3D shot) | `caseStudies[].chapter` |
| Publications | `publications` |
| Experience timeline | `flightLog` |
| Tools and methods | `toolkit` |
| Talks and posters | `talks` |
| Honors | `honors` |

Other files you might touch:

- **CV:** replace `public/cv/Tyler_Barr_CV.pdf` (keep the file name, or update `person.links.cv`).
- **Headshot:** `public/images/tyler-360.*` and `tyler-720.*` (WebP + JPEG).
- **Charts on case-study pages:** `src/components/CaseFigures.astro`. The numbers come from the papers.
- **Chart on each homepage chapter:** `src/components/home/ChapterPlot.astro`.
- **3D scene:** `src/scripts/scene.ts`. Each homepage section has a `data-scene` name, and `shots()` sets the camera for it. Coastlines come from Natural Earth (public domain) via the `world-atlas` package.
- **Type:** Jost for headings and body, Space Mono for data and labels (both self-hosted through `@fontsource`).
- **Social preview image:** `public/og.jpg` (1200×630).

### Turning on a "public release coming soon" code button

When Catalyst or E-MOCAT goes public, change its entry under that case study's `code` list:

```ts
{ label: 'Catalyst', status: 'live', href: 'https://github.com/tyler-barr4/Catalyst' },
```

## Running locally

Needs Node 22.23.4 or newer (Astro 7 requirement).

```bash
npm ci
npm run dev       # http://localhost:4321 with hot reload
npm run build     # static site in dist/
npm run preview   # serve dist/
```

## Deploying

`.github/workflows/deploy.yml` builds and publishes the site on every push to `main` (and can be run by hand from the Actions tab).
It reads the base path from GitHub Pages, so the same code works at `https://tyler-barr4.github.io/` and under a project path like `/<repo>/`.
To test a subpath build locally: `BASE_PATH=/portfolio npm run build`.

### One-time GitHub setup

1. **Settings → General → Danger Zone → Change visibility → Public.** Pages on a free plan only publishes public repositories.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Merge to `main` (or **Actions → Deploy to GitHub Pages → Run workflow**).
4. Watch the run in **Actions**; the URL appears on the deploy job and under **Settings → Pages**.
5. Optional: tick **Enforce HTTPS** in Settings → Pages once it's offered.

## Small extras

- The homepage camera follows the page as you scroll. The pause button (bottom right) stops all motion, and the site respects the system "reduce motion" setting.
- The rendezvous chapter on the homepage has a small hand-flown 8-bit docking game using Clohessy–Wiltshire dynamics, with an autopilot to race.
- On desktop the homepage snaps one section per screen. Each section has a `data-scene` that picks its camera shot.
- There is an A-10 parked somewhere in the experience section. Typing `brrrt` anywhere also works.
