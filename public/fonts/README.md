# Kit fonts

Built-in faces ship here as WOFF2. **Font packs** (§4.4) reference these paths from `font-packs/<packId>/manifest.json`.

| Pack | Display | Stack |
|------|---------|--------|
| `libretto-default` | Libretto Paléologue Poster | Newsreader, Source Sans 3, Departure Mono |
| `editorial-plain` | Newsreader (display weight) | same body / UI / mono |

Custom traced packs live under `font-packs/<packId>/` with web copies under `public/font-packs/<packId>/`. Create one with:

```bash
npx scorecard-kit fonts trace --reference ./sheet.png --packId my-display --label "My Display"
```

Licences: see `LICENSES/FONTS.txt` and per-family `*-OFL.txt` files. Only bundle fonts whose licences allow redistribution.