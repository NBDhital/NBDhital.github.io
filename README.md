# Narayan Babu Dhital — Academic Portfolio Website

A complete, ready-to-launch academic portfolio website: **Home, About Me, Research &
Publications, Courses & Research Students, Blog, and Contact** — built with plain HTML/CSS/JS
(no build tools, no database) so it works perfectly on **free GitHub Pages hosting**, and so
you (or any future non-technical editor) can update content by editing simple text files.

Theme: muted navy-blue backgrounds with gold accents, serif headings (Playfair Display) +
clean sans-serif body text (Source Sans 3), smooth scroll-reveal animations, and a fully
responsive layout for desktop and mobile.

---

## 0. What's in this folder

```
site/
├── index.html          → Home page
├── about.html           → About Me
├── research.html         → Research & Publications
├── courses.html          → Courses & Research Students
├── blog.html             → Blog listing page
├── contact.html          → Contact page (with form)
├── 404.html               → "Page not found" page
├── CNAME                  → tells GitHub Pages your custom domain (nbdhital.com.np)
├── robots.txt / sitemap.xml → basic SEO helpers
├── css/style.css           → ALL colours, fonts, spacing — edit once, changes everywhere
├── js/include.js            → loads the shared header & footer on every page
├── js/script.js               → scroll animations + tab switching
├── includes/header.html        → the navigation menu (shared by every page)
├── includes/footer.html         → the footer (shared by every page)
├── images/                       → your photos & logos go here
└── blog/                          → one HTML file per blog post + a reusable template
```

**Why a shared header/footer works well for you:** every page loads `includes/header.html`
and `includes/footer.html` automatically via JavaScript. If you ever need to change a menu
item, your email address, or a social link, you edit **one file** and it updates on **all six
pages** at once.

---

## 1. Preview the site on your own computer (optional but recommended)

Because the header/footer are loaded with JavaScript `fetch()`, double-clicking an HTML file
won't show the menu (browsers block local file loading for security). Instead, run a tiny
local server:

- **If you have Python installed:** open a terminal in the `site` folder and run
  `python3 -m http.server 8000`, then open `http://localhost:8000` in your browser.
- **If you use VS Code:** install the free "Live Server" extension, right-click `index.html`,
  choose "Open with Live Server".

This step is just for checking your work before publishing — it's optional.

---

## 2. Put the site on GitHub (free hosting)

1. Go to **github.com** and create a free account if you don't have one.
2. Click the **+** icon (top right) → **New repository**.
   - Repository name: `nbdhital-portfolio` (any name is fine — since you're using your own
     domain, it does **not** need to be `yourusername.github.io`).
   - Set it to **Public**.
   - Do **not** initialize with a README (we already have one).
   - Click **Create repository**.
3. On the new repository's page, click **"uploading an existing file"** (or drag-and-drop).
4. Drag the **entire contents of this `site` folder** (not the folder itself — its *contents*:
   `index.html`, `about.html`, the `css` folder, etc.) into the browser window.
5. Scroll down, write a commit message like "Initial website upload", and click
   **Commit changes**.

*(If you're comfortable with git/command line instead, you can `git init`, `git add .`,
`git commit -m "initial"`, `git remote add origin <your-repo-url>`, `git push` instead of
steps 3–5.)*

### Turn on GitHub Pages

1. In your repository, go to **Settings → Pages** (left sidebar).
2. Under "Build and deployment" → Source, choose **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)** → **Save**.
4. Within a minute or two, GitHub will show a green box with your temporary site address,
   something like `https://yourusername.github.io/nbdhital-portfolio/`. Open it to confirm
   the site loads (menu, images, pages all working).

Your site is now live for free — the rest of this guide connects your own domain name to it.

---

## 3. Register your free `nbdhital.com.np` domain

