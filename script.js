const CLASSES = {
  blade: {
    id: "blade",
    name: { en: "Blade Warden", tr: "Kılıç Muhafızı" },
    desc: {
      en: "Trained to meet trouble head-on. Strong, steady, not much for subtlety.",
      tr: "Dertle doğrudan yüzleşmek üzere yetişmiş. Güçlü, sağlam, inceliğe pek meraklı değil.",
    },
    stats: { str: 5, dex: 2, con: 3, int: 2, wis: 2, cha: 2 },
    hp: 28,
    icon: "icon-blade",
    portrait: "assets/class-blade.png",
  },
  rite: {
    id: "rite",
    name: { en: "Rite Warden", tr: "Ayin Muhafızı" },
    desc: {
      en: "Knows the old words better than the old fights. Reads a room, and a ward-stone, well.",
      tr: "Eski sözleri eski dövüşlerden daha iyi biliyor. Bir odayı da bir mühür taşını da iyi okur.",
    },
    stats: { str: 2, dex: 2, con: 2, int: 5, wis: 3, cha: 2 },
    hp: 20,
    icon: "icon-rite",
    portrait: "assets/class-rite.png",
  },
  shadow: {
    id: "shadow",
    name: { en: "Shadow Warden", tr: "Gölge Muhafızı" },
    desc: {
      en: "Would rather not be noticed at all. Usually gets their way.",
      tr: "Hiç fark edilmemeyi tercih eder. Genelde de öyle olur.",
    },
    stats: { str: 2, dex: 5, con: 2, int: 2, wis: 2, cha: 3 },
    hp: 20,
    icon: "icon-shadow",
    portrait: "assets/class-shadow.png",
  },
};

const DIFFICULTIES = {
  easy: {
    id: "easy",
    name: { en: "The Dusty Cave", tr: "Tozlu Mağara" },
    desc: {
      en: "A shallow, half-forgotten stretch of the ruins. Still dangerous. Less so than the rest.",
      tr: "Harabelerin sığ, yarı unutulmuş bir kısmı. Yine de tehlikeli. Diğerlerinden az.",
    },
    mod: -3,
  },
  medium: {
    id: "medium",
    name: { en: "The Owl's Tower", tr: "Baykuş Kulesi" },
    desc: {
      en: "An old watchtower the ruins swallowed whole. Something still roosts in it.",
      tr: "Harabelerin bütünüyle yuttuğu eski bir gözetleme kulesi. Hâlâ içinde bir şey tüneyip duruyor.",
    },
    mod: 0,
  },
  hard: {
    id: "hard",
    name: { en: "The Heart of Hollowmere", tr: "Hollowmere'in Kalbi" },
    desc: {
      en: "As deep as anyone has gone and come back to talk about it. Barely.",
      tr: "Birinin gidip de geri dönüp anlatabildiği en derin nokta. Zar zor.",
    },
    mod: 3,
  },
};

const STAT_LABEL = {
  str: { en: "Strength", tr: "Güç" },
  dex: { en: "Dexterity", tr: "Çeviklik" },
  con: { en: "Constitution", tr: "Dayanıklılık" },
  int: { en: "Intelligence", tr: "Zeka" },
  wis: { en: "Wisdom", tr: "Sezgi" },
  cha: { en: "Charisma", tr: "Karizma" },
};

// Real pixel-art sprites for the five creatures, some cropped out of a
// larger sheet (backgroundPos), the rest used whole. Falls back to the
// hand-drawn SVG line icon when a scene icon isn't in this list.
const CREATURE_SPRITES = {
  "icon-moth": { src: "assets/creature-moth.png", w: 8, h: 8, x: 0, y: 0 },
  "icon-bone": { src: "assets/creature-bonewretch.png", w: 64, h: 64, x: 0, y: 0 },
  "icon-serpent": { src: "assets/creature-serpent.png", w: 42, h: 42, x: 0, y: 0 },
  "icon-ashling": { src: "assets/creature-ashling.png", w: 65, h: 57, x: 390, y: 163 },
  "icon-drowspawn": { src: "assets/creature-drowspawn.png", w: 48, h: 48, x: 0, y: 0 },
};

const state = {
  lang: "en",
  screen: "difficulty",
  name: "",
  classId: null,
  difficultyId: null,
  stats: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  pointsLeft: 6,
  hp: 10,
  maxHp: 10,
  relics: [],
  flags: new Set(),
  sceneId: "start",
  dead: false,
  pendingCheck: null,
  lastRoll: null,
  musicVolume: 0.7,
  sfxVolume: 0.7,
  history: [],
  tookNoDamage: true,
  usedClassAbility: false,
  maxRelicsHeld: 0,
  firstCheckSeen: false,
};

const BADGES = [
  { id: "untouched", en: "Untouched", tr: "El Sürülmedi", check: () => state.tookNoDamage },
  { id: "true_to_class", en: "True to Class", tr: "Sınıfına Sadık", check: () => state.usedClassAbility },
  { id: "scavenger", en: "Scavenger", tr: "Yağmacı", check: () => state.maxRelicsHeld >= 2 },
  { id: "sealed_by_words", en: "Sealed by Words", tr: "Sözlerle Mühürlendi", check: () => state.flags.has("resealed") },
  { id: "survivor", en: "Survivor", tr: "Hayatta Kalan", check: () => !state.dead },
];

function t(pair) {
  return pair[state.lang];
}

function hasRelic(name) {
  return state.relics.includes(name);
}

function hasAnyFlag(...names) {
  return names.some((n) => state.flags.has(n));
}

function damage(n) {
  const before = state.hp;
  state.hp = Math.max(0, state.hp - n);
  if (state.hp < before) {
    state.tookNoDamage = false;
    triggerDamageFeedback();
  }
}

function heal(n) {
  state.hp = Math.min(state.maxHp, state.hp + n);
}

function triggerDamageFeedback() {
  const flash = document.getElementById("damage-flash");
  if (flash) {
    flash.classList.remove("damage-flash--play");
    void flash.offsetWidth;
    flash.classList.add("damage-flash--play");
  }
  const panel = document.querySelector(".story-panel");
  if (panel) {
    panel.classList.remove("shake");
    void panel.offsetWidth;
    panel.classList.add("shake");
  }
  playSfx("hit");
}

function difficultyMod() {
  return DIFFICULTIES[state.difficultyId].mod;
}

function rollCheck(statKey, dc) {
  const roll = 1 + Math.floor(Math.random() * 20);
  const statValue = state.stats[statKey];
  const total = roll + statValue;
  const target = dc + difficultyMod();
  const success = total >= target;
  return { roll, statValue, total, target, success, statKey };
}

// Scene text, choices and checks. A "check" choice rolls a d20 against a
// difficulty-adjusted DC using one of the three stats; success and failure
// can lead to different scenes entirely, not just different flavor text.
// Hollowmere: The Vigil -- expanded branch content
// Drop-in replacement for the current single-scene "serpent_tunnel",
// "ashling_shrine" and "bone_vault" stubs. Each branch below is a
// self-contained mini dungeon that eventually funnels back into the
// existing "the_deep" scene, which is not redefined here.
//
// Three exported objects: serpentBranch, ashlingBranch, boneBranch.
// Entry points for the hub to link to: serpent_01, ashling_01, bone_01.

// ============================================================
// FLOODED TUNNEL BRANCH -- Fen Serpent (prefix: serpent_)
// Recurring elements: collapsed sluice gates, slick/unstable footing,
// drowned old Warden gear, stale air pockets, blind cave eels.
// ============================================================

