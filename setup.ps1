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
$u3 = gh issue create -R $repo -t "EC Outline Glow: likes and comments" -b "Leave a thumbs-up or heart on this post to like EC Outline Glow. Write comments below. They show on the EC Outline Glow page."
$u4 = gh issue create -R $repo -t "EC Neon Outline: likes and comments" -b "Leave a thumbs-up or heart on this post to like EC Neon Outline. Write comments below. They show on the EC Neon Outline page."
$n1 = ($u1 -split "/")[-1]; $n2 = ($u2 -split "/")[-1]; $n3 = ($u3 -split "/")[-1]; $n4 = ($u4 -split "/")[-1]
if ($n1 -ne "1" -or $n2 -ne "2" -or $n3 -ne "3" -or $n4 -ne "4") { Write-Warning "Issue numbers are $n1, $n2, $n3, $n4, not 1 to 4. Edit assets/config.js (issue: ...) to match, then commit and push." }
try { gh issue pin $n1 -R $repo; gh issue pin $n2 -R $repo } catch { Write-Host "Could not pin the issues. That is fine." }

# The downloads. The page counts downloads from these release files.
gh release create twitch-v1.1.1 downloads/EC_Twitch_v1.1.1.zip -R $repo -t "EC Twitch 1.1.1" -n "EC Twitch 1.1.1. Unzip it and follow INSTALL.txt."
gh release create deep-glow-2-v5.0.0 downloads/EC_Deep_Glow_2_v5.0.0.zip -R $repo -t "EC Deep Glow 2 5.0.0" -n "EC Deep Glow 2 5.0.0. Unzip it and follow INSTALL.txt."
gh release create outline-glow-v1.4.0 downloads/EC_Outline_Glow_v1.4.0.zip -R $repo -t "EC Outline Glow 1.4.0" -n "EC Outline Glow 1.4.0. Unzip it and follow INSTALL.txt."
gh release create neon-outline-v3.2.0 downloads/EC_Neon_Outline_v3.2.0.zip -R $repo -t "EC Neon Outline 3.2.0" -n "EC Neon Outline 3.2.0. Unzip it and follow INSTALL.txt."

Write-Host ""
Write-Host "Done. Repo: https://github.com/$repo"
Write-Host "Next: deploy it on Vercel (see README.md)."
