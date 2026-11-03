# EC Plug-ins: one-time GitHub setup. Run this inside the unzipped folder, in PowerShell.
# Needs git and the GitHub CLI (gh), and `gh auth login` done once.
$ErrorActionPreference = "Stop"
$repo = "DioEnterRight/ec-plugins"

git init -b main
git add .
git commit -m "EC Plug-ins store"
gh repo create $repo --public --source . --push --description "Free EffectCraft plug-ins: EC Twitch and EC Deep Glow 2"

# The two comment threads. The page expects them to be issue 1 and issue 2, in this order.
$u1 = gh issue create -R $repo -t "EC Twitch: likes and comments" -b "Leave a thumbs-up or heart on this post to like EC Twitch. Write comments below. They show on the EC Twitch page."
$u2 = gh issue create -R $repo -t "EC Deep Glow 2: likes and comments" -b "Leave a thumbs-up or heart on this post to like EC Deep Glow 2. Write comments below. They show on the EC Deep Glow 2 page."
$n1 = ($u1 -split "/")[-1]; $n2 = ($u2 -split "/")[-1]
if ($n1 -ne "1" -or $n2 -ne "2") { Write-Warning "Issue numbers are $n1 and $n2, not 1 and 2. Edit assets/config.js (issue: ...) to match, then commit and push." }
try { gh issue pin $n1 -R $repo; gh issue pin $n2 -R $repo } catch { Write-Host "Could not pin the issues. That is fine." }

# The downloads. The page counts downloads from these release files.
gh release create twitch-v1.1 downloads/EC_Twitch_v1.1.zip -R $repo -t "EC Twitch 1.1" -n "EC Twitch 1.1. Unzip it and follow INSTALL.txt."
gh release create deep-glow-2-v4.1.1 downloads/EC_Deep_Glow_2_v4.1.1.zip -R $repo -t "EC Deep Glow 2 4.1.1" -n "EC Deep Glow 2 4.1.1. Unzip it and follow INSTALL.txt."

Write-Host ""
Write-Host "Done. Repo: https://github.com/$repo"
Write-Host "Next: deploy it on Vercel (see README.md)."