const serpentBranch = {
  serpent_01: {
    title: { en: "Into the Flood", tr: "Suların Altına" },
    mood: "green",
    icon: "icon-serpent",
    text: {
      en: "The tunnel mouth drops below the waterline almost at once. Cold water laps at broken stone, and somewhere ahead something moves in slow circles under the surface. Three ways forward: wade straight down the flooded main channel, pick along a narrow ledge that stays mostly dry, or work along the wall where the water pools deepest and the shadows are thickest.",
      tr: "Tünel ağzı hemen başında su seviyesinin altına iniyor. Soğuk su kırık taşların üzerinde çırpınıyor, ilerideki bir yerde bir şey suyun altında yavaş yavaş dönüyor. Üç yol var: sel basmış ana kanaldan doğrudan geçmek, kuru kalan dar bir çıkıntı boyunca ilerlemek ya da suyun en derin, gölgelerin en yoğun olduğu duvar kenarından sıyrılmak.",
    },
    choices: [
      { label: { en: "Wade the main channel", tr: "Ana kanaldan geç" }, next: "serpent_02a" },
      { label: { en: "Take the ledge", tr: "Çıkıntıdan ilerle" }, next: "serpent_02b" },
      {
        label: { en: "Slip along the deep shadow", tr: "Derin gölgeden sıyrıl" },
        classOnly: "shadow",
        next: "serpent_02c",
      },
    ],
  },

  serpent_02a: {
    title: { en: "Unsteady Ground", tr: "Kaygan Zemin" },
    mood: "green",
    text: {
      en: "The channel floor is slick with old algae and loose gravel. Every step could go wrong.",
      tr: "Kanal zemini eski yosun ve gevşek çakıllarla kaygan. Her adım ters gidebilir.",
    },
    choices: [
      {
        label: { en: "Pick your way across", tr: "Dikkatle karşıya geç" },
        type: "check",
        stat: "dex",
        dc: 9,
        onSuccess: {
          next: "serpent_03",
          text: { en: "You find your footing and keep moving without a slip.", tr: "Dengeni buluyor, hiç kaymadan ilerlemeye devam ediyorsun." },
        },
        onFail: {
          next: "serpent_03",
          effect: () => { damage(2); },
          text: { en: "Your foot slides out and you go down hard, catching yourself against the wall.", tr: "Ayağın kayıyor, sert bir şekilde düşüyorsun ama kendini duvara tutunarak topluyorsun." },
        },
      },
    ],
  },

  serpent_02b: {
    title: { en: "The Narrow Ledge", tr: "Dar Çıkıntı" },
    mood: "green",
    text: {
      en: "The ledge is barely wide enough for one foot at a time, and the pack on your back doesn't help your balance.",
      tr: "Çıkıntı bir seferde tek ayak sığacak kadar dar, sırtındaki çanta da dengeni hiç kolaylaştırmıyor.",
    },
    choices: [
      {
        label: { en: "Keep your weight centered", tr: "Ağırlığını dengede tut" },
        type: "check",
        stat: "dex",
        dc: 9,
        onSuccess: {
          next: "serpent_03",
          effect: () => { state.flags.add("serpent_dry"); },
          text: { en: "You make it across dry, without so much as wetting a boot.", tr: "Karşıya kuru geçiyorsun, botunu bile ıslatmadan." },
        },
        onFail: {
          next: "serpent_03",
          effect: () => { damage(1); },
          text: { en: "You slip on the last stretch and go knee deep before catching the ledge again.", tr: "Son kısımda kayıyor, dizine kadar suya giriyorsun ama çıkıntıya yeniden tutunuyorsun." },
        },
      },
    ],
  },

  serpent_02c: {
    title: { en: "Through the Dark Water", tr: "Karanlık Suyun İçinden" },
    mood: "green",
    icon: "icon-serpent",
    text: {
      en: "You keep to the deepest shadow along the wall, moving without a splash. Something surfaces briefly where you would have been standing, then sinks again without ever noticing you.",
      tr: "Duvar boyunca en derin gölgeye yapışıp sessizce ilerliyorsun. Az önce durmuş olacağın yerde bir şey kısa süreliğine su yüzüne çıkıyor, sonra seni hiç fark etmeden yeniden dalıyor.",
    },
    choices: [
      {
        label: { en: "Continue on, unseen", tr: "Fark edilmeden devam et" },
        next: "serpent_03",
        effect: () => { state.flags.add("serpent_dry"); },
      },
    ],
  },

  serpent_03: {
    title: { en: "A Junction", tr: "Bir Kavşak" },
    mood: "green",
    text: {
      en: "The water opens into a wider space. Two side passages branch off, half-flooded and dark, before the main route continues toward a rusted gate somewhere ahead.",
      tr: "Su daha geniş bir alana açılıyor. Ana yol ilerideki paslı bir kapıya doğru devam etmeden önce, iki yarı sular altında kalmış yan geçit ayrılıyor.",
    },
    choices: [
      { label: { en: "Check the passage to the left", tr: "Soldaki geçide bak" }, next: "serpent_04" },
      { label: { en: "Check the passage to the right", tr: "Sağdaki geçide bak" }, next: "serpent_04b" },
      { label: { en: "Skip the side passages, keep moving", tr: "Yan geçitleri atla, devam et" }, next: "serpent_05" },
    ],
  },

  serpent_04: {
    title: { en: "Flooded Storeroom", tr: "Sular Altındaki Depo" },
    mood: "green",
    text: {
      en: "Old crates float in a foot of standing water. Most have rotted open and spilled useless ruin, but one crate near the back is still sealed.",
      tr: "Eski sandıklar bir karış su içinde yüzüyor. Çoğu çürüyüp açılmış ve içindekiler işe yaramaz hale gelmiş, ama arkadaki bir sandık hâlâ kapalı.",
    },
    choices: [
      {
        label: { en: "Pry the sealed crate open", tr: "Kapalı sandığı zorla aç" },
        type: "check",
        stat: "int",
        dc: 8,
        onSuccess: {
          next: "serpent_05",
          effect: () => { state.relics.push("old tow rope"); },
          text: { en: "You work it open carefully and find a coil of rope, still sound.", tr: "Dikkatlice açıyorsun ve hâlâ sağlam duran bir halat buluyorsun." },
        },
        onFail: {
          next: "serpent_05",
          effect: () => { damage(1); },
          text: { en: "The crate splits wrong and something sharp inside catches your hand.", tr: "Sandık yanlış açılıyor, içindeki keskin bir şey elini kesiyor." },
        },
      },
      { label: { en: "Leave it, keep moving", tr: "Bırak, devam et" }, next: "serpent_05" },
    ],
  },

  serpent_04b: {
    title: { en: "A Quiet Alcove", tr: "Sessiz Bir Oyuk" },
    mood: "amber",
    text: {
      en: "Someone carved a row of names into the stone here long ago, high enough to stay above the waterline. It's dry, and quiet, out of the current.",
      tr: "Uzun zaman önce biri buraya taşın üstüne bir sıra isim kazımış, su seviyesinin üstünde kalacak kadar yükseğe. Burası kuru ve sessiz, akıntının dışında.",
    },
    choices: [
      { label: { en: "Rest here a moment", tr: "Bir süre dinlen" }, next: "serpent_05", effect: () => { heal(2); } },
      { label: { en: "Keep moving", tr: "Devam et" }, next: "serpent_05" },
    ],
  },

  serpent_05: {
    title: { en: "The First Sluice Gate", tr: "İlk Savak Kapısı" },
    mood: "green",
    text: {
      en: "A rusted iron gate blocks the channel, jammed half-shut in its frame. Old glyphs are cut into the stone beside the control wheel, worn almost smooth.",
      tr: "Paslı bir demir kapı kanalı tıkıyor, çerçevesinin içinde yarı kapalı sıkışmış. Kontrol çarkının yanındaki taşa eski işaretler kazınmış, neredeyse silinmiş.",
    },
    choices: [
      {
        label: { en: "Force the gate open", tr: "Kapıyı zorla aç" },
        classOnly: "blade",
        next: "serpent_06",
        effect: () => { damage(1); },
      },
      {
        label: { en: "Read the glyphs", tr: "İşaretleri oku" },
        classOnly: "rite",
        next: "serpent_06",
        effect: () => { state.flags.add("serpent_glyphs_read"); },
      },
      {
        label: { en: "Work the control wheel", tr: "Kontrol çarkını çevir" },
        type: "check",
        stat: "int",
        dc: 10,
        onSuccess: { next: "serpent_06", text: { en: "The wheel groans but turns, and the gate creaks upward just enough to pass.", tr: "Çark inleyerek dönüyor ve kapı geçecek kadar gıcırdayarak yükseliyor." } },
        onFail: { next: "serpent_06", effect: () => { damage(1); }, text: { en: "The wheel snaps loose and swings back, catching your arm.", tr: "Çark aniden gevşiyor, geri fırlayıp kolunu çarpıyor." } },
      },
      {
        label: { en: "Wade around through the side channel", tr: "Yan kanaldan dolan" },
        type: "check",
        stat: "con",
        dc: 11,
        onSuccess: { next: "serpent_06", text: { en: "The side channel is tighter and colder, but you squeeze through.", tr: "Yan kanal daha dar ve daha soğuk ama sıyrılıp geçiyorsun." } },
        onFail: { next: "serpent_06", effect: () => { damage(2); }, text: { en: "The current is stronger than it looks and slams you into the wall before you fight free.", tr: "Akıntı göründüğünden güçlü çıkıyor, seni duvara çarpıyor, zor bela kurtuluyorsun." } },
      },
    ],
  },

  serpent_06: {
    title: { en: "Narrow Water", tr: "Dar Su" },
    mood: "green",
    text: {
      en: "Past the gate the tunnel narrows to a single flooded lane. Something pale flickers under the surface ahead, then another, and another.",
      tr: "Kapının ardında tünel sular altında kalmış tek bir şeride daralıyor. İlerideki suyun altında soluk bir şey parlıyor, sonra bir tane daha, bir tane daha.",
    },
    choices: [{ label: { en: "Move on", tr: "Devam et" }, next: "serpent_07" }],
  },

  serpent_07: {
    title: { en: "Blind Cave Eels", tr: "Kör Mağara Yılan Balıkları" },
    mood: "green",
    text: {
      en: "They're not the serpent, just a nest of blind eels stirred up by your passing, thin as fingers and quick to bite if you crowd them.",
      tr: "Bunlar yılan değil, geçişinle rahatsız olmuş kör yılan balıkları sürüsü, parmak kadar ince ama sıkıştırılırlarsa hızlı ısırıyorlar.",
    },
    choices: [
      {
        label: { en: "Read their pattern", tr: "Hareketlerini oku" },
        classOnly: "rite",
        next: "serpent_08",
        text: { en: "You recognize the migration behavior at once, and they part around you without a single bite.", tr: "Göç davranışlarını hemen tanıyorsun, hiç ısırmadan etrafından ayrılıyorlar." },
      },
      {
        label: { en: "Hold still and let them pass", tr: "Kıpırdamadan geçmelerini bekle" },
        type: "check",
        stat: "wis",
        dc: 9,
        onSuccess: { next: "serpent_08", text: { en: "You go completely still and they lose interest.", tr: "Tamamen hareketsiz kalıyorsun, ilgilerini kaybediyorlar." } },
        onFail: { next: "serpent_08", effect: () => { damage(1); }, text: { en: "One gets a nip in before the rest scatter.", tr: "Diğerleri dağılmadan önce biri seni ısırmayı başarıyor." } },
      },
      {
        label: { en: "Push through quickly", tr: "Hızla aralarından geç" },
        type: "check",
        stat: "str",
        dc: 8,
        onSuccess: { next: "serpent_08", text: { en: "You force through the current before they can react.", tr: "Onlar tepki veremeden akıntının içinden geçiyorsun." } },
        onFail: { next: "serpent_08", effect: () => { damage(1); }, text: { en: "You come out the other side stung more than once.", tr: "Karşı tarafa birden fazla ısırıkla çıkıyorsun." } },
      },
    ],
  },

  serpent_08: {
    title: { en: "Two Ways Down", tr: "Aşağıya İki Yol" },
    mood: "green",
    text: {
      en: "The passage splits. A flooded stairwell drops steeply into darker water, likely a shortcut if you can hold your breath long enough. A rusted walkway continues level but longer, bolted above the waterline.",
      tr: "Geçit ikiye ayrılıyor. Sular altında kalmış bir merdiven daha karanlık suya doğru dik iniyor, nefesini yeterince tutabilirsen muhtemelen bir kısayol. Paslı bir yürüyüş yolu ise su seviyesinin üstünde, daha uzun ama düz devam ediyor.",
    },
    choices: [
      { label: { en: "Take the submerged stairwell", tr: "Sular altındaki merdivene gir" }, next: "serpent_09a" },
      { label: { en: "Take the upper walkway", tr: "Üstteki yürüyüş yolunu tut" }, next: "serpent_09b" },
    ],
  },

  serpent_09a: {
    title: { en: "Under the Surface", tr: "Suyun Altında" },
    mood: "green",
    text: {
      en: "The stairwell keeps going down further than expected. You'll need to hold your breath the whole way.",
      tr: "Merdiven beklenenden çok daha derine iniyor. Tüm yol boyunca nefesini tutman gerekecek.",
    },
    choices: [
      {
        label: { en: "Dive straight through", tr: "Doğrudan dal" },
        requires: () => state.stats.con >= 5,
        next: "serpent_10",
        text: { en: "Your nerve holds and you cut through the dark water in one clean push, surfacing on the other side before your lungs even complain.", tr: "Cesaretin seni yarı yolda bırakmıyor, karanlık suyu tek bir hamlede geçip ciğerlerin şikayet etmeden karşı tarafta yüzeye çıkıyorsun." },
      },
      {
        label: { en: "Push through the dark water", tr: "Karanlık suyun içinden geç" },
        type: "check",
        stat: "con",
        dc: 11,
        onSuccess: { next: "serpent_10", text: { en: "You break the surface right as your breath was about to give out.", tr: "Nefesin tükenmek üzereyken tam vaktinde yüzeye çıkıyorsun." } },
        onFail: { next: "serpent_10", effect: () => { damage(2); }, text: { en: "Your chest burns before you break the surface again, and you come up coughing water.", tr: "Yeniden yüzeye çıkmadan önce göğsün yanıyor, öksürerek su çıkarıyorsun." } },
      },
    ],
  },

  serpent_09b: {
    title: { en: "The Long Walkway", tr: "Uzun Yürüyüş Yolu" },
    mood: "green",
    text: {
      en: "The walkway holds, mostly. It takes longer, but along the way you spot something wedged under a fallen support beam.",
      tr: "Yürüyüş yolu çoğunlukla sağlam duruyor. Daha uzun sürüyor ama yol boyunca devrilmiş bir destek kirişinin altına sıkışmış bir şey görüyorsun.",
    },
    choices: [
      {
        label: { en: "Pull it free", tr: "Onu çekip çıkar" },
        type: "check",
        stat: "int",
        dc: 8,
        onSuccess: { next: "serpent_10", effect: () => { state.relics.push("waterproof lantern"); }, text: { en: "You work it loose. It's a lantern, sealed tight, still dry inside.", tr: "Yerinden söküyorsun. Sıkıca kapatılmış bir fener, içi hâlâ kuru." } },
        onFail: { next: "serpent_10", text: { en: "It's wedged too tight to free without more time than you have.", tr: "Vaktin yetmediği kadar sıkı sıkışmış, çıkaramıyorsun." } },
      },
      { label: { en: "Leave it, keep going", tr: "Bırak, devam et" }, next: "serpent_10" },
    ],
  },

  serpent_10: {
    title: { en: "A Dry Waypost", tr: "Kuru Bir Konak Yeri" },
    mood: "amber",
    text: {
      en: "A stretch of old stonework rises just above the waterline, dry enough for a moment's rest. Someone left a half-burned candle stub here once.",
      tr: "Eski bir taş yığını su seviyesinin biraz üstünde yükseliyor, bir anlık dinlenmeye yetecek kadar kuru. Bir zamanlar biri burada yarı yanmış bir mum ucu bırakmış.",
    },
    choices: [
      { label: { en: "Rest here", tr: "Burada dinlen" }, next: "serpent_11", effect: () => { heal(2); } },
      { label: { en: "Look around a bit more first", tr: "Önce biraz etrafa bak" }, next: "serpent_10b" },
      { label: { en: "Keep moving", tr: "Devam et" }, next: "serpent_11" },
    ],
  },

  serpent_10b: {
    title: { en: "A Scattered Camp", tr: "Dağılmış Bir Kamp" },
    mood: "amber",
    text: {
      en: "Someone made camp here once and never came back for it. A few supplies are still usable, dry and untouched behind a fallen slab.",
      tr: "Bir zamanlar biri burada kamp kurmuş ve bir daha geri dönmemiş. Devrilmiş bir levhanın arkasında hâlâ kullanılabilir, kuru ve dokunulmamış birkaç eşya duruyor.",
    },
    choices: [
      { label: { en: "Take the supplies", tr: "Eşyaları al" }, next: "serpent_11", effect: () => { heal(1); } },
      { label: { en: "Leave them, keep moving", tr: "Bırak, devam et" }, next: "serpent_11" },
    ],
  },

  serpent_11: {
    title: { en: "A Sunken Archive", tr: "Batık Bir Arşiv" },
    mood: "green",
    icon: "icon-scroll",
    text: {
      en: "Shelves of ruined paper line a small side chamber, most of it pulp now. One journal, wrapped in oilcloth, has survived. A rusted strongbox is wedged under a shelf nearby.",
      tr: "Küçük bir yan odada raflar dolusu çürümüş kağıt duruyor, çoğu artık hamur haline gelmiş. Yağlı bezle sarılmış bir günlük hayatta kalmayı başarmış. Yakındaki bir rafın altına paslı bir kasa sıkışmış.",
    },
    choices: [
      {
        label: { en: "Read the journal at a glance", tr: "Günlüğe bir bakışta göz gezdir" },
        classOnly: "rite",
        next: "serpent_12",
        effect: () => { state.relics.push("soaked Warden journal"); state.flags.add("serpent_journal_read"); },
      },
      {
        label: { en: "Try to make out the waterlogged writing", tr: "Suya bulanmış yazıyı çözmeye çalış" },
        type: "check",
        stat: "int",
        dc: 9,
        onSuccess: { next: "serpent_12", effect: () => { state.relics.push("soaked Warden journal"); }, text: { en: "The ink has held just enough to make out a warning about the gate ahead.", tr: "Mürekkep, ilerideki kapı hakkındaki bir uyarıyı okuyacak kadar dayanmış." } },
        onFail: { next: "serpent_12", text: { en: "The ink has run too badly. You give up on it.", tr: "Mürekkep fazla dağılmış, vazgeçiyorsun." } },
      },
      { label: { en: "Check the strongbox instead", tr: "Onun yerine kasaya bak" }, next: "serpent_11c" },
      { label: { en: "Leave it all, move on", tr: "Hiçbirine dokunma, devam et" }, next: "serpent_12" },
    ],
  },

  serpent_11c: {
    title: { en: "A Rusted Strongbox", tr: "Paslı Bir Kasa" },
    mood: "green",
    text: {
      en: "Wedged under the collapsed shelf is a small strongbox, its lock long seized with rust.",
      tr: "Çökmüş rafın altına sıkışmış küçük bir kasa var, kilidi çoktan paslanıp tutmuş.",
    },
    choices: [
      {
        label: { en: "Wrench it open", tr: "Kasayı zorla aç" },
        classOnly: "blade",
        next: "serpent_12",
        effect: () => { damage(1); state.relics.push("a handful of old coin"); },
      },
      {
        label: { en: "Pick the seized lock", tr: "Tutmuş kilidi zorla" },
        type: "check",
        stat: "dex",
        dc: 9,
        onSuccess: { next: "serpent_12", effect: () => { state.relics.push("a handful of old coin"); }, text: { en: "The mechanism gives after some patient work.", tr: "Sabırlı bir uğraştan sonra mekanizma açılıyor." } },
        onFail: { next: "serpent_12", text: { en: "The lock won't budge, and you're not going to waste more time on it.", tr: "Kilit hiç açılmıyor, daha fazla vakit harcamayacaksın." } },
      },
      { label: { en: "Leave it", tr: "Bırak" }, next: "serpent_12" },
    ],
  },

  serpent_12: {
    title: { en: "The Second Gate", tr: "İkinci Kapı" },
    mood: "green",
    text: {
      en: "This gate is worse than the first, half-collapsed and half-submerged, the mechanism long dead.",
      tr: "Bu kapı ilkinden daha kötü durumda, yarısı çökmüş yarısı sular altında, mekanizma çoktan ölmüş.",
    },
    choices: [
      {
        label: { en: "Slip through the broken grate", tr: "Kırık ızgaradan sıyrıl" },
        classOnly: "shadow",
        next: "serpent_14",
        text: { en: "There's a gap low in the ironwork, just wide enough for you.", tr: "Demir işlemenin alt kısmında tam sana yetecek kadar bir aralık var." },
      },
      {
        label: { en: "Wrench the grate open", tr: "Izgarayı zorla aç" },
        classOnly: "blade",
        next: "serpent_14",
        effect: () => { damage(1); },
      },
      { label: { en: "Dive under the gate", tr: "Kapının altından dal" }, type: "check", stat: "dex", dc: 11,
        onSuccess: { next: "serpent_14", text: { en: "You squeeze under with room to spare.", tr: "Altından fazla zorlanmadan geçiyorsun." } },
        onFail: { next: "serpent_14", effect: () => { damage(2); }, text: { en: "A jagged edge catches your side on the way through.", tr: "Geçerken sivri bir kenar yanını çiziyor." } },
      },
      { label: { en: "Find the maintenance shaft", tr: "Bakım bacasını bul" }, next: "serpent_13" },
    ],
  },

  serpent_13: {
    title: { en: "The Maintenance Shaft", tr: "Bakım Bacası" },
    mood: "green",
    text: {
      en: "A cramped side shaft holds three corroded valves, each stamped with a worn symbol. Getting the order wrong will flood the shaft further.",
      tr: "Dar bir yan baca içinde her biri aşınmış bir sembolle damgalanmış üç paslı vana var. Sırayı yanlış çevirmek bacayı daha da su altında bırakır.",
    },
    choices: [
      {
        label: { en: "Read the symbols", tr: "Sembolleri oku" },
        classOnly: "rite",
        next: "serpent_14",
        text: { en: "You recognize the old maintenance code at once and turn them in the right order without incident.", tr: "Eski bakım kodunu hemen tanıyorsun, hiçbir sorun yaşamadan doğru sırayla çeviriyorsun." },
      },
      {
        label: { en: "Work out the sequence yourself", tr: "Sırayı kendin çöz" },
        requires: () => state.stats.int >= 5,
        next: "serpent_14",
        text: { en: "You don't need the code. Your eye for pattern is sharp enough to see which valve turns first.", tr: "Koda ihtiyacın yok. Deseni okuyacak kadar keskin bir gözün var, hangi vananın önce çevrileceğini görüyorsun." },
      },
      {
        label: { en: "Guess at the sequence", tr: "Sırayı tahmin et" },
        type: "check",
        stat: "int",
        dc: 11,
        onSuccess: { next: "serpent_14", text: { en: "You get lucky, and the valves click into place cleanly.", tr: "Şansın yaver gidiyor, vanalar sorunsuzca yerine oturuyor." } },
        onFail: { next: "serpent_14", effect: () => { damage(2); }, text: { en: "You get it wrong, and cold water surges through the shaft before you scramble out.", tr: "Yanlış çeviriyorsun, bacadan soğuk su fışkırıyor, zor bela dışarı çıkıyorsun." } },
      },
    ],
  },

  serpent_14: {
    title: { en: "Something in the Water", tr: "Suyun İçindeki Bir Şey" },
    mood: "red",
    icon: "icon-serpent",
    text: {
      en: "The passage opens into a flooded hall, and there, coiled loosely around a fallen pillar, is the serpent. It hasn't moved toward you yet. It's watching.",
      tr: "Geçit sular altında kalmış bir salona açılıyor ve orada, devrilmiş bir sütunun etrafına gevşekçe sarılmış halde yılan duruyor. Henüz sana doğru hareket etmedi. İzliyor.",
    },
    choices: [
      {
        label: { en: "Hold your ground, weapon ready", tr: "Yerinde dur, silahını hazırla" },
        classOnly: "blade",
        next: "serpent_15",
        effect: () => { damage(1); },
        text: { en: "It reads the challenge in your stance and slides back into deeper water without testing you further, though standing so still costs you.", tr: "Duruşundaki meydan okumayı okuyor, seni daha fazla denemeden derin suya çekiliyor, ama bu kadar hareketsiz durmak sana pahalıya patlıyor." },
      },
      { label: { en: "Back away slowly", tr: "Yavaşça geri çekil" }, type: "check", stat: "wis", dc: 10,
        onSuccess: { next: "serpent_15", text: { en: "You ease back without breaking its gaze, and it loses interest.", tr: "Bakışını bozmadan yavaşça geri çekiliyorsun, ilgisini kaybediyor." } },
        onFail: { next: "serpent_15", effect: () => { damage(1); }, text: { en: "You back away too fast, and it surges closer before losing interest anyway.", tr: "Çok hızlı geri çekiliyorsun, o da yaklaşıyor ama yine de ilgisini kaybediyor." } },
      },
      { label: { en: "Stay still and watch it", tr: "Kıpırdamadan izle" }, type: "check", stat: "wis", dc: 10,
        onSuccess: { next: "serpent_15", text: { en: "It decides you're not worth the trouble and sinks away.", tr: "Uğraşmaya değmeyeceğine karar veriyor ve dibe çekiliyor." } },
        onFail: { next: "serpent_15", effect: () => { damage(1); }, text: { en: "It lunges once to test you, then withdraws.", tr: "Seni denemek için bir kez saldırıyor, sonra çekiliyor." } },
      },
    ],
  },

  serpent_15: {
    title: { en: "Broken Walkway", tr: "Kırık Yürüyüş Yolu" },
    mood: "green",
    text: {
      en: "Past the hall, the floor gives way to broken planks over open water.",
      tr: "Salonun ardında zemin, açık suyun üzerindeki kırık tahtalara dönüşüyor.",
    },
    choices: [
      { label: { en: "Cross carefully", tr: "Dikkatlice geç" }, type: "check", stat: "dex", dc: 9,
        onSuccess: { next: "serpent_16", text: { en: "The planks hold under careful steps.", tr: "Dikkatli adımlarla tahtalar seni taşıyor." } },
        onFail: { next: "serpent_16", effect: () => { damage(1); }, text: { en: "A plank gives out and you go through to the waist before pulling free.", tr: "Bir tahta kırılıyor, beline kadar suya batıyorsun ama zor bela çıkıyorsun." } },
      },
      {
        label: { en: "Notice the gap in the planking", tr: "Tahtaların arasındaki aralığı fark et" },
        classOnly: "shadow",
        next: "serpent_15c",
      },
    ],
  },

  serpent_15c: {
    title: { en: "A Hidden Nook", tr: "Gizli Bir Köşe" },
    mood: "green",
    text: {
      en: "There's a gap in the broken planks leading down to a dry hollow beneath, the kind of thing no one crossing at a normal pace would ever spot.",
      tr: "Kırık tahtaların arasında aşağıya, kuru bir oyuğa açılan bir aralık var, normal hızda geçen birinin asla fark edemeyeceği türden.",
    },
    choices: [
      { label: { en: "Drop down and cross underneath", tr: "Aşağıya in ve alttan geç" }, next: "serpent_16", effect: () => { heal(1); } },
    ],
  },

  serpent_16: {
    title: { en: "An Old Warden", tr: "Eski Bir Muhafız" },
    mood: "green",
    text: {
      en: "A skeleton is wedged between two collapsed beams, its armor long rusted through. A badge is still pinned to what's left of the collar.",
      tr: "İki çökmüş kirişin arasına sıkışmış bir iskelet var, zırhı çoktan paslanmış. Yakadan geriye kalan kısma hâlâ bir rozet iliştirilmiş.",
    },
    choices: [
      { label: { en: "Take the badge", tr: "Rozeti al" }, next: "serpent_17a", effect: () => { state.relics.push("drowned Warden's badge"); } },
      { label: { en: "Leave them be", tr: "Onu rahat bırak" }, next: "serpent_17a" },
    ],
  },

  serpent_17a: {
    title: { en: "Open Water or Pipe", tr: "Açık Su mu Boru mu" },
    mood: "green",
    text: {
      en: "Ahead, the flooded hall opens into open water, or you could follow an old drainage pipe running along the ceiling.",
      tr: "İlerideki sular altında kalmış salon açık suya dönüşüyor, ya da tavan boyunca uzanan eski bir drenaj borusunu takip edebilirsin.",
    },
    choices: [
      { label: { en: "Swim the open water", tr: "Açık sudan yüz" }, next: "serpent_17b" },
      { label: { en: "Follow the pipe", tr: "Boruyu takip et" }, next: "serpent_17c" },
    ],
  },

  serpent_17b: {
    title: { en: "Open Water", tr: "Açık Su" },
    mood: "green",
    text: {
      en: "The eels are back, more of them this time, agitated by something further down.",
      tr: "Yılan balıkları geri döndü, bu sefer daha kalabalıklar, aşağıdan gelen bir şeyle tedirginler.",
    },
    choices: [
      {
        label: { en: "Power through the current", tr: "Akıntıyı güçle geç" },
        requires: () => state.stats.str >= 5,
        next: "serpent_18",
        text: { en: "Your strength cuts through the pull easily, and the eels can't keep pace.", tr: "Gücün akıntıyı kolayca yarıyor, yılan balıkları tempoyu tutturamıyor." },
      },
      {
        label: { en: "Push through", tr: "Aralarından geç" },
        type: "check",
        stat: "con",
        dc: 10,
        onSuccess: { next: "serpent_18", text: { en: "You keep your head and push clear of them.", tr: "Soğukkanlılığını koruyup aralarından sıyrılıyorsun." } },
        onFail: { next: "serpent_18", effect: () => { damage(2); }, text: { en: "They get several bites in before you break free.", tr: "Kurtulmadan önce birkaç kez ısırıyorlar." } },
      },
    ],
  },

  serpent_17c: {
    title: { en: "The Drainage Pipe", tr: "Drenaj Borusu" },
    mood: "green",
    text: {
      en: "Tight and awkward, but dry. Near the far end you find a small cache someone stashed and never came back for.",
      tr: "Dar ve rahatsız ama kuru. Uzak ucuna yakın bir yerde birinin sakladığı ve bir daha geri dönmediği küçük bir stok buluyorsun.",
    },
    choices: [
      { label: { en: "Take what's useful", tr: "İşe yarayanı al" }, next: "serpent_18", effect: () => { heal(1); } },
      { label: { en: "Keep moving", tr: "Devam et" }, next: "serpent_18" },
    ],
  },

  serpent_18: {
    title: { en: "Bad Air", tr: "Kötü Hava" },
    mood: "green",
    text: {
      en: "A low chamber ahead is thick with stagnant air, the kind that makes your head swim if you breathe too much of it.",
      tr: "İlerideki alçak oda durgun havayla dolu, çok fazla soluyunca başını döndürecek türden.",
    },
    choices: [
      { label: { en: "Hold your breath and move fast", tr: "Nefesini tut, hızlı geç" }, type: "check", stat: "con", dc: 10,
        onSuccess: { next: "serpent_19", text: { en: "You're through before it can touch you.", tr: "Sana dokunamadan geçiyorsun." } },
        onFail: { next: "serpent_19", effect: () => { damage(2); }, text: { en: "Your head spins badly before you clear the chamber.", tr: "Odayı geçmeden önce başın fena halde dönüyor." } },
      },
      { label: { en: "Find the old vent shaft", tr: "Eski baca deliğini bul" }, type: "check", stat: "wis", dc: 9,
        onSuccess: { next: "serpent_19", text: { en: "You spot a crack letting in clean air and route around the worst of it.", tr: "Temiz hava sızan bir çatlak buluyor, en kötüsünden kaçınarak dolanıyorsun." } },
        onFail: { next: "serpent_19", effect: () => { damage(1); }, text: { en: "You can't find a way around it in time and push through anyway.", tr: "Zamanında bir yol bulamıyor, mecburen içinden geçiyorsun." } },
      },
    ],
  },

  serpent_19: {
    title: { en: "A Flickering Ward", tr: "Titreyen Bir Mühür" },
    mood: "violet",
    text: {
      en: "A minor ward-stone sits in a side alcove, its light stuttering weakly. It's not the one you're looking for, but it's failing all the same.",
      tr: "Bir yan oyukta küçük bir mühür taşı duruyor, ışığı zayıfça titriyor. Aradığın taş bu değil ama o da aynı şekilde çöküyor.",
    },
    choices: [
      {
        label: { en: "Perform the partial rite", tr: "Kısmi âyini gerçekleştir" },
        classOnly: "rite",
        next: "serpent_20",
        effect: () => { heal(1); },
        text: { en: "You know enough of the old words to settle it without forcing anything, and something in the quiet after feels like relief.", tr: "Bir şeyi zorlamadan yatıştıracak kadar eski sözleri biliyorsun, ardından gelen sessizlikte bir rahatlama var." },
      },
      { label: { en: "Try to stabilize it", tr: "Dengelemeye çalış" }, type: "check", stat: "int", dc: 12,
        onSuccess: { next: "serpent_20", effect: () => { heal(1); }, text: { en: "You find the right thread and the stone settles.", tr: "Doğru ipliği buluyorsun, taş yatışıyor." } },
        onFail: { next: "serpent_20", effect: () => { damage(1); }, text: { en: "You push the wrong thread of the working and it snaps back at you.", tr: "İşleyişin yanlış ipliğini itiyorsun, geri tepiyor." } },
      },
      { label: { en: "Leave it alone", tr: "Dokunma" }, next: "serpent_20" },
    ],
  },

  serpent_20: {
    title: { en: "The Last Crossing", tr: "Son Geçiş" },
    mood: "green",
    text: {
      en: "A collapsed section leaves only a narrow beam over deep water between you and the passage beyond.",
      tr: "Çökmüş bir bölüm, seninle ilerideki geçit arasında derin suyun üzerinde sadece dar bir kiriş bırakıyor.",
    },
    choices: [
      {
        label: { en: "Balance across without looking down", tr: "Aşağı bakmadan dengede geç" },
        classOnly: "shadow",
        next: "serpent_21",
        text: { en: "Your footing never wavers.", tr: "Adımların hiç sarsılmıyor." },
      },
      {
        label: { en: "Use the rope to steady your crossing", tr: "Geçişi sağlamlaştırmak için halatı kullan" },
        requires: () => hasRelic("old tow rope"),
        next: "serpent_21",
        effect: () => { state.relics = state.relics.filter(r => r !== "old tow rope"); },
        text: { en: "You tie off the rope and cross without incident, then leave it behind, spent.", tr: "Halatı bağlıyor, sorunsuzca geçiyorsun, sonra tükenmiş halde arkanda bırakıyorsun." },
      },
      { label: { en: "Jump the gap", tr: "Boşluğu atla" }, type: "check", stat: "str", dc: 11,
        onSuccess: { next: "serpent_21", text: { en: "You clear it with room to spare.", tr: "Rahatlıkla atlayıp geçiyorsun." } },
        onFail: { next: "serpent_21", effect: () => { damage(2); }, text: { en: "You come up short and scramble the rest of the way, half in the water.", tr: "Yeterince uzağa atlayamıyorsun, yarı suyun içinde zor bela geri kalanını geçiyorsun." } },
      },
    ],
  },

  serpent_21: {
    title: { en: "The Serpent's Den", tr: "Yılanın İni" },
    mood: "red",
    icon: "icon-serpent",
    text: {
      en: "Ahead, the water deepens into a wide black pool, and the serpent is there again, closer this time, less patient.",
      tr: "İlerideki su geniş kara bir gölete dönüşüyor ve yılan yine orada, bu sefer daha yakın, daha az sabırlı.",
    },
    choices: [
      {
        label: { en: "Slip past along the far wall", tr: "Uzak duvar boyunca sıyrıl" },
        classOnly: "shadow",
        next: "serpent_23",
        text: { en: "You keep to the shadow and it never so much as turns its head.", tr: "Gölgede kalıyorsun, başını bile çevirmiyor." },
      },
      {
        label: { en: "Move past it, slow and quiet", tr: "Yavaş ve sessizce geç" },
        requires: () => state.stats.dex >= 5,
        next: "serpent_23",
        text: { en: "Your nerve is steady enough that your calm reads as no threat at all, and it lets you pass.", tr: "Cesaretin o kadar sağlam ki sakinliğin tehdit gibi görünmüyor, seni geçiyor." },
      },
      { label: { en: "Try to get past it", tr: "Yanından geçmeyi dene" }, type: "check", stat: "dex", dc: 12,
        onSuccess: { next: "serpent_23", text: { en: "You slide by while it hesitates.", tr: "O tereddüt ederken yanından sıyrılıyorsun." } },
        onFail: { next: "serpent_22" },
      },
      { label: { en: "Stand and meet it", tr: "Dur ve karşıla" }, next: "serpent_22" },
    ],
  },

  serpent_22: {
    title: { en: "Holding Your Ground", tr: "Yerini Koru" },
    mood: "red",
    text: {
      en: "It's not interested in a fair fight. It wants you gone, one way or another.",
      tr: "Adil bir dövüş istemiyor. Bir şekilde gitmeni istiyor.",
    },
    choices: [
      { label: { en: "Fight it off", tr: "Savaşarak püskürt" }, type: "check", stat: "str", dc: 12,
        onSuccess: { next: "serpent_23", effect: () => { damage(2); }, text: { en: "You drive it back, though not without cost.", tr: "Geri püskürtüyorsun ama bedelsiz olmuyor." } },
        onFail: { next: "serpent_23", effect: () => { damage(3); }, text: { en: "It gets a solid hit in before finally retreating on its own terms.", tr: "Kendi isteğiyle geri çekilmeden önce sağlam bir darbe indiriyor." } },
      },
      { label: { en: "Read its strikes and dodge through", tr: "Saldırılarını oku, sıyrılarak geç" }, type: "check", stat: "dex", dc: 11,
        onSuccess: { next: "serpent_23", text: { en: "You time it perfectly and slip past between strikes.", tr: "Zamanlamanı mükemmel ayarlıyor, saldırıların arasından sıyrılıyorsun." } },
        onFail: { next: "serpent_23", effect: () => { damage(2); }, text: { en: "You misjudge one strike and pay for it.", tr: "Bir saldırıyı yanlış okuyorsun, bedelini ödüyorsun." } },
      },
    ],
  },

  serpent_23: {
    title: { en: "Past the Pool", tr: "Gölün Ötesinde" },
    mood: "green",
    text: {
      en: "Whatever just happened, you're through. The passage beyond climbs slightly, drier ground at last.",
      tr: "Az önce ne olduysa oldu, geçtin. İlerideki geçit hafifçe yükseliyor, sonunda daha kuru bir zemin.",
    },
    choices: [{ label: { en: "Keep going", tr: "Devam et" }, next: "serpent_24" }],
  },

  serpent_24: {
    title: { en: "The Ward-Stone", tr: "Mühür Taşı" },
    mood: "violet",
    icon: "icon-scroll",
    text: {
      en: "This is what you came for, a ward-stone cracked through its center, the seal around it barely holding. Old script rings the base.",
      tr: "Aradığın şey bu, ortasından çatlamış bir mühür taşı, etrafındaki mühür zar zor tutunuyor. Tabanını eski bir yazı çevreliyor.",
    },
    choices: [
      {
        label: { en: "Read the inscription", tr: "Yazıtı oku" },
        classOnly: "rite",
        next: "serpent_25",
        effect: () => { state.flags.add("serpent_inscription_read"); },
        text: { en: "You understand exactly what's keeping the seal from failing entirely, and what that means for whoever comes after you.", tr: "Mührün tamamen çökmesini engelleyen şeyi tam olarak anlıyorsun, ardından gelecek kişi için ne anlama geldiğini de." },
      },
      { label: { en: "Study the crack", tr: "Çatlağı incele" }, type: "check", stat: "int", dc: 11,
        onSuccess: { next: "serpent_25", text: { en: "You get a rough sense of how bad it is.", tr: "Ne kadar kötü durumda olduğuna dair kaba bir fikir ediniyorsun." } },
        onFail: { next: "serpent_25", effect: () => { damage(1); }, text: { en: "Something in the stone reacts to your prodding and stings back.", tr: "Taş, dokunuşuna tepki veriyor ve seni acıtıyor." } },
      },
    ],
  },

  serpent_25: {
    title: { en: "Deeper Still", tr: "Daha da Derine" },
    mood: "green",
    text: {
      en: "The flooded tunnel is behind you now. A dry stair leads up out of the water, toward whatever's waiting further into Hollowmere.",
      tr: "Sular altındaki tünel artık geride kaldı. Kuru bir merdiven sudan yukarı, Hollowmere'in derinliklerinde bekleyen her neyse ona doğru çıkıyor.",
    },
    choices: [{ label: { en: "Climb up", tr: "Yukarı çık" }, next: "the_deep" }],
  },
};

