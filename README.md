# Top 10 (Your Version)

A mobile-first quiz for ranking your 10 favorite Taylor Swift songs. It finishes with an album breakdown, a playful persona, superlatives and four shareable image cards with an optional name ("Top 10 Taylor Swift Songs: Vivian's Version").

It's a fan-made project, not affiliated with Taylor Swift or her labels. It uses song titles only, with no lyrics, audio or cover art.

## How it works

1. **Pick:** check as many favorites as you like on each page: the 12 albums, plus one page of non-album songs. Any page can be skipped. Search finds songs from any album by title, featured artist or movie.
2. **Narrow it down:** keep 10 from that shortlist. People need at least 10 picks to continue.
3. **Rank:** drag the 10 into order, or use the arrows.
4. **See results:** one of 13 personas, then tabs for the top 10, album breakdown, three superlatives and the full shortlist.
5. **Share:** in the Share tab, add a name if you like, then swipe between the Top 10, Albums, Superlatives and Shortlist cards. Share and Save image use the card in view, and **Save all** saves every card at once. There's also a link to the full results.

**How the results are worked out**

- **Album breakdown:** every shortlisted song earns 1 point, and the top 10 earn more on top of that: 10 for #1, down to 1 for #10.
- **Personas:** the ranked top 10 counts for 70% and the shortlist for 30%, so picking more songs doesn't water down a favorite album.
- **Shortlist card:** it fits up to 30 songs. Past that, it keeps the top 10 and takes the rest evenly across albums. The full list is always in the Shortlist tab.
- **Colors and headline font:** these come from the album that leads on the same 70/30 split as personas, so a long shortlist from one album doesn't outweigh a ranked favorite.

**Saving images:** on iPhones and iPads, **Save image** opens the share menu, where people tap **Save Image** to add it to Photos, because a website can't save straight to Photos. Android and computers download the file. If a browser can't share a file, **Share** saves the image instead.

The site has no backend, accounts or tracking. Progress is saved in the person's browser until they choose **Start over and clear my results**, which also clears their name. Share links carry the results and optional name in the URL. The only outside requests are for Google Fonts.

## Site address

The site lives at https://vivian-killin.github.io/taylor-swift-songs/. Share images and share links use the address in `js/config.js`, so update it there if this ever changes.

## Fonts

All fonts are free lookalikes from Google Fonts, because the originals are mostly commercial or her own handwriting. Fan sources disagree on several of them. The quiz uses Jost, a clean retro sans serif chosen for readability. Results headlines use a font based on the person's top album:

| Album | Headline font |
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

Longer text on results pages uses Libre Caslon for folklore, evermore and The Tortured Poets Department, and the device's standard font for everything else. To change a font, edit `FONTS` at the bottom of `js/data.js`.

## Put it on GitHub Pages

1. Create a new public repository on GitHub, named exactly `taylor-swift-songs`.
2. Choose **uploading an existing file** and drag in everything inside this folder: `index.html`, `README.md`, and the `css`, `js` and `tests` folders.
3. Commit the upload.
4. Go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)`, and save.
5. After a minute or two, the site is live at https://vivian-killin.github.io/taylor-swift-songs/.

**To update the live site:** open the folder for the changed file on GitHub, choose **Add file → Upload files**, drag it in, and commit. Changes usually appear within a few minutes. If a phone still shows the old version, close the tab and reopen the site.

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
