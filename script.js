const CLASSES = {
  blade: {
    id: "blade",
    name: { en: "Blade Warden", tr: "Kılıç Muhafızı" },
    desc: {
      en: "Trained to meet trouble head-on. Strong, steady, not much for subtlety.",
      tr: "Dertle doğrudan yüzleşmek üzere yetişmiş. Güçlü, sağlam, inceliğe pek meraklı değil.",
    },
    stats: { might: 4, wits: 2, nerve: 2 },
    hp: 12,
    icon: "icon-blade",
  },
  rite: {
    id: "rite",
    name: { en: "Rite Warden", tr: "Ayin Muhafızı" },
    desc: {
      en: "Knows the old words better than the old fights. Reads a room, and a ward-stone, well.",
      tr: "Eski sözleri eski dövüşlerden daha iyi biliyor. Bir odayı da bir mühür taşını da iyi okur.",
    },
    stats: { might: 2, wits: 4, nerve: 2 },
    hp: 9,
    icon: "icon-rite",
  },
  shadow: {
    id: "shadow",
    name: { en: "Shadow Warden", tr: "Gölge Muhafızı" },
    desc: {
      en: "Would rather not be noticed at all. Usually gets their way.",
      tr: "Hiç fark edilmemeyi tercih eder. Genelde de öyle olur.",
    },
    stats: { might: 2, wits: 2, nerve: 4 },
    hp: 9,
    icon: "icon-shadow",
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
  might: { en: "Might", tr: "Güç" },
  wits: { en: "Wits", tr: "Zeka" },
  nerve: { en: "Nerve", tr: "Soğukkanlılık" },
};

const state = {
  lang: "en",
  screen: "difficulty",
  name: "",
  classId: null,
  difficultyId: null,
  stats: { might: 0, wits: 0, nerve: 0 },
  pointsLeft: 2,
  hp: 10,
  maxHp: 10,
  relics: [],
  flags: new Set(),
  sceneId: "start",
  dead: false,
  pendingCheck: null,
  lastRoll: null,
};

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
  state.hp = Math.max(0, state.hp - n);
}