// ============================================================
// ASH SHRINE BRANCH -- Ashling (prefix: ashling_)
// Recurring elements: heat-cracked tiles, fused archway, drifting
// ash and ember, kindling motes, burnt Warden relics, a brazier
// order puzzle, a glass-fused bridge.
// ============================================================

const ashlingBranch = {
  ashling_01: {
    title: { en: "Into the Ash", tr: "Küllerin İçine" },
    mood: "orange",
    icon: "icon-ashling",
    text: {
      en: "The shrine passage is scorched black from floor to ceiling, and the air still tastes faintly of smoke that should have cleared centuries ago. Ahead, a scorched hall runs straight through the heat, a collapsed colonnade offers a rougher climb around it, and off to the side a narrow vent breathes cooler air into the dark.",
      tr: "Tapınak geçidi tepeden tırnağa kararmış, hava hâlâ yüzyıllar önce dağılmış olması gereken dumanın tadını taşıyor. İleride, kavrulmuş bir koridor sıcağın içinden dosdoğru geçiyor, çökmüş bir sütunlu geçit etrafından daha zorlu bir tırmanış sunuyor, kenarda ise dar bir baca karanlığa daha serin bir hava üflüyor.",
    },
    choices: [
      { label: { en: "Walk the scorched hall", tr: "Kavrulmuş koridordan geç" }, next: "ashling_02a" },
      { label: { en: "Climb over the colonnade", tr: "Sütunlu geçidin üstünden geç" }, next: "ashling_02b" },
      { label: { en: "Slip through the vent", tr: "Bacadan sıyrıl" }, classOnly: "shadow", next: "ashling_02c" },
    ],
  },

  ashling_02a: {
    title: { en: "Cracked Tiles", tr: "Çatlak Fayanslar" },
    mood: "orange",
    text: {
      en: "The floor here is heat-warped, the tiles cracked and ready to give under weight.",
      tr: "Buradaki zemin ısıdan bükülmüş, fayanslar çatlamış ve ağırlık altında çökmeye hazır.",
    },
    choices: [
      { label: { en: "Step carefully", tr: "Dikkatle adım at" }, type: "check", stat: "dex", dc: 9,
        onSuccess: { next: "ashling_03", text: { en: "You cross without a single tile giving way.", tr: "Tek bir fayans bile çökmeden karşıya geçiyorsun." } },
        onFail: { next: "ashling_03", effect: () => { damage(2); }, text: { en: "A tile gives way under your foot and you drop through to the ankle before pulling free.", tr: "Ayağının altında bir fayans çöküyor, bileğine kadar batıyorsun ama zor bela çıkıyorsun." } },
      },
    ],
  },

  ashling_02b: {
    title: { en: "Over the Rubble", tr: "Molozun Üstünden" },
    mood: "orange",
    text: {
      en: "Fallen columns block the way, still warm to the touch even now.",
      tr: "Devrilmiş sütunlar yolu kapatıyor, hâlâ dokununca ılık.",
    },
    choices: [
      { label: { en: "Climb across", tr: "Tırmanarak geç" }, type: "check", stat: "str", dc: 9,
        onSuccess: { next: "ashling_03", text: { en: "You pick your handholds well and cross without trouble.", tr: "Tutunacak yerleri iyi seçiyor, sorunsuzca geçiyorsun." } },
        onFail: { next: "ashling_03", effect: () => { damage(1); }, text: { en: "A loose stone shifts and scrapes your leg on the way down.", tr: "Gevşek bir taş kayıyor, inerken bacanı sıyırıyor." } },
      },
    ],
  },

  ashling_02c: {
    title: { en: "The Cool Vent", tr: "Serin Baca" },
    mood: "orange",
    text: {
      en: "You fold yourself into the vent and move through on your knees, the smoke never quite reaching you. Small motes of drifting flame scatter away from your shadow without ever seeing you.",
      tr: "Bacaya sığıp dizlerinin üstünde ilerliyorsun, duman sana hiç ulaşmıyor. Küçük alev parçacıkları seni hiç görmeden gölgenden kaçışıyor.",
    },
    choices: [
      { label: { en: "Continue on, unseen", tr: "Fark edilmeden devam et" }, next: "ashling_03", effect: () => { state.flags.add("ashling_quiet_entry"); } },
    ],
  },

  ashling_03: {
    title: { en: "The Shrine Antechamber", tr: "Tapınağın Ön Odası" },
    mood: "orange",
    text: {
      en: "Two side chambers open off the main room, both dark with old soot. The main route continues toward a fused archway ahead.",
      tr: "Ana odadan iki yan oda açılıyor, ikisi de eski kurumla kararmış. Ana yol ilerideki kaynaşmış bir kemere doğru devam ediyor.",
    },
    choices: [
      { label: { en: "Check the sacristy", tr: "Kutsal odaya bak" }, next: "ashling_04" },
      { label: { en: "Check the votive alcove", tr: "Adak oyuğuna bak" }, next: "ashling_04b" },
      { label: { en: "Skip ahead", tr: "Atla, ilerle" }, next: "ashling_05" },
    ],
  },

  ashling_04: {
    title: { en: "The Burnt Sacristy", tr: "Yanmış Kutsal Oda" },
    mood: "orange",
    text: {
      en: "Robes and vestments, long since burned to fragile ash, line a set of cabinets. One drawer, metal-lined, might have survived.",
      tr: "Dolapların üzerinde kırılgan küle dönüşmüş cübbeler duruyor. Metal kaplı bir çekmece belki hayatta kalmıştır.",
    },
    choices: [
      { label: { en: "Open the drawer carefully", tr: "Çekmeceyi dikkatle aç" }, type: "check", stat: "dex", dc: 8,
        onSuccess: { next: "ashling_05", effect: () => { state.relics.push("scorched cloak"); }, text: { en: "It comes loose intact, a cloak folded inside, scorched but wearable.", tr: "Bozulmadan çıkıyor, içinde katlanmış bir pelerin var, kavrulmuş ama giyilebilir." } },
        onFail: { next: "ashling_05", effect: () => { damage(1); }, text: { en: "It crumbles the moment you touch it, and a puff of hot ash catches you in the face.", tr: "Dokunur dokunmaz dağılıyor, sıcak bir kül bulutu yüzüne çarpıyor." } },
      },
      { label: { en: "Leave it", tr: "Bırak" }, next: "ashling_05" },
    ],
  },

  ashling_04b: {
    title: { en: "The Votive Alcove", tr: "Adak Oyuğu" },
    mood: "amber",
    text: {
      en: "Rows of long-dead candles sit undisturbed here, and the air is strangely cool compared to the rest of the shrine.",
      tr: "Burada sıra sıra sönmüş mumlar hiç dokunulmamış duruyor, hava tapınağın geri kalanına göre tuhaf bir şekilde serin.",
    },
    choices: [
      { label: { en: "Rest a moment", tr: "Bir süre dinlen" }, next: "ashling_05", effect: () => { heal(2); } },
      { label: { en: "Keep moving", tr: "Devam et" }, next: "ashling_05" },
    ],
  },

  ashling_05: {
    title: { en: "The Fused Archway", tr: "Kaynaşmış Kemer" },
    mood: "orange",
    text: {
      en: "Heat warped the old archway shut, metal fused to stone. Wards are cut into the frame, scorched but not gone.",
      tr: "Isı eski kemeri kaynaştırıp kapatmış, metal taşla birleşmiş. Çerçeveye kazınmış mühürler var, kararmış ama silinmemiş.",
    },
    choices: [
      { label: { en: "Force the archway open", tr: "Kemeri zorla aç" }, classOnly: "blade", next: "ashling_06", effect: () => { damage(1); } },
      {
        label: { en: "Read the wards", tr: "Mühürleri oku" },
        classOnly: "rite",
        next: "ashling_06",
        effect: () => { state.flags.add("ashling_wards_read"); },
        text: { en: "The scorched marks are still legible to you, and you know exactly which section is safe to push against.", tr: "Kararmış işaretler hâlâ okunabiliyor, tam olarak hangi kısmın itilmeye güvenli olduğunu biliyorsun." },
      },
      { label: { en: "Find the weak latch", tr: "Zayıf mandalı bul" }, type: "check", stat: "int", dc: 10,
        onSuccess: { next: "ashling_06", text: { en: "You spot a hairline gap and work the latch free.", tr: "İnce bir aralık buluyor, mandalı gevşetiyorsun." } },
        onFail: { next: "ashling_06", effect: () => { damage(1); }, text: { en: "A section of warped metal snaps back and grazes your hand.", tr: "Bükülmüş bir metal parçası geri fırlıyor, elini sıyırıyor." } },
      },
      { label: { en: "Break it down", tr: "Kırarak aç" }, type: "check", stat: "str", dc: 11,
        onSuccess: { next: "ashling_06", text: { en: "You bend the fused metal back with steady force.", tr: "Kaynaşmış metali sabit bir güçle geriye büküyorsun." } },
        onFail: { next: "ashling_06", effect: () => { damage(2); }, text: { en: "It gives all at once and a sharp edge catches your arm.", tr: "Aniden veriyor, keskin bir kenar kolunu kesiyor." } },
      },
    ],
  },

  ashling_06: {
    title: { en: "Past the Archway", tr: "Kemerin Ardında" },
    mood: "orange",
    text: {
      en: "Beyond, the air fills with drifting ash, thick enough to taste. Small orange lights drift through it, unhurried.",
      tr: "İlerisinde hava savrulan küllerle doluyor, tadı bile alınacak kadar yoğun. Küçük turuncu ışıklar içinden acele etmeden süzülüyor.",
    },
    choices: [{ label: { en: "Continue", tr: "Devam et" }, next: "ashling_07" }],
  },

  ashling_07: {
    title: { en: "Kindling Motes", tr: "Kıvılcım Zerreleri" },
    mood: "orange",
    text: {
      en: "They're small, fist-sized flickers of flame, curious rather than hostile, unless something startles them.",
      tr: "Küçükler, yumruk büyüklüğünde alev parçacıkları, tedirgin edilmedikçe düşman değil, meraklılar.",
    },
    choices: [
      {
        label: { en: "Speak the old calming words", tr: "Eski yatıştırıcı sözleri söyle" },
        classOnly: "rite",
        next: "ashling_08",
        text: { en: "They drift closer, then scatter peacefully, entirely at ease.", tr: "Yaklaşıyorlar, sonra huzurla dağılıyorlar, hiç tedirgin değiller." },
      },
      { label: { en: "Stay still and let them pass", tr: "Kıpırdamadan geçmelerini bekle" }, type: "check", stat: "wis", dc: 9,
        onSuccess: { next: "ashling_08", text: { en: "They drift by without ever really noticing you.", tr: "Seni pek fark etmeden yanından süzülüyorlar." } },
        onFail: { next: "ashling_08", effect: () => { damage(1); }, text: { en: "One brushes your sleeve and it catches for a moment before you smother it.", tr: "Biri koluna değiyor, bir an tutuşuyor ama söndürüyorsun." } },
      },
      { label: { en: "Wave them off", tr: "El sallayarak uzaklaştır" }, type: "check", stat: "cha", dc: 8,
        onSuccess: { next: "ashling_08", text: { en: "A firm gesture is enough to scatter them.", tr: "Kararlı bir hareket dağılmalarına yetiyor." } },
        onFail: { next: "ashling_08", effect: () => { damage(1); }, text: { en: "You startle one and it flares against your hand.", tr: "Birini ürkütüyorsun, elinde parlıyor." } },
      },
    ],
  },

  ashling_08: {
    title: { en: "Catwalk or Cellar", tr: "Geçit mi Mahzen mi" },
    mood: "orange",
    text: {
      en: "A narrow iron catwalk crosses directly over a bed of low, steady embers. A cooler route drops down into an old cellar and goes the long way around.",
      tr: "Dar bir demir geçit doğrudan alçak, sabit korların üzerinden geçiyor. Daha serin bir yol ise eski bir mahzene inip uzun yoldan dolanıyor.",
    },
    choices: [
      { label: { en: "Cross the catwalk", tr: "Geçitten geç" }, next: "ashling_09a" },
      { label: { en: "Take the cellar route", tr: "Mahzen yolunu tut" }, next: "ashling_09b" },
    ],
  },

  ashling_09a: {
    title: { en: "Over the Embers", tr: "Korların Üstünde" },
    mood: "orange",
    text: {
      en: "The heat rising off the embers is fierce even from the catwalk.",
      tr: "Korlardan yükselen sıcaklık geçitten bile şiddetli hissediliyor.",
    },
    choices: [
      {
        label: { en: "Walk it steady, no hesitation", tr: "Duraksamadan sabit adımlarla geç" },
        requires: () => state.stats.con >= 5,
        next: "ashling_10",
        text: { en: "Your nerve doesn't so much as flicker, and you're across before the heat has time to matter.", tr: "Cesaretin hiç sarsılmıyor, sıcaklık önem kazanmadan karşıya geçiyorsun." },
      },
      { label: { en: "Cross carefully", tr: "Dikkatlice geç" }, type: "check", stat: "dex", dc: 11,
        onSuccess: { next: "ashling_10", text: { en: "You keep your pace even and make it across.", tr: "Adımlarını düzenli tutuyor, karşıya geçiyorsun." } },
        onFail: { next: "ashling_10", effect: () => { damage(2); }, text: { en: "The heat gets to you halfway and you stumble the rest of the way across.", tr: "Yarı yolda sıcaklık seni zorluyor, geri kalanını sendeleyerek geçiyorsun." } },
      },
    ],
  },

  ashling_09b: {
    title: { en: "The Old Cellar", tr: "Eski Mahzen" },
    mood: "orange",
    text: {
      en: "Cooler, slower, but along the wall you spot a warped bronze bell half-buried in ash.",
      tr: "Daha serin, daha yavaş ama duvar boyunca küllerin arasına yarı gömülmüş, çarpılmış bronz bir çan görüyorsun.",
    },
    choices: [
      { label: { en: "Dig it out", tr: "Kazıp çıkar" }, next: "ashling_10", effect: () => { state.relics.push("warped bell"); } },
      { label: { en: "Leave it", tr: "Bırak" }, next: "ashling_10" },
    ],
  },

  ashling_10: {
    title: { en: "A Cool Corner", tr: "Serin Bir Köşe" },
    mood: "amber",
    text: {
      en: "A stretch of shrine wall stayed untouched by the fire somehow, cool stone against your back.",
      tr: "Tapınak duvarının bir kısmı bir şekilde yangından etkilenmemiş, sırtına değen taş serin.",
    },
    choices: [
      { label: { en: "Rest here", tr: "Burada dinlen" }, next: "ashling_11", effect: () => { heal(2); } },
      { label: { en: "Look around a bit more first", tr: "Önce biraz etrafa bak" }, next: "ashling_10b" },
      { label: { en: "Keep going", tr: "Devam et" }, next: "ashling_11" },
    ],
  },

  ashling_10b: {
    title: { en: "A Priest's Cache", tr: "Bir Rahibin Saklı Yeri" },
    mood: "amber",
    text: {
      en: "Behind a loose stone, someone stashed a small kit and never came back for it, spared from the fire by pure luck.",
      tr: "Gevşek bir taşın arkasına biri küçük bir kit saklamış ve bir daha geri dönmemiş, sırf şans eseri yangından kurtulmuş.",
    },
    choices: [
      { label: { en: "Take it", tr: "Al" }, next: "ashling_11", effect: () => { heal(1); } },
      { label: { en: "Leave it, keep moving", tr: "Bırak, devam et" }, next: "ashling_11" },
    ],
  },

  ashling_11: {
    title: { en: "The Shrine Records", tr: "Tapınak Kayıtları" },
    mood: "orange",
    icon: "icon-scroll",
    text: {
      en: "Clay tablets are stacked here, most cracked from the heat. A wax seal, somehow unmelted, sits on top of the pile. A small reliquary box is tucked behind them.",
      tr: "Burada kil tabletler istiflenmiş, çoğu ısıdan çatlamış. Yığının üstünde nedense erimemiş bir mum mühür duruyor. Arkalarında küçük bir kutu saklı.",
    },
    choices: [
      {
        label: { en: "Read the tablets", tr: "Tabletleri oku" },
        classOnly: "rite",
        next: "ashling_12",
        effect: () => { state.relics.push("melted wax seal"); },
        text: { en: "You make sense of the old shrine records at a glance, including a note on how the shrine's keeper used to calm the flame.", tr: "Eski tapınak kayıtlarını bir bakışta anlıyorsun, tapınağın bekçisinin alevi nasıl yatıştırdığına dair bir not da dahil." },
      },
      { label: { en: "Try to piece the records together", tr: "Kayıtları birleştirmeye çalış" }, type: "check", stat: "int", dc: 10,
        onSuccess: { next: "ashling_12", effect: () => { state.relics.push("melted wax seal"); }, text: { en: "You make out enough of it to be useful.", tr: "İşe yarayacak kadarını çözüyorsun." } },
        onFail: { next: "ashling_12", text: { en: "The tablets are too fragmented to make real sense of.", tr: "Tabletler anlam çıkaramayacak kadar parçalanmış." } },
      },
      { label: { en: "Check the reliquary box instead", tr: "Onun yerine kutuya bak" }, next: "ashling_11c" },
      { label: { en: "Leave it all", tr: "Hiçbirine dokunma" }, next: "ashling_12" },
    ],
  },

  ashling_11c: {
    title: { en: "A Locked Reliquary", tr: "Kilitli Bir Kutu" },
    mood: "orange",
    text: {
      en: "A small metal box, warped shut by heat, sits behind the tablets.",
      tr: "Tabletlerin arkasında, ısı yüzünden kaynaşıp kapanmış küçük bir metal kutu duruyor.",
    },
    choices: [
      { label: { en: "Force it open", tr: "Zorla aç" }, classOnly: "blade", next: "ashling_12", effect: () => { damage(1); state.relics.push("a small brass icon"); } },
      { label: { en: "Work the warped hinge free", tr: "Kaynaşmış menteşeyi gevşet" }, type: "check", stat: "int", dc: 9,
        onSuccess: { next: "ashling_12", effect: () => { state.relics.push("a small brass icon"); }, text: { en: "The hinge finally gives without breaking anything inside.", tr: "Menteşe sonunda içindekini bozmadan açılıyor." } },
        onFail: { next: "ashling_12", text: { en: "It won't budge, and you're not going to waste more time on it.", tr: "Hiç açılmıyor, daha fazla vakit harcamayacaksın." } },
      },
      { label: { en: "Leave it", tr: "Bırak" }, next: "ashling_12" },
    ],
  },

  ashling_12: {
    title: { en: "The Blocked Passage", tr: "Tıkalı Geçit" },
    mood: "orange",
    text: {
      en: "A second collapse blocks the way, and beside it a row of dead braziers, each carved with a different mark, that look like they used to open something when lit in the right order.",
      tr: "İkinci bir çökme yolu kapatıyor, yanında ise her biri farklı bir işaretle kazınmış, doğru sırayla yakıldığında bir şeyi açtığı belli olan bir sıra sönmüş mangal var.",
    },
    choices: [
      { label: { en: "Just climb through the rubble", tr: "Molozun içinden zorla geç" }, classOnly: "blade", next: "ashling_14", effect: () => { damage(1); } },
      { label: { en: "Try the braziers", tr: "Mangalları dene" }, next: "ashling_13" },
    ],
  },

  ashling_13: {
    title: { en: "The Right Order", tr: "Doğru Sıra" },
    mood: "orange",
    text: {
      en: "An inscription above the braziers hints at the order, if you can read it.",
      tr: "Mangalların üstündeki bir yazı, okuyabilirsen sırayı ima ediyor.",
    },
    choices: [
      {
        label: { en: "Read the inscription", tr: "Yazıtı oku" },
        classOnly: "rite",
        next: "ashling_14",
        text: { en: "The order is obvious to you, and the braziers catch in sequence, the rubble sliding aside on its own.", tr: "Sıra senin için apaçık, mangallar sırayla tutuşuyor, moloz kendiliğinden kayarak açılıyor." },
      },
      {
        label: { en: "Work out the pattern yourself", tr: "Deseni kendin çöz" },
        requires: () => state.stats.int >= 5,
        next: "ashling_14",
        text: { en: "You don't need the inscription, the logic of the marks is plain enough on its own.", tr: "Yazıta ihtiyacın yok, işaretlerin mantığı zaten yeterince açık." },
      },
      { label: { en: "Guess at the order", tr: "Sırayı tahmin et" }, type: "check", stat: "int", dc: 12,
        onSuccess: { next: "ashling_14", text: { en: "You get it right on the first try.", tr: "İlk denemede doğru yapıyorsun." } },
        onFail: { next: "ashling_14", effect: () => { damage(1); }, text: { en: "You light them wrong, and a burst of flame singes your sleeve before you correct it.", tr: "Yanlış yakıyorsun, düzeltmeden önce bir alev patlaması kolunu kavuruyor." } },
      },
    ],
  },

  ashling_14: {
    title: { en: "The Flame in the Shrine", tr: "Tapınaktaki Alev" },
    mood: "red",
    icon: "icon-ashling",
    text: {
      en: "It's there ahead, taller than a person, burning without fuel in the shrine's heart, and it turns toward you the moment you enter.",
      tr: "İlerde duruyor, bir insandan uzun, tapınağın kalbinde yakıtsız yanıyor, sen içeri girer girmez sana doğru dönüyor.",
    },
    choices: [
      {
        label: { en: "Stand firm, don't flinch", tr: "Yerinde dur, gerileme" },
        classOnly: "blade",
        next: "ashling_15",
        effect: () => { damage(2); },
        text: { en: "You take a wash of heat against your skin and don't move, and it seems to respect that more than it wants to burn you.", tr: "Cildine çarpan bir sıcaklık dalgasına rağmen hareket etmiyorsun, seni yakmaktan çok buna saygı duyuyor gibi." },
      },
      { label: { en: "Back away calmly", tr: "Sakince geri çekil" }, type: "check", stat: "wis", dc: 10,
        onSuccess: { next: "ashling_15", text: { en: "You retreat without showing fear, and it settles.", tr: "Korku göstermeden geri çekiliyorsun, o da yatışıyor." } },
        onFail: { next: "ashling_15", effect: () => { damage(1); }, text: { en: "It flares once as you back away, catching your sleeve.", tr: "Geri çekilirken bir kez parlıyor, kolunu tutuşturuyor." } },
      },
      { label: { en: "Speak to it steadily", tr: "Sakin bir sesle konuş" }, type: "check", stat: "cha", dc: 11,
        onSuccess: { next: "ashling_15", text: { en: "Something in your tone reaches it, and it dims a little.", tr: "Ses tonundaki bir şey ona ulaşıyor, biraz sönüyor." } },
        onFail: { next: "ashling_15", effect: () => { damage(1); }, text: { en: "It doesn't understand, or doesn't care, and flares in answer.", tr: "Anlamıyor ya da umursamıyor, cevap olarak parlıyor." } },
      },
    ],
  },

  ashling_15: {
    title: { en: "Cracked Ground Again", tr: "Yine Çatlak Zemin" },
    mood: "orange",
    text: {
      en: "The floor here is just as unstable as before.",
      tr: "Buradaki zemin de öncekiler kadar dengesiz.",
    },
    choices: [
      { label: { en: "Pick your steps", tr: "Adımlarını seç" }, type: "check", stat: "dex", dc: 9,
        onSuccess: { next: "ashling_16", text: { en: "You cross without a scare.", tr: "Hiç korkmadan geçiyorsun." } },
        onFail: { next: "ashling_16", effect: () => { damage(1); }, text: { en: "A tile cracks under you but holds just long enough.", tr: "Altında bir fayans çatlıyor ama tam vaktinde dayanıyor." } },
      },
      {
        label: { en: "Skirt the edge along the wall", tr: "Duvar boyunca kenardan ilerle" },
        classOnly: "shadow",
        next: "ashling_16c",
      },
    ],
  },

  ashling_16c: {
    title: { en: "Along the Wall", tr: "Duvar Boyunca" },
    mood: "orange",
    text: {
      en: "The narrow strip along the wall holds a small cache someone tucked away and forgot, undisturbed since the fire.",
      tr: "Duvar boyunca dar şerit, birinin saklayıp unuttuğu, yangından beri hiç dokunulmamış küçük bir stok barındırıyor.",
    },
    choices: [
      { label: { en: "Take it and continue", tr: "Al ve devam et" }, next: "ashling_16", effect: () => { heal(1); } },
    ],
  },

  ashling_16: {
    title: { en: "A Fallen Warden", tr: "Düşmüş Bir Muhafız" },
    mood: "orange",
    text: {
      en: "Bones, burned black, rest against the wall. Something metal glints beneath them, an old tile etched with a name.",
      tr: "Simsiyah yanmış kemikler duvara yaslanmış duruyor. Altlarında metal bir şey parlıyor, üzerine bir isim kazınmış eski bir fayans.",
    },
    choices: [
      { label: { en: "Take the tile", tr: "Fayansı al" }, next: "ashling_17a", effect: () => { state.relics.push("ash-etched tile"); } },
      { label: { en: "Leave them be", tr: "Onu rahat bırak" }, next: "ashling_17a" },
    ],
  },

  ashling_17a: {
    title: { en: "Flame Corridor or Side Vent", tr: "Alev Koridoru mu Yan Baca mı" },
    mood: "orange",
    text: {
      en: "Ahead, an open corridor still flickers with low flame along both walls, or a narrow side vent skips around it entirely.",
      tr: "İlerideki açık koridorun iki duvarında hâlâ alçak alevler titreşiyor, ya da dar bir yan baca onu tamamen atlıyor.",
    },
    choices: [
      { label: { en: "Walk the flame corridor", tr: "Alev koridorundan geç" }, next: "ashling_17b" },
      { label: { en: "Take the side vent", tr: "Yan bacayı kullan" }, next: "ashling_17c" },
      {
        label: { en: "Slip through the gap between, unnoticed", tr: "Aradaki aralıktan fark edilmeden geç" },
        classOnly: "shadow",
        next: "ashling_18",
        text: { en: "You find a seam between the two routes that neither the flame nor anything watching would ever think to cover.", tr: "İki yolun arasında ne alevin ne de gözleyen bir şeyin kapatmayı akıl edeceği bir çatlak buluyorsun." },
      },
    ],
  },

  ashling_17b: {
    title: { en: "Through the Flames", tr: "Alevlerin İçinden" },
    mood: "orange",
    text: {
      en: "The flames are low but constant, and getting through means getting close.",
      tr: "Alevler alçak ama sürekli, geçmek yaklaşmak demek.",
    },
    choices: [
      {
        label: { en: "Shoulder straight through, heat be damned", tr: "Sıcağa aldırmadan doğruca geç" },
        requires: () => state.stats.con >= 5,
        next: "ashling_18",
        text: { en: "Your build shrugs off the heat well enough that you just walk it.", tr: "Yapın sıcağa o kadar dayanıklı ki yürüyerek geçiyorsun." },
      },
      { label: { en: "Push through quickly", tr: "Hızla geç" }, type: "check", stat: "con", dc: 10,
        onSuccess: { next: "ashling_18", text: { en: "You move fast enough that the heat barely registers.", tr: "O kadar hızlı hareket ediyorsun ki sıcaklık neredeyse hissedilmiyor." } },
        onFail: { next: "ashling_18", effect: () => { damage(2); }, text: { en: "The heat catches you halfway and you stumble out singed.", tr: "Yarı yolda sıcaklık seni yakalıyor, kavrulmuş halde çıkıyorsun." } },
      },
    ],
  },

  ashling_17c: {
    title: { en: "The Side Vent", tr: "Yan Baca" },
    mood: "orange",
    text: {
      en: "Cramped but cool, and near the end you find a dropped waterskin, somehow intact.",
      tr: "Dar ama serin, ucuna yakın bir yerde nedense hâlâ sağlam bir su tulumu buluyorsun.",
    },
    choices: [
      { label: { en: "Take it", tr: "Al" }, next: "ashling_18", effect: () => { heal(1); } },
      { label: { en: "Keep moving", tr: "Devam et" }, next: "ashling_18" },
    ],
  },

  ashling_18: {
    title: { en: "The Ash Cloud", tr: "Kül Bulutu" },
    mood: "orange",
    text: {
      en: "A whole chamber ahead is choked with fine drifting ash, the kind that gets into your lungs if you're not careful.",
      tr: "İlerideki tüm oda ince, savrulan külle dolu, dikkatli olmazsan ciğerlerine dolan türden.",
    },
    choices: [
      { label: { en: "Cover your face and push through", tr: "Yüzünü kapat, içinden geç" }, type: "check", stat: "con", dc: 10,
        onSuccess: { next: "ashling_19", text: { en: "You get through before it catches in your chest.", tr: "Göğsüne dolmadan geçiyorsun." } },
        onFail: { next: "ashling_19", effect: () => { damage(2); }, text: { en: "You come out coughing hard, throat raw.", tr: "Boğazın yanarak, şiddetli öksürerek çıkıyorsun." } },
      },
      { label: { en: "Find the cleaner air pocket", tr: "Daha temiz hava cebini bul" }, type: "check", stat: "wis", dc: 9,
        onSuccess: { next: "ashling_19", text: { en: "You spot a thinner patch and follow it through.", tr: "Daha seyrek bir bölge buluyor, onu takip ederek geçiyorsun." } },
        onFail: { next: "ashling_19", effect: () => { damage(1); }, text: { en: "You can't find a clean line and breathe in more than you'd like.", tr: "Temiz bir hat bulamıyor, istediğinden fazlasını soluyorsun." } },
      },
    ],
  },

  ashling_19: {
    title: { en: "A Failing Ward", tr: "Çöken Bir Mühür" },
    mood: "violet",
    text: {
      en: "Another minor ward-stone, not the one you need, flickers weakly in a side nook.",
      tr: "Bir yan oyukta zayıfça titreyen, aradığın olmayan başka küçük bir mühür taşı.",
    },
    choices: [
      {
        label: { en: "Perform the partial rite", tr: "Kısmi âyini gerçekleştir" },
        classOnly: "rite",
        next: "ashling_20",
        effect: () => { heal(1); },
        text: { en: "You settle it with familiar words, and the quiet after feels earned.", tr: "Bildik sözlerle yatıştırıyorsun, ardından gelen sessizlik hak edilmiş gibi." },
      },
      { label: { en: "Try to stabilize it", tr: "Dengelemeye çalış" }, type: "check", stat: "int", dc: 12,
        onSuccess: { next: "ashling_20", effect: () => { heal(1); }, text: { en: "You find the right approach and it settles.", tr: "Doğru yaklaşımı buluyorsun, yatışıyor." } },
        onFail: { next: "ashling_20", effect: () => { damage(1); }, text: { en: "It flares against your effort and singes your hand.", tr: "Çabana karşı parlıyor, elini yakıyor." } },
      },
      { label: { en: "Leave it alone", tr: "Dokunma" }, next: "ashling_20" },
    ],
  },

  ashling_20: {
    title: { en: "The Glass Bridge", tr: "Cam Köprü" },
    mood: "orange",
    text: {
      en: "Heat fused the floor here into a narrow ridge of half-melted stone, glassy and treacherous, spanning a drop into the embers below.",
      tr: "Isı buradaki zemini yarı erimiş, camsı ve tehlikeli, aşağıdaki korlara açılan bir uçurumun üzerinde uzanan dar bir sırta dönüştürmüş.",
    },
    choices: [
      { label: { en: "Cross light-footed, no weight lingering", tr: "Hafif adımlarla, hiç durmadan geç" }, classOnly: "shadow", next: "ashling_21", text: { en: "You're across before the heat even registers.", tr: "Sıcaklık fark edilmeden karşıya geçiyorsun." } },
      { label: { en: "Cross it fast", tr: "Hızlıca geç" }, type: "check", stat: "str", dc: 11,
        onSuccess: { next: "ashling_21", text: { en: "You cover the distance in a few sure strides.", tr: "Birkaç emin adımda mesafeyi kapatıyorsun." } },
        onFail: { next: "ashling_21", effect: () => { damage(2); }, text: { en: "You slip near the end and land hard on the far side.", tr: "Sona yakın kayıyor, karşı tarafa sert iniyorsun." } },
      },
      { label: { en: "Cross it slow and steady", tr: "Yavaş ve dengeli geç" }, type: "check", stat: "con", dc: 11,
        onSuccess: { next: "ashling_21", text: { en: "You take it one careful step at a time and make it across.", tr: "Adım adım dikkatle ilerliyor, karşıya geçiyorsun." } },
        onFail: { next: "ashling_21", effect: () => { damage(2); }, text: { en: "Your foot skids on the glassy surface and you go down hard.", tr: "Ayağın camsı yüzeyde kayıyor, sert bir şekilde düşüyorsun." } },
      },
    ],
  },

  ashling_21: {
    title: { en: "The Shrine's Heart", tr: "Tapınağın Kalbi" },
    mood: "red",
    icon: "icon-ashling",
    text: {
      en: "The flame is here, larger now, coiled around what must be the ward-stone itself.",
      tr: "Alev burada, şimdi daha büyük, mühür taşının kendisi olması gereken şeyin etrafına sarılmış.",
    },
    choices: [
      { label: { en: "Circle around unseen", tr: "Fark edilmeden çevresinden dolan" }, classOnly: "shadow", next: "ashling_23", text: { en: "You keep to the cold stone at the edges and it never notices you at all.", tr: "Kenarlardaki soğuk taşa yapışıyorsun, seni hiç fark etmiyor." } },
      {
        label: { en: "Approach without fear, and mean it", tr: "Korkusuzca yaklaş, ciddi ol" },
        requires: () => state.stats.cha >= 5,
        next: "ashling_23",
        text: { en: "It reads nothing in you worth burning for, and lets you pass close by.", tr: "Sende yakmaya değer bir şey bulamıyor, yanından geçmene izin veriyor." },
      },
      { label: { en: "Approach carefully", tr: "Dikkatle yaklaş" }, type: "check", stat: "wis", dc: 12,
        onSuccess: { next: "ashling_23", text: { en: "You move slow enough that it doesn't take offense.", tr: "Yeterince yavaş hareket ediyorsun, rahatsız olmuyor." } },
        onFail: { next: "ashling_22" },
      },
      { label: { en: "Confront it directly", tr: "Doğrudan karşısına çık" }, next: "ashling_22" },
    ],
  },

  ashling_22: {
    title: { en: "The Flame Rises", tr: "Alev Yükseliyor" },
    mood: "red",
    text: {
      en: "It doesn't want a fight so much as it wants to be left alone, but it will burn you to get that.",
      tr: "Bir kavga istediğinden çok yalnız bırakılmak istiyor, ama bunun için seni yakmaktan çekinmeyecek.",
    },
    choices: [
      { label: { en: "Weather the heat and push through", tr: "Sıcağa dayan, içinden geç" }, type: "check", stat: "con", dc: 12,
        onSuccess: { next: "ashling_23", effect: () => { damage(2); }, text: { en: "You push through, burned but standing.", tr: "İçinden geçiyorsun, yanmış ama ayaktasın." } },
        onFail: { next: "ashling_23", effect: () => { damage(3); }, text: { en: "It catches you badly before finally letting you pass.", tr: "Seni fena halde yakıyor, sonunda geçmene izin veriyor." } },
      },
      { label: { en: "Find the calm at its center", tr: "Merkezindeki sakinliği bul" }, type: "check", stat: "wis", dc: 11,
        onSuccess: { next: "ashling_23", text: { en: "You find the still point in it and it settles just enough.", tr: "İçindeki durgun noktayı buluyorsun, yeterince yatışıyor." } },
        onFail: { next: "ashling_23", effect: () => { damage(2); }, text: { en: "You misjudge it and it flares hard before calming.", tr: "Yanlış okuyorsun, yatışmadan önce şiddetle parlıyor." } },
      },
    ],
  },

  ashling_23: {
    title: { en: "Past the Flame", tr: "Alevin Ötesinde" },
    mood: "orange",
    text: {
      en: "However it happened, you're through, and the heat is finally easing.",
      tr: "Nasıl olduysa oldu, geçtin, sıcaklık sonunda hafifliyor.",
    },
    choices: [{ label: { en: "Continue", tr: "Devam et" }, next: "ashling_24" }],
  },

  ashling_24: {
    title: { en: "The Ward-Stone", tr: "Mühür Taşı" },
    mood: "violet",
    icon: "icon-scroll",
    text: {
      en: "The stone here is scorched black but intact, the crack running through it thin as a hair.",
      tr: "Buradaki taş simsiyah kararmış ama sağlam, içinden geçen çatlak kıl kadar ince.",
    },
    choices: [
      {
        label: { en: "Read the inscription", tr: "Yazıtı oku" },
        classOnly: "rite",
        next: "ashling_25",
        effect: () => { state.flags.add("ashling_inscription_read"); },
        text: { en: "The old script tells you exactly how close this one is to failing, and why.", tr: "Eski yazı, bunun ne kadar çöküşe yakın olduğunu ve nedenini tam olarak anlatıyor." },
      },
      { label: { en: "Study the crack", tr: "Çatlağı incele" }, type: "check", stat: "int", dc: 11,
        onSuccess: { next: "ashling_25", text: { en: "You get a rough sense of how bad it is.", tr: "Ne kadar kötü durumda olduğuna dair kaba bir fikir ediniyorsun." } },
        onFail: { next: "ashling_25", effect: () => { damage(1); }, text: { en: "The stone flares hot against your hand as you touch it.", tr: "Dokunduğunda taş elinin altında ısınıyor." } },
      },
    ],
  },

  ashling_25: {
    title: { en: "Out of the Ash", tr: "Küllerin Dışına" },
    mood: "orange",
    text: {
      en: "The shrine is behind you, and cooler air finds its way in from somewhere ahead.",
      tr: "Tapınak artık geride kaldı, ilerideki bir yerden daha serin bir hava süzülüyor.",
    },
    choices: [{ label: { en: "Move on", tr: "İlerle" }, next: "the_deep" }],
  },
};

