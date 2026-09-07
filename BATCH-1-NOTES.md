# Batch 1 — shared design layer

Drop these over your repo. `images/`, `data/`, `aqi-*.js`, `publications.js`,
`CNAME`, `robots.txt` and `sitemap.xml` are untouched and are not in this drop.

```
css/style.css          rewritten  (2066 -> 2010 lines)
includes/header.html   rewritten
includes/footer.html   rewritten
js/include.js          rewritten
js/script.js           rewritten
*.html, blog/*.html    13 files, two mechanical edits each (see §3)
```

---

## 1. What I found in the audit

Reading the real repo changed three things I'd told you earlier, all of which
were me guessing at files I couldn't open:

- **`.page-nav` already existed.** Your sticky in-page section bar. I had
  invented a `.section-nav` that would have sat alongside it doing the same
  job. Dropped; yours is kept and extended.
- **`.aqi-scale` already existed**, as the six-row category legend on the
  air-quality page. I had invented a horizontal bar under the same class name,
  which would have collided head-on. Dropped.
- **`--header-height` is measured live** by `updateHeaderHeight()` and consumed
  by `.page-nav`'s sticky `top`. My static `--header-h` was a duplicate of a
  system you'd already built, and built for a good reason — the comment in
  `include.js` documents the intermittent-gap bug it fixed. Kept as-is.

Genuine defects fixed:

| | Issue | Fix |
|---|---|---|
| 1 | Header injected with no reserved height — page jumped on every load | `min-height: var(--header-height)` on the placeholder |
| 2 | `preconnect` pointed at `fonts.googleapis.com` but not `fonts.gstatic.com`, where the font files are | second preconnect with `crossorigin` |
| 3 | Scroll handler in `script.js` ran unthrottled and wrote a class on every event | rAF-batched, writes only on state flip |
| 4 | No `<main>` landmark, no skip link, on any page | both added |
| 5 | Mobile menu had no `aria-expanded`, no scroll lock, no Escape, and stayed open on rotate | all four added |
| 6 | `.page-nav` had no active state — your brief asks for one | `initSectionSpy()` in `script.js` |
| 7 | Footer heading read "Prefessional" | corrected |
| 8 | Social links are two-letter abbreviations; screen readers announced "Sc" | `aria-label` added, all six URLs preserved verbatim |

---

## 2. Design decisions

**Colour.** Your palette was already cool, which is the right instinct — the
site's argument is clear air versus haze, so the neutral axis should lean
blue-grey, never warm cream. I kept the family and gave it more steps. Gold
moved from `#c9a227` to `#9a7b32`: the original reads bright against a light
ground and pushed the page toward "gilded" rather than "scholarly."

Two accents with separate jobs, so neither is overworked — brass for editorial
punctuation (rules, eyebrows, dates), slate for interaction (links, focus).

Every text/background pair was checked against WCAG AA and the ink scale was
solved numerically, not eyeballed. Lowest ratio on the site is now 4.52:1
(`--ink-faint` on the footer ground). Your previous muted greys failed AA at
small sizes on the tinted backgrounds.

**Type — the one thing you never answered.** I went with Source Serif 4 for
headings, keeping Source Sans 3. Reasons: Playfair is a high-contrast Didone
whose hairlines go fragile at heading sizes, its register is fashion-editorial
rather than calm, and Source Serif 4 is the same superfamily as your existing
sans — shared vertical metrics, so headings and body lock to one rhythm.

**Reverting is one line.** In `css/style.css`, `--font-heading`:

```css
--font-heading: 'Playfair Display', Georgia, serif;
```

Then swap `Source+Serif+4` back to `Playfair+Display:wght@600;700` in the font
link. Nothing else moves.

**Page banner.** Was a dark navy gradient, which contradicts the brief's "light
background with dark text." Now paper with a hairline and a brass breadcrumb,
so inner pages read as continuous with home.

**The AQI module** is where the design spends its boldness — it's the only live
instrument on the site. `aqi-widget.js` writes `.style.color` from your category
palette; the category strip beside the reading now uses `currentColor`, so it
adopts that colour with **zero JavaScript change**.

---

## 3. What changed inside your 13 HTML files

Only two mechanical edits per file. No content, no URLs, no metadata touched:

1. Font link swapped, `gstatic` preconnect added.
2. Everything between the two include placeholders wrapped in
   `<main id="main">`, giving the skip link a target.

Your ~130 inline `style=` attributes are **untouched and still work** — every
legacy variable name (`--color-gold`, `--font-heading`, `--radius`,
`--shadow-soft`, `--color-text-muted`, and the rest) is still declared, remapped
to the new palette. That's deliberate: removing them would have broken 130
inline styles simultaneously. Migrating them is batch 2.

---

## 4. Verified programmatically

- No class used in any HTML file lost its styling in the rewrite (checked all
  13 pages + both includes against old and new stylesheets)
- All 39 `getElementById` targets across your 6 JS files still resolve
- All JS-dependent state classes present: `active`, `is-current`, `is-invalid`,
  `is-scrolled`, `is-visible`, `open`, `show`, `is-dominant`
- All 12 `.page-nav__item` anchors resolve to real section IDs
- Zero broken internal links, zero missing image/script/CSS assets
- CSS braces and parens balanced, no undeclared custom properties
- Both JS files pass `node --check`
- `publications.js` still owns its own `.tab-btn[data-tag]` filter buttons —
  the handler in `script.js` returns early on any button without `data-tab`,
  before touching a single class, so the two never fight

**I cannot render pages.** No browser in my environment. Everything above is
static analysis. Visual QA is yours.

---

## 5. Please check these five in a browser

1. **Header height.** `--header-height` falls back to `74px` before JS measures.
   If your rendered header isn't ~74px, the `.page-nav` will sit wrong for one
   frame on load. Adjust the token to match.
2. **Hero portrait crop.** `profile-main.jpg` is 1280×1224 (near square) and the
   hero now crops it to 4:5 at `object-position: center 20%`. Check his head
   isn't cut.
3. **Mobile nav** at ≤900px — open, navigate, rotate, press Escape.
4. **Section scrollspy** on research / courses / professional-journey.
5. **AQI widget and the air-quality page** — live data, geolocation button,
   Leaflet map, category colours.

---

## 6. Batch 2

Not done yet, and it's the larger half:

- Migrate ~130 inline styles into classes (`research.html` has the metrics block
  fully inline; `air-quality.html` has 23; the blog posts have 56 between them)
- Rebuild the research metrics display — currently four inline-styled divs, and
  the brief asks for something other than dashboard tiles
- Per-page semantic and heading-order pass
- `width`/`height` on images to kill remaining layout shift
- **Image weight.** 7.9 MB of JPEGs, several oversized: `home-intro-2.jpg` is
  673 KB at 1977px, `dashain-mahina-2.jpg` is 752 KB. Resizing to display width
  and converting to WebP would cut roughly 80% — the single largest performance
  win available, and bigger than anything in the CSS.
- Canonical URLs and Open Graph tags
- Remove dead CSS (`.hero-eyebrow`, `.profile-card`, `.section--dark`,
  `.affil-card`, `.brand-*` colour classes) — confirmed unused in both HTML and JS
