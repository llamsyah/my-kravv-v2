# MY KRAVV — Milestone 5.5 visual review

Design artifacts only. **Visual design awaits user approval.**

Open [index.html](index.html) for the screenshot gallery and links to five responsive
static prototypes. The folder can be viewed directly from disk. For a local HTTP
preview, run `node design/milestone-5.5/serve.mjs` from the repository root, then
open `http://127.0.0.1:4175/`. This optional viewer serves only this folder on
loopback and rejects mutations. It is independent of Next.js and the app server.

## Views

| Page      | Static prototype                 | Desktop screenshot                           | Mobile sheet                                    |
| --------- | -------------------------------- | -------------------------------------------- | ----------------------------------------------- |
| Home      | [home.html](home.html)           | [desktop](screenshots/home-desktop.jpg)      | [mobile](screenshots/home-mobile-full.jpg)      |
| Companies | [companies.html](companies.html) | [desktop](screenshots/companies-desktop.jpg) | [mobile](screenshots/companies-mobile-full.jpg) |
| Overview  | [overview.html](overview.html)   | [desktop](screenshots/overview-desktop.jpg)  | [mobile](screenshots/overview-mobile-full.jpg)  |
| Pemikiran | [thoughts.html](thoughts.html)   | [desktop](screenshots/thoughts-desktop.jpg)  | [mobile](screenshots/thoughts-mobile-full.jpg)  |
| Refine    | [refine.html](refine.html)       | [desktop](screenshots/refine-desktop.jpg)    | [mobile](screenshots/refine-mobile-full.jpg)    |

[Desktop board](screenshots/desktop-board.jpg),
[mobile board](screenshots/mobile-board.jpg), and
[mobile original/proposal comparison expanded](screenshots/refine-mobile-comparison.jpg).
Each page also has a `-mobile.jpg` first-screen capture and a `-desktop-full.jpg`
capture. Boards show thumbnails of actual captures; individual files preserve
their original resolution.

## Boundaries and fictional content

All companies, notes, timestamps, counts, acceptance events, drafts, and proposals
are illustrative fictional fixtures, manually authored for design review. They
are not facts about a real company and not output from a provider call. Only the
Rimba Nusa workspace is drawn; other company entrances point to this representative
workspace, not independently implemented records.

These pages contain **no scripts or forms**, app imports, credentials, environment
reads, Supabase clients, provider SDKs, storage, analytics, or remote runtime assets.
Local navigation and native disclosure work. Save, search, archive filter, selection,
account, management, edit, and review decision controls are visual examples only;
they do not implement those actions or modify a record. The viewer additionally
sets `script-src 'none'`, `connect-src 'none'`, and `form-action 'none'`.

`prototype.mjs` generates the HTML using only Node's filesystem/URL modules.
`serve.mjs` is the optional isolated static viewer. Neither belongs to production.
The SVG landscape is an original simple geometric illustration, a proposed
atmospheric treatment rather than the final photographic landscape asset. Icons
are local inline SVGs with a consistent 1.75px stroke; no icon package was added.

## Typography assets

Fonts are self-contained in `assets/` with original license notices:

- Inter Variable: [official source](https://rsms.me/inter/font-files/InterVariable.woff2),
  [license](assets/Inter-LICENSE.txt).
- Source Serif 4 Regular: [official Adobe source](https://github.com/adobe-fonts/source-serif/blob/release/WOFF2/OTF/SourceSerif4-Regular.otf.woff2),
  [license](assets/SourceSerif-LICENSE.md).

No font or package was added to the application. No network is needed to view
the prototypes after this folder is available.

## Rendering evidence and limitations

Browser captures were taken using the Codex in-app browser:

- Desktop: 1440 × 1000 CSS viewport, JPEG first-screen and full-page captures.
- Mobile: 390 × 844 CSS viewport, JPEG first-screen captures; full sheets also at
  390px width with natural document height.
- The browser capture surface trims the output relative to those reported CSS
  viewport sizes: main first-screen files are 1425×990 pixels desktop and 375×811
  pixels mobile. Review boards are 1440×1000 pixels. Exact file dimensions are in
  [capture manifest](screenshots/capture-manifest.json); viewport dimensions must
  not be interpreted as a verified native pixel/zoom measurement.
- All five layouts also received DOM width checks at 320px and 768px; no
  page-wide horizontal overflow was observed. See [render metrics](screenshots/render-metrics.json).
- Reading/source disclosure was opened and captured on mobile Refine.
- CSS zoom was 1; the native browser zoom UI and device pixel ratio were not
  independently verified. These are desktop-browser responsive views with desktop
  scrollbars, not a claim of native phone/device or software-keyboard testing.

Default mobile prototypes have fixed bottom navigation. Full-page screenshot
capture otherwise places the fixed rail over the middle of a long image. Therefore
the `*-sheet.html` variants put only that rail into document flow at the end; all
content and other styling remain the same. First-screen captures show the actual
fixed rail. Full sheets are presentation exports, not evidence of fixed-rail scroll
behavior. No original screenshot was painted over or retouched.

The files demonstrate representative populated states, not all empty, archived,
pending, failure, long-input, or resolved Refine states. Those remain visual QA
and design review work before implementation acceptance. No production tests
were changed or run for this isolated visual stage.