// ============================================================
// BONE VAULT BRANCH -- Bonewretch (prefix: bone_)
// Recurring elements: shifting bone piles, sealed ossuary doors,
// marrow dust in the air, rib-crawlers, grave-good relics, a
// burial-order niche puzzle, a bone chute shortcut.
// ============================================================

const boneBranch = {
  bone_01: {
    title: { en: "Into the Vault", tr: "Kemik Mahzenine Giriş" },
    mood: "bone",
    icon: "icon-bone",
    text: {
      en: "The passage down is lined floor to ceiling with old bone, stacked by hands that cared once and stopped caring somewhere along the way. Three ways in: straight down the main gallery where the stacks are highest, along a narrow service crawlway that keeps clear of the piles, or through a gap in the wall where the dark sits thickest.",
      tr: "Aşağı inen geçit tepeden tırnağa eski kemiklerle örülü, bir zamanlar özenle, sonra bir yerde özeni bırakmış ellerle istiflenmiş. İçeri üç yol var: yığınların en yüksek olduğu ana galeriden dosdoğru geçmek, yığınlardan uzak duran dar bir bakım geçidinden ilerlemek ya da karanlığın en yoğun olduğu duvardaki bir aralıktan sızmak.",
    },
    choices: [
      { label: { en: "Walk the main gallery", tr: "Ana galeriden geç" }, next: "bone_02a" },
      { label: { en: "Take the service crawlway", tr: "Bakım geçidinden ilerle" }, next: "bone_02b" },
      { label: { en: "Slip through the gap", tr: "Aralıktan sıyrıl" }, classOnly: "shadow", next: "bone_02c" },
    ],
  },

  bone_02a: {
    title: { en: "Shifting Bone", tr: "Kayan Kemikler" },
    mood: "bone",
    text: {
      en: "The stacks aren't as solid as they look. Every step sends a small slide of bone clattering somewhere nearby.",
      tr: "Yığınlar göründükleri kadar sağlam değil. Her adımda yakınlarda bir yerde küçük bir kemik kayması takırdıyor.",
    },
    choices: [
      { label: { en: "Move carefully", tr: "Dikkatle ilerle" }, type: "check", stat: "dex", dc: 9,
        onSuccess: { next: "bone_03", text: { en: "You thread through without setting off a single slide.", tr: "Tek bir kayma bile başlatmadan aralarından geçiyorsun." } },
        onFail: { next: "bone_03", effect: () => { damage(2); }, text: { en: "A stack gives way under you and buries your leg to the knee before you dig free.", tr: "Bir yığın altında çöküyor, bacan dizine kadar gömülüyor ama zor bela çıkıyorsun." } },
      },
    ],
  },

  bone_02b: {
    title: { en: "The Crawlway", tr: "Sürünme Geçidi" },
    mood: "bone",
    text: {
      en: "Low and cramped, but the bone here is packed solid enough to trust.",
      tr: "Alçak ve dar, ama buradaki kemikler güvenilecek kadar sıkı yerleşmiş.",
    },
    choices: [
      { label: { en: "Push through", tr: "İçinden geç" }, type: "check", stat: "str", dc: 8,
        onSuccess: { next: "bone_03", text: { en: "You force through without much trouble.", tr: "Fazla zorlanmadan içinden geçiyorsun." } },
        onFail: { next: "bone_03", effect: () => { damage(1); }, text: { en: "You wedge yourself briefly and have to wrench free, scraping your shoulder.", tr: "Bir an sıkışıyorsun, omzunu sıyırarak zor bela kurtuluyorsun." } },
      },
    ],
  },

  bone_02c: {
    title: { en: "Through the Gap", tr: "Aralıktan Geçiş" },
    mood: "bone",
    text: {
      en: "You fold yourself sideways through the gap without so much as a bone shifting under you. Something small and pale skitters away in the dark without ever knowing you passed.",
      tr: "Tek bir kemiği bile kaydırmadan aralıktan yana doğru süzülüyorsun. Küçük, soluk bir şey karanlıkta senin geçtiğini hiç fark etmeden kaçışıyor.",
    },
    choices: [
      { label: { en: "Continue on, unseen", tr: "Fark edilmeden devam et" }, next: "bone_03", effect: () => { state.flags.add("bone_quiet_entry"); } },
    ],
  },

  bone_03: {
    title: { en: "A Branching Gallery", tr: "Dallanan Galeri" },
    mood: "bone",
    text: {
      en: "Two burial niches open off to the sides, dark and undisturbed. The main gallery continues ahead toward a sealed ossuary door.",
      tr: "Yanlarda iki mezar oyuğu açılıyor, karanlık ve el değmemiş. Ana galeri ilerideki mühürlü bir mahzen kapısına doğru devam ediyor.",
    },
    choices: [
      { label: { en: "Check the left niche", tr: "Soldaki oyuğa bak" }, next: "bone_04" },
      { label: { en: "Check the right niche", tr: "Sağdaki oyuğa bak" }, next: "bone_04b" },
      { label: { en: "Skip ahead", tr: "Atla, ilerle" }, next: "bone_05" },
    ],
  },

  bone_04: {
    title: { en: "A Sealed Niche", tr: "Mühürlü Bir Oyuk" },
    mood: "bone",
    text: {
      en: "Grave goods sit undisturbed beside old remains, a ring gone yellow with age among them.",
      tr: "Mezar eşyaları eski kalıntıların yanında hiç dokunulmamış duruyor, aralarında yaşla sararmış bir yüzük var.",
    },
    choices: [
      { label: { en: "Take it without disturbing the rest", tr: "Geri kalanını bozmadan al" }, type: "check", stat: "dex", dc: 8,
        onSuccess: { next: "bone_05", effect: () => { state.relics.push("yellowed grave ring"); }, text: { en: "You slide it free without a sound.", tr: "Hiç ses çıkarmadan çekip alıyorsun." } },
        onFail: { next: "bone_05", effect: () => { damage(1); }, text: { en: "Your hand knocks something loose and a scatter of small bones clatters down around you.", tr: "Elin bir şeyi kaydırıyor, etrafına küçük kemikler dökülüyor." } },
      },
      { label: { en: "Leave it", tr: "Bırak" }, next: "bone_05" },
    ],
  },

  bone_04b: {
    title: { en: "Another Niche", tr: "Başka Bir Oyuk" },
    mood: "amber",
    text: {
      en: "This one's smaller, empty of remains, just old dust and quiet.",
      tr: "Bu daha küçük, kalıntısı yok, sadece eski toz ve sessizlik.",
    },
    choices: [
      { label: { en: "Rest a moment", tr: "Bir süre dinlen" }, next: "bone_05", effect: () => { heal(2); } },
      { label: { en: "Keep moving", tr: "Devam et" }, next: "bone_05" },
    ],
  },

  bone_05: {
    title: { en: "The Sealed Door", tr: "Mühürlü Kapı" },
    mood: "bone",
    text: {
      en: "A stone door blocks the gallery, carved over with warding marks, wedged shut by decades of settling.",
      tr: "Bir taş kapı galeriyi kapatıyor, üstü mühür işaretleriyle kazınmış, onlarca yıllık çökmeyle sıkışmış.",
    },
    choices: [
      { label: { en: "Force it open", tr: "Zorla aç" }, classOnly: "blade", next: "bone_06", effect: () => { damage(1); } },
      {
        label: { en: "Read the warding marks", tr: "Mühür işaretlerini oku" },
        classOnly: "rite",
        next: "bone_06",
        effect: () => { state.flags.add("bone_marks_read"); },
        text: { en: "You know exactly which mark releases the door and which one you'd rather not touch.", tr: "Hangi işaretin kapıyı açtığını, hangisine dokunmaman gerektiğini tam olarak biliyorsun." },
      },
      { label: { en: "Find the release mechanism", tr: "Açma mekanizmasını bul" }, type: "check", stat: "int", dc: 10,
        onSuccess: { next: "bone_06", text: { en: "You find the hidden catch and the door swings loose.", tr: "Gizli mandalı buluyorsun, kapı gevşeyip açılıyor." } },
        onFail: { next: "bone_06", effect: () => { damage(1); }, text: { en: "You trigger the wrong mark and a small piece of the frame cracks off onto your hand.", tr: "Yanlış işarete dokunuyorsun, çerçeveden bir parça elinin üstüne düşüyor." } },
      },
      { label: { en: "Break it down", tr: "Kırarak aç" }, type: "check", stat: "str", dc: 11,
        onSuccess: { next: "bone_06", text: { en: "The old stone finally gives way.", tr: "Eski taş sonunda yerinden oynuyor." } },
        onFail: { next: "bone_06", effect: () => { damage(2); }, text: { en: "It gives all at once and a chunk of stone catches your shoulder.", tr: "Aniden veriyor, bir taş parçası omzuna çarpıyor." } },
      },
    ],
  },

  bone_06: {
    title: { en: "Deeper Bone", tr: "Daha Derin Kemikler" },
    mood: "bone",
    text: {
      en: "Past the door, the air changes, dry and fine, dust that gets into everything.",
      tr: "Kapının ardında hava değişiyor, kuru ve ince, her yere sinen bir toz.",
    },
    choices: [{ label: { en: "Continue", tr: "Devam et" }, next: "bone_07" }],
  },

  bone_07: {
    title: { en: "Rib-Crawlers", tr: "Kaburga Sürüngenleri" },
    mood: "bone",
    text: {
      en: "Small things, built from loose bone fragments held together by something that shouldn't work but does, skittering low across the floor. They scatter if left alone.",
      tr: "Çalışmaması gereken ama çalışan bir şeyle bir arada tutulan gevşek kemik parçalarından oluşan küçük şeyler, zeminde alçaktan koşuşturuyorlar. Rahatsız edilmezlerse dağılıyorlar.",
    },
    choices: [
      {
        label: { en: "Recognize the binding and let it be", tr: "Bağı tanı, dokunma" },
        classOnly: "rite",
        next: "bone_08",
        text: { en: "You know what holds them together and know better than to disturb it. They pay you no mind at all.", tr: "Onları bir arada tutan şeyi biliyorsun, bozmamak gerektiğini de. Sana hiç aldırmıyorlar." },
      },
      { label: { en: "Stand still and wait them out", tr: "Kıpırdamadan bekle" }, type: "check", stat: "wis", dc: 9,
        onSuccess: { next: "bone_08", text: { en: "They lose interest and skitter off.", tr: "İlgilerini kaybedip koşuşturarak uzaklaşıyorlar." } },
        onFail: { next: "bone_08", effect: () => { damage(1); }, text: { en: "One darts over your boot and gives you a nasty scratch.", tr: "Biri botunun üzerinden geçiyor, fena bir çizik bırakıyor." } },
      },
      { label: { en: "Scatter them and push through", tr: "Dağıt, içinden geç" }, type: "check", stat: "str", dc: 8,
        onSuccess: { next: "bone_08", text: { en: "A firm sweep of your arm sends them scattering.", tr: "Kolunu sert bir hareketle sallayınca dağılıyorlar." } },
        onFail: { next: "bone_08", effect: () => { damage(1); }, text: { en: "One clings on and needs to be pried off.", tr: "Biri tutunuyor, çekip çıkarman gerekiyor." } },
      },
    ],
  },

  bone_08: {
    title: { en: "Two Paths Down", tr: "Aşağıya İki Yol" },
    mood: "bone",
    text: {
      en: "The gallery splits. A steep drop through a bone chute looks like a shortcut if you can control the fall. A longer stair winds down the safer way.",
      tr: "Galeri ikiye ayrılıyor. Bir kemik oluğundan dik bir iniş, düşüşü kontrol edebilirsen bir kısayol gibi görünüyor. Daha uzun bir merdiven ise daha güvenli yoldan aşağı kıvrılıyor.",
    },
    choices: [
      { label: { en: "Take the bone chute", tr: "Kemik oluğuna gir" }, next: "bone_09a" },
      { label: { en: "Take the stair", tr: "Merdiveni kullan" }, next: "bone_09b" },
    ],
  },

  bone_09a: {
    title: { en: "The Chute", tr: "Oluk" },
    mood: "bone",
    text: {
      en: "It's steeper than it looked, and there's nothing to grab on the way down.",
      tr: "Göründüğünden daha dik, inerken tutunacak hiçbir şey yok.",
    },
    choices: [
      {
        label: { en: "Control the fall with brute strength", tr: "Kaba güçle düşüşü kontrol et" },
        requires: () => state.stats.str >= 5,
        next: "bone_10",
        text: { en: "You brace hard enough against the sides that the fall barely counts as one.", tr: "Kenarlara o kadar sert dayanıyorsun ki düşüş neredeyse düşüş sayılmıyor." },
      },
      { label: { en: "Control the fall", tr: "Düşüşü kontrol et" }, type: "check", stat: "dex", dc: 11,
        onSuccess: { next: "bone_10", text: { en: "You manage to slow yourself enough to land clean.", tr: "Kendini yeterince yavaşlatıp temiz iniyorsun." } },
        onFail: { next: "bone_10", effect: () => { damage(2); }, text: { en: "You hit the bottom hard and lie still for a second before getting up.", tr: "Dibe sert bir şekilde çarpıyor, ayağa kalkmadan önce bir saniye öylece kalıyorsun." } },
      },
    ],
  },

  bone_09b: {
    title: { en: "The Long Stair", tr: "Uzun Merdiven" },
    mood: "bone",
    text: {
      en: "Slower, but you spot something tucked into a gap in the wall along the way.",
      tr: "Daha yavaş, ama yol boyunca duvardaki bir aralığa sıkışmış bir şey görüyorsun.",
    },
    choices: [
      { label: { en: "Reach in for it", tr: "Elini uzatıp al" }, type: "check", stat: "dex", dc: 8,
        onSuccess: { next: "bone_10", effect: () => { state.relics.push("marrow charm"); }, text: { en: "You work it free, a small charm strung on old cord.", tr: "Yerinden söküyorsun, eski bir iple bağlanmış küçük bir tılsım." } },
        onFail: { next: "bone_10", text: { en: "It's wedged too deep to reach without more time.", tr: "Daha fazla vakit gerektirecek kadar derin sıkışmış, ulaşamıyorsun." } },
      },
      { label: { en: "Leave it", tr: "Bırak" }, next: "bone_10" },
    ],
  },

  bone_10: {
    title: { en: "A Still Chamber", tr: "Durgun Bir Oda" },
    mood: "amber",
    text: {
      en: "No bones here, just bare stone, quiet enough to catch your breath.",
      tr: "Burada kemik yok, sadece çıplak taş, nefes toplayacak kadar sessiz.",
    },
    choices: [
      { label: { en: "Rest here", tr: "Burada dinlen" }, next: "bone_11", effect: () => { heal(2); } },
      { label: { en: "Look around a bit more first", tr: "Önce biraz etrafa bak" }, next: "bone_10b" },
      { label: { en: "Keep going", tr: "Devam et" }, next: "bone_11" },
    ],
  },

  bone_10b: {
    title: { en: "An Old Digger's Kit", tr: "Eski Bir Kazıcı Takımı" },
    mood: "amber",
    text: {
      en: "Someone who came through here long before you left a small kit behind, wrapped in cloth and forgotten.",
      tr: "Senden çok önce buradan geçen biri, beze sarılıp unutulmuş küçük bir takım bırakmış.",
    },
    choices: [
      { label: { en: "Take it", tr: "Al" }, next: "bone_11", effect: () => { heal(1); } },
      { label: { en: "Leave it, keep moving", tr: "Bırak, devam et" }, next: "bone_11" },
    ],
  },

  bone_11: {
    title: { en: "The Old Records", tr: "Eski Kayıtlar" },
    mood: "bone",
    icon: "icon-scroll",
    text: {
      en: "Names are scratched into flat stones here, a record of who was buried and why. One tag, tarnished but intact, sits among them. A sealed stone coffin rests against the far wall.",
      tr: "Buradaki düz taşlara isimler kazınmış, kimin neden gömüldüğünün kaydı. Aralarında kararmış ama sağlam bir künye var. Karşı duvara yaslanmış mühürlü bir taş tabut duruyor.",
    },
    choices: [
      {
        label: { en: "Read the burial record", tr: "Gömü kaydını oku" },
        classOnly: "rite",
        next: "bone_12",
        effect: () => { state.relics.push("tarnished Warden tag"); },
        text: { en: "You make sense of it immediately, including a note about something that was buried here and shouldn't have woken up.", tr: "Hemen anlıyorsun, buraya gömülen ve uyanmaması gereken bir şeye dair bir not da dahil." },
      },
      { label: { en: "Try to piece it together", tr: "Kaydı birleştirmeye çalış" }, type: "check", stat: "int", dc: 10,
        onSuccess: { next: "bone_12", effect: () => { state.relics.push("tarnished Warden tag"); }, text: { en: "You make out enough of it to be useful.", tr: "İşe yarayacak kadarını çözüyorsun." } },
        onFail: { next: "bone_12", text: { en: "The scratches are too worn to make real sense of.", tr: "Kazımalar anlam çıkaramayacak kadar aşınmış." } },
      },
      { label: { en: "Check the coffin instead", tr: "Onun yerine tabuta bak" }, next: "bone_11c" },
      { label: { en: "Leave it all", tr: "Hiçbirine dokunma" }, next: "bone_12" },
    ],
  },

  bone_11c: {
    title: { en: "A Sealed Coffin", tr: "Mühürlü Bir Tabut" },
    mood: "bone",
    text: {
      en: "The stone lid is heavy and hasn't been moved in a very long time.",
      tr: "Taş kapak ağır ve çok uzun zamandır kımıldatılmamış.",
    },
    choices: [
      { label: { en: "Wrench it open", tr: "Zorla aç" }, classOnly: "blade", next: "bone_12", effect: () => { damage(1); state.relics.push("a carved bone comb"); } },
      { label: { en: "Lever the lid loose", tr: "Kapağı gevşet" }, type: "check", stat: "str", dc: 10,
        onSuccess: { next: "bone_12", effect: () => { state.relics.push("a carved bone comb"); }, text: { en: "You manage to shift it enough to reach inside.", tr: "İçeri ulaşacak kadar kaydırmayı başarıyorsun." } },
        onFail: { next: "bone_12", text: { en: "It won't budge, and you're not going to waste more time on it.", tr: "Hiç kımıldamıyor, daha fazla vakit harcamayacaksın." } },
      },
      { label: { en: "Leave it", tr: "Bırak" }, next: "bone_12" },
    ],
  },

  bone_12: {
    title: { en: "The Blocked Vault", tr: "Tıkalı Mahzen" },
    mood: "bone",
    text: {
      en: "A heavy fall of bone and stone blocks the way forward. Beside it, a row of skull-niches, each marked, look like they're meant to be filled in a particular order to shift something loose.",
      tr: "Ağır bir kemik ve taş yığını ilerideki yolu kapatıyor. Yanında, her biri işaretli bir sıra kafatası oyuğu, bir şeyi gevşetmek için belirli bir sırayla doldurulması gerektiği belli oluyor.",
    },
    choices: [
      { label: { en: "Just shove the blockage aside", tr: "Tıkanıklığı zorla it" }, classOnly: "blade", next: "bone_14", effect: () => { damage(1); } },
      {
        label: { en: "Heave it aside on your own", tr: "Tek başına kaldır" },
        requires: () => state.stats.str >= 6,
        next: "bone_14",
        text: { en: "Your strength alone is enough, no need to work out the niches at all.", tr: "Sadece gücün yetiyor, oyukları çözmeye bile gerek kalmıyor." },
      },
      { label: { en: "Work out the burial order", tr: "Gömü sırasını çöz" }, next: "bone_13" },
    ],
  },

  bone_13: {
    title: { en: "The Burial Order", tr: "Gömü Sırası" },
    mood: "bone",
    text: {
      en: "An inscription nearby hints at the correct order, if it can be read.",
      tr: "Yakındaki bir yazı, okunabilirse doğru sırayı ima ediyor.",
    },
    choices: [
      {
        label: { en: "Read the inscription", tr: "Yazıtı oku" },
        classOnly: "rite",
        next: "bone_14",
        text: { en: "The order is plain to you, and the niches settle into place, the blockage grinding aside.", tr: "Sıra senin için apaçık, oyuklar yerine oturuyor, tıkanıklık gıcırdayarak açılıyor." },
      },
      {
        label: { en: "Work out the order yourself", tr: "Sırayı kendin çöz" },
        requires: () => state.stats.int >= 5,
        next: "bone_14",
        text: { en: "You don't need the inscription. The logic of the names is plain enough on its own.", tr: "Yazıta ihtiyacın yok. İsimlerin mantığı zaten yeterince açık." },
      },
      { label: { en: "Guess the order", tr: "Sırayı tahmin et" }, type: "check", stat: "int", dc: 12,
        onSuccess: { next: "bone_14", text: { en: "You get it right on the first try.", tr: "İlk denemede doğru yapıyorsun." } },
        onFail: { next: "bone_14", effect: () => { damage(1); }, text: { en: "You get it wrong, and a shower of loose bone comes down on you before you clear it.", tr: "Yanlış yapıyorsun, temizlemeden önce üstüne bir avuç gevşek kemik dökülüyor." } },
      },
    ],
  },

  bone_14: {
    title: { en: "Something Stands Up", tr: "Bir Şey Ayağa Kalkıyor" },
    mood: "red",
    icon: "icon-bone",
    text: {
      en: "A pile of old bone in the corner shifts, then rises, slow and wrong, joints that shouldn't hold together somehow do.",
      tr: "Köşedeki eski bir kemik yığını kıpırdıyor, sonra ayağa kalkıyor, yavaş ve yanlış, birbirini tutmaması gereken eklemler nedense tutuyor.",
    },
    choices: [
      {
        label: { en: "Hold your ground and stand it down", tr: "Yerinde dur, geri püskürt" },
        classOnly: "blade",
        next: "bone_15",
        effect: () => { damage(2); },
        text: { en: "You take a hit that would've dropped someone lighter and don't give an inch, and eventually it loses interest.", tr: "Daha hafif birini yere sereceğine bir darbe alıyorsun ama bir adım bile geri çekilmiyorsun, sonunda ilgisini kaybediyor." },
      },
      { label: { en: "Get moving, it's slow", tr: "Hemen uzaklaş, yavaş" }, type: "check", stat: "con", dc: 10,
        onSuccess: { next: "bone_15", text: { en: "You put distance between you before it fully rises.", tr: "O tam kalkmadan önce aranıza mesafe koyuyorsun." } },
        onFail: { next: "bone_15", effect: () => { damage(1); }, text: { en: "It catches your leg as you scramble past.", tr: "Yanından geçerken bacanı yakalıyor." } },
      },
      { label: { en: "Outrun it", tr: "Ondan hızlı koş" }, type: "check", stat: "con", dc: 10,
        onSuccess: { next: "bone_15", effect: () => { state.flags.add("bone_outpaced"); }, text: { en: "You easily leave it behind, its pace no match for yours.", tr: "Kolayca geride bırakıyorsun, hızına yetişemiyor." } },
        onFail: { next: "bone_15", effect: () => { damage(1); }, text: { en: "It's slower than you but reaches you once before you clear the room.", tr: "Senden yavaş ama odayı geçmeden önce bir kez sana ulaşıyor." } },
      },
    ],
  },

  bone_15: {
    title: { en: "Loose Footing Again", tr: "Yine Kaygan Zemin" },
    mood: "bone",
    text: {
      en: "More shifting bone underfoot, worse this time.",
      tr: "Ayak altında yine kayan kemikler, bu sefer daha kötü.",
    },
    choices: [
      { label: { en: "Pick your steps carefully", tr: "Adımlarını dikkatle seç" }, type: "check", stat: "dex", dc: 9,
        onSuccess: { next: "bone_16", text: { en: "You cross without setting anything off.", tr: "Hiçbir şeyi harekete geçirmeden geçiyorsun." } },
        onFail: { next: "bone_16", effect: () => { damage(1); }, text: { en: "A pile shifts under you but you keep your footing.", tr: "Altındaki yığın kayıyor ama dengeni koruyorsun." } },
      },
      {
        label: { en: "Find the one stable line through", tr: "Sağlam tek hattı bul" },
        classOnly: "shadow",
        next: "bone_16c",
      },
    ],
  },

  bone_16c: {
    title: { en: "A Quiet Gap", tr: "Sessiz Bir Aralık" },
    mood: "bone",
    text: {
      en: "Tucked out of sight is a small hollow someone once used to hide, and left something behind in.",
      tr: "Gözden uzak küçük bir oyukta, bir zamanlar birinin saklanmak için kullandığı ve bir şey bırakıp gittiği bir yer var.",
    },
    choices: [
      { label: { en: "Take it and continue", tr: "Al ve devam et" }, next: "bone_16", effect: () => { heal(1); } },
    ],
  },

  bone_16: {
    title: { en: "A Fallen Warden", tr: "Düşmüş Bir Muhafız" },
    mood: "bone",
    text: {
      en: "Old armor, mostly bone-dust now, rests against the wall. A key, carved from rib-bone, is still clutched in what's left of a hand.",
      tr: "Duvara yaslanmış eski bir zırh, artık büyük kısmı kemik tozuna dönmüş. Elden geriye kalanın hâlâ sıkı tuttuğu, kaburga kemiğinden oyulmuş bir anahtar var.",
    },
    choices: [
      { label: { en: "Take the key", tr: "Anahtarı al" }, next: "bone_17a", effect: () => { state.relics.push("cracked rib-bone key"); } },
      { label: { en: "Leave them be", tr: "Onu rahat bırak" }, next: "bone_17a" },
    ],
  },

  bone_17a: {
    title: { en: "Open Gallery or Side Crawl", tr: "Açık Galeri mi Yan Geçit mi" },
    mood: "bone",
    text: {
      en: "Ahead, the main gallery opens wide, or a narrow side crawl cuts a tighter but quieter path around it.",
      tr: "İlerideki ana galeri geniş açılıyor, ya da dar bir yan geçit onun etrafından daha sıkışık ama daha sessiz bir yol keser.",
    },
    choices: [
      { label: { en: "Cross the open gallery", tr: "Açık galeriden geç" }, next: "bone_17b" },
      { label: { en: "Take the side crawl", tr: "Yan geçidi kullan" }, next: "bone_17c" },
      {
        label: { en: "Slip through the gap between, unnoticed", tr: "Aradaki aralıktan fark edilmeden geç" },
        classOnly: "shadow",
        next: "bone_18",
        text: { en: "You find a seam between the two routes that nothing here would ever think to watch.", tr: "İki yolun arasında buradaki hiçbir şeyin gözlemeyi akıl edeceği bir çatlak buluyorsun." },
      },
    ],
  },

  bone_17b: {
    title: { en: "The Open Gallery", tr: "Açık Galeri" },
    mood: "bone",
    text: {
      en: "The rib-crawlers are back, more of them, stirred up by something further ahead.",
      tr: "Kaburga sürüngenleri geri döndü, daha kalabalıklar, ilerideki bir şeyle tedirginler.",
    },
    choices: [
      {
        label: { en: "Clear a path through them", tr: "Aralarından bir yol aç" },
        requires: () => state.stats.str >= 5,
        next: "bone_18",
        text: { en: "You don't need finesse, just enough force to keep moving, and they scatter well clear of you.", tr: "İnceliğe ihtiyacın yok, sadece ilerlemeye yetecek güç, senden uzağa dağılıyorlar." },
      },
      { label: { en: "Push through", tr: "İçlerinden geç" }, type: "check", stat: "con", dc: 10,
        onSuccess: { next: "bone_18", text: { en: "You keep your nerve and push clear of them.", tr: "Soğukkanlılığını koruyup aralarından sıyrılıyorsun." } },
        onFail: { next: "bone_18", effect: () => { damage(2); }, text: { en: "Several get a scratch in before you clear the gallery.", tr: "Galeriyi geçmeden önce birkaçı seni çiziyor." } },
      },
    ],
  },

  bone_17c: {
    title: { en: "The Side Crawl", tr: "Yan Geçit" },
    mood: "bone",
    text: {
      en: "Tight and slow, but quiet, and near the end you find a small stash tucked into a gap.",
      tr: "Dar ve yavaş ama sessiz, ucuna yakın bir aralığa sıkıştırılmış küçük bir stok buluyorsun.",
    },
    choices: [
      { label: { en: "Take what's there", tr: "Orada olanı al" }, next: "bone_18", effect: () => { heal(1); } },
      { label: { en: "Keep moving", tr: "Devam et" }, next: "bone_18" },
    ],
  },

  bone_18: {
    title: { en: "Marrow Dust", tr: "İlik Tozu" },
    mood: "bone",
    text: {
      en: "A whole chamber ahead is thick with fine bone dust, the kind that catches in your throat and doesn't let go easily.",
      tr: "İlerideki bütün oda ince kemik tozuyla dolu, boğazına yapışıp kolay kolay bırakmayan türden.",
    },
    choices: [
      { label: { en: "Cover up and push through fast", tr: "Yüzünü kapat, hızla geç" }, type: "check", stat: "con", dc: 10,
        onSuccess: { next: "bone_19", text: { en: "You clear it before it can settle in your chest.", tr: "Göğsüne yerleşmeden geçiyorsun." } },
        onFail: { next: "bone_19", effect: () => { damage(2); }, text: { en: "You come out hacking, throat coated in dust.", tr: "Boğazın tozla kaplanmış halde, öksürerek çıkıyorsun." } },
      },
      { label: { en: "Find the clearer air along the ceiling", tr: "Tavan boyunca daha temiz havayı bul" }, type: "check", stat: "wis", dc: 9,
        onSuccess: { next: "bone_19", text: { en: "You keep low to a thinner layer and pass through mostly clean.", tr: "Daha seyrek bir tabakaya alçalıp neredeyse temiz geçiyorsun." } },
        onFail: { next: "bone_19", effect: () => { damage(1); }, text: { en: "You can't find a clean line in time and breathe in more than you'd like.", tr: "Zamanında temiz bir hat bulamıyor, istediğinden fazlasını soluyorsun." } },
      },
    ],
  },

  bone_19: {
    title: { en: "A Failing Seal", tr: "Çöken Bir Mühür" },
    mood: "violet",
    text: {
      en: "Another minor ward-stone sits forgotten in a side niche, its light almost gone.",
      tr: "Bir yan oyukta unutulmuş başka bir küçük mühür taşı duruyor, ışığı neredeyse sönmüş.",
    },
    choices: [
      {
        label: { en: "Perform the partial rite", tr: "Kısmi âyini gerçekleştir" },
        classOnly: "rite",
        next: "bone_20",
        effect: () => { heal(1); },
        text: { en: "The old words come easily, and the stone settles without a fight.", tr: "Eski sözler kolayca geliyor, taş hiç direnmeden yatışıyor." },
      },
      { label: { en: "Try to stabilize it", tr: "Dengelemeye çalış" }, type: "check", stat: "int", dc: 12,
        onSuccess: { next: "bone_20", effect: () => { heal(1); }, text: { en: "You find the right approach and it settles.", tr: "Doğru yaklaşımı buluyorsun, yatışıyor." } },
        onFail: { next: "bone_20", effect: () => { damage(1); }, text: { en: "You push the wrong thread and it snaps back at you.", tr: "Yanlış ipliği itiyorsun, geri tepiyor." } },
      },
      { label: { en: "Leave it alone", tr: "Dokunma" }, next: "bone_20" },
    ],
  },

  bone_20: {
    title: { en: "The Narrow Crossing", tr: "Dar Geçiş" },
    mood: "bone",
    text: {
      en: "A collapse leaves only a thin ridge of packed bone spanning a drop into a darker vault below.",
      tr: "Bir çökme, aşağıdaki daha karanlık mahzene açılan bir uçurumun üzerinde sadece ince, sıkışmış bir kemik sırtı bırakıyor.",
    },
    choices: [
      { label: { en: "Cross light and quick", tr: "Hafif ve hızlı geç" }, classOnly: "shadow", next: "bone_21", text: { en: "You're over before the ridge has a chance to test you.", tr: "Sırt seni sınamadan geçiyorsun." } },
      { label: { en: "Cross it fast", tr: "Hızlıca geç" }, type: "check", stat: "str", dc: 11,
        onSuccess: { next: "bone_21", text: { en: "You cover it in a few sure strides.", tr: "Birkaç emin adımda geçiyorsun." } },
        onFail: { next: "bone_21", effect: () => { damage(2); }, text: { en: "You slip near the end and land hard on the far side.", tr: "Sona yakın kayıyor, karşı tarafa sert iniyorsun." } },
      },
      { label: { en: "Cross it slow and steady", tr: "Yavaş ve dengeli geç" }, type: "check", stat: "con", dc: 11,
        onSuccess: { next: "bone_21", text: { en: "You take it one careful step at a time.", tr: "Adım adım dikkatle ilerliyorsun." } },
        onFail: { next: "bone_21", effect: () => { damage(2); }, text: { en: "The ridge shifts under you and you scramble the rest of the way across.", tr: "Sırt altında kayıyor, geri kalanını zor bela geçiyorsun." } },
      },
    ],
  },

  bone_21: {
    title: { en: "The Bone Vault's Heart", tr: "Kemik Mahzeninin Kalbi" },
    mood: "red",
    icon: "icon-bone",
    text: {
      en: "It's here, the whole shape of it now visible, slow and patient in the way that only something with nowhere else to be can afford.",
      tr: "Burada, artık tüm şekli görünür halde, ancak gidecek başka hiçbir yeri olmayan bir şeyin göze alabileceği türden yavaş ve sabırlı.",
    },
    choices: [
      { label: { en: "Slip around the edge of the chamber", tr: "Odanın kenarından dolan" }, classOnly: "shadow", next: "bone_23", text: { en: "It's slow enough that staying out of its line entirely is easy, if you're careful.", tr: "Dikkatliysen görüş hattından tamamen uzak durmak kolay, o kadar yavaş." } },
      {
        label: { en: "Walk past it steady, don't run", tr: "Koşmadan, sakin adımlarla geç" },
        requires: () => state.stats.wis >= 5,
        next: "bone_23",
        text: { en: "Running is what draws its attention, and your nerve is steady enough not to.", tr: "Dikkatini çeken koşmaktır, cesaretin bunu yapmayacak kadar sağlam." },
      },
      { label: { en: "Move past carefully", tr: "Dikkatlice yanından geç" }, type: "check", stat: "dex", dc: 12,
        onSuccess: { next: "bone_23", text: { en: "You slip by while it's still turning toward you.", tr: "O sana doğru dönerken yanından sıyrılıyorsun." } },
        onFail: { next: "bone_22" },
      },
      { label: { en: "Meet it head on", tr: "Yüzleş" }, next: "bone_22" },
    ],
  },

  bone_22: {
    title: { en: "Old Bone, Old Grudge", tr: "Eski Kemik, Eski Kin" },
    mood: "red",
    text: {
      en: "It's slow, but relentless, and it doesn't tire the way you do.",
      tr: "Yavaş ama yılmaz, senin gibi yorulmuyor.",
    },
    choices: [
      { label: { en: "Break it apart", tr: "Parçalara ayır" }, type: "check", stat: "str", dc: 12,
        onSuccess: { next: "bone_23", effect: () => { damage(2); }, text: { en: "You bring it down piece by piece, though it costs you.", tr: "Parça parça yere seriyorsun ama bedelsiz olmuyor." } },
        onFail: { next: "bone_23", effect: () => { damage(3); }, text: { en: "It gets a heavy blow in before finally coming apart.", tr: "Sonunda dağılmadan önce sana ağır bir darbe indiriyor." } },
      },
      { label: { en: "Wear it down and slip past", tr: "Yorup yanından sıyrıl" }, type: "check", stat: "dex", dc: 11,
        onSuccess: { next: "bone_23", text: { en: "You keep moving until it simply can't keep up.", tr: "Yetişemez hale gelene kadar hareket etmeye devam ediyorsun." } },
        onFail: { next: "bone_23", effect: () => { damage(2); }, text: { en: "It manages one solid grab before you finally break free.", tr: "Kurtulmadan önce sağlam bir kez seni yakalıyor." } },
      },
    ],
  },

  bone_23: {
    title: { en: "Past the Vault", tr: "Mahzenin Ötesinde" },
    mood: "bone",
    text: {
      en: "However it happened, you're through, and the passage ahead climbs toward drier, quieter ground.",
      tr: "Nasıl olduysa oldu, geçtin, ilerideki geçit daha kuru, daha sessiz bir zemine doğru yükseliyor.",
    },
    choices: [{ label: { en: "Continue", tr: "Devam et" }, next: "bone_24" }],
  },

  bone_24: {
    title: { en: "The Ward-Stone", tr: "Mühür Taşı" },
    mood: "violet",
    icon: "icon-scroll",
    text: {
      en: "The stone here is nearly buried in bone dust, but the crack through its center is unmistakable.",
      tr: "Buradaki taş neredeyse kemik tozuna gömülmüş, ama ortasından geçen çatlak apaçık ortada.",
    },
    choices: [
      {
        label: { en: "Read the inscription", tr: "Yazıtı oku" },
        classOnly: "rite",
        next: "bone_25",
        effect: () => { state.flags.add("bone_inscription_read"); },
        text: { en: "You understand exactly what's holding this one together, and how little time it has left.", tr: "Bunu bir arada tutan şeyi ve ne kadar az zamanı kaldığını tam olarak anlıyorsun." },
      },
      { label: { en: "Study the crack", tr: "Çatlağı incele" }, type: "check", stat: "int", dc: 11,
        onSuccess: { next: "bone_25", text: { en: "You get a rough sense of how bad it is.", tr: "Ne kadar kötü durumda olduğuna dair kaba bir fikir ediniyorsun." } },
        onFail: { next: "bone_25", effect: () => { damage(1); }, text: { en: "Something shifts loose at your touch and a shard nicks your hand.", tr: "Dokunuşunla bir şey gevşiyor, bir kıymık elini kesiyor." } },
      },
    ],
  },

  bone_25: {
    title: { en: "Out of the Bone Vault", tr: "Kemik Mahzeninin Dışına" },
    mood: "bone",
    text: {
      en: "The vault is behind you, and the air finally starts to clear.",
      tr: "Mahzen artık geride kaldı, hava sonunda temizlenmeye başlıyor.",
    },
    choices: [{ label: { en: "Move on", tr: "İlerle" }, next: "the_deep" }],
  },
};

