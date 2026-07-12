# cloudX Resume

**Free, private, open-source resume builder** — live at [cloudx.co.in/resume](https://cloudx.co.in/resume/).

Built so students and professionals can make a great resume **without paying anyone**: no accounts, no paywalls, no limits, no tracking.

## Why it's private by design

Everything runs **100% in your browser**. Your resume is never uploaded to any server:

- Uploaded PDFs/DOCX are parsed locally (pdf.js / mammoth.js)
- Documents save to your own browser (localStorage)
- PDF export uses your browser's print engine
- The host is static GitHub Pages — there is no backend to send data to

## Features

- **16 templates** — classic, modern, two-column, banded, executive — one click to switch, any accent color
- **Import** an existing resume (PDF / DOCX / TXT) — best-effort parsing into structured fields
- **ATS checker** — paste a job description, get a keyword-match score plus resume-quality checks (quantified bullets, action verbs, length…)
- **Multiple documents** — keep one resume per job application, duplicate and tweak
- **Export** — polished PDF (print), or JSON of your data

## Contributing

PRs welcome! Easy wins:

- **New templates** — add a CSS block in `index.html` (`<style id="rz-styles">`, follow the `.rz-*` pattern) and register it in the `TEMPLATES` array in `app.js`. Keep templates single-font, print-safe, and driven by the `--racc` accent variable.
- **Better parsing** — `parseResumeText()` in `app.js` is heuristic; real-world resume samples that break it make great issues.
- **ATS checks** — the keyword extractor and quality checks live in `app.js`; improvements must stay fully client-side.

### Ground rules

1. **Client-side only.** No backends, no analytics, no external calls beyond the two CDN libraries. The privacy promise is the product.
2. **No real personal data anywhere** — sample data must stay fictional.
3. Keep it dependency-light: vanilla HTML/CSS/JS, no build step.

## Run locally

```bash
python3 -m http.server 8731
# open http://localhost:8731/resume/
```

---

Maintained by [Anjul Upadhyay](https://cloudx.co.in) · MIT-style: use it, fork it, share it.
