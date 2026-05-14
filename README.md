# CEQA Navigator

**California CEQA Pathway Checklist & Review Tool**

A free, plain-language tool that helps California public agencies, developers, environmental consultants, and community members determine the appropriate California Environmental Quality Act (CEQA) review pathway for their project — in under 5 minutes.

🌐 **Live site:** [ceqanavigator.com](https://ceqanavigator.com)

---

## What it does

Answer 9 plain-language questions about your project and receive:

- ✅ **Recommended CEQA pathway** — from "CEQA does not apply" through Categorical Exemption, ND, MND, and full EIR
- ⚖️ **Conservative alternative** — a more litigation-proof option with one click
- 💰 **Cost breakdown** — consultant fees, technical reports, filing fees, and CDFW fees (2026 rates)
- ⏱ **Step-by-step process flowchart** — every statutory review period with agency actions
- 📄 **Downloadable HTML report** — open in any browser and print to PDF

---

## Data sources & legal basis

All guidance reflects the **2026 CEQA Statutes & Guidelines** (Association of Environmental Professionals, AEP Edition), including:

- California Public Resources Code §§ 21000–21189
- 14 CCR §§ 15000–15387 (CEQA Guidelines)
- CEQA Appendix G Environmental Checklist (2020 revision — Energy and Wildfire added)
- 2025 legislation: SB 79, AB 507, AB 130, SB 131, SB 71
- 2025 case law: *Koi Nation v. County of Sonoma* (AB 52 tribal consultation)
- 2026 CDFW filing fee: $3,717.25
- Validated against real-world CEQA memos (City of San Jose Environmental Planning Division, April 2026; David J. Powers & Associates, April 2026)

---

## No backend required

This is a **100% static, single-page application**. There is no:

- Server or API
- Database
- Node.js / Python / PHP backend
- Authentication server (Google sign-in is a UI demo — wire to real OAuth2 before production)
- Payment processing server (Stripe Payment Links handle checkout externally)

Everything runs in the browser. Deploy anywhere that serves static files.

---

## Project structure

```
ceqa-tool/
├── index.html          # All markup — header, wizard steps, modals, footer
├── styles.css          # All styling — layout, components, print styles
├── script.js           # All logic — CEQA determination engine, UI, PDF generation
├── assets/
│   └── og-image.png    # Open Graph preview image (add your own)
├── sitemap.xml         # For Google Search Console submission
├── robots.txt          # Search engine crawl rules
├── .gitignore          # Standard ignores
└── README.md           # This file
```

---

## Deployment (free, ~10 minutes)

### Option 1 — Cloudflare Pages (recommended)

1. Fork this repository
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com) → Create a project → Connect to Git
3. Select this repo. Build command: *(leave blank)*. Output directory: `/`
4. Click **Save and Deploy**
5. Add your custom domain under **Custom Domains**

HTTPS is automatic. Updates deploy in seconds when you push to `main`.

### Option 2 — Netlify

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire `ceqa-tool/` folder onto the page
3. Your site is live instantly at a `*.netlify.app` URL
4. Add a custom domain in Site Settings → Domain Management

### Option 3 — GitHub Pages

1. Go to your repository **Settings → Pages**
2. Source: **Deploy from a branch** → `main` → `/ (root)`
3. Save. Live at `https://yourusername.github.io/ceqa-tool/`

---

## Wiring up real services (before production)

### Stripe payments (Save Progress feature)
The payment modal UI is built but submits to a demo handler. To take real payments:

1. Create a free account at [stripe.com](https://stripe.com)
2. In Stripe Dashboard → **Payment Links** → Create links for:
   - Monthly plan: $4.99/month
   - Annual plan: $35.00/year
3. In `script.js`, find `processPayment()` and replace the demo block with:
   ```js
   window.open('https://buy.stripe.com/YOUR_LINK_ID', '_blank');
   ```
4. No server required — Stripe handles the entire checkout flow.

### Formspree feedback (anonymous feedback submissions)
The feedback modal logs to `console.log` by default. To receive emails:

1. Create a free account at [formspree.io](https://formspree.io)
2. Create a new form and copy your endpoint (e.g. `https://formspree.io/f/abcd1234`)
3. In `script.js`, find `submitFeedback()` and replace `console.log(...)` with:
   ```js
   fetch('https://formspree.io/f/YOUR_FORM_ID', {
     method: 'POST',
     body: JSON.stringify(payload),
     headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
   });
   ```

### Google OAuth2 (Save Progress sign-in)
The Google sign-in button uses a `prompt()` dialog in demo mode. For real OAuth2:

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the Google Identity API
3. Create OAuth2 credentials (Web Application type)
4. Replace the `signInWithGoogle()` function in `script.js` with the Google Identity Services SDK flow
5. User sessions can be stored in `localStorage` (already wired) or a backend of your choice

---

## Customization

### Updating CEQA data
All CEQA pathway data is in `script.js` in clearly labeled objects:

| Object | Contents |
|--------|----------|
| `CT` | Pathway descriptions and legal authority citations |
| `FLOWS` | Step-by-step process steps per pathway |
| `COSTS` | Cost breakdowns per pathway (update CDFW fee annually) |
| `TIMELINES` | Estimated total timelines per pathway |
| `ACQ_NOTES` | Land acquisition impact explanations |
| `INFO_PAGES` | Content for Disclaimer, Privacy, Terms, Contact, About modals |

### CDFW fee (updates annually)
Search `script.js` for `3,717.25` and update to the current year's fee.
CDFW publishes updated fees at [wildlife.ca.gov/CEQA](https://wildlife.ca.gov/CEQA).

### Adding a new CEQA pathway
1. Add an entry to `CT` with `name`, `abbr`, `auth`, `desc`
2. Add a corresponding entry to `FLOWS` (array of process steps)
3. Add a corresponding entry to `COSTS`
4. Add a corresponding entry to `TIMELINES`
5. Update `determineCEQA()` logic to return the new pathway key when appropriate

---

## Legal disclaimer

This tool provides **general guidance only** and does not replace review by a qualified CEQA professional, lead agency, or legal counsel. Results are a starting point for discussion — not a legal determination or certified environmental document. Always consult a licensed environmental professional and the applicable lead agency before making project decisions.

This project is not affiliated with the State of California, the Governor's Office of Planning and Research (OPR), the Department of Toxic Substances Control (DTSC), or the Association of Environmental Professionals (AEP).

---

## License

MIT License — free to use, modify, and distribute with attribution.

---

## Contributing

Pull requests are welcome, especially for:
- Updated CEQA fee schedules
- New 2025–2026 statutory exemptions
- Additional Appendix G checklist items
- Agency-specific local requirements (BAAQMD, coastal zone, etc.)
- Accessibility improvements

Please open an issue first for significant changes.

---

*Built with care for California planners, applicants, and communities navigating CEQA.*
