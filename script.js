const MAX_HP_START = 10;
const MAX_RESOLVE_START = 8;

const state = {
  hp: MAX_HP_START,
  maxHp: MAX_HP_START,
  resolve: 5,
  maxResolve: MAX_RESOLVE_START,
  relics: [],
  flags: new Set(),
  sceneId: "start",
  dead: false,
};

function hasRelic(name) {
  return state.relics.includes(name);
}

function damage(n) {
  state.hp = Math.max(0, state.hp - n);
}

function heal(n) {
  state.hp = Math.min(state.maxHp, state.hp + n);
}

function spendResolve(n) {
  state.resolve = Math.max(0, state.resolve - n);
}

function gainResolve(n) {
  state.resolve = Math.min(state.maxResolve, state.resolve + n);
}

// Every scene has a mood color for the backdrop and, where it fits, an
// SVG icon from the shared Hollowmere bestiary so the two games read as
// the same world.
const SCENES = {
  start: {
    title: "The Broken Gate",
    mood: "amber",
    text: "The gate into Hollowmere's under-ruins was sealed once. It isn't anymore. Cold air moves up out of the dark, carrying dust and something under the dust. Your torch is lit. The wards down here are failing faster than the last report said, and you're the one sent to find out why.",
    choices: [
      {
        label: "Move quickly, the wards won't wait",
        next: "archive",
        effect: () => state.flags.add("bold_start"),
      },
      {
        label: "Move carefully, listen before you step",
        next: "archive",
        effect: () => state.flags.add("careful_start"),
      },
    ],
  },

  archive: {
    title: "The Old Archive",
    mood: "amber",
    icon: "icon-scroll",
    text: "A side chamber, shelves collapsed into each other. Someone kept records here once. A few ledger pages have survived the damp, if you want to dig for them.",
    choices: [
      {
        label: "Search for anything useful (costs 1 Resolve)",
        requires: () => state.resolve >= 1,
        lockedLabel: "Search for anything useful (needs 1 Resolve)",
        next: "moth_swarm",
        effect: () => {
          spendResolve(1);
          state.relics.push("cracked ledger page");
          state.flags.add("has_ledger");
        },
      },
      {
        label: "Skim quickly and move on",
        next: "moth_swarm",
        effect: () => {},
      },
      {
        label: "Leave it, time is short",
        next: "moth_swarm",
        effect: () => {},
      },
    ],
  },

  moth_swarm: {
    title: "Grave Moths",
    mood: "violet",
    icon: "icon-moth",
    text: "A crack in the ceiling, and out of it: Grave Moths, dozens of them, papery wings catching your torchlight. They aren't fast. They aren't smart. There are a lot of them.",
    choices: [
      {
        label: "Ward them off (needs 2 Resolve)",
        requires: () => state.resolve >= 2,
        lockedLabel: "Ward them off (needs 2 Resolve)",
        next: "the_hall",
        effect: () => {
          spendResolve(2);
          state.flags.add("sealed_moths");
        },
      },
      {
        label: "Push through and keep moving",
        next: "the_hall",
        effect: () => damage(1),
      },
      {
        label: "Stand still and let them pass over you",
        next: "the_hall",
        effect: () => {
          if (Math.random() < 0.5) damage(2);
        },
      },
    ],
  },

  the_hall: {
    title: "The Warden's Hall",
    mood: "amber",
    text: "A wide chamber, half collapsed. The ward-stone at its center is cracked clean through, the failing light inside it flickering in a way it shouldn't. Three passages lead further down. You can only take one before the light in the stone gives out completely.",
    choices: [
      {
        label: "South, into the flooded tunnels",
        next: "serpent_tunnel",
        effect: () => {},
      },
      {
        label: "East, toward the ash-choked shrine",
        next: "ashling_shrine",
        effect: () => {},
      },
      {
        label: "Down, into the bone vault",
        next: "bone_vault",
        effect: () => {},
      },
    ],
  },

  serpent_tunnel: {
    title: "The Flooded Tunnel",
    mood: "green",
    icon: "icon-serpent",
    text: "Black water, ankle deep, then knee deep. Something long moves under the surface, keeping pace with you without ever quite surfacing. A Fen Serpent, patient about it.",
    choices: [
      {
        label: () =>
          hasRelic("cracked ledger page")
            ? "Trade the ledger page for safe passage"
            : "Offer something of yours for safe passage (costs 1 HP)",
        next: "the_deep",
        effect: () => {
          if (hasRelic("cracked ledger page")) {
            state.relics = state.relics.filter((r) => r !== "cracked ledger page");
          } else {
            damage(1);
          }
          state.flags.add("serpent_ally");
        },
      },
      {
        label: "Try to slip past quietly (needs 3 Resolve)",
        requires: () => state.resolve >= 3,
        lockedLabel: "Try to slip past quietly (needs 3 Resolve)",
        next: "the_deep",
        effect: () => spendResolve(3),
      },
      {
        label: "Force your way through",
        next: "the_deep",
        effect: () => {
          damage(2);
          state.relics.push("serpent scale");
        },
      },
    ],
  },

  ashling_shrine: {
    title: "The Ash-Choked Shrine",
    mood: "orange",
    icon: "icon-ashling",
    text: "Burn marks on every wall, old enough to have their own dust. A single wisp of flame hangs in the middle of the room, watching you the way fire shouldn't be able to.",
    choices: [
      {
        label: () =>
          hasRelic("cracked ledger page")
            ? "Speak the old rite you found in the ledger"
            : "Speak the old rite (you don't know it)",
        requires: () => hasRelic("cracked ledger page"),
        lockedLabel: "Speak the old rite (needs the ledger page)",
        next: "the_deep",
        effect: () => state.flags.add("ashling_calmed"),
      },
      {
        label: "Douse it and push past",
        next: "the_deep",
        effect: () => {
          spendResolve(1);
          state.flags.add("ashling_doused");
        },
      },
      {
        label: "Back away and leave it be",
        next: "the_deep",
        effect: () => state.flags.add("ashling_avoided"),
      },
    ],
  },

  bone_vault: {
    title: "The Bone Vault",
    mood: "bone",
    icon: "icon-bone",
    text: "Old bones, stacked floor to ceiling, most of them still. Not all of them. Something in the pile is trying to remember how to stand up.",
    choices: [
      {
        label: "Recite the Warden's rest-rite (needs 2 Resolve)",
        requires: () => state.resolve >= 2,
        lockedLabel: "Recite the Warden's rest-rite (needs 2 Resolve)",
        next: "the_deep",
        effect: () => {
          spendResolve(2);
          state.flags.add("bonewretch_rested");
        },
      },
      {
        label: "Break it apart before it finishes standing",
        next: "the_deep",
        effect: () => {
          damage(1);
          state.flags.add("bonewretch_broken");
        },
      },
      {
        label: "Retreat and seal the vault door",
        next: "the_deep",
        effect: () => state.flags.add("bonewretch_sealed"),
      },
    ],
  },

  the_deep: {
    title: "The Deep Passage",
    mood: "purple",
    text: "The last stretch. Whatever's actually wrong with the wards is close now, you can feel it in the stone under your boots. You could rest here a moment, if you've got anything worth spending on it.",
    choices: [
      {
        label: () =>
          hasRelic("serpent scale")
            ? "Trade the serpent scale to catch your breath (heal 2)"
            : "Rest a moment (nothing to trade)",
        requires: () => hasRelic("serpent scale"),
        lockedLabel: "Rest a moment (needs something to trade)",
        next: "drowspawn_reveal",
        effect: () => {
          state.relics = state.relics.filter((r) => r !== "serpent scale");
          heal(2);
        },
      },
      {
        label: "Press on, there's no time",
        next: "drowspawn_reveal",
        effect: () => {},
      },
    ],
  },

  drowspawn_reveal: {
    title: "The Cracked Ward-Stone",
    mood: "red",
    icon: "icon-drowspawn",
    text: "This is it. The ward-stone here isn't just cracked, it's being fed on, something coiled around its base pulling the last of the light out of it strand by strand. A Drowspawn. The one nobody wants to see reach the surface.",
    choices: [
      {
        label: () =>
          state.resolve >= 2
            ? "Strike hard, spend everything you've got (2 Resolve, risk 1 HP)"
            : "Strike hard (risk 3 HP)",
        next: "ending",
        effect: () => {
          if (state.resolve >= 2) {
            spendResolve(2);
            damage(1);
          } else {
            damage(3);
          }
          state.flags.add("fought_drowspawn");
        },
      },
      {
        label: () =>
          state.flags.has("sealed_moths") ||
          state.flags.has("ashling_calmed") ||
          state.flags.has("bonewretch_rested")
            ? "Use what you've learned to re-seal the stone"
            : "Try to re-seal the stone (you don't really know how)",
        requires: () =>
          state.flags.has("sealed_moths") ||
          state.flags.has("ashling_calmed") ||
          state.flags.has("bonewretch_rested"),
        lockedLabel: "Re-seal the stone (needs a rite you never learned)",
        next: "ending",
        effect: () => state.flags.add("resealed"),
      },
      {
        label: "Retreat and go warn the other Wardens",
        next: "ending",
        effect: () => state.flags.add("retreated"),
      },
    ],
  },
};

