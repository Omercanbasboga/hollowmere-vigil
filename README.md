# Hollowmere: The Vigil

A branching text RPG set in the same world as [hollowmere](https://github.com/Omercanbasboga/hollowmere). Different game, different mechanic, same ruins.

Play it here: [live link once deployed]

## What it is

Before the story starts you build a Warden: pick a difficulty (three separate locations under
Hollowmere, from a shallow cave to the deepest part anyone's come back from), pick a class
(Blade, Rite, or Shadow, each with its own starting stats), put a couple of extra points into
Might, Wits, or Nerve, and name them.

From there it plays out as a series of scenes and choices. Some choices are free, just
narrative branches. Others are checks, roll a d20, add the relevant stat, compare it to a
difficulty-adjusted target number, and depending on whether you clear it, the story actually
goes somewhere different, not just a different line of flavor text. Fail a check and you might
take damage, miss out on something, or end up in a worse fight later. Full English/Turkish
toggle, all scene text and UI included.

There are three different middle sections (the flooded tunnel, the ash shrine, the bone vault),
you only see one per run, and six different endings depending on your stats, your choices, and
how the final fight at the ward-stone goes for you.

## Why it's built this way

Still no build step, everything's in `script.js`: a `SCENES` object (scene text, backdrop mood,
and a list of choices), an `ENDINGS` object, and a small dice-check system (`rollCheck`) that
rolls against a stat and a difficulty-adjusted DC. A "check" choice carries an `onSuccess` and
an `onFail`, each with its own `next` scene, its own `effect`, and its own line of text, so
success and failure are genuinely different branches instead of the same branch with different
flavor text tacked on.

Every piece of scene and UI text is stored as `{ en, tr }` and a `t()` helper picks the current
language. A couple of choice labels are functions instead of plain strings, the same trick as
in `hollowmere`, so a button can read differently once you actually have the relic or the flag
it needs.

The pixel-art feel is still CSS and two Google Fonts (Press Start 2P for headers, VT323 for
body text), not sprite art, I don't have a way to generate real pixel art. Same SVG bestiary as
`hollowmere`, plus a few new icons for the classes and the d20.

Music is two CC0 tracks from OpenGameArt.org, same as before ("Spooky Dungeon" by Memoraphile,
"Loopable Dungeon Ambience" by JaggedStone, both attributed in the footer), now loaded lazily
through `new Audio()` on first toggle instead of pre-declared `<audio>` tags, with an error
listener so a failed load shows up in the button instead of just doing nothing.

## Running locally

Static page, no build step:

```bash
python3 -m http.server 8000
```

then open `localhost:8000`.