`.com.np` domains are issued **free of charge, for life**, by **Mercantile Communications**
through the official registrar **[register.com.np](https://register.com.np)** — but only to
individuals who hold a **Nepali citizenship certificate, driving licence, or passport**, or to
registered Nepali businesses. Because you'll need to supply DNS "nameservers" during the
application, set up free Cloudflare DNS **first** (step 3a), then register the domain
(step 3b).

### 3a. Create a free Cloudflare account (for DNS management)

`register.com.np` does not let you manage your own DNS records (no custom A/CNAME records),
so nearly everyone pairs it with a free third-party DNS manager — Cloudflare is the standard,
free choice.

1. Go to **cloudflare.com** → sign up for a free account.
2. Click **Add a site**, type `nbdhital.com.np`, choose the **Free** plan.
3. Cloudflare will try to scan for existing DNS records (it will find none yet — that's fine,
   the domain isn't registered yet) and then show you **two nameservers**, e.g.:
   ```
   aida.ns.cloudflare.com
   evan.ns.cloudflare.com
   ```
   (Yours will have different, randomly assigned names.) **Write these down** — you'll enter
   them in the next step.

### 3b. Apply for the domain at register.com.np

1. Go to **[register.com.np](https://register.com.np)**, search `nbdhital`, choose the
   **.com.np** extension, and click **Register**.
2. Create an account (legal name, email, phone) and verify your email address.
3. Fill in the domain request form:
   - **Nameservers:** enter the two Cloudflare nameservers from step 3a.
   - **Administrative contact:** your legal name, "Nepal" as country, your citizenship
     province, city, and address; leave "Organization" blank for a personal domain.
4. Write a short, formal **cover letter** requesting the domain `nbdhital.com.np` for your
   personal academic portfolio (a few sentences is enough).
5. Upload a clear photo/scan of your **citizenship certificate** (front & back) or passport,
   plus the cover letter, each under ~200 KB in `.jpg` format.
6. Submit. Approval is manual and typically takes **1–3 business days** (Mercantile usually
   processes same-day if submitted before ~5 PM Nepal time). You'll get an email once approved.

### 3c. Point the domain at GitHub Pages (once approved)

1. In **Cloudflare → DNS → Records**, add these records:

   | Type  | Name | Content                | Proxy status |
   |-------|------|-------------------------|--------------|
   | A     | @    | 185.199.108.153         | DNS only     |
   | A     | @    | 185.199.109.153         | DNS only     |
   | A     | @    | 185.199.110.153         | DNS only     |
   | A     | @    | 185.199.111.153         | DNS only     |
   | CNAME | www  | yourusername.github.io  | DNS only     |

   (These four IP addresses are GitHub's official Pages servers. Set "Proxy status" to **DNS
   only** — grey cloud, not orange — while GitHub verifies the domain and issues your SSL
   certificate; you can switch it to "Proxied" afterwards if you'd like Cloudflare's extra
   speed/security features.)

2. Back in your GitHub repository → **Settings → Pages**, under "Custom domain" type
   `nbdhital.com.np` and click **Save**. (This repository already includes a `CNAME` file with
   this domain, so GitHub should detect it automatically — you're just confirming it.)
3. Wait for the "DNS check successful" green message (can take anywhere from a few minutes to
   24 hours), then tick **Enforce HTTPS** so visitors always get the secure padlock.

Your site is now live at **https://nbdhital.com.np** 🎉

> **Don't want to wait for domain approval?** Your `https://yourusername.github.io/...`
> address from Step 2 already works right now — share that in the meantime, and switch the
> domain over once it's approved. Nothing else about the site needs to change.

---

## 4. Connect the contact form (5 minutes, free)

The contact form on `contact.html` is wired to **Formspree**, a free service that emails form
submissions straight to your inbox — no server needed.

1. Go to **formspree.io** → sign up free with `narayan.dhital@pmc.tu.edu.np`.
2. Click **New Form**, name it "Portfolio Contact Form", and copy the **form endpoint URL**
   it gives you (looks like `https://formspree.io/f/abcd1234`).
3. Open `contact.html`, find this line near the bottom:
   ```html
   <form class="contact-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```
   and replace `YOUR_FORM_ID` with your real ID (e.g. `abcd1234`).
4. Save, re-upload the file to GitHub (or edit it directly on github.com — see Section 6),
   and send yourself a test message from the live site to confirm it arrives by email.

The free Formspree plan allows 50 submissions/month, which is normally plenty for a personal
academic site.

---

## 5. Add your real photos (replace the placeholders)

The site currently uses simple grey/gold placeholder graphics so nothing looks "broken."
Replace them by uploading your own images to the `images/` folder **using the exact same file
names**, so every page picks them up automatically:

| File to replace                     | Suggested photo                                  |
|--------------------------------------|---------------------------------------------------|
| `images/profile-main.jpg`            | Your main professional portrait (square, ≥600×600px) |
| `images/profile-small.jpg`           | Small square headshot for the top-left logo spot |
| `images/favicon.png`                 | A small square icon (browser-tab icon)           |
| `images/affil-tu.png`                | Tribhuvan University logo                        |
| `images/affil-uef.png`               | University of Eastern Finland logo               |
| `images/affil-editorial.png`         | Any icon representing editorial/journal work     |
| `images/award-photo.jpg`             | Photo receiving the Nepal Bidyabhusan Padak       |
| `images/research-focus.jpg`          | A fieldwork / lab / monitoring-equipment photo   |
| `images/blog/kallavesi-lake.jpg`     | Your Kallavesi Lake photo from the "युद्ध" post |
| `images/blog/placeholder.jpg`        | A general photo used for blog posts without one  |

To upload: open your GitHub repository in the browser → navigate into the `images` folder →
click **Add file → Upload files** → drag your photo in → make sure the file name matches
exactly (same spelling, same `.jpg`/`.png`) → commit.

---

## 6. Updating content later (no coding knowledge needed)

You do **not** need to install anything to make future edits — GitHub lets you edit text files
right in your browser:

1. Go to your repository on github.com and click on the file you want to change
   (e.g. `research.html`).
2. Click the **pencil icon** (Edit this file) in the top-right of the file view.
3. Make your change directly in the text (see the specific instructions below for each
   section).
4. Scroll down, add a short commit message like "Add 2027 publication", click
   **Commit changes**.
5. Your live site updates automatically within about a minute.

### Add a new publication
Open `research.html`, find the matching `<div class="pub-year">` for the year (or create a
new one, e.g. `<div class="pub-year">2027</div>`), and copy-paste an existing
`<div class="pub-item">...</div>` line just under it, then edit the authors/title/journal/DOI.

### Add a new blog post
1. Copy `blog/post-template.html`, rename it (e.g. `blog/2027-03-my-new-post.html`).
2. Edit the title, date, photo, and paragraph text inside it (instructions are written as
   comments inside the file itself).
3. Open `blog.html`, copy one of the existing `<div class="card blog-post-card">...</div>`
   blocks, paste it at the **top** of the list, and update the title, excerpt, date, image and
   link to point to your new file.

### Add a new research student
Open `courses.html`, find the M.Sc. or B.Sc. section, copy an existing
`<div class="card student-card">...</div>` block, paste it in, and edit the name, topic,
funding and graduation status.

### Change the menu, footer, email or social links
Edit `includes/header.html` (menu) or `includes/footer.html` (footer/email/socials) — the
change appears on all six pages automatically.

### Change colours or fonts site-wide
Open `css/style.css` — the very top `:root { ... }` block lists every colour and font as a
named variable with comments explaining what each one controls.

---

## 7. Final checklist before you announce the site

- [ ] All placeholder images replaced with real photos
- [ ] Formspree form ID updated and tested (Section 4)
- [ ] Domain shows "DNS check successful" and HTTPS padlock is active
- [ ] Checked the site on your phone (menu opens/closes correctly, text is readable)
- [ ] Re-read `about.html`'s Experience section and adjusted the year ranges — they were
      estimated from your biography text and should be double-checked (a note is left inside
      the file itself as a reminder)
- [ ] Clicked through Scopus / Web of Science / ORCID / Google Scholar / ResearchGate /
      LinkedIn links on the Home page to confirm they're current

---

## Notes on the Blog page

Blog excerpts were pulled from your existing Blogger index page
(nbdhital.blogspot.com), which only publicly shows the opening paragraph(s) of each post
before the "Read more" break. Each new page in `/blog/` includes that opening excerpt plus a
link back to the original Blogger post, with a clearly marked comment showing exactly where to
paste in the rest of each essay once you're ready — this preserves your original writing
without inventing or guessing at content you haven't published for the excerpt view.

---

## Support

If a step above doesn't behave as described (GitHub Pages, Cloudflare and register.com.np
occasionally tweak their interfaces), search their current help docs — the underlying concepts
(nameservers → DNS records → GitHub Pages custom domain) won't change even if a button moves.
