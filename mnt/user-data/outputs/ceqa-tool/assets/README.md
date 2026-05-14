# assets/

Place static assets here:

- `og-image.png` — Open Graph preview image (1200×630px recommended)
  Used when the site is shared on LinkedIn, Twitter/X, iMessage, etc.
  Should show the CEQA Navigator logo/name on a navy background.

- `favicon.ico` — Browser tab icon (32×32px)
  Can be generated free at https://favicon.io

- `apple-touch-icon.png` — iOS home screen icon (180×180px)

## Adding Open Graph tags

Once you have og-image.png, add these to the <head> in index.html:

```html
<meta property="og:title" content="CEQA Navigator — California CEQA Pathway Checklist">
<meta property="og:description" content="Free tool to determine your CEQA review pathway. Updated to 2026 AEP Guidelines.">
<meta property="og:image" content="https://ceqanavigator.com/assets/og-image.png">
<meta property="og:url" content="https://ceqanavigator.com">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```