function heal(n) {
  state.hp = Math.min(state.maxHp, state.hp + n);
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
        stat: "nerve",
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
        stat: "wits",
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
      tr: "Tavanda bir çatlak, ve içinden: Mezar Güveleri, düzinelercesi, kağıt gibi kanatları meşale ışığını yansıtıyor. Hızlı değiller. Akıllı değiller. Ama çok sayıdalar.",
    },
    choices: [
      {
        label: { en: "Ward them off with the old words", tr: "Eski sözlerle onları defet" },
        type: "check",
        stat: "wits",
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
            tr: "Sözlerin yarısını doğru söylüyorsun, ki bu hiç söylememekten kötü. Kendiliklerinden dağılmadan önce seni sarıyorlar.",
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
        next: "serpent_tunnel",
        effect: () => {},
      },
      {
        label: { en: "East, toward the ash-choked shrine", tr: "Doğuya, kül dolu tapınağa" },
        next: "ashling_shrine",
        effect: () => {},
      },
      {
        label: { en: "Down, into the bone vault", tr: "Aşağıya, kemik mahzenine" },
        next: "bone_vault",
        effect: () => {},
      },
    ],
  },

  serpent_tunnel: {
    title: { en: "The Flooded Tunnel", tr: "Sel Basmış Tünel" },
    mood: "green",
    icon: "icon-serpent",
    text: {
      en: "Black water, ankle deep, then knee deep. Something long moves under the surface, keeping pace with you without ever quite surfacing. A Fen Serpent, patient about it.",
      tr: "Siyah su, önce ayak bileği, sonra diz boyu. Yüzeyin altında uzun bir şey hareket ediyor, hiç tam yüzeye çıkmadan seninle aynı hızda ilerliyor. Bir Bataklık Yılanı, sabırla.",
    },
    choices: [
      {
        label: () =>
          hasRelic("cracked ledger page")
            ? { en: "Trade the ledger page for safe passage", tr: "Güvenli geçiş için defter sayfasını ver" }
            : { en: "Offer something of yours for safe passage (costs 1 HP)", tr: "Güvenli geçiş için bir şeyini ver (1 Can kaybı)" },
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
        label: { en: "Try to slip past quietly", tr: "Sessizce sıyrılmayı dene" },
        type: "check",
        stat: "nerve",
        dc: 13,
        onSuccess: {
          next: "the_deep",
          text: {
            en: "You barely breathe until you're past it. It never surfaces.",
            tr: "Geçene kadar nefesini zor tutuyorsun. Hiç yüzeye çıkmıyor.",
          },
        },
        onFail: {
          next: "the_deep",
          effect: () => damage(2),
          text: {
            en: "It surfaces just long enough to make its point, then lets you go.",
            tr: "Sadece niyetini belli edecek kadar yüzeye çıkıyor, sonra bırakıyor.",
          },
        },
      },
      {
        label: { en: "Force your way through", tr: "Zorla geç" },
        next: "the_deep",
        effect: () => {
          damage(2);
          state.relics.push("serpent scale");
        },
      },
    ],
  },

  ashling_shrine: {
    title: { en: "The Ash-Choked Shrine", tr: "Kül Dolu Tapınak" },
    mood: "orange",
    icon: "icon-ashling",
    text: {
      en: "Burn marks on every wall, old enough to have their own dust. A single wisp of flame hangs in the middle of the room, watching you the way fire shouldn't be able to.",
      tr: "Her duvarda, kendi tozunu tutacak kadar eski yanık izleri. Odanın ortasında tek bir alev kıvılcımı asılı duruyor, ateşin yapabilmemesi gereken bir şekilde seni izliyor.",
    },
    choices: [
      {
        label: () =>
          hasRelic("cracked ledger page")
            ? { en: "Speak the old rite you found in the ledger", tr: "Defterde bulduğun eski ayini oku" }
            : { en: "Speak the old rite (you don't know it)", tr: "Eski ayini oku (bilmiyorsun)" },
        requires: () => hasRelic("cracked ledger page"),
        type: "check",
        stat: "wits",
        dc: 11,
        onSuccess: {
          next: "the_deep",
          effect: () => state.flags.add("ashling_calmed"),
          text: {
            en: "The flame dims and steadies, listening. Something in it settles.",
            tr: "Alev sönükleşip sakinleşiyor, dinliyor. İçindeki bir şey yatışıyor.",
          },
        },
        onFail: {
          next: "the_deep",
          effect: () => {
            damage(1);
            state.flags.add("ashling_angered");
          },
          text: {
            en: "You get the shape of the words right and none of the meaning. It flares hot enough to singe you and goes quiet, furious.",
            tr: "Sözlerin şeklini doğru buluyorsun ama anlamını hiç bulamıyorsun. Seni yakacak kadar alevleniyor ve öfkeyle susuyor.",
          },
        },
      },
      {
        label: { en: "Douse it and push past", tr: "Söndür ve geç" },
        next: "the_deep",
        effect: () => state.flags.add("ashling_doused"),
      },
      {
        label: { en: "Back away and leave it be", tr: "Geri çekil ve dokunma" },
        next: "the_deep",
        effect: () => state.flags.add("ashling_avoided"),
      },
    ],
  },

  bone_vault: {
    title: { en: "The Bone Vault", tr: "Kemik Mahzeni" },
    mood: "bone",
    icon: "icon-bone",
    text: {
      en: "Old bones, stacked floor to ceiling, most of them still. Not all of them. Something in the pile is trying to remember how to stand up.",
      tr: "Eski kemikler, yerden tavana yığılmış, çoğu hareketsiz. Hepsi değil. Yığının içindeki bir şey nasıl ayağa kalkılacağını hatırlamaya çalışıyor.",
    },
    choices: [
      {
        label: { en: "Recite the Warden's rest-rite", tr: "Muhafızın dinlendirme ayinini oku" },
        type: "check",
        stat: "wits",
        dc: 12,
        onSuccess: {
          next: "the_deep",
          effect: () => state.flags.add("bonewretch_rested"),
          text: {
            en: "The pile settles back into stillness, whatever was trying to stand giving up on it.",
            tr: "Yığın yeniden hareketsizliğe dönüyor, ayağa kalkmaya çalışan her neyse vazgeçiyor.",
          },
        },
        onFail: {
          next: "the_deep",
          effect: () => {
            damage(2);
            state.flags.add("bonewretch_broken");
          },
          text: {
            en: "It's already standing by the time you finish the first line. You break it apart the hard way instead.",
            tr: "Sen ilk satırı bitirene kadar zaten ayağa kalkmış bile. Onu zor yoldan parçalıyorsun.",
          },
        },
      },
      {
        label: { en: "Break it apart before it finishes standing", tr: "Tam ayağa kalkmadan onu parçala" },
        next: "the_deep",
        effect: () => {
          damage(1);
          state.flags.add("bonewretch_broken");
        },
      },
      {
        label: { en: "Retreat and seal the vault door", tr: "Geri çekil ve mahzen kapısını mühürle" },
        next: "the_deep",
        effect: () => state.flags.add("bonewretch_sealed"),
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
        stat: "nerve",
        dc: 10,
        onSuccess: {
          next: "drowspawn_reveal",
          effect: () => heal(1),
          text: {
            en: "You make out a few words, old ones, and something about hearing them said right steadies you.",
            tr: "Birkaç kelime seçebiliyorsun, eski kelimeler, ve doğru söylendiğini duymak seni sakinleştiriyor.",
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
        stat: "might",
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
          hasAnyFlag("sealed_moths", "ashling_calmed", "bonewretch_rested")
            ? { en: "Use what you've learned to re-seal the stone", tr: "Öğrendiklerinle taşı yeniden mühürle" }
            : { en: "Try to re-seal the stone (you don't really know how)", tr: "Taşı yeniden mühürlemeyi dene (aslında nasıl olduğunu bilmiyorsun)" },
        requires: () => hasAnyFlag("sealed_moths", "ashling_calmed", "bonewretch_rested"),
        type: "check",
        stat: "wits",
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
      tr: "Sana dönmeyi bitirmeden vuruyorsun, ve dövüş bu kadar. Drowspawn mühür taşından çözülüyor ve bir daha kalkmıyor. Taş hâlâ çatlak. En azından artık beslenmiyor.",
    },
  },
  ending_fight_lose: {
    variant: "neutral",
    title: { en: "Blood on the Stone", tr: "Taşın Üzerindeki Kan" },
    text: {
      en: "It's faster than it looks. You trade blows you can't really afford to trade, and by the time it finally lets go of the ward-stone to deal with you properly, you're both done fighting for tonight. You make it out. Barely counts as a win.",
      tr: "Göründüğünden hızlı. Karşılayamayacağın darbeler alıp veriyorsun, ve seninle gerçekten ilgilenmek için mühür taşını sonunda bıraktığında ikiniz de bu gece için dövüşü bırakmış oluyorsunuz. Dışarı çıkmayı başarıyorsun. Zar zor kazanç sayılır.",
    },
  },
  ending_seal_fail: {
    variant: "neutral",
    title: { en: "A Patch, Not a Cure", tr: "Yama, Çare Değil" },
    text: {
      en: "You get the shape of the rite right and the timing wrong. The stone holds, barely, in a way that's going to need someone back down here within the month. It costs you more than you wanted to give.",
      tr: "Ayinin şeklini doğru buluyorsun ama zamanlamayı yanlış yapıyorsun. Taş tutuyor, zar zor, ve bir ay içinde birinin buraya geri dönmesi gerekecek şekilde. Vermek istediğinden daha fazlasına mal oluyor.",
    },
  },
  ending_warning: {
    variant: "neutral",
    title: { en: "The Warning", tr: "Uyarı" },
    text: {
      en: "You don't stay to fight it. You make it back up and tell the other Wardens exactly what's down there, which is more than the last report managed. Someone braver, or more prepared, will have to finish this.",
      tr: "Onunla dövüşmek için kalmıyorsun. Yukarı çıkıp diğer Muhafızlara orada tam olarak ne olduğunu anlatıyorsun, ki bu son raporun başardığından fazlası. Daha cesur ya da daha hazırlıklı biri bunu bitirmek zorunda kalacak.",
    },
  },
  ending_death: {
    variant: "lose",
    title: { en: "The Vigil Ends Here", tr: "Nöbet Burada Bitiyor" },
    text: {
      en: "The dark takes what it wants sometimes. Your torch goes out before you can get back to the surface, and Hollowmere keeps one more thing it shouldn't.",
      tr: "Karanlık bazen istediğini alır. Yüzeye çıkamadan meşalen sönüyor, ve Hollowmere alması gerekmeyen bir şeyi daha elinde tutuyor.",
    },
  },
};

function currentScene() {
  return SCENES[state.sceneId];
}

function resolveChoice(choice) {
  if (choice.type === "check") {
    const result = rollCheck(choice.stat, choice.dc);
    state.lastRoll = result;
    const branch = result.success ? choice.onSuccess : choice.onFail;
    showRollResult(result, branch);
    return;
  }
  choice.effect();
  advanceTo(choice.next);
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
  renderScene();
}

function showRollResult(result, branch) {
  state.pendingCheck = { result, branch };
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
  renderScene();
}

function endRun(endingId) {
  const ending = state.dead ? ENDINGS.ending_death : ENDINGS[endingId];
  const card = document.getElementById("end-card");
  card.classList.remove("overlay-card--win", "overlay-card--lose", "overlay-card--neutral");
  card.classList.add("overlay-card--" + ending.variant);

  document.getElementById("end-title").textContent = t(ending.title);
  document.getElementById("end-text").textContent = t(ending.text);
  const summaryLabel = state.lang === "tr" ? "Kalan Can" : "HP left";
  const relicsLabel = state.lang === "tr" ? "Taşınan eşyalar" : "Relics carried";
  const noneLabel = state.lang === "tr" ? "yok" : "none";
  document.getElementById("end-summary").textContent =
    `${summaryLabel}: ${state.hp}/${state.maxHp}. ${relicsLabel}: ${state.relics.length ? state.relics.join(", ") : noneLabel}`;
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
    card.innerHTML = `<strong>${t(d.name)}</strong><span>${t(d.desc)}</span>`;
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
      <svg class="pick-icon"><use href="#${c.icon}"></use></svg>
      <strong>${t(c.name)}</strong>
      <span>${t(c.desc)}</span>
    `;
    card.addEventListener("click", () => {
      state.classId = c.id;
      state.stats = { ...c.stats };
      state.maxHp = c.hp;
      state.hp = c.hp;
      state.pointsLeft = 2;
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
    ["might", "wits", "nerve"].forEach((key) => {
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
  hpEl.innerHTML = "";
  for (let i = 0; i < state.maxHp; i++) {
    const pip = document.createElement("span");
    pip.className = "pip pip-hp" + (i < state.hp ? "" : " pip-empty");
    hpEl.appendChild(pip);
  }

  ["might", "wits", "nerve"].forEach((key) => {
    document.getElementById("stat-" + key).textContent = state.stats[key];
  });

  const relicsEl = document.getElementById("relics-list");
  const noneLabel = state.lang === "tr" ? "yok" : "none yet";
  relicsEl.textContent = state.relics.length ? state.relics.join(", ") : noneLabel;
}

function renderScene() {
  renderSheet();
  const scene = currentScene();

  document.getElementById("scene-title").textContent = t(scene.title);
  document.getElementById("scene-text").textContent = t(scene.text).replace(/\{name\}/g, state.name);

  const backdrop = document.getElementById("backdrop");
  backdrop.className = "backdrop mood-" + scene.mood;
  backdrop.innerHTML = scene.icon
    ? `<svg class="backdrop-icon"><use href="#${scene.icon}"></use></svg>`
    : `<svg class="backdrop-icon backdrop-icon--dim"><use href="#icon-scroll"></use></svg>`;

  const choicesEl = document.getElementById("choices");
  choicesEl.innerHTML = "";

  if (state.pendingCheck) {
    renderRollResult(choicesEl);
    return;
  }

  scene.choices.forEach((choice) => {
    const allowed = choice.requires ? choice.requires() : true;
    const labelPair = typeof choice.label === "function" ? choice.label() : choice.label;
    const label = t(labelPair);
    const btn = document.createElement("button");
    btn.className = "choice-btn" + (allowed ? "" : " choice-locked");
    let displayLabel = label;
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
}

document.getElementById("lang-toggle").addEventListener("click", () => {
  state.lang = state.lang === "en" ? "tr" : "en";
  applyStaticLang();
  if (document.getElementById("intro-overlay").hidden === false) {
    renderCreation();
  } else if (!document.getElementById("game-area").hidden) {
    renderScene();
  }
});

// ---- Audio (created lazily so a failed load never blocks the toggle) ----

let themeAudio = null;
let ambienceAudio = null;
let soundOn = false;

function ensureAudio() {
  if (!themeAudio) {
    themeAudio = new Audio("audio/theme.mp3");
    themeAudio.loop = true;
    themeAudio.volume = 0.25;
    themeAudio.addEventListener("error", () => {
      document.getElementById("sound-toggle").textContent = "\u{1F507} " + (state.lang === "tr" ? "Müzik yok" : "No audio");
    });
  }
  if (!ambienceAudio) {
    ambienceAudio = new Audio("audio/ambience.ogg");
    ambienceAudio.loop = true;
    ambienceAudio.volume = 0.3;
    ambienceAudio.addEventListener("error", () => {});
  }
}

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

document.getElementById("begin-button").addEventListener("click", beginStory);

document.getElementById("retry-button").addEventListener("click", () => {
  state.screen = "difficulty";
  state.name = "";
  state.classId = null;
  state.difficultyId = null;
  state.stats = { might: 0, wits: 0, nerve: 0 };
  state.pointsLeft = 2;
  state.hp = 10;
  state.maxHp = 10;
  state.relics = [];
  state.flags = new Set();
  state.sceneId = "start";
  state.dead = false;
  state.pendingCheck = null;

  document.getElementById("end-overlay").hidden = true;
  document.getElementById("game-area").hidden = true;
  document.getElementById("intro-overlay").hidden = false;
  renderCreation();
});

applyStaticLang();
renderCreation();