function currentScene() {
  return SCENES[state.sceneId];
}

function goToScene(id) {
  state.sceneId = id;
  if (state.hp <= 0) {
    state.sceneId = "ending";
  }
  render();
}

function chooseOption(choice) {
  choice.effect();
  if (state.hp <= 0) {
    state.dead = true;
    render();
    endRun();
    return;
  }
  if (choice.next === "ending") {
    render();
    endRun();
    return;
  }
  goToScene(choice.next);
}

function endingText() {
  if (state.dead) {
    return {
      title: "The Vigil Ends Here",
      text: "The dark takes what it wants sometimes. Your torch goes out before you can get back to the surface, and Hollowmere keeps one more thing it shouldn't.",
      variant: "lose",
    };
  }
  if (state.flags.has("resealed")) {
    return {
      title: "The Seal Holds",
      text: "You get the rite right, or close enough. The ward-stone flickers, steadies, and holds. It won't hold forever, nothing down here does, but it'll hold long enough for someone else to worry about it next.",
      variant: "win",
    };
  }
  if (state.flags.has("fought_drowspawn")) {
    return {
      title: "A Costly Watch",
      text: "You drive it off, more by stubbornness than skill. The ward-stone is still cracked, still weak, but the thing feeding on it is gone for now. You make it back to the surface carrying more bruises than answers.",
      variant: "neutral",
    };
  }
  return {
    title: "The Warning",
    text: "You don't stay to fight it. You make it back up and tell the other Wardens exactly what's down there, which is more than the last report managed. Someone braver, or more prepared, will have to finish this.",
    variant: "neutral",
  };
}

