/*
  The song bank. Each song is a string: "Title|flag|flag=value".

  Flags:
    hit        released as a single under her own name
    vault      "From the Vault" track
    tag=X      where the song comes from (Deluxe, The Anthology, ...)
    feat=X     other credited artist, shown under the title
    note=X     film or show, shown under the title
    y=YYYY     release year, for non-album songs only

  Songs are in official track order, so track 5 is always the fifth entry.
  Share links store a song's position, so add new songs to the END of a list.
*/
(function (root) {
  const SECTIONS = [
    {
      code: "de", title: "Taylor Swift", short: "Debut", year: 2006,
      theme: { bg: "#DDEFE3", ink: "#0F3B2E", accent: "#1F7A5C", accentInk: "#FFFFFF" },
      songs: [
        "Tim McGraw|hit", "Picture to Burn|hit", "Teardrops on My Guitar|hit",
        "A Place in This World", "Cold as You", "The Outside",
        "Tied Together with a Smile", "Stay Beautiful", "Should've Said No|hit",
        "Mary's Song (Oh My My My)", "Our Song|hit",
        "I'm Only Me When I'm with You|tag=Deluxe", "Invisible|tag=Deluxe",
        "A Perfectly Good Heart|tag=Deluxe",
      ],
    },
    {
      code: "fe", title: "Fearless", short: "Fearless", year: 2008,
      theme: { bg: "#F7E7B0", ink: "#4A3508", accent: "#8A5F07", accentInk: "#FFFFFF" },
      songs: [
        "Fearless|hit", "Fifteen|hit", "Love Story|hit", "Hey Stephen",
        "White Horse|hit", "You Belong with Me|hit", "Breathe|feat=Colbie Caillat",
        "Tell Me Why", "You're Not Sorry", "The Way I Loved You", "Forever & Always",
        "The Best Day", "Change",
        "Jump Then Fall|tag=Platinum", "Untouchable|tag=Platinum",
        "Come In with the Rain|tag=Platinum", "SuperStar|tag=Platinum",
        "The Other Side of the Door|tag=Platinum",
        "Today Was a Fairytale|hit|note=Valentine's Day",
        "You All Over Me|vault|feat=Maren Morris", "Mr. Perfectly Fine|vault",
        "We Were Happy|vault", "That's When|vault|feat=Keith Urban", "Don't You|vault",
        "Bye Bye Baby|vault",
      ],
    },
    {
      code: "sn", title: "Speak Now", short: "Speak Now", year: 2010,
      theme: { bg: "#EADCF5", ink: "#33124F", accent: "#6C2BA6", accentInk: "#FFFFFF" },
      songs: [
        "Mine|hit", "Sparks Fly|hit", "Back to December|hit", "Speak Now", "Dear John",
        "Mean|hit", "The Story of Us|hit", "Never Grow Up", "Enchanted",
        "Better than Revenge", "Innocent", "Haunted", "Last Kiss", "Long Live|hit",
        "Ours|hit|tag=Deluxe", "Superman|tag=Deluxe",
        "Electric Touch|vault|feat=Fall Out Boy", "When Emma Falls in Love|vault",
        "I Can See You|vault", "Castles Crumbling|vault|feat=Hayley Williams",
        "Foolish One|vault", "Timeless|vault",
        "If This Was a Movie|tag=Deluxe",
      ],
    },
    {
      code: "re", title: "Red", short: "Red", year: 2012,
      theme: { bg: "#7E1220", ink: "#FFF1EC", accent: "#FFD9CF", accentInk: "#5A0C16" },
      songs: [
        "State of Grace", "Red|hit", "Treacherous", "I Knew You Were Trouble|hit",
        "All Too Well", "22|hit", "I Almost Do",
        "We Are Never Ever Getting Back Together|hit", "Stay Stay Stay",
        "The Last Time|hit|feat=Gary Lightbody", "Holy Ground", "Sad Beautiful Tragic",
        "The Lucky One", "Everything Has Changed|hit|feat=Ed Sheeran", "Starlight",
        "Begin Again|hit",
        "The Moment I Knew|tag=Deluxe", "Come Back... Be Here|tag=Deluxe",
        "Girl at Home|tag=Deluxe", "Ronan|hit|note=Charity single",
        "Better Man|vault", "Nothing New|vault|feat=Phoebe Bridgers", "Babe|vault",
        "Message in a Bottle|hit|vault",
        "I Bet You Think About Me|hit|vault|feat=Chris Stapleton",
        "Forever Winter|vault", "Run|vault|feat=Ed Sheeran", "The Very First Night|vault",
        "All Too Well (10 Minute Version)|vault",
      ],
    },
    {
      code: "ne", title: "1989", short: "1989", year: 2014,
      theme: { bg: "#CFE8F6", ink: "#0F3550", accent: "#1C6E9E", accentInk: "#FFFFFF" },
      songs: [
        "Welcome to New York", "Blank Space|hit", "Style|hit", "Out of the Woods|hit",
        "All You Had to Do Was Stay", "Shake It Off|hit", "I Wish You Would",
        "Bad Blood|hit", "Wildest Dreams|hit", "How You Get the Girl", "This Love",
        "I Know Places", "Clean",
        "Wonderland|tag=Deluxe", "You Are in Love|tag=Deluxe",
        "New Romantics|hit|tag=Deluxe",
        "\"Slut!\"|hit|vault", "Say Don't Go|vault", "Now That We Don't Talk|vault",
        "Suburban Legends|vault", "Is It Over Now?|hit|vault",
      ],
    },
    {
      code: "rp", title: "reputation", short: "reputation", year: 2017,
      theme: { bg: "#121212", ink: "#F2F2F2", accent: "#EDEDED", accentInk: "#111111" },
      songs: [
        "...Ready for It?|hit", "End Game|hit|feat=Ed Sheeran & Future",
        "I Did Something Bad", "Don't Blame Me", "Delicate|hit",
        "Look What You Made Me Do|hit", "So It Goes...", "Gorgeous", "Getaway Car|hit",
        "King of My Heart", "Dancing with Our Hands Tied", "Dress",
        "This Is Why We Can't Have Nice Things", "Call It What You Want",
        "New Year's Day|hit",
      ],
    },
    {
      code: "lo", title: "Lover", short: "Lover", year: 2019,
      theme: { bg: "#FBD9E8", ink: "#5A1C43", accent: "#B4256E", accentInk: "#FFFFFF" },
      songs: [
        "I Forgot That You Existed", "Cruel Summer|hit", "Lover|hit", "The Man|hit",
        "The Archer", "I Think He Knows", "Miss Americana & the Heartbreak Prince",
        "Paper Rings", "Cornelia Street", "Death by a Thousand Cuts", "London Boy",
        "Soon You'll Get Better|feat=The Chicks", "False God", "You Need to Calm Down|hit",
        "Afterglow", "ME!|hit|feat=Brendon Urie", "It's Nice to Have a Friend", "Daylight",
      ],
    },
    {
      code: "fo", title: "folklore", short: "folklore", year: 2020,
      theme: { bg: "#E3E3E0", ink: "#2B2B2B", accent: "#55585A", accentInk: "#FFFFFF" },
      songs: [
        "the 1", "cardigan|hit", "the last great american dynasty",
        "exile|hit|feat=Bon Iver", "my tears ricochet", "mirrorball", "seven", "august",
        "this is me trying", "illicit affairs", "invisible string", "mad woman", "epiphany",
        "betty|hit", "peace", "hoax", "the lakes|tag=Deluxe",
      ],
    },
    {
      code: "ev", title: "evermore", short: "evermore", year: 2020,
      theme: { bg: "#E6D2BA", ink: "#3D2410", accent: "#8C4E1C", accentInk: "#FFFFFF" },
      songs: [
        "willow|hit", "champagne problems", "gold rush", "'tis the damn season",
        "tolerate it", "no body, no crime|hit|feat=HAIM", "happiness", "dorothea",
        "coney island|hit|feat=The National", "ivy", "cowboy like me", "long story short",
        "marjorie", "closure", "evermore|feat=Bon Iver",
        "right where you left me|tag=Deluxe", "it's time to go|tag=Deluxe",
      ],
    },
    {
      code: "mi", title: "Midnights", short: "Midnights", year: 2022,
      theme: { bg: "#141B3C", ink: "#EDEBFF", accent: "#B7B3FF", accentInk: "#141B3C" },
      songs: [
        "Lavender Haze|hit", "Maroon", "Anti-Hero|hit",
        "Snow on the Beach|hit|feat=Lana Del Rey", "You're on Your Own, Kid", "Midnight Rain",
        "Question...?", "Vigilante Shit", "Bejeweled", "Labyrinth", "Karma|hit",
        "Sweet Nothing", "Mastermind",
        "The Great War|tag=3am Edition", "Bigger Than the Whole Sky|tag=3am Edition",
        "Paris|tag=3am Edition", "High Infidelity|tag=3am Edition", "Glitch|tag=3am Edition",
        "Would've, Could've, Should've|tag=3am Edition", "Dear Reader|tag=3am Edition",
        "Hits Different|tag=Til Dawn Edition", "You're Losing Me|vault",
      ],
    },
    {
      code: "tt", title: "The Tortured Poets Department", short: "TTPD", year: 2024,
      theme: { bg: "#F3EEE3", ink: "#2A2622", accent: "#6B6259", accentInk: "#FFFFFF" },
      songs: [
        "Fortnight|hit|feat=Post Malone", "The Tortured Poets Department",
        "My Boy Only Breaks His Favorite Toys", "Down Bad", "So Long, London",
        "But Daddy I Love Him", "Fresh Out the Slammer",
        "Florida!!!|feat=Florence + the Machine", "Guilty as Sin?",
        "Who's Afraid of Little Old Me?", "I Can Fix Him (No Really I Can)", "loml",
        "I Can Do It with a Broken Heart|hit", "The Smallest Man Who Ever Lived",
        "The Alchemy", "Clara Bow",
        "The Black Dog|tag=The Anthology", "imgonnagetyouback|tag=The Anthology",
        "The Albatross|tag=The Anthology", "Chloe or Sam or Sophia or Marcus|tag=The Anthology",
        "How Did It End?|tag=The Anthology", "So High School|tag=The Anthology",
        "I Hate It Here|tag=The Anthology", "thanK you aIMee|tag=The Anthology",
        "I Look in People's Windows|tag=The Anthology", "The Prophecy|tag=The Anthology",
        "Cassandra|tag=The Anthology", "Peter|tag=The Anthology", "The Bolter|tag=The Anthology",
        "Robin|tag=The Anthology", "The Manuscript|tag=The Anthology",
      ],
    },
    {
      code: "sg", title: "The Life of a Showgirl", short: "Showgirl", year: 2025,
      theme: { bg: "#0B5C55", ink: "#FFF4E3", accent: "#FF9A3D", accentInk: "#3A1C00" },
      songs: [
        "The Fate of Ophelia|hit", "Elizabeth Taylor|hit", "Opalite|hit", "Father Figure",
        "Eldest Daughter", "Ruin the Friendship", "Actually Romantic", "Wi$h Li$t", "Wood",
        "CANCELLED!", "Honey", "The Life of a Showgirl|feat=Sabrina Carpenter",
        "Patient Zero|hit|tag=The Encore|y=2026", "Cleveland!|tag=The Encore|y=2026",
        "Pink Clouding|tag=The Encore|y=2026", "Babylon|tag=The Encore|y=2026",
      ],
    },
    {
      code: "xx", title: "Non-album songs", short: "Non-album", year: null,
      theme: { bg: "#FFF3E8", ink: "#2A2233", accent: "#8B3A62", accentInk: "#FFFFFF" },
      groups: [
        {
          name: "Movies & TV",
          kind: "soundtrack",
          songs: [
            "Crazier|note=Hannah Montana: The Movie|y=2009",
            "Safe & Sound|feat=The Civil Wars|note=The Hunger Games|y=2011",
            "Eyes Open|hit|note=The Hunger Games|y=2012",
            "Sweeter than Fiction|note=One Chance|y=2013",
            "I Don't Wanna Live Forever|hit|feat=ZAYN|note=Fifty Shades Darker|y=2016",
            "Beautiful Ghosts|note=Cats|y=2019",
            "Macavity|feat=Idris Elba|note=Cats|y=2019",
            "Only the Young|note=Miss Americana|y=2020",
            "Carolina|note=Where the Crawdads Sing|y=2022",
            "I Knew It, I Knew You|hit|note=Toy Story 5|y=2026",
          ],
        },
        {
          name: "Collabs & guest spots",
          kind: "collab",
          songs: [
            "Hold On|feat=Jack Ingram|y=2007",
            "Best Days of Your Life|feat=Kellie Pickler|note=Backing vocals|y=2008",
            "Two Is Better Than One|feat=Boys Like Girls|y=2009",
            "Half of My Heart|feat=John Mayer|y=2009",
            "Both of Us|feat=B.o.B|y=2012",
            "Highway Don't Care|hit|feat=Tim McGraw & Keith Urban|y=2013",
            "Gasoline|feat=HAIM|y=2021",
            "Renegade|feat=Big Red Machine|y=2021",
            "Birch|feat=Big Red Machine|y=2021",
            "The Joker and the Queen|feat=Ed Sheeran|y=2022",
            "The Alcott|feat=The National|y=2023",
            "us.|feat=Gracie Abrams|y=2024",
          ],
        },
        {
          name: "One-offs & rarities",
          kind: "oneoff",
          songs: [
            "Beautiful Eyes|note=Beautiful Eyes EP|y=2008",
            "I Heart ?|note=Beautiful Eyes EP|y=2008",
            "American Girl|note=Tom Petty cover|y=2009",
            "September|note=Earth, Wind & Fire cover|y=2018",
            "All of the Girls You Loved Before|y=2023",
          ],
        },
        {
          name: "Holiday",
          kind: "holiday",
          songs: [
            "Last Christmas|note=Wham! cover|y=2007",
            "Christmases When You Were Mine|y=2007",
            "Santa Baby|note=Holiday standard|y=2007",
            "Silent Night|note=Holiday standard|y=2007",
            "Christmas Must Be Something More|y=2007",
            "White Christmas|note=Holiday standard|y=2007",
            "Christmas Tree Farm|hit|y=2019",
          ],
        },
      ],
    },
  ];

  /*
    Free Google Fonts that look like each era's lettering. The originals are mostly
    commercial, or her own handwriting. `display` is for headlines, and `text` is for
    longer copy on the results page (the system font if left out).
    scale evens out fonts that look small at the same size. IM Fell's 1 looks like an I,
    so oldstyleDigits sets numbers in the text font instead.
  */
  const QUIZ_SANS = { family: "Jost", css: "Jost:ital,wght@0,400..800;1,400..800", weight: 700, scale: 1, sans: true };
  const FONTS = {
    de: { display: { family: "Yellowtail", css: "Yellowtail", weight: 400, scale: 1.15 } },
    fe: { display: { family: "Arsenal", css: "Arsenal:wght@700", weight: 700, scale: 1 } },
    sn: { display: { family: "Rochester", css: "Rochester", weight: 400, scale: 1.15 } },
    re: { display: { family: "Anton", css: "Anton", weight: 400, scale: 1, upper: true } },
    ne: { display: { family: "Permanent Marker", css: "Permanent+Marker", weight: 400, scale: 0.92 } },
    rp: { display: { family: "UnifrakturMaguntia", css: "UnifrakturMaguntia", weight: 400, scale: 1.15 } },
    lo: { display: { family: "Satisfy", css: "Satisfy", weight: 400, scale: 1.2 } },
    fo: {
      display: { family: "IM Fell DW Pica", css: "IM+Fell+DW+Pica", weight: 400, scale: 1.05, oldstyleDigits: true },
      text: { family: "Libre Caslon Text", css: "Libre+Caslon+Text:ital@0;1" },
    },
    ev: {
      display: { family: "IM Fell DW Pica", css: "IM+Fell+DW+Pica", weight: 400, scale: 1.05, oldstyleDigits: true },
      text: { family: "Libre Caslon Text", css: "Libre+Caslon+Text:ital@0;1" },
    },
    mi: { display: { family: "Inter Tight", css: "Inter+Tight:wght@600", weight: 600, scale: 0.92 } },
    tt: {
      display: { family: "Libre Caslon Display", css: "Libre+Caslon+Display", weight: 400, scale: 1.05 },
      text: { family: "Libre Caslon Text", css: "Libre+Caslon+Text:ital@0;1" },
    },
    sg: { display: { family: "Barlow Condensed", css: "Barlow+Condensed:ital,wght@1,800", weight: 800, italic: true, scale: 1.08, upper: true } },
    xx: { display: QUIZ_SANS },
  };
  SECTIONS.forEach((section) => { section.font = FONTS[section.code]; });

  root.TS_SECTIONS = SECTIONS;
  if (typeof module !== "undefined") module.exports = SECTIONS;
})(typeof window !== "undefined" ? window : globalThis);
