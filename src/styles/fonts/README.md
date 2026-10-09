# Local application fonts

Unmodified assets reused from the approved isolated visual prototypes. Runtime
loading uses `next/font/local` from the root layout; no Google/Adobe/Inter font
request is made by a private page. License notices are retained verbatim.

| Asset                      | Original upstream source                                                                          | Verified metadata                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| InterVariable.woff2        | https://rsms.me/inter/font-files/InterVariable.woff2                                              | Inter Variable, normal; weight 100–900, optical size 14–32. |
| SourceSerif4-Regular.woff2 | https://github.com/adobe-fonts/source-serif/blob/release/WOFF2/OTF/SourceSerif4-Regular.otf.woff2 | Source Serif 4 Regular, static weight 400.                  |

Metadata was decoded with the installed Next.js font loader's bundled fontkit.
Both files include the glyphs in the synthetic Indonesian verification text.
Only normal styles are loaded. Inter handles controls, sections and Thought
reading; Source Serif 4 handles selected display headings and the existing K mark.
System fallbacks and Next.js metric-adjusted fallbacks remain enabled with swap.

Do not modify or format the upstream license notices. These files are application
assets, not standalone user deliverables.