const SCENES = {
  start: {
    title: { en: "The Broken Gate", tr: "Kırık Kapı" },
    mood: "amber",
    text: {
      en: "The gate was sealed once. It isn't anymore. Cold air moves up out of the dark, carrying dust and something under the dust. Your torch is lit. Whatever's wrong with the wards here, you're the one sent to find it.",
      tr: "Kapı bir zamanlar mühürlüydü. Artık değil. Karanlıktan yukarı doğru soğuk bir hava akıyor, toz ve tozun altındaki bir şeyi taşıyarak. Meşalen yanıyor. Buradaki mühürlerde ne bozuksa, onu bulmak için gönderilen sensin.",
    },
    choices: [
      {
        label: { en: "Move quickly, the wards won't wait", tr: "Hızlı ilerle, mühürler beklemez" },
        next: "corridor",
        effect: () => state.flags.add("bold_start"),
      },
      {
        label: { en: "Move carefully, listen before you step", tr: "Dikkatli ilerle, adım atmadan önce dinle" },
        next: "corridor",
        effect: () => state.flags.add("careful_start"),
      },
    ],
  },

  corridor: {
    title: { en: "The Long Stretch", tr: "Uzun Geçit" },
    mood: "purple",
    text: {
      en: "A corridor that goes on longer than it should, the torchlight barely reaching the walls on either side. Something drips somewhere ahead. The air smells wrong, old and wet at once.",
      tr: "Olması gerekenden uzun süren bir koridor, meşale ışığı iki yandaki duvarlara zar zor ulaşıyor. İlerideki bir yerde bir şeyler damlıyor. Hava yanlış kokuyor, hem eski hem nemli.",
    },
    choices: [
      {
        label: { en: "Keep your nerve and push on", tr: "Soğukkanlılığını koru ve devam et" },
        type: "check",
        stat: "cha",
        dc: 8,
        onSuccess: {
          next: "archive",
          text: {
            en: "Whatever's dripping, it isn't paying attention to you. You keep moving.",
            tr: "Damlayan her neyse, sana aldırış etmiyor. İlerlemeye devam ediyorsun.",
          },
        },
        onFail: {
          next: "archive",
          effect: () => damage(1),
          text: {
            en: "You flinch at a sound that turns out to be nothing and crack your elbow on the wall for it.",
            tr: "Hiçbir şey çıkmayan bir sese irkiliyorsun ve bu yüzden dirseğini duvara çarpıyorsun.",
          },
        },
      },
    ],
  },

  archive: {
    title: { en: "The Old Archive", tr: "Eski Arşiv" },
    mood: "amber",
    icon: "icon-scroll",
    text: {
      en: "A side chamber, shelves collapsed into each other. Someone kept records here once. A few ledger pages have survived the damp, if you want to dig for them.",
      tr: "Bir yan oda, raflar birbirinin üstüne çökmüş. Bir zamanlar biri burada kayıt tutmuş. Birkaç defter sayfası nemden kurtulmuş, kazmak istersen.",
    },
    choices: [
      {
        label: { en: "Search the shelves carefully", tr: "Rafları dikkatle araştır" },
        type: "check",
        stat: "wis",
        dc: 10,
        onSuccess: {
          next: "moth_swarm",
          effect: () => {
            state.relics.push("cracked ledger page");
            state.flags.add("has_ledger");
          },
          text: {
            en: "Under a collapsed shelf, a ledger page survived, and part of a rite is still legible on it.",
            tr: "Çökmüş bir rafın altında bir defter sayfası hayatta kalmış, üzerindeki bir ayinin bir kısmı hâlâ okunabiliyor.",
          },
        },
        onFail: {
          next: "moth_swarm",
          effect: () => damage(1),
          text: {
            en: "A shelf gives way under your hand and comes down on your shoulder. Nothing here but rot.",
            tr: "Elinin altındaki bir raf çöküyor ve omzuna iniyor. Burada çürümüşlükten başka bir şey yok.",
          },
        },
      },
      {
        label: { en: "Skim quickly and move on", tr: "Hızlıca göz gezdir ve devam et" },
        next: "moth_swarm",
        effect: () => {},
      },
    ],
  },

  moth_swarm: {
    title: { en: "Grave Moths", tr: "Mezar Güveleri" },
    mood: "violet",
    icon: "icon-moth",
    text: {
      en: "A crack in the ceiling, and out of it: Grave Moths, dozens of them, papery wings catching your torchlight. They aren't fast. They aren't smart. There are a lot of them.",
      tr: "Tavanda bir çatlak var, içinden Mezar Güveleri çıkıyor: düzinelercesi, kağıt gibi kanatları meşale ışığını yansıtıyor. Hızlı değiller. Akıllı değiller. Ama çok sayıdalar.",
    },
    choices: [
      {
        label: { en: "Ward them off with the old words", tr: "Eski sözlerle onları defet" },
        type: "check",
        stat: "cha",
        dc: 12,
        onSuccess: {
          next: "the_hall",
          effect: () => state.flags.add("sealed_moths"),
          text: {
            en: "The rite holds. The swarm scatters back into the crack like it was never there.",
            tr: "Ayin tutuyor. Sürü, hiç orada değilmiş gibi çatlağa geri dağılıyor.",
          },
        },
        onFail: {
          next: "the_hall",
          effect: () => damage(2),
          text: {
            en: "You get half the words right, which is worse than none. They swarm you before scattering on their own.",
            tr: "Sözlerin yarısını doğru söylüyorsun, bu da hiç söylememekten kötü. Kendiliklerinden dağılmadan önce seni sarıyorlar.",
          },
        },
      },
      {
        label: { en: "Push straight through", tr: "Doğrudan içlerinden geç" },
        next: "the_hall",
        effect: () => damage(1),
      },
    ],
  },

  the_hall: {
    title: { en: "The Warden's Hall", tr: "Muhafızın Salonu" },
    mood: "amber",
    text: {
      en: "A wide chamber, half collapsed. The ward-stone at its center is cracked clean through, the failing light inside it flickering in a way it shouldn't. Three passages lead further down. You can only take one before the light in the stone gives out completely.",
      tr: "Yarısı çökmüş geniş bir oda. Ortasındaki mühür taşı baştan aşağı çatlamış, içindeki sönmekte olan ışık olmaması gereken bir şekilde titriyor. Aşağı inen üç geçit var. Taştaki ışık tamamen sönmeden önce sadece birini seçebilirsin.",
    },
    choices: [
      {
        label: { en: "South, into the flooded tunnels", tr: "Güneye, sel basmış tünellere" },
        next: "serpent_01",
        effect: () => {},
      },
      {
        label: { en: "East, toward the ash-choked shrine", tr: "Doğuya, kül dolu tapınağa" },
        next: "ashling_01",
        effect: () => {},
      },
      {
        label: { en: "Down, into the bone vault", tr: "Aşağıya, kemik mahzenine" },
        next: "bone_01",
        effect: () => {},
      },
    ],
  },

  the_deep: {
    title: { en: "The Deep Passage", tr: "Derin Geçit" },
    mood: "purple",
    text: {
      en: "The last stretch. Whatever's actually wrong with the wards is close now, you can feel it in the stone under your boots. Something whispers just past the edge of hearing.",
      tr: "Son bölüm. Mühürlerde gerçekten ne bozuksa artık yakın, botlarının altındaki taşta hissediyorsun. Duyabildiğinin hemen ötesinde bir şey fısıldıyor.",
    },
    choices: [
      {
        label: { en: "Listen to the whisper", tr: "Fısıltıyı dinle" },
        type: "check",
        stat: "wis",
        dc: 10,
        onSuccess: {
          next: "drowspawn_reveal",
          effect: () => heal(1),
          text: {
            en: "You make out a few words, old ones, and something about hearing them said right steadies you.",
            tr: "Birkaç kelime seçebiliyorsun, eski kelimeler, doğru söylendiğini duymak da seni sakinleştiriyor.",
          },
        },
        onFail: {
          next: "drowspawn_reveal",
          text: {
            en: "You can't make out a single word, and you're not sure you wanted to. You press on unsettled.",
            tr: "Tek bir kelime bile seçemiyorsun, zaten istediğinden de emin değilsin. Huzursuz bir şekilde ilerliyorsun.",
          },
        },
      },
      {
        label: () =>
          hasRelic("serpent scale")
            ? { en: "Trade the serpent scale to catch your breath (heal 2)", tr: "Nefes almak için yılan pulunu ver (2 Can iyileş)" }
            : { en: "Rest a moment (nothing to trade)", tr: "Bir an dinlen (verecek bir şeyin yok)" },
        requires: () => hasRelic("serpent scale"),
        next: "drowspawn_reveal",
        effect: () => {
          state.relics = state.relics.filter((r) => r !== "serpent scale");
          heal(2);
        },
      },
      {
        label: { en: "Press on, there's no time", tr: "Devam et, vakit yok" },
        next: "drowspawn_reveal",
        effect: () => {},
      },
    ],
  },

  drowspawn_reveal: {
    title: { en: "The Cracked Ward-Stone", tr: "Çatlak Mühür Taşı" },
    mood: "red",
    icon: "icon-drowspawn",
    text: {
      en: "This is it. The ward-stone here isn't just cracked, it's being fed on, something coiled around its base pulling the last of the light out of it strand by strand. A Drowspawn. The one nobody wants to see reach the surface.",
      tr: "İşte burası. Buradaki mühür taşı sadece çatlamamış, besleniyor, tabanına dolanmış bir şey ondaki son ışığı şerit şerit çekiyor. Bir Drowspawn. Kimsenin yüzeye çıkmasını istemediği şey.",
    },
    choices: [
      {
        label: { en: "Strike hard and fast", tr: "Sert ve hızlı vur" },
        type: "check",
        stat: "str",
        dc: 13,
        onSuccess: {
          next: "ending_fight_win",
          effect: () => {
            damage(1);
            state.flags.add("fought_drowspawn_win");
          },
        },
        onFail: {
          next: "ending_fight_lose",
          effect: () => {
            damage(4);
            state.flags.add("fought_drowspawn_lose");
          },
        },
      },
      {
        label: () =>
          hasAnyFlag(
            "sealed_moths",
            "ashling_inscription_read",
            "ashling_wards_read",
            "bone_inscription_read",
            "bone_marks_read",
            "serpent_glyphs_read",
            "serpent_inscription_read",
            "serpent_journal_read"
          )
            ? { en: "Use what you've learned to re-seal the stone", tr: "Öğrendiklerinle taşı yeniden mühürle" }
            : { en: "Try to re-seal the stone (you don't really know how)", tr: "Taşı yeniden mühürlemeyi dene (aslında nasıl olduğunu bilmiyorsun)" },
        requires: () =>
          hasAnyFlag(
            "sealed_moths",
            "ashling_inscription_read",
            "ashling_wards_read",
            "bone_inscription_read",
            "bone_marks_read",
            "serpent_glyphs_read",
            "serpent_inscription_read",
            "serpent_journal_read"
          ),
        type: "check",
        stat: "int",
        dc: 14,
        onSuccess: {
          next: "ending_seal_holds",
          effect: () => state.flags.add("resealed"),
        },
        onFail: {
          next: "ending_seal_fail",
          effect: () => {
            damage(3);
            state.flags.add("resealed_failed");
          },
        },
      },
      {
        label: { en: "Retreat and go warn the other Wardens", tr: "Geri çekil ve diğer Muhafızları uyar" },
        next: "ending_warning",
        effect: () => state.flags.add("retreated"),
      },
    ],
  },
};

