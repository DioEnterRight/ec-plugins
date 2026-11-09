# EC Plug-ins

Free plug-ins for EffectCraft, with a small store page.

| Plug-in | Version | What it is |
|---|---|---|
| EC Twitch | 1.2.1 | Random hits of blur, color, light, scale, slide and time, with 25 presets |
| EC Deep Glow 2 | 5.1.0 | HDR glow with a hot core and a long soft halo |
| EC Outline Glow | 1.4.0 | Glowing outline with seven Glow Types (made by Slizzy, upgraded by DioEnterRight) |
| EC Neon Outline | 3.2.0 | Three-colour neon line with electric flicker (made by Slizzy, upgraded by DioEnterRight) |

Each plug-in's page has the full install steps. The zips are in `downloads/`.

EC Twitch and EC Deep Glow 2: (c) 2026 DioEnterRight. All rights reserved. See `LICENSE.txt`.

## Put it online (about 5 minutes)

1. **GitHub.** In PowerShell, inside this folder, run `./setup.ps1`. It creates the repository `DioEnterRight/ec-plugins`, pushes the files, makes the four comment threads (issues 1 to 4) and uploads each zip as a release.
2. **Vercel.** Go to vercel.com, choose Add New > Project, import `DioEnterRight/ec-plugins`, set Framework Preset to **Other**, leave Build Command and Output Directory empty, and deploy. There is nothing to build.

If you use a different repository name, change `repo` in `assets/config.js`.

## How the numbers work with no database

The page reads everything from GitHub in the visitor's browser. Nothing is stored on Vercel.

| Number | Where it comes from |
|---|---|
| Downloads | The download count GitHub keeps for each release file. The page links the Download button to the release file as soon as the release exists, so every download is counted. |
| Likes | Thumbs-up, heart, party and rocket reactions on the plug-in's GitHub issue. The Like button opens that issue. |
| Comments | Comments on the same issue. The page lists them, and "Write a comment" opens GitHub. |

Good to know:
- Liking and commenting need a free GitHub account. Anonymous likes would need a database or a counter service.
- GitHub allows 60 anonymous requests an hour per visitor. The page makes 2 to 3 and keeps the answer for 10 minutes, so this is not a problem in practice. If GitHub can't be reached the numbers show a dash and the Download button still works from `downloads/`.
- Downloads from the `downloads/` folder are not counted, only the release files.
- The repository must stay public.
- You moderate comments on GitHub: delete or hide them on the issue.

## Comment box inside the page (optional)

Install the utterances app on the repository at github.com/apps/utterances, then set `inlineComments: "utterances"` in `assets/config.js`. A comment box then appears on each plug-in page.

## Add a new plug-in

1. Put its zip in `downloads/`.
2. Create a GitHub issue for its likes and comments, and note its number.
3. Add it to `products` in `assets/config.js` with that issue number and the zip's file name, and add its page.
4. `gh release create <tag> downloads/<zip> -R DioEnterRight/ec-plugins`, or create the release on GitHub and drag the zip in.

## Release a new version

1. Rebuild the zip and put it in `downloads/`. Keep the file name or update `zip` in `assets/config.js`.
2. `gh release create <tag> downloads/<zip> -R DioEnterRight/ec-plugins`
3. Commit and push. Vercel redeploys.

Download counts are summed across all releases that contain a file with the configured name.

## Files

- `index.html`, `twitch/index.html`, `deep-glow-2/index.html`: the pages
- `assets/`: styles, script and `config.js`
- `downloads/`: the two zips
- `vercel.json`: clean URLs
- `setup.ps1`: one-time GitHub setup
