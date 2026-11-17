# README art

Everything here is generated from the traced motifs in `src/components/nouveau/motifs/` (Alphonse Mucha, *Documents décoratifs*, 1902, public domain) and the Libretto Paléologue font in `public/fonts/`.

| File | What it is | Source |
|---|---|---|
| `../../logo.png` | Plugin logo (512×512 PNG), used by `.cursor-plugin/plugin.json` and root `plugin.json` | plate 30: `p30-blossom` medallion over `p30-cap` seed pods |
| `../../logo.svg` | Vector source for README and docs (512×512 viewBox) | as above |
| `logo-512.png` · `logo-256.png` · `logo-128.png` | PNG exports of the logo, transparent corners | as above |
| `hero.svg` | Animated README hero: the logo plus the wordmark, with glyph outlines taken from Libretto Paléologue Poster | plate 30 + font |
| `divider-lys33.svg` · `divider-lys33-foot.svg` | Animated lily-frieze page dividers, 880 px wide (the foot one is flipped) | plate 33: `p33-frieze` |
| `frame-coins46-top.svg` · `frame-coins46-bottom.svg` | Animated frame caps that bracket each install guide | plate 46: `p46-corner` and `p46-knot` |
| `screens/*.png` | Screenshots of this kit running `npx scorecard-kit dev` | n/a |

The SVGs animate with CSS inside the file, which still runs when GitHub shows them through `<img>`. The animation stops when the reader has *reduce motion* turned on. No scripts and no external references are used.