Object.assign(SCENES, serpentBranch, ashlingBranch, boneBranch);

const ENDINGS = {
  ending_seal_holds: {
    variant: "win",
    title: { en: "The Seal Holds", tr: "Mühür Tutuyor" },
    text: {
      en: "You get the rite right, or close enough. The ward-stone flickers, steadies, and holds. It won't hold forever, nothing down here does, but it'll hold long enough for someone else to worry about it next.",
      tr: "Ayini doğru yapıyorsun, ya da yeterince doğru. Mühür taşı titreşiyor, sabitleşiyor ve tutuyor. Sonsuza dek tutmayacak, buradaki hiçbir şey tutmuyor, ama başka birinin bir dahaki sefere endişelenmesine yetecek kadar tutacak.",
    },
  },
  ending_fight_win: {
    variant: "win",
    title: { en: "A Warden's Strike", tr: "Bir Muhafızın Darbesi" },
    text: {
      en: "You hit it before it finishes turning toward you, and that's the whole fight. The Drowspawn unravels off the ward-stone and doesn't get back up. The stone is still cracked. At least it's not being fed on anymore.",
      tr: "Sana dönmeyi bitirmeden vuruyorsun, dövüş bu kadar. Drowspawn mühür taşından çözülüyor ve bir daha kalkmıyor. Taş hâlâ çatlak. En azından artık beslenmiyor.",
    },
  },
  ending_fight_lose: {
    variant: "neutral",
    title: { en: "Blood on the Stone", tr: "Taşın Üzerindeki Kan" },
    text: {
      en: "It's faster than it looks. You trade blows you can't really afford to trade, and by the time it finally lets go of the ward-stone to deal with you properly, you're both done fighting for tonight. You make it out. Barely counts as a win.",
      tr: "Göründüğünden hızlı. Karşılayamayacağın darbeler alıp veriyorsun, seninle gerçekten ilgilenmek için mühür taşını sonunda bıraktığında ikiniz de bu gece için dövüşü bırakmış oluyorsunuz. Dışarı çıkmayı başarıyorsun. Zar zor kazanç sayılır.",
    },
  },
  ending_seal_fail: {
    variant: "neutral",
    title: { en: "A Patch, Not a Cure", tr: "Yama, Çare Değil" },
    text: {
      en: "You get the shape of the rite right and the timing wrong. The stone holds, barely, in a way that's going to need someone back down here within the month. It costs you more than you wanted to give.",
      tr: "Ayinin şeklini doğru buluyorsun ama zamanlamayı yanlış yapıyorsun. Taş tutuyor, zar zor, bir ay içinde birinin buraya geri dönmesi gerekecek şekilde. Vermek istediğinden daha fazlasına mal oluyor.",
    },
  },
  ending_warning: {
    variant: "neutral",
    title: { en: "The Warning", tr: "Uyarı" },
    text: {
      en: "You don't stay to fight it. You make it back up and tell the other Wardens exactly what's down there, which is more than the last report managed. Someone braver, or more prepared, will have to finish this.",
      tr: "Onunla dövüşmek için kalmıyorsun. Yukarı çıkıp diğer Muhafızlara orada tam olarak ne olduğunu anlatıyorsun, bu da son raporun başardığından fazlası. Daha cesur ya da daha hazırlıklı biri bunu bitirmek zorunda kalacak.",
    },
  },
  ending_death: {
    variant: "lose",
    title: { en: "The Vigil Ends Here", tr: "Nöbet Burada Bitiyor" },
    text: {
      en: "The dark takes what it wants sometimes. Your torch goes out before you can get back to the surface, and Hollowmere keeps one more thing it shouldn't.",
      tr: "Karanlık bazen istediğini alır. Yüzeye çıkamadan meşalen sönüyor, Hollowmere de alması gerekmeyen bir şeyi daha elinde tutuyor.",
    },
  },
};

