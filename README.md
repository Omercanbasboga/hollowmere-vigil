# Hollowmere: The Vigil

A short branching text adventure set in the same world as [hollowmere](https://github.com/Omercanbasboga/hollowmere). Different game, different mechanic, same ruins.

Play it here: [live link once deployed]

## What it is

You're a Warden sent down into the ruins under Hollowmere to find out why the old wards are
failing faster than the last report said. It plays out over about a dozen scenes and takes
somewhere around 20-30 minutes depending on how much you read and how careful you are.

Two stats: HP and Resolve. Most choices cost one or the other, or risk one or the other. What
you pick up along the way (a page from an old ledger, a serpent's scale) can open up different
options later, so the same choice doesn't always mean the same thing twice.

There are three different middle sections (the flooded tunnel, the ash shrine, the bone vault)
and you only get to see one per run, plus a few different endings depending on how the last
scene goes. Worth playing more than once.

## Why it's built this way

No build step, no framework, just a scene graph in `script.js` (an object where each scene
has some text, a mood color, and a list of choices with effects and requirements) and a render
function that redraws the HUD and the current scene whenever something changes. Choices can
have a `requires()` check that locks them out if you don't have the resolve, relic, or history
for them, and a couple of choice labels are functions instead of plain strings so the button
text itself updates once you actually have what you'd need.

The pixel-art feel is CSS and two Google Fonts (Press Start 2P for headers, VT323 for body
text so it's still readable at length), not actual sprite art. Same reused SVG bestiary icons
as `hollowmere`, so a Grave Moth looks like the same Grave Moth in both games.

Music is two CC0 tracks from OpenGameArt.org: "Spooky Dungeon" by Memoraphile for the theme,
and "Loopable Dungeon Ambience" by JaggedStone layered underneath. Both attributed in the
footer. Off by default, there's a toggle in the header.

## Running locally

Static page, no build step:

```bash
python3 -m http.server 8000
```

then open `localhost:8000`.