function endRun() {
  const result = endingText();
  const card = document.getElementById("end-card");
  card.classList.remove("overlay-card--win", "overlay-card--lose");
  if (result.variant === "win") card.classList.add("overlay-card--win");
  if (result.variant === "lose") card.classList.add("overlay-card--lose");

  document.getElementById("end-title").textContent = result.title;
  document.getElementById("end-text").textContent = result.text;
  document.getElementById("end-summary").textContent =
    `HP left: ${state.hp}/${state.maxHp}. Relics carried: ${state.relics.length ? state.relics.join(", ") : "none"}`;
  document.getElementById("end-overlay").hidden = false;
}

function renderStats() {
  const hpEl = document.getElementById("hp-pips");
  hpEl.innerHTML = "";
  for (let i = 0; i < state.maxHp; i++) {
    const pip = document.createElement("span");
    pip.className = "pip pip-hp" + (i < state.hp ? "" : " pip-empty");
    hpEl.appendChild(pip);
  }

  const resEl = document.getElementById("resolve-pips");
  resEl.innerHTML = "";
  for (let i = 0; i < state.maxResolve; i++) {
    const pip = document.createElement("span");
    pip.className = "pip pip-resolve" + (i < state.resolve ? "" : " pip-empty");
    resEl.appendChild(pip);
  }

  const relicsEl = document.getElementById("relics-list");
  relicsEl.textContent = state.relics.length ? state.relics.join(", ") : "none yet";
}

function renderScene() {
  const scene = currentScene();
  document.getElementById("scene-title").textContent = scene.title;
  document.getElementById("scene-text").textContent = scene.text;

  const backdrop = document.getElementById("backdrop");
  backdrop.className = "backdrop mood-" + scene.mood;
  backdrop.innerHTML = scene.icon
    ? `<svg class="backdrop-icon"><use href="#${scene.icon}"></use></svg>`
    : "";

  const choicesEl = document.getElementById("choices");
  choicesEl.innerHTML = "";
  scene.choices.forEach((choice) => {
    const allowed = choice.requires ? choice.requires() : true;
    const label = typeof choice.label === "function" ? choice.label() : choice.label;
    const btn = document.createElement("button");
    btn.className = "choice-btn" + (allowed ? "" : " choice-locked");
    btn.textContent = allowed || !choice.lockedLabel ? label : choice.lockedLabel;
    if (!allowed) {
      btn.disabled = true;
    } else {
      btn.addEventListener("click", () => chooseOption(choice));
    }
    choicesEl.appendChild(btn);
  });
}

function render() {
  renderStats();
  renderScene();
}

const soundToggle = document.getElementById("sound-toggle");
const themeAudio = document.getElementById("theme-audio");
const ambienceAudio = document.getElementById("ambience-audio");
let soundOn = false;

soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  if (soundOn) {
    themeAudio.volume = 0.25;
    ambienceAudio.volume = 0.35;
    themeAudio.play().catch(() => {});
    ambienceAudio.play().catch(() => {});
    soundToggle.textContent = "\u{1F50A} Sound on";
  } else {
    themeAudio.pause();
    ambienceAudio.pause();
    soundToggle.textContent = "\u{1F508} Sound off";
  }
});

document.getElementById("begin-button").addEventListener("click", () => {
  document.getElementById("intro-overlay").hidden = true;
  render();
});

document.getElementById("retry-button").addEventListener("click", () => {
  state.hp = MAX_HP_START;
  state.maxHp = MAX_HP_START;
  state.resolve = 5;
  state.maxResolve = MAX_RESOLVE_START;
  state.relics = [];
  state.flags = new Set();
  state.sceneId = "start";
  state.dead = false;
  document.getElementById("end-overlay").hidden = true;
  render();
});

render();