function currentScene() {
  return SCENES[state.sceneId];
}

function resolveChoice(choice) {
  if (choice.classOnly) state.usedClassAbility = true;
  if (choice.type === "check") {
    const result = rollCheck(choice.stat, choice.dc);
    state.lastRoll = result;
    const branch = result.success ? choice.onSuccess : choice.onFail;
    showRollResult(result, branch, choice);
    return;
  }
  if (choice.effect) choice.effect();
  advanceTo(choice.next);
}

function recordHistory() {
  const scene = currentScene();
  if (!scene) return;
  state.history.push({ en: scene.title.en, tr: scene.title.tr });
  if (state.history.length > 80) state.history.shift();
}

function advanceTo(nextId) {
  if (state.hp <= 0) {
    state.dead = true;
    endRun("ending_death");
    return;
  }
  if (ENDINGS[nextId]) {
    endRun(nextId);
    return;
  }
  state.sceneId = nextId;
  state.pendingCheck = null;
  recordHistory();
  renderScene();
  saveGame();
}

function showRollResult(result, branch, choice) {
  state.pendingCheck = { result, branch, choice };
  renderScene();
}

function confirmRoll() {
  const { branch } = state.pendingCheck;
  if (branch.effect) branch.effect();
  const next = branch.next;
  state.pendingCheck = null;
  if (state.hp <= 0) {
    state.dead = true;
    endRun("ending_death");
    return;
  }
  if (ENDINGS[next]) {
    endRun(next);
    return;
  }
  state.sceneId = next;
  recordHistory();
  renderScene();
  saveGame();
}

function rerollWithRelic() {
  if (!state.pendingCheck || state.relics.length === 0) return;
  const spent = state.relics.pop();
  const { choice } = state.pendingCheck;
  const result = rollCheck(choice.stat, choice.dc);
  state.lastRoll = result;
  const branch = result.success ? choice.onSuccess : choice.onFail;
  state.pendingCheck = { result, branch, choice, rerolledWith: spent };
  renderScene();
}

function endRun(endingId) {
  const ending = state.dead ? ENDINGS.ending_death : ENDINGS[endingId];
  const card = document.getElementById("end-card");
  card.classList.remove("overlay-card--win", "overlay-card--lose", "overlay-card--neutral");
  card.classList.add("overlay-card--" + ending.variant);

  const iconMap = { win: "icon-seal", lose: "icon-skull", neutral: "icon-torch" };
  document.getElementById("end-icon").innerHTML =
    `<use href="#${iconMap[ending.variant] || "icon-torch"}"></use>`;

  if (soundOn) {
    playEndingJingle(ending.variant === "win" ? "win" : "lose");
  }

  document.getElementById("end-title").textContent = t(ending.title);
  document.getElementById("end-text").textContent = t(ending.text);
  const summaryLabel = state.lang === "tr" ? "Kalan Can" : "HP left";
  const relicsLabel = state.lang === "tr" ? "Taşınan eşyalar" : "Relics carried";
  const noneLabel = state.lang === "tr" ? "yok" : "none";
  document.getElementById("end-summary").textContent =
    `${summaryLabel}: ${state.hp}/${state.maxHp}. ${relicsLabel}: ${state.relics.length ? state.relics.join(", ") : noneLabel}`;

  const badgesRow = document.getElementById("badges-row");
  badgesRow.innerHTML = "";
  BADGES.filter((b) => b.check()).forEach((b) => {
    const chip = document.createElement("div");
    chip.className = "badge-chip";
    chip.innerHTML = `<svg><use href="#icon-badge"></use></svg><span>${state.lang === "tr" ? b.tr : b.en}</span>`;
    badgesRow.appendChild(chip);
  });

  clearSave();
  document.getElementById("end-overlay").hidden = false;
}

// ---- Character creation screen ----

