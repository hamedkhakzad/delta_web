# delta_web

Website of the DELTA team at Inria. **This readme file is to help team members to update the site.**

## How the site is organised

| What | Where |
|---|---|
| Page shell (menu, tabs, footer) | `index.html` |
| All styles (colours, widths, fonts at the top) | `assets/css/site.css` |
| All behaviour (tabs, search, filters, rendering) | `assets/js/site.js` |
| Home-page animation | `assets/js/network.js` |
| **Content to edit** | `data/*.json` |

Every tab except Contacts is filled from a JSON file. **To update the website, edit the JSON file and push – you do not need to touch the HTML.**

## Updating content

**Team – `data/team.json`**
- New member: copy an entry inside `"current"`, change `name`, `role`, `group` (must be one of `"groups"`), `dates`, `photo` and the optional `links` (`email`, `scholar`, `linkedin`, `twitter`, `github`, `orcid`, `website`). Empty links are not shown.
- Someone leaves: move them from `"current"` to `"alumni"` (name + role is enough).
- Face badly cropped? Adjust `photo_position` (e.g. `"center 20%"`) or add `"photo_zoom": 1.3`.
- `"team_photo"`: put an image path there to show a group photo at the top of the Team page.
- `"open_positions"` feeds the "Join us" box on the Contacts page (empty list = "no open positions" message).

**News – `data/news.json`** – newest first. Fields: `date` (`"YYYY-MM"`), `tag` (Paper, Award, Funding, Event, Press – a new tag creates a new filter button), `title`, `text` (simple HTML links allowed), optional `images` (`[{"src": "...", "alt": "..."}]`). The three newest items also appear on the Home page.

**Software – `data/software.json`** – one entry per tool: `name`, `image`, `tagline`, `tags`, `links` (`label` + `url`; links with an empty `url` are hidden).

**Research – `data/research.json`** – one entry per theme: `title`, `image`, `summary`, `highlights`, `paragraphs` (HTML allowed), `software` (names from `software.json`, shown as links).

**Publications – `data/publications.json`** – see the note below.

The numbers on the Home page (publications, tools, team members) are counted automatically.

## Images
Large images slow the site down. Keep photos under ~150 KB (about 800 px wide for figures, 500 px for portraits; WebP or JPEG). The folder `images/opt/` contains web-sized copies of the original images; the JSON files point to them.

## Publications and the Google Scholar script
`fetch_publications.py` (run by `.github/workflows/update-publications.yml`) rewrites `data/publications.json` from Google Scholar. Things to know:
- The page accepts the `doi` field either as a plain DOI (`10.1038/...`) or as the HTML snippet the script writes.
- Duplicates (same title and year) are hidden automatically.
- The script skips the download when the file is less than one day old. On GitHub Actions a fresh checkout always looks "new", so in practice the scheduled run does nothing. If you ever change that, remember the script **overwrites the whole file**, including any manual corrections.

## After changing CSS or JS
Browsers cache files. Increase the number in `?v=3` (in `index.html`, on `site.css`, `site.js` and `network.js`) so visitors get the new version. The JSON files are always re-checked.

## Preview locally
```
python3 -m http.server 8000      # then open http://localhost:8000
```
(Opening `index.html` by double-click does not work, because browsers block loading the JSON files from `file://`.)

## Notes
Last website meeting May 7th 2025

- Dedicated page for Research section (done)
- Add missing past members (now: add them to `"alumni"` in `data/team.json`)
