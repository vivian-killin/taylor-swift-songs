# Top 10 (Your Version)

A mobile-first quiz for ranking your 10 favorite Taylor Swift songs. It finishes with an album breakdown, a playful persona, superlatives and a shareable image with an optional name ("Top 10 Taylor Swift Songs: Vivian's Version").

It's a fan-made project, not affiliated with Taylor Swift or her labels. It uses song titles only, with no lyrics, audio or cover art.

## How it works

1. **Pick:** tap up to 5 favorites from each of the 12 albums, plus a non-album section. Search finds any song from any screen.
2. **Cut:** keep 10 from that shortlist.
3. **Rank:** drag them into order.
4. **Results:** every shortlisted song earns 1 point, and the top 10 earn 10 more points for #1, down to 1 more for #10. Those points drive the album breakdown and persona.

The site has no backend, accounts or tracking. Progress is saved in the person's browser, and share links carry the results (and the optional name) in the URL. The only outside requests are for Google Fonts.

## Site address

The site lives at https://vivian-killin.github.io/taylor-swift-songs/. Share images and share links use the address in `js/config.js`, so update it there if this ever changes.

## Fonts

All fonts are free lookalikes from Google Fonts, because the originals are mostly commercial or her own handwriting. Fan sources disagree on several of them. The quiz uses Jost, a clean retro sans serif chosen for readability. Results use a font based on the person's top album:

| Album | Font |
|---|---|
| Taylor Swift | Yellowtail |
| Fearless | Arsenal |
| Speak Now | Rochester |
| Red | Anton |
| 1989 | Permanent Marker |
| reputation | UnifrakturMaguntia |
| Lover | Satisfy |
| folklore, evermore | IM Fell DW Pica |
| Midnights | Inter Tight |
| The Tortured Poets Department | Libre Caslon |
| The Life of a Showgirl | Barlow Condensed |
| Non-album | Jost |

To change one, edit `FONTS` at the bottom of `js/data.js`.

## Put it on GitHub Pages

1. Create a new public repository on GitHub, named exactly `taylor-swift-songs`.
2. Choose **uploading an existing file** and drag in everything inside this folder: `index.html`, `README.md`, and the `css`, `js` and `tests` folders.
3. Commit the upload.
4. Go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)`, and save.
5. After a minute or two, the site is live at https://vivian-killin.github.io/taylor-swift-songs/.

## What's in the song bank

There are 282 songs, current as of November 1, 2026:

- All 12 studio albums, including deluxe, Platinum, 3am and Anthology tracks, The Encore and all vault tracks.
- 34 non-album songs: movies and TV, collabs and guest spots, one-offs and holiday songs.

Original and Taylor's Version recordings count as one song. "All Too Well (10 Minute Version)" stays separate.

**Left out on purpose:**

| Why | Songs |
|---|---|
| Live recordings | "Baby", "Bette Davis Eyes", "Breathless", "Drops of Jupiter", "I Want You Back", "Umbrella", "Big Star" (with Kenny Chesney) |
| Alternate versions and remixes | "Lover (Remix)", "Long Live" (Brazilian version), and acoustic, piano and other remixed versions. The "Bad Blood", "Karma" and "Snow on the Beach" variants count as the album song. |
| She wrote it but isn't heard on it | "This Is What You Came For", "You'll Always Find Your Way Back Home", "Bein' With My Baby", "1 Step Forward, 3 Steps Back", "Deja Vu" |
| Not a song, or never released | "Taylor Swift's 1st Phone Call with Tim McGraw", SNL songs, unreleased demos |
| Credited to a choir | "God Bless the Children" |

The list was checked row by row against Wikipedia's [List of songs by Taylor Swift](https://en.wikipedia.org/wiki/List_of_songs_by_Taylor_Swift) and each album's track listing.

## Update it

- **New songs:** add them to the **end** of a list in `js/data.js`. Share links store each song's position, so inserting one mid-list would change old links. Don't reorder existing songs for the same reason.
- **Personas and superlatives:** the copy and rules are in `js/logic.js`.
- **Tests:** run these after any change (needs [Node](https://nodejs.org)):

```bash
node tests/run.js
```