function renderCreation() {
  const root = document.getElementById("creation-root");
  root.innerHTML = "";

  const diffSection = document.createElement("div");
  diffSection.className = "create-section";
  diffSection.innerHTML = `<h3>${state.lang === "tr" ? "Zorluk seç" : "Choose your difficulty"}</h3>`;
  const diffRow = document.createElement("div");
  diffRow.className = "card-row";
  Object.values(DIFFICULTIES).forEach((d) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "pick-card" + (state.difficultyId === d.id ? " picked" : "");
    const recTag = d.id === "easy"
      ? `<span class="recommended-tag">${state.lang === "tr" ? "ÖNERİLEN" : "RECOMMENDED"}</span>`
      : "";
    card.innerHTML = `${recTag}<strong>${t(d.name)}</strong><span>${t(d.desc)}</span>`;
    card.addEventListener("click", () => {
      state.difficultyId = d.id;
      renderCreation();
    });
    diffRow.appendChild(card);
  });
  diffSection.appendChild(diffRow);
  root.appendChild(diffSection);

  const classSection = document.createElement("div");
  classSection.className = "create-section";
  classSection.innerHTML = `<h3>${state.lang === "tr" ? "Sınıf seç" : "Choose your class"}</h3>`;
  const classRow = document.createElement("div");
  classRow.className = "card-row";
  Object.values(CLASSES).forEach((c) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "pick-card" + (state.classId === c.id ? " picked" : "");
    card.innerHTML = `
      <img class="pick-portrait" src="${c.portrait}" alt="">
      <strong>${t(c.name)}</strong>
      <span>${t(c.desc)}</span>
    `;
    card.addEventListener("click", () => {
      state.classId = c.id;
      state.stats = { ...c.stats };
      state.maxHp = c.hp;
      state.hp = c.hp;
      state.pointsLeft = 6;
      renderCreation();
    });
    classRow.appendChild(card);
  });
  classSection.appendChild(classRow);
  root.appendChild(classSection);

  if (state.classId) {
    const statSection = document.createElement("div");
    statSection.className = "create-section";
    statSection.innerHTML = `<h3>${state.lang === "tr" ? "Statları dağıt" : "Allocate stats"} (${state.pointsLeft} ${state.lang === "tr" ? "puan kaldı" : "points left"})</h3>`;
    const statRow = document.createElement("div");
    statRow.className = "stat-alloc-row";
    ["str", "dex", "con", "int", "wis", "cha"].forEach((key) => {
      const base = CLASSES[state.classId].stats[key];
      const row = document.createElement("div");
      row.className = "stat-alloc";
      row.innerHTML = `
        <span class="stat-alloc-label">${t(STAT_LABEL[key])}</span>
        <button type="button" class="stat-btn" data-act="minus" data-key="${key}">-</button>
        <span class="stat-alloc-value">${state.stats[key]}</span>
        <button type="button" class="stat-btn" data-act="plus" data-key="${key}">+</button>
      `;
      const minusBtn = row.querySelector('[data-act="minus"]');
      const plusBtn = row.querySelector('[data-act="plus"]');
      minusBtn.disabled = state.stats[key] <= base;
      plusBtn.disabled = state.pointsLeft <= 0 || state.stats[key] >= base + 3;
      minusBtn.addEventListener("click", () => {
        if (state.stats[key] > base) {
          state.stats[key]--;
          state.pointsLeft++;
          renderCreation();
        }
      });
      plusBtn.addEventListener("click", () => {
        if (state.pointsLeft > 0 && state.stats[key] < base + 3) {
          state.stats[key]++;
          state.pointsLeft--;
          renderCreation();
        }
      });
      statRow.appendChild(row);
    });
    statSection.appendChild(statRow);
    root.appendChild(statSection);

    const nameSection = document.createElement("div");
    nameSection.className = "create-section";
    nameSection.innerHTML = `<h3>${state.lang === "tr" ? "Adını yaz" : "Name your Warden"}</h3>`;
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = "name-input";
    nameInput.maxLength = 24;
    nameInput.placeholder = state.lang === "tr" ? "Örn. Teren" : "e.g. Teren";
    nameInput.value = state.name;
    nameInput.addEventListener("input", (e) => {
      state.name = e.target.value;
      beginBtn.disabled = !state.name.trim();
    });
    nameSection.appendChild(nameInput);
    root.appendChild(nameSection);
  }

  const beginBtn = document.getElementById("begin-button");
  beginBtn.disabled = !(state.difficultyId && state.classId && state.name.trim());
}

function beginStory() {
  document.getElementById("intro-overlay").hidden = true;
  document.getElementById("game-area").hidden = false;
  renderScene();
}

// ---- In-story rendering ----

function renderSheet() {
  document.getElementById("sheet-name").textContent = state.name;
  document.getElementById("sheet-class").textContent = t(CLASSES[state.classId].name);
  document.getElementById("sheet-difficulty").textContent = t(DIFFICULTIES[state.difficultyId].name);

  const hpEl = document.getElementById("hp-pips");
  const pct = Math.max(0, Math.round((state.hp / state.maxHp) * 100));
  hpEl.innerHTML = `
    <div class="hp-bar-track"><div class="hp-bar-fill" style="width:${pct}%"></div></div>
    <span class="hp-bar-value">${state.hp}/${state.maxHp}</span>
  `;

  ["str", "dex", "con", "int", "wis", "cha"].forEach((key) => {
    document.getElementById("stat-" + key).textContent = state.stats[key];
  });

  const relicsEl = document.getElementById("relics-list");
  const noneLabel = state.lang === "tr" ? "yok" : "none yet";
  relicsEl.textContent = state.relics.length ? state.relics.join(", ") : noneLabel;

  state.maxRelicsHeld = Math.max(state.maxRelicsHeld, state.relics.length);

  const vignette = document.getElementById("low-hp-vignette");
  if (vignette) {
    vignette.classList.toggle("low-hp-vignette--on", state.hp > 0 && state.hp / state.maxHp <= 0.25);
  }
}

function renderScene() {
  renderSheet();
  const scene = currentScene();

  document.getElementById("scene-title").textContent = t(scene.title);
  document.getElementById("scene-text").textContent = t(scene.text).replace(/\{name\}/g, state.name);

  const backdrop = document.getElementById("backdrop");
  backdrop.className = "backdrop mood-" + scene.mood;
  backdrop.classList.remove("backdrop-fade");
  void backdrop.offsetWidth;
  backdrop.classList.add("backdrop-fade");

  const glow = document.getElementById("mood-glow");
  if (glow) {
    glow.className = "mood-glow mood-glow--on mood-glow--" + scene.mood;
  }

  const sprite = scene.icon && CREATURE_SPRITES[scene.icon];
  if (sprite) {
    const spriteClass = scene.icon === "icon-moth" ? "backdrop-sprite backdrop-sprite--moth" : "backdrop-sprite";
    backdrop.innerHTML = `<div class="${spriteClass}" style="
      width:${sprite.w}px; height:${sprite.h}px;
      background-image:url('${sprite.src}');
      background-position:-${sprite.x}px -${sprite.y}px;
    "></div>`;
  } else if (scene.icon) {
    backdrop.innerHTML = `<svg class="backdrop-icon"><use href="#${scene.icon}"></use></svg>`;
  } else {
    backdrop.innerHTML = `<svg class="backdrop-icon backdrop-icon--dim"><use href="#icon-scroll"></use></svg>`;
  }

  const choicesEl = document.getElementById("choices");
  choicesEl.innerHTML = "";

  const hint = document.getElementById("first-check-hint");
  if (hint) {
    if (state.pendingCheck && !state.firstCheckSeen) {
      hint.hidden = false;
      state.firstCheckSeen = true;
    } else {
      hint.hidden = true;
    }
  }

  if (state.pendingCheck) {
    renderRollResult(choicesEl);
    return;
  }

  const visibleChoices = scene.choices.filter(
    (choice) => !choice.classOnly || choice.classOnly === state.classId
  );

  visibleChoices.forEach((choice) => {
    const allowed = choice.requires ? choice.requires() : true;
    const labelPair = typeof choice.label === "function" ? choice.label() : choice.label;
    const label = t(labelPair);
    const btn = document.createElement("button");
    btn.className = "choice-btn" + (allowed ? "" : " choice-locked") + (choice.classOnly ? " choice-class" : "");
    let displayLabel = label;
    if (choice.classOnly) {
      displayLabel += ` (${t(CLASSES[choice.classOnly].name)})`;
    }
    if (choice.type === "check") {
      const dcShown = choice.dc + difficultyMod();
      displayLabel += ` [${t(STAT_LABEL[choice.stat])} vs ${dcShown}]`;
    }
    btn.textContent = displayLabel;
    if (!allowed) {
      btn.disabled = true;
    } else {
      btn.addEventListener("click", () => resolveChoice(choice));
    }
    choicesEl.appendChild(btn);
  });
}

function renderRollResult(choicesEl) {
  const { result } = state.pendingCheck;
  const box = document.createElement("div");
  box.className = "roll-box";
  const label = state.lang === "tr" ? "Zar" : "Roll";
  const statLabel = t(STAT_LABEL[result.statKey]);
  const outcomeLabel = result.success
    ? state.lang === "tr" ? "BAŞARILI" : "SUCCESS"
    : state.lang === "tr" ? "BAŞARISIZ" : "FAILURE";
  box.innerHTML = `
    <svg class="roll-die ${result.success ? "roll-die--win" : "roll-die--lose"}"><use href="#icon-d20"></use></svg>
    <div class="roll-text">
      <div class="roll-formula">${label}: ${result.roll} + ${statLabel} ${result.statValue} = ${result.total} / ${result.target}</div>
      <div class="roll-outcome roll-outcome--${result.success ? "win" : "lose"}">${outcomeLabel}</div>
    </div>
  `;
  choicesEl.appendChild(box);

  const branchText = state.pendingCheck.branch.text;
  if (branchText) {
    const p = document.createElement("p");
    p.className = "roll-flavor";
    p.textContent = t(branchText);
    choicesEl.appendChild(p);
  }

  if (!result.success && state.relics.length > 0) {
    const rerollBtn = document.createElement("button");
    rerollBtn.className = "choice-btn choice-class";
    const relicName = state.relics[state.relics.length - 1];
    rerollBtn.textContent =
      state.lang === "tr"
        ? `"${relicName}" eşyanı harcayıp yeniden dene`
        : `Spend "${relicName}" to try again`;
    rerollBtn.addEventListener("click", rerollWithRelic);
    choicesEl.appendChild(rerollBtn);
  }

  const continueBtn = document.createElement("button");
  continueBtn.className = "choice-btn";
  continueBtn.textContent = state.lang === "tr" ? "Devam et" : "Continue";
  continueBtn.addEventListener("click", confirmRoll);
  choicesEl.appendChild(continueBtn);
}

// ---- Language toggle ----

function applyStaticLang() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-en]").forEach((el) => {
    el.textContent = el.dataset[state.lang];
  });
  document.getElementById("lang-toggle").textContent = state.lang === "en" ? "TR" : "EN";
  document.getElementById("settings-lang-en").classList.toggle("active", state.lang === "en");
  document.getElementById("settings-lang-tr").classList.toggle("active", state.lang === "tr");
}

function setLang(lang) {
  state.lang = lang;
  applyStaticLang();
  saveSettings();
  if (document.getElementById("intro-overlay").hidden === false) {
    renderCreation();
  } else if (!document.getElementById("game-area").hidden) {
    renderScene();
  } else if (!document.getElementById("main-menu-overlay").hidden) {
    // static text already re-applied above
  }
}

document.getElementById("lang-toggle").addEventListener("click", () => {
  setLang(state.lang === "en" ? "tr" : "en");
});

document.getElementById("settings-lang-en").addEventListener("click", () => setLang("en"));
document.getElementById("settings-lang-tr").addEventListener("click", () => setLang("tr"));

// ---- Audio (created lazily so a failed load never blocks the toggle) ----

const BASE_THEME_VOL = 0.25;
const BASE_AMBIENCE_VOL = 0.3;

let themeAudio = null;
let ambienceAudio = null;
let soundOn = false;

function ensureAudio() {
  if (!themeAudio) {
    themeAudio = new Audio("audio/theme.mp3");
    themeAudio.loop = true;
    themeAudio.volume = BASE_THEME_VOL * state.musicVolume;
    themeAudio.addEventListener("error", () => {
      document.getElementById("sound-toggle").textContent = "\u{1F507} " + (state.lang === "tr" ? "Müzik yok" : "No audio");
    });
  }
  if (!ambienceAudio) {
    ambienceAudio = new Audio("audio/ambience.ogg");
    ambienceAudio.loop = true;
    ambienceAudio.volume = BASE_AMBIENCE_VOL * state.musicVolume;
    ambienceAudio.addEventListener("error", () => {});
  }
}

function applyMusicVolume() {
  if (themeAudio) themeAudio.volume = BASE_THEME_VOL * state.musicVolume;
  if (ambienceAudio) ambienceAudio.volume = BASE_AMBIENCE_VOL * state.musicVolume;
}

let winAudio = null;
let loseAudio = null;

function playEndingJingle(variant) {
  if (themeAudio) themeAudio.pause();
  if (ambienceAudio) ambienceAudio.pause();

  const src = variant === "win" ? "audio/win.mp3" : "audio/lose.mp3";
  const jingle = new Audio(src);
  jingle.volume = 0.6 * state.sfxVolume;
  jingle.play().catch(() => {});
  if (variant === "win") {
    winAudio = jingle;
  } else {
    loseAudio = jingle;
  }
}

const sfxCache = {};

function playSfx(name) {
  if (state.sfxVolume <= 0) return;
  const files = { click: "audio/click.mp3", select: "audio/select.mp3", hit: "audio/hit.mp3" };
  const src = files[name];
  if (!src) return;
  if (!sfxCache[name]) sfxCache[name] = new Audio(src);
  const sfx = sfxCache[name];
  sfx.currentTime = 0;
  sfx.volume = state.sfxVolume;
  sfx.play().catch(() => {});
}

document.addEventListener(
  "click",
  (e) => {
    const target = e.target.closest("button, .pick-card");
    if (target && !target.disabled) playSfx("click");
  },
  true
);

document.getElementById("sound-toggle").addEventListener("click", () => {
  ensureAudio();
  soundOn = !soundOn;
  const btn = document.getElementById("sound-toggle");
  if (soundOn) {
    themeAudio.play().catch(() => {});
    ambienceAudio.play().catch(() => {});
    btn.textContent = "\u{1F50A} " + (state.lang === "tr" ? "Ses açık" : "Sound on");
  } else {
    themeAudio.pause();
    ambienceAudio.pause();
    btn.textContent = "\u{1F508} " + (state.lang === "tr" ? "Ses kapalı" : "Sound off");
  }
});

document.getElementById("music-volume-slider").addEventListener("input", (e) => {
  state.musicVolume = Number(e.target.value) / 100;
  applyMusicVolume();
  saveSettings();
});

document.getElementById("sfx-volume-slider").addEventListener("input", (e) => {
  state.sfxVolume = Number(e.target.value) / 100;
  saveSettings();
});

// ---- Save / resume ----

const SAVE_KEY = "hollowmere-vigil-save";
const SETTINGS_KEY = "hollowmere-vigil-settings";

function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        name: state.name,
        classId: state.classId,
        difficultyId: state.difficultyId,
        stats: state.stats,
        hp: state.hp,
        maxHp: state.maxHp,
        relics: state.relics,
        flags: Array.from(state.flags),
        sceneId: state.sceneId,
        tookNoDamage: state.tookNoDamage,
        usedClassAbility: state.usedClassAbility,
        maxRelicsHeld: state.maxRelicsHeld,
        history: state.history,
      })
    );
  } catch (e) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
}

function hasSave() {
  return !!loadGame();
}

function applySavedState(saved) {
  state.name = saved.name;
  state.classId = saved.classId;
  state.difficultyId = saved.difficultyId;
  state.stats = saved.stats;
  state.hp = saved.hp;
  state.maxHp = saved.maxHp;
  state.relics = saved.relics;
  state.flags = new Set(saved.flags);
  state.sceneId = saved.sceneId;
  state.tookNoDamage = saved.tookNoDamage;
  state.usedClassAbility = saved.usedClassAbility;
  state.maxRelicsHeld = saved.maxRelicsHeld;
  state.history = saved.history || [];
  state.dead = false;
  state.pendingCheck = null;
}

function initSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (typeof s.musicVolume === "number") state.musicVolume = s.musicVolume;
    if (typeof s.sfxVolume === "number") state.sfxVolume = s.sfxVolume;
    if (s.lang) state.lang = s.lang;
  } catch (e) {}
}

function saveSettings() {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ musicVolume: state.musicVolume, sfxVolume: state.sfxVolume, lang: state.lang })
    );
  } catch (e) {}
}

document.getElementById("begin-button").addEventListener("click", beginStory);

function resetToFreshCharacter() {
  state.name = "";
  state.classId = null;
  state.difficultyId = null;
  state.stats = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  state.pointsLeft = 6;
  state.hp = 10;
  state.maxHp = 10;
  state.relics = [];
  state.flags = new Set();
  state.sceneId = "start";
  state.dead = false;
  state.pendingCheck = null;
  state.tookNoDamage = true;
  state.usedClassAbility = false;
  state.maxRelicsHeld = 0;
  state.history = [];
  state.firstCheckSeen = false;
  clearSave();
}

document.getElementById("retry-button").addEventListener("click", () => {
  resetToFreshCharacter();
  document.getElementById("end-overlay").hidden = true;
  document.getElementById("game-area").hidden = true;
  document.getElementById("intro-overlay").hidden = false;
  renderCreation();
});

document.getElementById("end-menu-button").addEventListener("click", () => {
  document.getElementById("end-overlay").hidden = true;
  document.getElementById("game-area").hidden = true;
  document.getElementById("main-menu-overlay").hidden = false;
  document.getElementById("menu-continue-button").disabled = !hasSave();
});

// ---- Main menu ----

document.getElementById("menu-new-button").addEventListener("click", () => {
  resetToFreshCharacter();
  document.getElementById("main-menu-overlay").hidden = true;
  document.getElementById("intro-overlay").hidden = false;
  renderCreation();
});

document.getElementById("menu-continue-button").addEventListener("click", () => {
  const saved = loadGame();
  if (!saved) return;
  applySavedState(saved);
  document.getElementById("main-menu-overlay").hidden = true;
  document.getElementById("game-area").hidden = false;
  renderScene();
});

// ---- Settings / credits / history panels ----

let screenBeforeSettings = null;

function openSettings() {
  const screens = ["main-menu-overlay", "intro-overlay", "game-area", "end-overlay"];
  screenBeforeSettings = screens.find((id) => !document.getElementById(id).hidden) || "main-menu-overlay";
  document.getElementById(screenBeforeSettings).hidden = true;
  document.getElementById("music-volume-slider").value = Math.round(state.musicVolume * 100);
  document.getElementById("sfx-volume-slider").value = Math.round(state.sfxVolume * 100);
  document.getElementById("settings-overlay").hidden = false;
}

function closeSettings() {
  document.getElementById("settings-overlay").hidden = true;
  if (screenBeforeSettings) document.getElementById(screenBeforeSettings).hidden = false;
}

document.getElementById("settings-toggle").addEventListener("click", openSettings);
document.getElementById("menu-settings-button").addEventListener("click", openSettings);
document.getElementById("settings-back-button").addEventListener("click", closeSettings);

document.getElementById("settings-credits-button").addEventListener("click", () => {
  document.getElementById("settings-overlay").hidden = true;
  document.getElementById("credits-overlay").hidden = false;
});

document.getElementById("credits-back-button").addEventListener("click", () => {
  document.getElementById("credits-overlay").hidden = true;
  document.getElementById("settings-overlay").hidden = false;
});

function renderHistory() {
  const list = document.getElementById("history-list");
  list.innerHTML = "";
  if (state.history.length === 0) {
    list.textContent = state.lang === "tr" ? "Henüz yol alınmadı." : "No path walked yet.";
    return;
  }
  state.history.forEach((h, i) => {
    const div = document.createElement("div");
    div.className = "history-entry";
    const num = i + 1;
    div.innerHTML = `<span class="history-scene">${num}. ${t(h)}</span>`;
    list.appendChild(div);
  });
  list.scrollTop = list.scrollHeight;
}

document.getElementById("history-toggle").addEventListener("click", () => {
  renderHistory();
  document.getElementById("game-area").hidden = true;
  document.getElementById("history-overlay").hidden = false;
});

document.getElementById("history-back-button").addEventListener("click", () => {
  document.getElementById("history-overlay").hidden = true;
  document.getElementById("game-area").hidden = false;
});

// ---- Loading screen ----
// Waits on the font and a short minimum so the loading beat actually
// reads as a beat instead of a flicker, then hands off to the main menu.

function runLoadingScreen() {
  const fill = document.getElementById("loading-bar-fill");
  const minWait = new Promise((resolve) => {
    let pct = 0;
    const step = setInterval(() => {
      pct = Math.min(100, pct + 8);
      fill.style.width = pct + "%";
      if (pct >= 100) {
        clearInterval(step);
        resolve();
      }
    }, 70);
  });

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

  Promise.all([minWait, fontsReady]).then(() => {
    document.getElementById("loading-screen").hidden = true;
    document.getElementById("main-menu-overlay").hidden = false;
    document.getElementById("menu-continue-button").disabled = !hasSave();
  });
}

initSettingsFromStorage();
applyStaticLang();
renderCreation();
runLoadingScreen();
