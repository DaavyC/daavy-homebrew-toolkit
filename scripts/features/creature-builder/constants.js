import { MODULE_ID } from "../../constants.js";

export const TABLE_LEVELS = { min: -1, max: 24 };

export const CREATURE_TABLES = {
  attribute: {
    extreme: [null, null, 5, 5, 5, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 11, 11, 13],
    high: [3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10, 10, 10, 12],
    moderate: [2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 8, 8, 9],
    low: [0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7]
  },
  perception: {
    extreme: [9, 10, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 32, 33, 35, 36, 38, 39, 41, 43, 44, 46],
    high: [8, 9, 10, 11, 12, 14, 15, 17, 18, 19, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 35, 36, 38, 39, 40, 42],
    moderate: [5, 6, 7, 8, 9, 11, 12, 14, 15, 16, 18, 19, 21, 22, 23, 25, 26, 28, 29, 30, 32, 33, 35, 36, 37, 38],
    low: [2, 3, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 20, 22, 23, 25, 26, 27, 29, 30, 32, 33, 34, 36],
    terrible: [0, 1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15, 16, 18, 19, 20, 22, 23, 24, 26, 27, 28, 30, 31, 32]
  },
  skill: {
    extreme: [8, 9, 10, 11, 13, 15, 16, 18, 20, 21, 23, 25, 26, 28, 30, 31, 33, 35, 36, 38, 40, 41, 43, 45, 46, 48],
    high: [5, 6, 7, 8, 10, 12, 13, 15, 17, 18, 20, 22, 23, 25, 27, 28, 30, 32, 33, 35, 37, 38, 40, 42, 43, 45],
    moderate: [4, 5, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 28, 30, 31, 33, 34, 36, 37, 38, 40],
    low: [[2, 1], [3, 2], [4, 3], [5, 4], [7, 5], [8, 7], [10, 8], [11, 9], [13, 11], [14, 12], [16, 13], [17, 15], [19, 16], [20, 17], [22, 19], [23, 20], [25, 21], [26, 23], [28, 24], [29, 25], [31, 27], [32, 28], [34, 29], [35, 31], [36, 32], [38, 33]]
  },
  armorClass: {
    extreme: [18, 19, 19, 21, 22, 24, 25, 27, 28, 30, 31, 33, 34, 36, 37, 39, 40, 42, 43, 45, 46, 48, 49, 51, 52, 54],
    high: [15, 16, 16, 18, 19, 21, 22, 24, 25, 27, 28, 30, 31, 33, 34, 36, 37, 39, 40, 42, 43, 45, 46, 48, 49, 51],
    moderate: [14, 15, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 32, 33, 35, 36, 38, 39, 41, 42, 44, 45, 47, 48, 50],
    low: [12, 13, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 28, 30, 31, 33, 34, 36, 37, 39, 40, 42, 43, 45, 46, 48]
  },
  save: {
    extreme: [9, 10, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 32, 33, 35, 36, 38, 39, 41, 43, 44, 46],
    high: [8, 9, 10, 11, 12, 14, 15, 17, 18, 19, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 35, 36, 38, 39, 40, 42],
    moderate: [5, 6, 7, 8, 9, 11, 12, 14, 15, 16, 18, 19, 21, 22, 23, 25, 26, 28, 29, 30, 32, 33, 35, 36, 37, 38],
    low: [2, 3, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 20, 22, 23, 25, 26, 27, 29, 30, 32, 33, 34, 36],
    terrible: [0, 1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15, 16, 18, 19, 20, 22, 23, 24, 26, 27, 28, 30, 31, 32]
  },
  hitPoints: {
    high: [9, [20, 17], [26, 24], [40, 36], [59, 53], [78, 72], [97, 91], [123, 115], [148, 140], [173, 165], [198, 190], [223, 215], [248, 240], [273, 265], [298, 290], [323, 315], [348, 340], [373, 365], [398, 390], [423, 415], [448, 440], [473, 465], [505, 495], [544, 532], [581, 569], [633, 617]],
    moderate: [[8, 7], [16, 14], [21, 19], [32, 28], [48, 42], [63, 57], [78, 72], [99, 91], [119, 111], [139, 131], [159, 151], [179, 171], [199, 191], [219, 211], [239, 231], [259, 251], [279, 271], [299, 291], [319, 311], [339, 331], [359, 351], [379, 371], [405, 395], [436, 424], [466, 454], [508, 492]],
    low: [[6, 5], [13, 11], [16, 14], [25, 21], [37, 31], [48, 42], [59, 53], [75, 67], [90, 82], [105, 97], [120, 112], [135, 127], [150, 142], [165, 157], [180, 172], [195, 187], [210, 202], [225, 217], [240, 232], [255, 247], [270, 262], [285, 277], [305, 295], [329, 317], [351, 339], [383, 367]]
  },
  resistance: {
    maximum: [1, 3, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 23, 24, 25, 26],
    minimum: [1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
  },
  strikeAttack: {
    extreme: [10, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25, 27, 28, 29, 31, 32, 34, 35, 37, 38, 40, 41, 43, 44, 46],
    high: [8, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 32, 33, 35, 36, 38, 39, 41, 42, 44],
    moderate: [6, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 28, 30, 31, 33, 34, 36, 37, 39, 40, 42],
    low: [4, 4, 5, 7, 8, 9, 11, 12, 13, 15, 16, 17, 19, 20, 21, 23, 24, 25, 27, 28, 29, 31, 32, 33, 35, 36]
  },
  strikeDamage: {
    extreme: ["1d6+1", "1d6+3", "1d8+4", "1d12+4", "1d12+8", "2d10+7", "2d12+7", "2d12+10", "2d12+12", "2d12+15", "2d12+17", "2d12+20", "2d12+22", "3d12+19", "3d12+21", "3d12+24", "3d12+26", "3d12+29", "3d12+31", "3d12+34", "4d12+29", "4d12+32", "4d12+34", "4d12+37", "4d12+39", "4d12+42"],
    high: ["1d4+1", "1d6+2", "1d6+3", "1d10+4", "1d10+6", "2d8+5", "2d8+7", "2d8+9", "2d10+9", "2d10+11", "2d10+13", "2d12+13", "2d12+15", "3d10+14", "3d10+16", "3d10+18", "3d12+17", "3d12+18", "3d12+19", "3d12+20", "4d10+20", "4d10+22", "4d10+24", "4d10+26", "4d12+24", "4d12+26"],
    moderate: ["1d4", "1d4+2", "1d6+2", "1d8+4", "1d8+6", "2d6+5", "2d6+6", "2d6+8", "2d8+8", "2d8+9", "2d8+11", "2d10+11", "2d10+12", "3d8+12", "3d8+14", "3d8+15", "3d10+14", "3d10+15", "3d10+16", "3d10+17", "4d8+17", "4d8+19", "4d8+20", "4d8+22", "4d10+20", "4d10+22"],
    low: ["1d4", "1d4+1", "1d4+2", "1d6+3", "1d6+5", "2d4+4", "2d4+6", "2d4+7", "2d6+6", "2d6+8", "2d6+9", "2d6+10", "2d8+10", "3d6+10", "3d6+11", "3d6+13", "3d6+14", "3d6+15", "3d6+16", "3d6+17", "4d6+14", "4d6+15", "4d6+17", "4d6+18", "4d6+19", "4d6+21"]
  },
  spellDifficultyClass: {
    extreme: [19, 19, 20, 22, 23, 25, 26, 27, 29, 30, 32, 33, 34, 36, 37, 39, 40, 41, 43, 44, 46, 47, 48, 50, 51, 52],
    high: [16, 16, 17, 18, 20, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 34, 36, 37, 38, 40, 41, 42, 44, 45, 46, 48],
    moderate: [13, 13, 14, 15, 17, 18, 19, 21, 22, 23, 25, 26, 27, 29, 30, 31, 33, 34, 35, 37, 38, 39, 41, 42, 43, 45]
  },
  spellAttack: {
    extreme: [11, 11, 12, 14, 15, 17, 18, 19, 21, 22, 24, 25, 26, 28, 29, 31, 32, 33, 35, 36, 38, 39, 40, 42, 43, 44],
    high: [8, 8, 9, 10, 12, 13, 14, 16, 17, 18, 20, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 34, 36, 37, 38, 40],
    moderate: [5, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 19, 21, 22, 23, 25, 26, 27, 29, 30, 31, 33, 34, 35, 37]
  }
};

export const DICE_TERM = /^(\d+)d(\d+)$/;

export const SCALING_TIER = "high";
export const HEALING_RULE = "FastHealing";
export const REGENERATION_TYPE = "regeneration";
export const REGENERATION_FACTOR = 1.5;
export const FAST_HEALING_FACTOR = 1;
export const SCALED_DAMAGE_TYPE = "bludgeoning";

export const DAMAGE_FORMULA = /(@Damage\[)\(0\)/g;
export const DAMAGE_TYPE_PLACEHOLDER = /\[damageType\]/g;
export const CHECK_DC = /dc:(?=[|\]])/g;
export const ESCAPE_DC = /dc=0\b/g;

export const NATIVE_ABILITY_PACK = "pf2e.bestiary-ability-glossary-srd";
export const ABILITY_COSTS = ["1", "2", "3", "reaction", "free", "passive"];
export const ABILITY_CATEGORIES = ["offensive", "defensive", "interaction"];
export const DEFAULT_ABILITY_COST = "1";
export const DEFAULT_ABILITY_CATEGORY = "offensive";

export const ACTION_TYPE = "action";
export const ABILITY_INDEX_FIELDS = ["system.slug", "system.actionType.value", "system.actions.value", "system.category", "system.traits.value"];
export const SENSE_SLUGS = new Set(["darkvision", "greater-darkvision", "low-light-vision", "lifesense", "scent", "tremorsense", "thoughtsense", "wavesense"]);
export const GLYPHS = { 1: "1", 2: "2", 3: "3", reaction: "R", free: "F" };

export const DEFAULT_TIER = "moderate";

export const BASE_ROLES = {
  brute: {
    perception: "low",
    str: "high",
    con: "high",
    dex: "low",
    int: "low",
    wis: "low",
    cha: "low",
    fortitude: "high",
    reflex: "low",
    will: "low",
    hitPoints: "high",
    strikeAttack: "high",
    strikeDamage: "high"
  },
  magicalStriker: {
    strikeAttack: "high",
    strikeDamage: "high",
    spellDifficultyClass: "high",
    spellAttack: "high"
  },
  skillParagon: {
    fortitude: "low",
    reflex: "high",
    skill: "high"
  },
  skirmisher: {
    dex: "high",
    fortitude: "low",
    reflex: "high"
  },
  sniper: {
    perception: "high",
    dex: "high",
    fortitude: "low",
    reflex: "high",
    strikeAttack: "high",
    strikeDamage: "high",
    meleeStrikeAttack: "moderate",
    meleeStrikeDamage: "moderate"
  },
  soldier: {
    str: "high",
    armorClass: "high",
    fortitude: "high",
    strikeAttack: "high",
    strikeDamage: "high"
  },
  spellcaster: {
    fortitude: "low",
    will: "high",
    hitPoints: "low",
    strikeAttack: "low",
    spellDifficultyClass: "high",
    spellAttack: "high"
  }
};

const CASTER_SPELLS = { spellDifficultyClass: "high", spellAttack: "high" };

export const CLASS_ROLES = {
  alchemist: { perception: "low", skill: "high", int: "high", hitPoints: "low" },
  barbarian: { skill: "high", str: "high", con: "high", armorClass: "high", fortitude: "high", hitPoints: "high", strikeDamage: "extreme" },
  bard: { skill: "high", cha: "high", fortitude: "low", hitPoints: "low", strikeAttack: "low", ...CASTER_SPELLS },
  champion: { perception: "low", str: "high", armorClass: "extreme", reflex: "low", strikeDamage: "high" },
  clericCloistered: { perception: "high", skill: "high", wis: "high", armorClass: "low", fortitude: "low", will: "high", hitPoints: "low", strikeAttack: "low", ...CASTER_SPELLS },
  clericWarpriest: { str: "high", armorClass: "high", reflex: "low", will: "high", ...CASTER_SPELLS },
  druid: { perception: "high", skill: "high", wis: "high", will: "high", hitPoints: "low", strikeAttack: "low", ...CASTER_SPELLS },
  fighter: { skill: "high", str: "high", armorClass: "high", will: "low", strikeAttack: "high", strikeDamage: "high" },
  investigator: { perception: "high", skill: "high", int: "high", fortitude: "low", will: "high", hitPoints: "low", strikeDamage: "low" },
  monk: { skill: "high", str: "high", armorClass: "high", strikeDamage: "high" },
  oracle: { skill: "high", cha: "high", armorClass: "low", fortitude: "low", will: "high", hitPoints: "low", strikeAttack: "low", ...CASTER_SPELLS },
  ranger: { perception: "high", str: "high", armorClass: "high", strikeDamage: "high" },
  rogue: { perception: "high", skill: "high", dex: "high", armorClass: "high", fortitude: "low", reflex: "high", hitPoints: "low", strikeDamage: "low" },
  sorcerer: { perception: "low", cha: "high", armorClass: "low", fortitude: "low", hitPoints: "low", strikeAttack: "low", ...CASTER_SPELLS },
  swashbuckler: { perception: "high", skill: "high", dex: "high", armorClass: "high", fortitude: "low", reflex: "high", strikeDamage: "low" },
  witch: { perception: "low", skill: "high", int: "high", armorClass: "low", fortitude: "low", hitPoints: "low", strikeAttack: "low", ...CASTER_SPELLS },
  wizard: { perception: "low", skill: "high", int: "high", armorClass: "low", fortitude: "low", hitPoints: "low", strikeAttack: "low", ...CASTER_SPELLS }
};

export const ROLES = { ...BASE_ROLES, ...CLASS_ROLES };

export const SKILL_HEAVY_ROLES = new Set(["skillParagon", "investigator", "rogue"]);

export const MELEE_TIER_KEYS = { strikeAttack: "meleeStrikeAttack", strikeDamage: "meleeStrikeDamage" };

export const MAX_SPELL_RANK = 10;
export const CANTRIP_RANK = 0;

export const SLOTS_BY_TYPE = {
  prepared: { cantrips: 5, full: 3, newest: 2 },
  spontaneous: { cantrips: 0, full: 4, newest: 3 }
};

export const ATTRIBUTES = ["str", "dex", "con", "int", "wis", "cha"];
export const SAVES = ["fortitude", "reflex", "will"];

export const STATISTIC_TABLES = {
  ...Object.fromEntries(ATTRIBUTES.map((key) => [key, "attribute"])),
  perception: "perception",
  armorClass: "armorClass",
  ...Object.fromEntries(SAVES.map((key) => [key, "save"])),
  hitPoints: "hitPoints"
};

export const DEFAULT_STRIKE_DAMAGE_TYPE = "slashing";
export const DEFAULT_REACH = 5;
export const LORE_SKILL = "lore";
export const DEFAULT_RANGE_INCREMENT = 30;
export const DEFAULT_RESISTANCE_TIER = "minimum";
export const DEFAULT_SPEED = 25;
export const SPEED_TYPES = ["burrow", "climb", "fly", "swim"];

export const DEFAULT_STRIKE_NAME = "Strike";
export const DEFAULT_ABILITY_NAME = "Ability";

export const LORE_SUFFIX = /(?:^|\s)lore$/i;

export const PREPARATION_TYPES = ["innate", "prepared", "spontaneous"];
export const REACH_TRAIT = /^reach(-|$)/;

const CELESTIAL_TRAITS = ["celestial", "holy"];
const FIEND_TRAITS = ["fiend", "unholy"];
const MINDLESS_IMMUNITIES = ["bleed", "death-effects", "disease", "doomed", "drained", "fatigued", "healing", "nonlethal-attacks", "paralyzed", "poison", "sickened", "spirit", "unconscious", "vitality", "void"];

export const TRAIT_ABILITIES = {
  aberration: { senses: [{ type: "darkvision" }], languages: ["aklo"] },
  aeon: { traits: ["monitor"], languages: ["utopian"] },
  air: { languages: ["sussuran"], speeds: ["fly"] },
  angel: { traits: CELESTIAL_TRAITS, speeds: ["fly"] },
  animal: { attributes: { int: -4 } },
  archon: { traits: CELESTIAL_TRAITS, immunities: ["fear-effects"] },
  astral: { senses: [{ type: "darkvision" }] },
  azata: { traits: CELESTIAL_TRAITS, weaknesses: [{ type: "cold-iron" }] },
  celestial: { traits: ["holy"], senses: [{ type: "darkvision" }], languages: ["empyrean"], weaknesses: [{ type: "unholy" }] },
  cold: { resistances: [{ type: "cold" }] },
  construct: { immunities: MINDLESS_IMMUNITIES },
  daemon: { traits: FIEND_TRAITS, languages: ["daemonic"], immunities: ["death-effects"] },
  demon: { traits: FIEND_TRAITS, languages: ["chthonian"], weaknesses: [{ type: "cold-iron" }], tiers: { hitPoints: "high" } },
  devil: {
    traits: FIEND_TRAITS,
    languages: ["diabolic"],
    immunities: ["fire"],
    weaknesses: [{ type: "holy" }],
    resistances: [{ type: "physical", exceptions: ["silver"] }, { type: "poison" }]
  },
  dragon: { senses: [{ type: "darkvision" }], languages: ["draconic"], speeds: ["fly"] },
  earth: { senses: [{ type: "tremorsense", range: 30 }], languages: ["petran"], speeds: ["burrow"] },
  elemental: { senses: [{ type: "darkvision" }], immunities: ["bleed", "paralyzed", "poison", "sleep"] },
  ethereal: { senses: [{ type: "darkvision" }] },
  fey: { senses: [{ type: "low-light-vision" }], languages: ["aklo", "fey"], weaknesses: [{ type: "cold-iron" }] },
  fiend: { traits: ["unholy"], senses: [{ type: "darkvision" }], weaknesses: [{ type: "holy" }] },
  fire: { languages: ["pyric"], immunities: ["fire"], weaknesses: [{ type: "cold" }] },
  giant: { traits: ["humanoid"], senses: [{ type: "low-light-vision" }], languages: ["jotun"], minimumSize: "lg" },
  incorporeal: {
    attributes: { str: -5 },
    tiers: { armorClass: "low", hitPoints: "low" },
    immunities: ["bleed", "disease", "paralyzed", "poison", "precision"],
    resistances: [{ type: "all-damage", exceptions: ["force", "ghost-touch"] }]
  },
  metal: { languages: ["talican"] },
  monitor: { senses: [{ type: "darkvision" }] },
  ooze: {
    senses: [{ type: "motion-sense" }],
    tiers: { armorClass: "low", hitPoints: "high" },
    immunities: ["bleed", "critical-hits", "precision", "unconscious"]
  },
  plant: { senses: [{ type: "low-light-vision" }] },
  protean: { traits: ["monitor"], languages: ["protean"], resistances: [{ type: "precision" }] },
  psychopomp: {
    traits: ["monitor"],
    senses: [{ type: "lifesense", range: 60 }],
    languages: ["requian"],
    immunities: ["death-effects", "disease"],
    resistances: [{ type: "poison" }, { type: "void" }]
  },
  spirit: { traits: ["incorporeal", "undead"] },
  swarm: {
    tiers: { hitPoints: "low" },
    immunities: ["grabbed", "precision", "prone", "restrained", "swarm-mind"],
    weaknesses: [{ type: "area-damage" }],
    resistances: [{ type: "physical" }]
  },
  undead: { senses: [{ type: "darkvision" }], immunities: ["death-effects", "disease", "paralyzed", "poison", "sleep"] },
  water: { languages: ["thalassic"], speeds: ["swim"] },
  wood: { languages: ["muan"], weaknesses: [{ type: "fire" }] }
};

export const TRAIT_NOTES = new Set([
  "angel",
  "animal",
  "archon",
  "azata",
  "beast",
  "celestial",
  "construct",
  "daemon",
  "demon",
  "devil",
  "dragon",
  "fire",
  "fiend",
  "fungus",
  "giant",
  "humanoid",
  "incorporeal",
  "ooze",
  "plant",
  "protean",
  "psychopomp",
  "swarm",
  "undead",
  "wood"
]);

export const TRAIT_ATTRIBUTE_RULES = [
  ...Object.entries(TRAIT_ABILITIES).flatMap(([trait, { attributes = {} }]) =>
    Object.entries(attributes).map(([attribute, fix]) => ({ trait, attribute, max: fix, fix }))
  ),
  { trait: "beast", attribute: "int", min: -3, fix: -3 },
  { trait: "humanoid", attribute: "int", min: -3, fix: -3 }
];

export const SIZE_ORDER = ["tiny", "sm", "med", "lg", "huge", "grg"];

export const WEAKNESS_TIER = "maximum";

export const RANK = { terrible: 0, low: 1, moderate: 2, high: 3, extreme: 4 };
export const MAX_HIGH_SKILLS = 3;
export const MAX_SUGGESTED_FIXES = 2;
export const EARLY_SPELL_EXTREME_LEVEL = 15;
export const FLIGHT_LEVEL = 7;
export const BROAD_RESISTANCES = ["physical", "all-damage", "energy"];
export const SKILL_ATTRIBUTES = {
  acrobatics: "dex",
  arcana: "int",
  athletics: "str",
  crafting: "int",
  deception: "cha",
  diplomacy: "cha",
  intimidation: "cha",
  medicine: "wis",
  nature: "wis",
  occultism: "int",
  performance: "cha",
  religion: "wis",
  society: "int",
  stealth: "dex",
  survival: "wis",
  thievery: "dex",
  [LORE_SKILL]: "int"
};
export const SAVE_PRIORITY = ["will", "reflex", "fortitude", "perception"];
export const EXTREME_LIMITS = [
  { level: 20, count: 4 },
  { level: 15, count: 2 },
  { level: -Infinity, count: 1 }
];
export const MAXIMUM_SIZES = [
  { level: 10, size: "grg" },
  { level: 5, size: "huge" },
  { level: 1, size: "lg" },
  { level: -Infinity, size: "med" }
];
export const EXTREME_STRENGTH_SIZES = [
  { level: 10, size: "grg" },
  { level: 6, size: "huge" },
  { level: 1, size: "lg" }
];
export const EXTREME_STRENGTH_LAST_LEVEL = 15;
export const RANGED_DAMAGE_FIRST_LEVEL = 2;
export const EXTREME_ARMOR_CLASS_LAST_LEVEL = 5;
export const EXTREME_NEEDS_LOWS = { firstLevel: 2, lastLevel: 9, count: 2 };

export const SPELL_PACK = "pf2e.spells-srd";
export const SPELL_INDEX_FIELDS = ["system.level.value", "system.traits.value", "system.traits.traditions", "system.ritual"];
export const CANTRIP_TRAIT = "cantrip";
export const FOCUS_TRAIT = "focus";

export const COMMON_RARITY = "common";

export const SECTIONS = [
  { id: "identity", icon: "fa-id-card" },
  { id: "attributes", icon: "fa-dumbbell" },
  { id: "defenses", icon: "fa-shield-halved" },
  { id: "strikes", icon: "fa-hand-fist" },
  { id: "abilities", icon: "fa-bolt" },
  { id: "spells", icon: "fa-wand-sparkles" }
];

export const NATIVE_GROUPS = [
  { id: "actions", costs: ["1", "2", "3"] },
  { id: "reaction", costs: ["reaction"] },
  { id: "free", costs: ["free"] },
  { id: "passive", costs: ["passive"] }
];

const CLASS_FEATURES = "pf2e.classfeatures";
const CLASS_FEATS = "pf2e.feats-srd";

function ability(name, pack, id, cost = "passive", category = "offensive") {
  return { name, uuid: `Compendium.${pack}.Item.${id}`, cost, category };
}

const ABILITIES = {
  rage: ability("Rage", CLASS_FEATURES, "WZUCvxqbigXos1L9"),
  ragingResistance: ability("Raging Resistance", CLASS_FEATURES, "ie6xDX9GMEcA2Iuq", "passive", "defensive"),
  bravery: ability("Bravery", CLASS_FEATURES, "GJKJafDGuX4BeAeN", "passive", "defensive"),
  reactiveStrike: ability("Reactive Strike", NATIVE_ABILITY_PACK, "W7SbTykXrNwxDzJc", "reaction", "defensive"),
  shieldBlock: ability("Shield Block", NATIVE_ABILITY_PACK, "m4HQ2o5aPxjXf2kY", "reaction", "defensive"),
  huntPrey: ability("Hunt Prey", CLASS_FEATURES, "0nIOGpHQNHsKSFKT", "1"),
  huntersEdge: ability("Hunter's Edge", CLASS_FEATURES, "mzkkj9LEWjJPBhaq"),
  naturesEdge: ability("Nature's Edge", CLASS_FEATURES, "j2R64kwUgEJ1TudD"),
  masterfulHunter: ability("Masterful Hunter", CLASS_FEATURES, "RVZC4wVy5B5W2OeS"),
  swiftPrey: ability("Swift Prey", CLASS_FEATURES, "bBGb1LcffXEqar0p"),
  flurryOfBlows: ability("Flurry of Blows", CLASS_FEATURES, "NLHHHiAcdnZ5ohc2", "1"),
  metalStrikes: ability("Metal Strikes", CLASS_FEATURES, "CoRfFkisEsHE1e43"),
  mysticStrikes: ability("Mystic Strikes", CLASS_FEATURES, "D2AE8RfMlZ3D1FuV"),
  perfectedForm: ability("Perfected Form", CLASS_FEATURES, "KmTfg7Sg5va4yU00"),
  sneakAttack: ability("Sneak Attack", NATIVE_ABILITY_PACK, "AWvNPE4U0kEJSL1T"),
  surpriseAttack: ability("Surprise Attack", CLASS_FEATURES, "w6rMqmGzhUahdnA7"),
  denyAdvantage: ability("Deny Advantage", CLASS_FEATURES, "PNpmVmD21zViDtGC", "passive", "defensive"),
  debilitatingStrike: ability("Debilitating Strike", CLASS_FEATURES, "9SruVg2lZpNaYLOB"),
  masterStrike: ability("Master Strike", CLASS_FEATURES, "SUUdWG0t33VKa5q4"),
  deviseAStratagem: ability("Devise a Stratagem", CLASS_FEATURES, "lgo65ldX7WkXC8Ir"),
  quickBomber: ability("Quick Bomber", CLASS_FEATS, "xbg1scOIT7RI9Fij", "1"),
  infusedReagents: ability("Infused Reagents", CLASS_FEATURES, "wySB9VHOW1v3TX1L", "passive", "interaction"),
  smite: ability("Smite", CLASS_FEATS, "xgvKXeTxns0gIdAn", "1"),
  blessingOfTheDevoted: ability("Blessing of the Devoted", CLASS_FEATURES, "ERwuazupczhUSZ73", "passive", "defensive"),
  cause: ability("Cause", CLASS_FEATURES, "D4k8wuq1ncHFCBZz"),
  championsAura: ability("Champion's Aura", CLASS_FEATURES, "0x76o5OxgEmvqIDp", "passive", "defensive"),
  exaltedReaction: ability("Exalted Reaction", CLASS_FEATURES, "uptzvOLrZ3fctrl2", "reaction", "defensive"),
  divineFont: ability("Divine Font", CLASS_FEATURES, "gblTFUOgolqFS9v4", "passive", "interaction"),
  panache: ability("Panache", CLASS_FEATURES, "LzYi0OuOoypNb6jd"),
  preciseStrike: ability("Precise Strike", CLASS_FEATURES, "RQH6vigvhmiYKKjg"),
  confidentFinisher: ability("Confident Finisher", CLASS_FEATURES, "pyo0vmxUFIFX2GNl"),
  stylishCombatant: ability("Stylish Combatant", CLASS_FEATURES, "TALz3cU06Hb14Key", "passive", "interaction"),
  familiar: ability("Familiar", CLASS_FEATS, "bcxIg7wi8ZAhvhOD", "passive", "interaction")
};

const CHARISMA_SKILLS = ["deception", "diplomacy", "intimidation", "performance"];

function skills(tier, ...names) {
  return names.map((skill) => ({ skill, tier }));
}

function abilities(...keys) {
  return keys.map((key) => ABILITIES[key]);
}

export const ROLE_KITS = {
  magicalStriker: { spellcasting: { type: "innate" } },
  skirmisher: { speedBonus: 10 },
  soldier: { abilities: abilities("reactiveStrike") },
  spellcaster: { spellcasting: { type: "prepared" } },
  alchemist: { skills: skills("high", "crafting"), abilities: abilities("infusedReagents", "quickBomber") },
  barbarian: { skills: skills("high", "athletics"), abilities: abilities("rage", "ragingResistance") },
  bard: {
    skills: [...skills("moderate", "occultism"), ...skills("high", ...CHARISMA_SKILLS)],
    spellcasting: { tradition: "occult", type: "spontaneous" }
  },
  champion: {
    skills: skills("moderate", "religion"),
    abilities: abilities("blessingOfTheDevoted", "cause", "championsAura", "exaltedReaction", "shieldBlock", "smite")
  },
  clericCloistered: {
    skills: skills("high", "religion"),
    abilities: abilities("divineFont"),
    spellcasting: { tradition: "divine", type: "prepared" }
  },
  clericWarpriest: {
    skills: skills("moderate", "religion"),
    abilities: abilities("divineFont", "shieldBlock"),
    spellcasting: { tradition: "divine", type: "prepared" }
  },
  druid: {
    skills: skills("high", "nature"),
    abilities: abilities("shieldBlock"),
    spellcasting: { tradition: "primal", type: "prepared" }
  },
  fighter: { skills: skills("high", "athletics"), abilities: abilities("bravery", "reactiveStrike", "shieldBlock") },
  investigator: { skills: skills("high", "society"), abilities: abilities("deviseAStratagem") },
  monk: {
    skills: skills("high", "acrobatics", "athletics"),
    abilities: abilities("flurryOfBlows", "metalStrikes", "mysticStrikes", "perfectedForm")
  },
  oracle: { skills: skills("high", "religion"), spellcasting: { tradition: "divine", type: "spontaneous" } },
  ranger: {
    skills: [...skills("moderate", "nature"), ...skills("high", "survival")],
    abilities: abilities("huntPrey", "huntersEdge", "naturesEdge", "masterfulHunter", "swiftPrey")
  },
  rogue: {
    skills: skills("high", "stealth", "thievery"),
    abilities: abilities("sneakAttack", "surpriseAttack", "denyAdvantage", "debilitatingStrike", "masterStrike")
  },
  sorcerer: { spellcasting: { type: "spontaneous" } },
  swashbuckler: {
    skills: skills("high", "acrobatics"),
    abilities: abilities("panache", "confidentFinisher", "preciseStrike", "stylishCombatant")
  },
  witch: { abilities: abilities("familiar"), spellcasting: { type: "prepared" } },
  wizard: { skills: skills("high", "arcana"), spellcasting: { tradition: "arcane", type: "prepared" } }
};

export const SPELL_TAB = "spell";
export const CANTRIP_CATEGORY = "cantrip";
export const SPELL_CATEGORY = "spell";

export const DIALOG_ID = `${MODULE_ID}-creature-builder`;
export const DEFAULT_SECTION = "identity";
export const DEFAULT_EXTRA_DAMAGE_TYPE = "fire";
export const NAME_FIELD = '[data-bind="name"]';
export const TRAITS_PATH = "traits";

export const BUTTON_CLASS = "hbt-open-builder";
export const BESTIARY_BUTTON_SELECTOR = '[data-action="openCompendiumBrowser"]';
