# Hollowmere: The Vigil

A branching text RPG set in the same world as [hollowmere](https://github.com/Omercanbasboga/hollowmere). Different game, different mechanic, same ruins.

Play it here: [live link once deployed]

## What it is

Before the story starts you build a Warden: pick a difficulty (three separate locations under
Hollowmere, from a shallow cave to the deepest part anyone's come back from), pick a class
(Blade, Rite, or Shadow, each with its own starting stats and its own set of things only that
class can attempt), put a couple of extra points into Might, Wits, or Nerve, and name them.

From there it plays out as a long chain of scenes and choices, over a hundred of them across a
full run. Some choices are free, just narrative branches. Others are checks: roll a d20, add the
relevant stat, compare it to a difficulty-adjusted target number, and depending on whether you
clear it, the story actually goes somewhere different, not just a different line of flavor text.
A few are locked entirely behind a stat threshold, no roll involved, you either have it or you
don't. A few more are locked to one class only, things a Blade Warden can force open that a Rite
Warden can't, things a Rite Warden can read that nobody else can, places a Shadow Warden can slip
past that the other two have to fight through. Full English/Turkish toggle, everywhere, all of it.

There are three separate dungeons under the hub room (a flooded tunnel, an ash-choked shrine, a
bone vault), each one a real branching mini-adventure on its own with its own recurring hazards
and its own side content, you only see one per run, and six different endings depending on your
stats, your choices, and how the final fight at the ward-stone goes for you.

## Why it's built this way

Still no build step, everything's in `script.js`: a `SCENES` object (scene text, backdrop mood,
a list of choices), an `ENDINGS` object, and a small dice-check system (`rollCheck`) that rolls
against a stat and a difficulty-adjusted DC. A "check" choice carries an `onSuccess` and an
`onFail`, each with its own `next` scene, its own `effect`, and its own line of text, so success
and failure are genuinely different branches instead of the same branch with different flavor
text tacked on. A `requires()` function on a choice can gate it behind a raw stat threshold or a
specific class, no roll needed for those, you either qualify or the option isn't there.

Every piece of scene and UI text is stored as `{ en, tr }` and a `t()` helper picks the current
language. A couple of choice labels are functions instead of plain strings, so a button can read
differently once you actually have the relic or the flag it needs.

Character portraits and the five creatures use real pixel-art sprites now instead of the hand-drawn
SVG line icons from the first pass, sourced from Kenney.nl, an itch.io CC0 dungeon pack, and a
handful of individually-checked CC0 pieces on OpenGameArt.org (full list and license text for
every single file in `assets/CREDITS.md`). A couple of matches are better than others, the
Shadow Warden portrait especially reads more like an elder than a rogue, there just wasn't a
cleaner CC0 hooded-rogue sprite out there. The scene backdrops layer a tiled pixel texture under
the existing color-mood gradient rather than a one-off illustration per scene, since the assets
on hand are tileable dungeon textures, not bespoke scene art.

Music is two CC0 ambient/theme tracks from OpenGameArt.org, plus a win jingle and a lose jingle
from a CC-BY 8-bit sound library (attribution in the footer), all loaded lazily through
`new Audio()` on first use instead of pre-declared `<audio>` tags, with an error listener so a
failed load shows up in the button instead of just doing nothing. The ending screen swaps in a
different icon and plays the matching jingle depending on whether the run ended in a win, a loss,
or somewhere in between. There's a short loading screen on first load too, mostly there to let
the pixel font and the sprite sheets actually finish loading before the character-creation screen
shows up looking right.

## Running locally

Static page, no build step:

```bash
python3 -m http.server 8000
```

then open `localhost:8000`.
