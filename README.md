# SutraKalpa — Design & Motion Studio

A single-page, editorial "construction sheet" site for SutraKalpa, built with
plain HTML, CSS and vanilla JavaScript — no build step, no frameworks.

## Structure

```
/
├── index.html      Markup + SEO/meta + JSON-LD
├── styles.css       All styling (variables, layout, responsive rules)
├── script.js        The animated thread, menu, scroll cue
├── assets/
│   ├── favicon.svg
│   └── og-image.svg   placeholder social-share image
└── README.md
```

## Running locally

No build tools, no dependencies. Just open `index.html` directly in a
browser, or serve the folder with any static server, e.g.:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Create a new repository (or use an existing one) and push these files to
   the root of the `main` branch:
   ```
   git init
   git add .
   git commit -m "SutraKalpa site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. In the repository on GitHub, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Set **Branch** to `main` and folder to `/ (root)`, then **Save**.
5. GitHub will publish the site at
   `https://<your-username>.github.io/<your-repo>/` within a minute or two.
6. If you're using a custom domain, add a `CNAME` file with the domain name
   at the repo root and configure your DNS accordingly (Pages settings will
   prompt for this).

No `index` path rewriting, no build output — this repo's root **is** the
deployable site.

## Notes on the design

- **Typography:** Cormorant Garamond (display serif), Space Grotesk (UI /
  sans), IBM Plex Mono (annotations, data). Noto Serif Devanagari is loaded
  in addition, solely so the सूत्र / कल्प glyphs render with the same
  editorial serif character as the Latin type — the brief's three families
  don't include Devanagari coverage, and it was the only way to keep those
  two words legible and on-brand rather than falling back to the OS default.
- **The thread:** built at runtime in `script.js`. Small invisible anchor
  points (`.pt`) are authored in the HTML at percentage positions inside
  each section; JS measures their real page coordinates, threads a smooth
  Catmull-Rom spline through each group, and renders it as SVG behind the
  headline and through the page. It drifts gently via `requestAnimationFrame`
  and slow-cycles between vermillion / ultramarine / brass. Everything here
  is disabled in favour of a static thread when the visitor has
  `prefers-reduced-motion: reduce` set.
- **Imagery:** every visual in the piece — the ink-flow panel, the particle
  cluster, the shell/topographic mark, the radar diagram — is hand-built SVG
  and CSS. No stock or generated photography is used, per the brief.
- **Editing copy:** all real copy lives directly in `index.html`; the small
  grey construction-note labels (`GRID`, `FRAME_0001`, `ANCHOR POINT`, …) are
  marked `aria-hidden="true"` since they're decorative, not content.

## Performance & accessibility

- Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`), a skip
  link, and visible focus states throughout.
- Fluid type via `clamp()`, CSS custom properties for the whole palette.
- `prefers-reduced-motion` is respected for the thread, the scroll cue, and
  smooth scrolling.
- No web fonts beyond the four Google Fonts families; everything else is
  inline SVG, so there's no image payload to optimize.
