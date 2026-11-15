# tanzimulislam.com — Website

Personal brand + B2B agency site for **Tanzimul Islam**, AI-Video Growth Partner
for US home remodeling contractors (roofing, kitchens, solar, hardscaping).

Single-page site. No build step. No backend. Pure HTML + CSS + JS.

## Deploy to Netlify (free, ~2 minutes)

**Drag-and-drop (easiest):**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop) (log in / sign up free).
2. Drag **this entire folder** (`tanzimulislam-site`) onto the page.
3. Done — you get a live `https://<name>.netlify.app` URL instantly.

**Connect your domain (tanzimulislam.com, on Namecheap):**
1. In Netlify: Site settings → Domain management → Add custom domain → `tanzimulislam.com`.
2. Netlify shows you the DNS records to add. In Namecheap → Domain List → Manage → Advanced DNS, add them (typically an `A` record + a `CNAME` for `www`, or Netlify's nameservers).
3. Wait 5–60 min for DNS. Netlify provisions free HTTPS automatically.

## Customize (5-minute checklist)

| What | Where |
|---|---|
| Calendly booking link | `index.html` — search `TODO`, replace `https://calendly.com/tanzim` (2 spots: hero + final CTA) |
| Video embeds | `index.html` — on each `.video-card`, set `data-youtube="VIDEO_ID"` (paste the 11-char YouTube ID) |
| Email address | `index.html` + `app.js` — search `contact@builtfusion.com` |
| Pilot payment | `index.html` — search `PAYMENT PLACEHOLDER`; `app.js` — replace the form success with a redirect to your Stripe Payment Link |
| Prices / copy | `index.html` — all copy is plain HTML, edit directly |
| Portrait | `assets/tanzim-cutout.png` — drop in a replacement with the same filename |

## Files

- `index.html` — the whole site (sections 01–09 + intake form)
- `styles.css` — design system (dark cinematic brutalist-premium)
- `app.js` — nav, mobile menu, video modal, form validation, scroll reveals
- `assets/tanzim-cutout.png` — headshot with background removed, blended into hero via CSS mask
- `assets/headshot-original.jpg` — original upload (backup)

## Notes

- Fonts load from Google Fonts (Anton / Inter / JetBrains Mono). Works offline-ish with system fallbacks.
- The pilot intake form currently validates and shows a success state — wire it to your Stripe Payment Link before launch (marked in code).
- Video cards are premium placeholders: click opens a modal; once `data-youtube` is set, it embeds the real video.
