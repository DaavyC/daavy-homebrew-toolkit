import { I18N_PREFIX, MODULE_ID } from "../../constants.js";
import { openInlineBuilderDialog } from "../inline-builder/inline-builder.js";
import {
  ABILITY_CATEGORIES,
  ABILITY_COSTS,
  ATTRIBUTES,
  BASE_ROLES,
  BROAD_RESISTANCES,
  CANTRIP_RANK,
  CLASS_ROLES,
  COMMON_RARITY,
  DEFAULT_ABILITY_CATEGORY,
  DEFAULT_ABILITY_COST,
  DEFAULT_ABILITY_NAME,
  DEFAULT_EXTRA_DAMAGE_TYPE,
  DEFAULT_RANGE_INCREMENT,
  DEFAULT_REACH,
  DEFAULT_RESISTANCE_TIER,
  DEFAULT_SECTION,
  DEFAULT_SPEED,
  DEFAULT_STRIKE_DAMAGE_TYPE,
  DEFAULT_STRIKE_NAME,
  DEFAULT_TIER,
  DIALOG_ID,
  EARLY_SPELL_EXTREME_LEVEL,
  EXTREME_ARMOR_CLASS_LAST_LEVEL,
  EXTREME_LIMITS,
  EXTREME_NEEDS_LOWS,
  EXTREME_STRENGTH_LAST_LEVEL,
  EXTREME_STRENGTH_SIZES,
  FLIGHT_LEVEL,
  LORE_SKILL,
  LORE_SUFFIX,
  MAX_HIGH_SKILLS,
  MAX_SUGGESTED_FIXES,
  MAXIMUM_SIZES,
  NAME_FIELD,
  NATIVE_GROUPS,
  RANGED_DAMAGE_FIRST_LEVEL,
  RANK,
  ROLE_KITS,
  SAVE_PRIORITY,
  SAVES,
  SECTIONS,
  SIZE_ORDER,
  SKILL_ATTRIBUTES,
  SKILL_HEAVY_ROLES,
  SPEED_TYPES,
  STATISTIC_TABLES,
  TRAIT_ABILITIES,
  TRAIT_ATTRIBUTE_RULES,
  TRAIT_NOTES,
  TRAITS_PATH,
  WEAKNESS_TIER
} from "./constants.js";
import {
  buildSpellItems,
  clampLevel,
  classifyValue,
  createId,
  format,
  getActionData,
  getAttributeLabel,
  getAvailableTiers,
  getCostGlyph,
  getDamageTypes,
  findNativeAbility,
  getNativeAbilities,
  getPreparationTypes,
  getRarities,
  getResistanceTypes,
  getRoleTier,
  getSaveLabel,
  getSenses,
  getSizes,
  getSkills,
  getSlotKey,
  getSpellLoadout,
  getSpellName,
  getSpells,
  getSpellSlots,
  getStrikeTier,
  getTableValue,
  getTraditions,
  getTraitCatalog,
  getTraitLabel,
  hasMeleePenalty,
  loadNativeAbilities,
  loadSpells,
  localize,
  localizeIfPresent,
  openSpellBrowser,
  resolveNativeAbilityItems,
  resolveSpellSources,
  resolveTier
} from "./utils.js";

function createRow(tier = DEFAULT_TIER) {
  return { tier, override: null };
}

export function createModel() {
  return {
    name: "",
    level: 1,
    size: "med",
    rarity: "common",
    traits: [],
    role: null,
    speed: DEFAULT_SPEED,
    otherSpeeds: [],
    senses: [],
    languages: [],
    immunities: [],
    grants: {},
    roleGrants: { skills: [], abilities: [], speed: null },
    statistics: Object.fromEntries(Object.keys(STATISTIC_TABLES).map((key) => [key, createRow()])),
    skills: [],
    resistances: [],
    strikes: [],
    abilities: [],
    spellcasting: null
  };
}

export function resolveRow(table, row, level) {
  const tier = resolveTier(table, row.tier, level);
  const custom = row.override !== null;
  return {
    tier,
    tiers: getAvailableTiers(table, level),
    custom,
    value: custom ? row.override : getTableValue(table, tier, level)
  };
}

function parseOverride(table, rawValue) {
  const text = String(rawValue ?? "").trim();
  if (!text) return null;
  if (table === "strikeDamage") return text;

  const number = Number(text);
  return Number.isFinite(number) ? Math.round(number) : null;
}

export function setRowOverride(model, table, row, rawValue) {
  const value = parseOverride(table, rawValue);
  const tableValue = getTableValue(table, resolveTier(table, row.tier, model.level), model.level);
  row.override = value === tableValue ? null : value;
}

export function selectTier(row, tier) {
  row.tier = tier;
  row.override = null;
}

export function adjustLevel(model, delta) {
  model.level = clampLevel(model.level + delta);
}

function applyStrikeTiers(strike, roleId) {
  strike.attack.tier = getStrikeTier(roleId, strike, "strikeAttack");
  strike.damage.tier = getStrikeTier(roleId, strike, "strikeDamage");
}

export function setStrikeRanged(strike, roleId, ranged) {
  strike.ranged = ranged;
  if (hasMeleePenalty(roleId)) applyStrikeTiers(strike, roleId);
}

function applySpellcastingTiers(spellcasting, roleId) {
  spellcasting.dc.tier = getRoleTier(roleId, "spellDifficultyClass");
  spellcasting.attack.tier = getRoleTier(roleId, "spellAttack");
}

export function applyRole(model, roleId) {
  model.role = roleId;
  for (const [key, row] of Object.entries(model.statistics)) row.tier = getRoleTier(roleId, key);
  for (const skill of model.skills) skill.value.tier = getRoleTier(roleId, "skill");
  for (const strike of model.strikes) applyStrikeTiers(strike, roleId);
  if (model.spellcasting) applySpellcastingTiers(model.spellcasting, roleId);
}

export function addSkill(model, skill) {
  const entry = { id: createId(), skill, lore: "", value: createRow(getRoleTier(model.role, "skill")) };
  model.skills.push(entry);
  return entry;
}

export function addResistance(model, kind, type, { tier = DEFAULT_RESISTANCE_TIER, exceptions = [] } = {}) {
  const entry = { id: createId(), kind, type, exceptions, value: createRow(tier) };
  model.resistances.push(entry);
  return entry;
}

export function addSense(model, type, range = null) {
  const entry = { id: createId(), type, range };
  model.senses.push(entry);
  return entry;
}

export function addOtherSpeed(model, type, value = model.speed) {
  const entry = { id: createId(), type, value };
  model.otherSpeeds.push(entry);
  return entry;
}

export function addStrike(model) {
  const strike = {
    id: createId(),
    name: "",
    ranged: false,
    attack: createRow(),
    damage: createRow(),
    damageType: DEFAULT_STRIKE_DAMAGE_TYPE,
    traits: [],
    reach: DEFAULT_REACH,
    increment: DEFAULT_RANGE_INCREMENT,
    extraDamage: []
  };
  applyStrikeTiers(strike, model.role);
  model.strikes.push(strike);
}

function pushAbility(model, { uuid = null, name = "", cost = DEFAULT_ABILITY_COST, category = DEFAULT_ABILITY_CATEGORY, traits = [] } = {}) {
  const entry = { id: createId(), uuid, name, cost, category, traits: [...traits], description: "" };
  model.abilities.push(entry);
  return entry;
}

export function addNativeAbility(model, ability) {
  if (model.abilities.some((entry) => entry.uuid === ability.uuid)) return null;
  return pushAbility(model, ability);
}

export function addCustomAbility(model) {
  return pushAbility(model);
}

export function addExtraDamage(strike, damageType) {
  strike.extraDamage.push({ id: createId(), formula: "", damageType });
}

export function enableSpellcasting(model) {
  model.spellcasting = { tradition: "arcane", type: "innate", spells: {}, dc: createRow(), attack: createRow() };
  applySpellcastingTiers(model.spellcasting, model.role);
}

export function setSpellTradition(spellcasting, tradition) {
  spellcasting.tradition = tradition;
  spellcasting.spells = {};
}

export function setSlotSpell(spellcasting, rank, index, uuid) {
  const key = getSlotKey(rank, index);
  if (uuid) spellcasting.spells[key] = uuid;
  else delete spellcasting.spells[key];
}

export function findUnusedValue(values, entries, key = "type") {
  const used = new Set(entries.map((entry) => entry[key]));
  return values.find((value) => !used.has(value));
}

function removeWhere(list, matches) {
  const index = list.findIndex(matches);
  if (index !== -1) list.splice(index, 1);
}

export function removeById(list, id) {
  removeWhere(list, (entry) => entry.id === id);
}

function removeValue(list, value) {
  removeWhere(list, (entry) => entry === value);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildDamageRolls(strike, level) {
  const rolls = [{ damage: resolveRow("strikeDamage", strike.damage, level).value, damageType: strike.damageType }];
  for (const extra of strike.extraDamage) {
    const formula = extra.formula.trim();
    if (formula) rolls.push({ damage: formula, damageType: extra.damageType });
  }
  return Object.fromEntries(rolls.map((roll) => [createId(), { ...roll, category: null }]));
}

function buildStrikeItem(strike, level) {
  const traits = [...strike.traits];
  if (!strike.ranged && strike.reach !== DEFAULT_REACH) traits.push(`reach-${strike.reach}`);

  return {
    type: "melee",
    name: strike.name.trim() || DEFAULT_STRIKE_NAME,
    system: {
      bonus: { value: resolveRow("strikeAttack", strike.attack, level).value },
      damageRolls: buildDamageRolls(strike, level),
      traits: { value: traits },
      range: strike.ranged ? { increment: strike.increment, max: null } : null
    }
  };
}

function buildSlotCounts(type, level) {
  return Object.fromEntries(getSpellSlots(type, level).map(({ rank, slots }) => [`slot${rank}`, { max: slots, value: slots }]));
}

function buildSpellcastingItem({ tradition, type, dc, attack }, level, entryId, prepared) {
  const slots = buildSlotCounts(type, level);
  return {
    _id: entryId,
    type: "spellcastingEntry",
    name: `${capitalize(tradition)} ${capitalize(type)} Spells`,
    system: {
      tradition: { value: tradition },
      prepared: { value: type, flexible: false },
      spelldc: {
        value: resolveRow("spellAttack", attack, level).value,
        dc: resolveRow("spellDifficultyClass", dc, level).value
      },
      slots: Object.fromEntries(Object.entries(slots).map(([key, slot]) => [key, { ...slot, ...prepared[key] }]))
    }
  };
}

function buildSpellcastingItems(spellcasting, level, sources) {
  const entryId = createId();
  const { items, prepared } = buildSpellItems(spellcasting, level, sources, entryId);
  const preparedSlots = spellcasting.type === "prepared" ? prepared : {};
  return [buildSpellcastingItem(spellcasting, level, entryId, preparedSlots), ...items];
}

function getLoreName(topic) {
  const name = topic.trim();
  if (!name) return "Lore";
  return LORE_SUFFIX.test(name) ? name : `${name} Lore`;
}

function buildLoreItem({ lore, value }, level) {
  return {
    type: "lore",
    name: getLoreName(lore),
    system: { mod: { value: resolveRow("skill", value, level).value } }
  };
}

function buildActorDamageModifiers(model, kind) {
  return model.resistances
    .filter((entry) => entry.kind === kind)
    .map(({ type, exceptions, value }) => ({
      type,
      value: resolveRow("resistance", value, model.level).value,
      ...(exceptions.length ? { exceptions } : {})
    }));
}

function buildAbilityItem({ name, cost, category, traits, description }) {
  const { actionType, actions } = getActionData(cost);
  return {
    type: "action",
    name: name.trim() || DEFAULT_ABILITY_NAME,
    system: {
      actionType: { value: actionType },
      actions: { value: actions },
      category,
      traits: { value: [...traits] },
      description: { value: description }
    }
  };
}

function buildSense({ type, range }) {
  return range ? { type, range } : { type };
}

export function buildActorSource(model, spellSources = new Map()) {
  const { level } = model;
  const statistic = (key) => resolveRow(STATISTIC_TABLES[key], model.statistics[key], level).value;
  const hitPoints = statistic("hitPoints");
  const standardSkills = model.skills.filter(({ skill }) => skill !== LORE_SKILL);

  return {
    name: model.name.trim(),
    type: "npc",
    system: {
      details: { level: { value: level }, languages: { value: [...model.languages] } },
      traits: { value: [...model.traits], rarity: model.rarity, size: { value: model.size } },
      abilities: Object.fromEntries(ATTRIBUTES.map((key) => [key, { mod: statistic(key) }])),
      perception: { mod: statistic("perception"), senses: model.senses.map(buildSense) },
      saves: Object.fromEntries(SAVES.map((key) => [key, { value: statistic(key) }])),
      attributes: {
        hp: { value: hitPoints, max: hitPoints },
        ac: { value: statistic("armorClass") },
        speed: { value: model.speed, otherSpeeds: model.otherSpeeds.map(({ type, value }) => ({ type, value })) },
        immunities: model.immunities.map((type) => ({ type })),
        resistances: buildActorDamageModifiers(model, "resistance"),
        weaknesses: buildActorDamageModifiers(model, "weakness")
      },
      skills: Object.fromEntries(standardSkills.map(({ skill, value }) => [skill, { base: resolveRow("skill", value, level).value }]))
    },
    items: [
      ...model.skills.filter(({ skill }) => skill === LORE_SKILL).map((entry) => buildLoreItem(entry, level)),
      ...model.strikes.map((strike) => buildStrikeItem(strike, level)),
      ...model.abilities.filter(({ uuid }) => !uuid).map(buildAbilityItem),
      ...(model.spellcasting ? buildSpellcastingItems(model.spellcasting, level, spellSources) : [])
    ]
  };
}

function labelOf(options, value) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function describeKey(key) {
  if (ATTRIBUTES.includes(key)) return getAttributeLabel(key);
  if (SAVES.includes(key)) return getSaveLabel(key);
  return localize(`Balance.Statistics.${key}`);
}

function describeStatistic({ key, skill, name }) {
  if (!key) return "";
  if (key === "skill") return name || labelOf(getSkills(), skill);
  return name ? `${describeKey(key)} (${name})` : describeKey(key);
}

function describeType({ entry, type }) {
  if (!type) return "";
  return entry === "speed" ? localize(`Speeds.${type}`) : labelOf(getResistanceTypes(entry), type);
}

function describeFix(fix) {
  const data = {
    statistic: describeStatistic(fix),
    tier: fix.tier ? localize(`Tiers.${fix.tier}`) : "",
    value: fix.value,
    size: fix.size ? labelOf(getSizes(), fix.size) : "",
    type: describeType(fix),
    trait: fix.trait ? getTraitLabel("creature", fix.trait) : "",
    immunity: fix.immunity ? getTraitLabel("immunity", fix.immunity) : ""
  };
  return format(`Balance.Fixes.${fix.kind}`, data);
}

function describeRequirement({ required, requiredKind }) {
  return requiredKind === "weakness" ? labelOf(getResistanceTypes("weakness"), required) : getTraitLabel(requiredKind, required);
}

function describeParams(params) {
  return {
    ...params,
    statistic: params.key ? describeStatistic(params) : "",
    required: params.required ? describeRequirement(params) : "",
    skill: params.skill ? params.name || labelOf(getSkills(), params.skill) : "",
    attribute: params.attribute ? getAttributeLabel(params.attribute) : "",
    trait: params.trait ? getTraitLabel("creature", params.trait) : "",
    size: params.size ? labelOf(getSizes(), params.size) : "",
    name: params.name || localize("Strikes.NamePlaceholder")
  };
}

function describeWarning({ id, rule, params, fixes }) {
  return {
    id,
    message: format(`Balance.Rules.${rule}`, describeParams(params)),
    fixes: fixes.map((fix, index) => ({ index, label: describeFix(fix) }))
  };
}

function grantSenses(model, senses) {
  return senses.filter(({ type }) => !model.senses.some((sense) => sense.type === type)).map(({ type, range }) => addSense(model, type, range ?? null).id);
}

function grantSpeeds(model, types) {
  return types.filter((type) => !model.otherSpeeds.some((speed) => speed.type === type)).map((type) => addOtherSpeed(model, type).id);
}

function grantDamageModifiers(model, kind, modifiers, tier) {
  return modifiers
    .filter(({ type }) => !model.resistances.some((entry) => entry.type === type))
    .map(({ type, exceptions }) => addResistance(model, kind, type, { tier, exceptions }).id);
}

function grantSlugs(list, slugs) {
  const added = slugs.filter((slug) => !list.includes(slug));
  list.push(...added);
  return added;
}

function grantLanguages(model, slugs) {
  const offered = new Set(getTraitCatalog("language").map(({ value }) => value));
  return grantSlugs(model.languages, slugs.filter((slug) => offered.has(slug)));
}

function applyAttributes(model, attributes = {}) {
  for (const [key, value] of Object.entries(attributes)) setRowOverride(model, "attribute", model.statistics[key], value);
}

function applyTiers(model, tiers = {}) {
  for (const [key, tier] of Object.entries(tiers)) model.statistics[key].tier = tier;
}

function applyMinimumSize(model, minimum) {
  if (minimum && SIZE_ORDER.indexOf(model.size) < SIZE_ORDER.indexOf(minimum)) model.size = minimum;
}

function grantTraitAbilities(model, ability) {
  applyAttributes(model, ability.attributes);
  applyTiers(model, ability.tiers);
  applyMinimumSize(model, ability.minimumSize);
  return {
    senses: grantSenses(model, ability.senses ?? []),
    speeds: grantSpeeds(model, ability.speeds ?? []),
    resistances: [
      ...grantDamageModifiers(model, "resistance", ability.resistances ?? []),
      ...grantDamageModifiers(model, "weakness", ability.weaknesses ?? [], WEAKNESS_TIER)
    ],
    languages: grantLanguages(model, ability.languages ?? []),
    immunities: grantSlugs(model.immunities, ability.immunities ?? [])
  };
}

function removeIds(list, ids) {
  for (const id of ids) removeById(list, id);
}

function removeSlugs(list, slugs) {
  for (const slug of slugs) removeValue(list, slug);
}

export function addTrait(model, slug) {
  if (model.traits.includes(slug)) return;
  model.traits.push(slug);

  const ability = TRAIT_ABILITIES[slug];
  if (!ability) return;
  model.grants[slug] = grantTraitAbilities(model, ability);
  for (const companion of ability.traits ?? []) addTrait(model, companion);
}

export function removeTrait(model, slug) {
  const index = model.traits.indexOf(slug);
  if (index === -1) return;
  model.traits.splice(index, 1);

  const grants = model.grants[slug];
  if (!grants) return;
  removeIds(model.senses, grants.senses);
  removeIds(model.otherSpeeds, grants.speeds);
  removeIds(model.resistances, grants.resistances);
  removeSlugs(model.languages, grants.languages);
  removeSlugs(model.immunities, grants.immunities);
  delete model.grants[slug];
}

function isGranted(model, id) {
  return Object.values(model.grants).some((grants) => grants.resistances.includes(id));
}

function rankOf(table, row, level) {
  const tier = row.override === null ? resolveTier(table, row.tier, level) : classifyValue(table, row.override, level);
  return RANK[tier];
}

function pickByLevel(steps, level) {
  return steps.find((step) => level >= step.level);
}

function buildStatisticEntry(level, key, table, row, extra = {}) {
  return { key, table, row, rank: rankOf(table, row, level), value: resolveRow(table, row, level).value, ...extra };
}

function inspectStrike(level, strike) {
  const name = strike.name.trim();
  return {
    strike,
    attack: buildStatisticEntry(level, "strikeAttack", "strikeAttack", strike.attack, { name }),
    damage: buildStatisticEntry(level, "strikeDamage", "strikeDamage", strike.damage, { name })
  };
}

function inspectSkill(level, entry) {
  const name = entry.skill === LORE_SKILL ? getLoreName(entry.lore) : "";
  return buildStatisticEntry(level, "skill", "skill", entry.value, { skill: entry.skill, name });
}

function inspect(model) {
  const { level } = model;
  const statistic = (key) => buildStatisticEntry(level, key, STATISTIC_TABLES[key], model.statistics[key]);
  const { spellcasting } = model;
  return {
    level,
    perception: statistic("perception"),
    armorClass: statistic("armorClass"),
    hitPoints: statistic("hitPoints"),
    saves: SAVES.map(statistic),
    attributes: Object.fromEntries(ATTRIBUTES.map((key) => [key, statistic(key)])),
    strikes: model.strikes.map((strike) => inspectStrike(level, strike)),
    skills: model.skills.map((entry) => inspectSkill(level, entry)),
    spell: spellcasting && {
      dc: buildStatisticEntry(level, "spellDifficultyClass", "spellDifficultyClass", spellcasting.dc),
      attack: buildStatisticEntry(level, "spellAttack", "spellAttack", spellcasting.attack)
    }
  };
}

function setTier(item, tier) {
  return {
    kind: "tier",
    key: item.key,
    skill: item.skill,
    name: item.name,
    tier,
    apply() {
      item.row.tier = tier;
      item.row.override = null;
    }
  };
}

function warning(rule, params = {}, fixes = [], id = rule) {
  return { id, rule, params, fixes: fixes.slice(0, MAX_SUGGESTED_FIXES) };
}

function getCoreStatistics(facts) {
  return [facts.perception, facts.armorClass, ...facts.saves, facts.hitPoints];
}

function getOffenseRank(facts) {
  const ranks = facts.strikes.flatMap(({ attack, damage }) => [attack.rank, damage.rank]);
  return ranks.length ? [Math.max(...ranks)] : [];
}

function getFocusRanks(facts) {
  return [...getCoreStatistics(facts).map(({ rank }) => rank), ...getOffenseRank(facts), ...(facts.spell ? [facts.spell.dc.rank] : [])];
}

function getExtremes(facts) {
  const firstExtreme = (items) => items.find(({ rank }) => rank === RANK.extreme);
  const extremeSpell = facts.spell ? firstExtreme([facts.spell.dc, facts.spell.attack]) : undefined;
  return [
    ...getCoreStatistics(facts).filter(({ rank }) => rank === RANK.extreme),
    firstExtreme(facts.strikes.map(({ attack }) => attack)),
    firstExtreme(facts.strikes.map(({ damage }) => damage)),
    extremeSpell,
    ...facts.skills.filter(({ rank }) => rank === RANK.extreme)
  ].filter(Boolean);
}

function getMainStatistics(facts) {
  const spell = facts.spell ? [facts.spell.dc, facts.spell.attack] : [];
  return [...getCoreStatistics(facts), ...facts.strikes.flatMap(({ attack, damage }) => [attack, damage]), ...spell];
}

function getDefenses(facts) {
  return [facts.armorClass, ...facts.saves];
}

function getLoweringFixes(facts) {
  const candidates = SAVE_PRIORITY.map((key) => (key === "perception" ? facts.perception : facts.saves.find((save) => save.key === key)));
  return candidates.filter(({ rank }) => rank >= RANK.moderate && rank < RANK.extreme).map((item) => setTier(item, "low"));
}

function lacksWeakness(facts) {
  const ranks = getFocusRanks(facts);
  const strong = ranks.filter((rank) => rank >= RANK.high).length;
  return (ranks.includes(RANK.extreme) || strong >= 4) && !ranks.some((rank) => rank <= RANK.low);
}

function checkNeedsWeakness(model, facts) {
  return lacksWeakness(facts) ? [warning("needsWeakness", {}, getLoweringFixes(facts))] : [];
}

function checkNoLowStatistic(model, facts) {
  const ranks = getMainStatistics(facts).map(({ rank }) => rank);
  if (Math.max(...ranks) !== RANK.high || ranks.some((rank) => rank <= RANK.low) || lacksWeakness(facts)) return [];
  return [warning("noLowStatistic", {}, getLoweringFixes(facts))];
}

function checkNoHighStatistic(model, facts) {
  const statistics = getMainStatistics(facts);
  if (statistics.some(({ rank }) => rank >= RANK.high) || !statistics.some(({ rank }) => rank <= RANK.low)) return [];
  const clashesWithWisdom = ({ key }) => key === "perception" && facts.attributes.wis.rank <= RANK.low;
  const candidates = statistics.filter((item) => item.rank === RANK.moderate && !clashesWithWisdom(item));
  return [warning("noHighStatistic", {}, candidates.map((item) => setTier(item, "high")))];
}

function checkExtremeWithoutLow(model, facts) {
  const { firstLevel, lastLevel, count } = EXTREME_NEEDS_LOWS;
  if (facts.level < firstLevel || facts.level > lastLevel || lacksWeakness(facts)) return [];
  const ranks = getMainStatistics(facts).map(({ rank }) => rank);
  const lows = ranks.filter((rank) => rank <= RANK.low).length;
  if (!ranks.includes(RANK.extreme) || ranks.includes(RANK.terrible) || lows >= count) return [];
  return [warning("extremeWithoutLow", { level: facts.level, count }, getLoweringFixes(facts))];
}

function checkHighDefenses(model, facts) {
  const defenses = getDefenses(facts);
  const high = defenses.filter(({ rank }) => rank >= RANK.high);
  const lowered = high.filter(({ key }) => key !== "armorClass").map((item) => setTier(item, "moderate"));
  if (high.length === defenses.length) return [warning("allHighDefenses", {}, lowered)];
  const hasLow = defenses.some(({ rank }) => rank <= RANK.low);
  return high.length === defenses.length - 1 && !hasLow ? [warning("manyHighDefenses", { count: high.length }, lowered)] : [];
}

function checkEarlyExtremeArmorClass(model, facts) {
  if (facts.level > EXTREME_ARMOR_CLASS_LAST_LEVEL || facts.armorClass.rank < RANK.extreme) return [];
  return [warning("earlyExtremeArmorClass", { level: facts.level }, [setTier(facts.armorClass, "high")])];
}

function getScaleCandidates(facts) {
  return [
    ...[facts.perception, facts.armorClass, ...facts.saves].map((item) => ({ item, id: item.key })),
    ...facts.strikes.map(({ strike, attack }) => ({ item: attack, id: `strikeAttack:${strike.id}` }))
  ];
}

function getScaleEdges({ table }, level) {
  const tiers = getAvailableTiers(table, level);
  const values = tiers.map((tier) => getTableValue(table, tier, level));
  const last = values.length - 1;
  return {
    top: { tier: tiers[0], limit: 2 * values[0] - values[1] },
    bottom: { tier: tiers[last], limit: 2 * values[last] - values[last - 1] }
  };
}

function isExpectedLowDefense(model, { key }) {
  return model.traits.includes("ooze") && (key === "armorClass" || key === "reflex");
}

function checkScaleLimits(model, facts) {
  return getScaleCandidates(facts).flatMap(({ item, id }) => {
    const { top, bottom } = getScaleEdges(item, facts.level);
    const params = { key: item.key, name: item.name, level: facts.level };
    if (item.value >= top.limit) return [warning("aboveScale", params, [setTier(item, top.tier)], `aboveScale:${id}`)];
    if (item.value > bottom.limit || isExpectedLowDefense(model, item)) return [];
    return [warning("belowScale", params, [setTier(item, bottom.tier)], `belowScale:${id}`)];
  });
}

function checkTooManyExtremes(model, facts) {
  const extremes = getExtremes(facts);
  const allowed = pickByLevel(EXTREME_LIMITS, facts.level).count;
  if (extremes.length <= allowed) return [];
  return [warning("tooManyExtremes", { count: extremes.length, allowed, level: facts.level }, extremes.slice(allowed).map((item) => setTier(item, "high")))];
}

function checkExtremeArmorClass(model, facts) {
  const { armorClass, hitPoints } = facts;
  if (armorClass.rank < RANK.extreme || hitPoints.rank < RANK.high) return [];
  return [warning("extremeArmorClassHitPoints", {}, [setTier(hitPoints, "moderate"), setTier(armorClass, "high")])];
}

function checkExtremeSaves(model, facts) {
  const extreme = facts.saves.filter(({ rank }) => rank === RANK.extreme);
  if (extreme.length < 2) return [];
  return [warning("multipleExtremeSaves", { count: extreme.length }, extreme.slice(1).map((item) => setTier(item, "high")))];
}

function checkLinkedExtremeStrikes(model, facts) {
  return facts.strikes
    .filter(({ attack, damage }) => Math.max(attack.rank, damage.rank) === RANK.extreme && Math.min(attack.rank, damage.rank) >= RANK.high)
    .map(({ strike, attack, damage }) => {
      const extremes = [damage, attack].filter(({ rank }) => rank === RANK.extreme).map((item) => setTier(item, "high"));
      return warning("linkedExtremeStrike", { name: strike.name.trim() }, extremes, `linkedExtremeStrike:${strike.id}`);
    });
}

function checkRangedStrikes(model, facts) {
  if (facts.level < RANGED_DAMAGE_FIRST_LEVEL) return [];
  return facts.strikes
    .filter(({ strike, damage }) => strike.ranged && damage.rank === RANK.extreme)
    .map(({ strike, damage }) => warning("rangedStrikeDamage", { name: strike.name.trim() }, [setTier(damage, "high")], `rangedStrikeDamage:${strike.id}`));
}

function checkAgileStrikes(model, facts) {
  return facts.strikes
    .filter(({ strike, damage }) => strike.traits.includes("agile") && damage.rank >= RANK.high)
    .map(({ strike, damage }) => warning("agileStrikeDamage", { name: strike.name.trim() }, [setTier(damage, "moderate")], `agileStrikeDamage:${strike.id}`));
}

function checkEarlyExtremeSpells(model, facts) {
  if (!facts.spell || facts.level >= EARLY_SPELL_EXTREME_LEVEL) return [];
  const extreme = [facts.spell.dc, facts.spell.attack].filter(({ rank }) => rank === RANK.extreme);
  const fragile = facts.armorClass.rank <= RANK.low && facts.hitPoints.rank <= RANK.low;
  if (!extreme.length || fragile) return [];
  return [warning("earlyExtremeSpells", { level: facts.level }, extreme.map((item) => setTier(item, "high")))];
}

function checkPerception(model, facts) {
  const { wis } = facts.attributes;
  if (wis.rank > RANK.low || facts.perception.rank < RANK.high) return [];
  return [warning("perceptionWisdom", {}, [setTier(facts.perception, "moderate"), setTier(wis, "moderate")])];
}

function isAttributeCapped(model, key) {
  return TRAIT_ATTRIBUTE_RULES.some((rule) => rule.attribute === key && rule.max !== undefined && model.traits.includes(rule.trait));
}

function checkSkillAttributes(model, facts) {
  return model.skills.flatMap((entry, index) => {
    const skill = facts.skills[index];
    const attribute = facts.attributes[SKILL_ATTRIBUTES[entry.skill]];
    if (skill.rank < RANK.high || attribute.rank > RANK.low) return [];
    const fixes = [...(isAttributeCapped(model, attribute.key) ? [] : [setTier(attribute, "moderate")]), setTier(skill, "moderate")];
    return [warning("skillAttribute", { skill: entry.skill, name: skill.name, attribute: attribute.key }, fixes, `skillAttribute:${entry.id}`)];
  });
}

function checkHighSkills(model, facts) {
  if (SKILL_HEAVY_ROLES.has(model.role)) return [];
  const high = facts.skills.filter(({ rank }) => rank >= RANK.high);
  if (high.length <= MAX_HIGH_SKILLS) return [];
  return [warning("tooManyHighSkills", { count: high.length }, high.slice(MAX_HIGH_SKILLS).map((item) => setTier(item, "moderate")))];
}

function removeFix(model, entry) {
  return { kind: "remove", entry: entry.kind, type: entry.type, apply: () => removeById(model.resistances, entry.id) };
}

function checkWeaknesses(model, facts) {
  const weaknesses = model.resistances.filter(({ kind }) => kind === "weakness");
  const own = weaknesses.filter(({ id }) => !isGranted(model, id));
  const warnings = [];
  if (own.length > 1) warnings.push(warning("tooManyWeaknesses", { count: own.length }, own.slice(1).map((entry) => removeFix(model, entry))));
  if (weaknesses.length && facts.hitPoints.rank <= RANK.low) warnings.push(warning("weaknessHitPoints", {}, [setTier(facts.hitPoints, "moderate")]));
  return warnings;
}

function checkBroadResistances(model, facts) {
  const broad = model.resistances.some(({ kind, type }) => kind === "resistance" && BROAD_RESISTANCES.includes(type));
  if (!broad || facts.hitPoints.rank < RANK.high) return [];
  return [warning("broadResistanceHitPoints", {}, [setTier(facts.hitPoints, "moderate")])];
}

function checkSizeForLevel(model, facts) {
  const { size } = pickByLevel(MAXIMUM_SIZES, facts.level);
  if (SIZE_ORDER.indexOf(model.size) <= SIZE_ORDER.indexOf(size)) return [];
  return [warning("sizeForLevel", { size: model.size, level: facts.level }, [{ kind: "size", size, apply: () => (model.size = size) }])];
}

function checkExtremeStrength(model, facts) {
  const required = pickByLevel(EXTREME_STRENGTH_SIZES, facts.level);
  const { str } = facts.attributes;
  if (!required || facts.level > EXTREME_STRENGTH_LAST_LEVEL || str.rank < RANK.extreme) return [];
  if (SIZE_ORDER.indexOf(model.size) >= SIZE_ORDER.indexOf(required.size)) return [];
  return [warning("extremeStrengthSize", { size: required.size, level: facts.level }, [setTier(str, "high")])];
}

function checkFlyingStrikers(model, facts) {
  const flying = model.otherSpeeds.filter(({ type }) => type === "fly");
  if (facts.level >= FLIGHT_LEVEL || !flying.length || !model.strikes.some(({ ranged }) => ranged)) return [];
  const remove = { kind: "remove", entry: "speed", type: "fly", apply: () => removeById(model.otherSpeeds, flying[0].id) };
  return [warning("flyingStrikers", { level: facts.level }, [remove])];
}

function violatesAttributeRule({ attribute, min, max }, facts) {
  const { value } = facts.attributes[attribute];
  return (max !== undefined && value > max) || (min !== undefined && value < min);
}

function checkTraitAttributes(model, facts) {
  return TRAIT_ATTRIBUTE_RULES.filter((rule) => model.traits.includes(rule.trait) && violatesAttributeRule(rule, facts)).map(({ trait, attribute, fix }) => {
    const { row } = facts.attributes[attribute];
    const apply = () => setRowOverride(model, "attribute", row, fix);
    return warning("traitAttribute", { trait, attribute }, [{ kind: "value", key: attribute, value: fix, apply }], `traitAttribute:${trait}`);
  });
}

function checkOozeArmorClass(model, facts) {
  if (!model.traits.includes("ooze") || facts.armorClass.rank <= RANK.low) return [];
  return [warning("oozeArmorClass", {}, [setTier(facts.armorClass, "low")])];
}

function checkSwarmHitPoints(model, facts) {
  if (!model.traits.includes("swarm") || facts.hitPoints.rank < RANK.high) return [];
  return [warning("swarmHitPoints", {}, [setTier(facts.hitPoints, "low")])];
}

function findMissingRequirements(model, listRequired, isPresent) {
  const missing = new Map();
  for (const trait of model.traits) {
    for (const required of listRequired(trait)) {
      if (!isPresent(required) && !missing.has(required)) missing.set(required, trait);
    }
  }
  return missing;
}

function hasWeaknessTo(model, type) {
  return model.resistances.some((entry) => (entry.kind === "weakness" && entry.type === type) || (entry.kind === "resistance" && entry.exceptions.includes(type)));
}

function hasProtectionFrom(model, type) {
  return model.immunities.includes(type) || model.resistances.some((entry) => entry.kind === "resistance" && entry.type === type);
}

function checkCompanionTraits(model) {
  const missing = findMissingRequirements(model, (trait) => TRAIT_ABILITIES[trait]?.traits ?? [], (slug) => model.traits.includes(slug));
  return [...missing].map(([required, trait]) => {
    const fix = { kind: "addTrait", trait: required, apply: () => addTrait(model, required) };
    return warning("missingTrait", { trait, required, requiredKind: "creature" }, [fix], `missingTrait:${required}`);
  });
}

function checkTraitWeaknesses(model) {
  const listWeaknesses = (trait) => (TRAIT_ABILITIES[trait]?.weaknesses ?? []).map(({ type }) => type);
  const missing = findMissingRequirements(model, listWeaknesses, (type) => hasWeaknessTo(model, type));
  return [...missing].map(([type, trait]) => {
    const apply = () => {
      removeIds(model.resistances, model.resistances.filter((entry) => entry.type === type).map(({ id }) => id));
      model.grants[trait]?.resistances.push(addResistance(model, "weakness", type, { tier: WEAKNESS_TIER }).id);
    };
    const fix = { kind: "addWeakness", entry: "weakness", type, apply };
    return warning("missingWeakness", { trait, required: type, requiredKind: "weakness" }, [fix], `missingWeakness:${type}`);
  });
}

function checkTraitProtections(model) {
  const missing = findMissingRequirements(model, (trait) => TRAIT_ABILITIES[trait]?.immunities ?? [], (type) => hasProtectionFrom(model, type));
  return [...missing].map(([type, trait]) => {
    const apply = () => {
      model.immunities.push(type);
      model.grants[trait]?.immunities.push(type);
    };
    return warning("missingProtection", { trait, required: type, requiredKind: "immunity" }, [{ kind: "addImmunity", immunity: type, apply }], `missingProtection:${type}`);
  });
}

const CHECKS = [
  checkNeedsWeakness,
  checkNoLowStatistic,
  checkNoHighStatistic,
  checkExtremeWithoutLow,
  checkHighDefenses,
  checkEarlyExtremeArmorClass,
  checkScaleLimits,
  checkTooManyExtremes,
  checkExtremeArmorClass,
  checkExtremeSaves,
  checkLinkedExtremeStrikes,
  checkRangedStrikes,
  checkAgileStrikes,
  checkEarlyExtremeSpells,
  checkPerception,
  checkSkillAttributes,
  checkHighSkills,
  checkWeaknesses,
  checkBroadResistances,
  checkSizeForLevel,
  checkExtremeStrength,
  checkFlyingStrikers,
  checkTraitAttributes,
  checkOozeArmorClass,
  checkSwarmHitPoints,
  checkCompanionTraits,
  checkTraitWeaknesses,
  checkTraitProtections
];

export function evaluateBalance(model) {
  const facts = inspect(model);
  return CHECKS.flatMap((check) => check(model, facts));
}

function signed(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function figure(table, row, level, format = String) {
  const { value, custom } = resolveRow(table, row, level);
  return { text: format(value), custom };
}

function buildStatistic(model, key, format) {
  return figure(STATISTIC_TABLES[key], model.statistics[key], model.level, format);
}

function buildHeaderTags(model) {
  const rarity = model.rarity === COMMON_RARITY ? [] : [{ label: labelOf(getRarities(), model.rarity), rarity: model.rarity }];
  return [
    ...rarity,
    { label: labelOf(getSizes(), model.size) },
    ...model.traits.map((slug) => ({ label: getTraitLabel("creature", slug) }))
  ];
}

function buildSkillSummaries(model) {
  const skills = getSkills();
  return model.skills.map((entry) => ({
    label: entry.skill === LORE_SKILL ? getLoreName(entry.lore) : labelOf(skills, entry.skill),
    figure: figure("skill", entry.value, model.level, signed)
  }));
}

function buildModifierSummaries(model, kind) {
  const types = getResistanceTypes(kind);
  return model.resistances
    .filter((entry) => entry.kind === kind)
    .map((entry) => ({
      label: labelOf(types, entry.type).toLowerCase(),
      figure: figure("resistance", entry.value, model.level),
      exceptions: entry.exceptions.map((type) => labelOf(types, type).toLowerCase()).join(", ")
    }));
}

function buildSenseSummaries(model) {
  const senses = getSenses();
  return model.senses.map(({ type, range }) => {
    const label = labelOf(senses, type).toLowerCase();
    return range ? `${label} ${range} ft` : label;
  });
}

function buildLanguages(model) {
  return model.languages.map((slug) => getTraitLabel("language", slug));
}

function buildImmunities(model) {
  return model.immunities.map((slug) => getTraitLabel("immunity", slug).toLowerCase());
}

function buildSpeeds(model) {
  const others = model.otherSpeeds.map(({ type, value }) => `${localize(`Speeds.${type}`)} ${value} ft`);
  return [`${model.speed} ft`, ...others].join(", ");
}

function buildStrikeTraits(strike) {
  const traits = strike.traits.map((slug) => getTraitLabel("strike", slug).toLowerCase());
  if (strike.ranged) traits.push(`${localize("Preview.RangeIncrement")} ${strike.increment} ft`);
  else if (strike.reach !== DEFAULT_REACH) traits.push(`${localize("Preview.Reach")} ${strike.reach} ft`);
  return traits.join(", ");
}

function buildStrike(strike, level) {
  const damageTypes = getDamageTypes();
  const extraDamage = strike.extraDamage
    .filter((line) => line.formula.trim())
    .map((line) => `${line.formula.trim()} ${labelOf(damageTypes, line.damageType).toLowerCase()}`);

  return {
    kind: localize(strike.ranged ? "Preview.Ranged" : "Preview.Melee"),
    name: (strike.name.trim() || localize("Strikes.NamePlaceholder")).toLowerCase(),
    bonus: figure("strikeAttack", strike.attack, level, signed),
    traits: buildStrikeTraits(strike),
    damage: figure("strikeDamage", strike.damage, level),
    damageType: labelOf(damageTypes, strike.damageType).toLowerCase(),
    extraDamage
  };
}

function buildAbility({ name, cost, traits, description }) {
  return {
    name: name.trim() || localize("Abilities.NamePlaceholder"),
    glyph: getCostGlyph(cost),
    traits: traits.map((slug) => getTraitLabel("ability", slug).toLowerCase()).join(", "),
    description
  };
}

function getRankLabel(rank) {
  return rank === CANTRIP_RANK ? localize("Spells.Cantrips") : format("Spells.Rank", { rank });
}

function buildSlotSummaries(spellcasting, level) {
  return getSpellLoadout(spellcasting, level).map(({ rank, spells }) => ({
    label: getRankLabel(rank),
    text: spells.map((uuid) => (uuid ? getSpellName(uuid) : localize("Spells.EmptySlot"))).join(", ")
  }));
}

function buildSpellcastingSummary(model) {
  const { spellcasting } = model;
  if (!spellcasting) return null;
  const tradition = labelOf(getTraditions(), spellcasting.tradition);
  const type = labelOf(getPreparationTypes(), spellcasting.type);
  return {
    name: `${tradition} ${type} ${localize("Preview.Spells")}`,
    slots: buildSlotSummaries(spellcasting, model.level),
    difficultyClass: figure("spellDifficultyClass", spellcasting.dc, model.level),
    attack: figure("spellAttack", spellcasting.attack, model.level, signed)
  };
}

export function buildPreview(model) {
  const name = model.name.trim();
  return {
    title: name || localize("Preview.Unnamed"),
    hasName: Boolean(name),
    levelLabel: `${localize("Preview.Creature")} ${model.level}`,
    tags: buildHeaderTags(model),
    perception: buildStatistic(model, "perception", signed),
    senses: buildSenseSummaries(model).join(", "),
    languages: buildLanguages(model).join(", "),
    skills: buildSkillSummaries(model),
    attributes: ATTRIBUTES.map((key) => ({ label: localize(`Preview.Attributes.${key}`), figure: buildStatistic(model, key, signed) })),
    armorClass: buildStatistic(model, "armorClass"),
    saves: SAVES.map((key) => ({ label: localize(`Preview.Saves.${key}`), figure: buildStatistic(model, key, signed) })),
    hitPoints: buildStatistic(model, "hitPoints"),
    immunities: buildImmunities(model).join(", "),
    speeds: buildSpeeds(model),
    resistances: buildModifierSummaries(model, "resistance"),
    weaknesses: buildModifierSummaries(model, "weakness"),
    strikes: model.strikes.map((strike) => buildStrike(strike, model.level)),
    abilities: model.abilities.map(buildAbility),
    spellcasting: buildSpellcastingSummary(model)
  };
}

function withSelected(options, selected) {
  return options.map((option) => ({ ...option, selected: option.value === selected }));
}

function availableOptions(options, entries, entry, key = "type") {
  const taken = new Set(entries.filter((other) => other !== entry).map((other) => other[key]));
  return options.filter(({ value }) => !taken.has(value));
}

function hasUnused(options, entries) {
  return findUnusedValue(options.map(({ value }) => value), entries) !== undefined;
}

function buildRow(model, { path, table, label, inputType = "number" }) {
  const resolved = resolveRow(table, foundry.utils.getProperty(model, path), model.level);
  return {
    path,
    table,
    label,
    inputType,
    value: resolved.value,
    custom: resolved.custom,
    tiers: resolved.tiers.map((tier) => ({
      value: tier,
      label: localize(`Tiers.${tier}`),
      active: !resolved.custom && tier === resolved.tier
    }))
  };
}

function buildTagPicker(kind, path, slugs) {
  return {
    kind,
    path,
    chips: slugs.map((slug) => ({ value: slug, label: getTraitLabel(kind, slug) })),
    options: getTraitCatalog(kind).filter(({ value }) => !slugs.includes(value))
  };
}

function buildRoleGroup(model, group, roles) {
  const options = Object.keys(roles).map((value) => ({ value, label: localize(`Roles.${value}`) }));
  return { label: localize(`Roles.Groups.${group}`), options: withSelected(options, model.role) };
}

function buildRoles(model) {
  return {
    none: { value: "", label: localize("Roles.None"), selected: model.role === null },
    groups: [buildRoleGroup(model, "base", BASE_ROLES), buildRoleGroup(model, "class", CLASS_ROLES)]
  };
}

function buildTraitNotes(model) {
  return model.traits
    .filter((slug) => TRAIT_NOTES.has(slug))
    .map((slug) => ({ label: getTraitLabel("creature", slug), text: localize(`TraitNotes.${slug}`) }));
}

function getSpeedOptions() {
  return SPEED_TYPES.map((value) => ({ value, label: localize(`Speeds.${value}`) }));
}

function buildOtherSpeeds(model) {
  const options = getSpeedOptions();
  return model.otherSpeeds.map((entry, index) => ({
    id: entry.id,
    path: `otherSpeeds.${index}`,
    value: entry.value,
    types: withSelected(availableOptions(options, model.otherSpeeds, entry), entry.type)
  }));
}

function buildIdentity(model) {
  return {
    name: model.name,
    level: model.level,
    sizes: withSelected(getSizes(), model.size),
    rarities: withSelected(getRarities(), model.rarity),
    roles: buildRoles(model),
    roleHint: model.role ? localizeIfPresent(`Roadmaps.${model.role}`) : "",
    traits: buildTagPicker("creature", "traits", model.traits),
    traitNotes: buildTraitNotes(model),
    speed: model.speed,
    otherSpeeds: buildOtherSpeeds(model),
    canAddSpeed: hasUnused(getSpeedOptions(), model.otherSpeeds),
    languages: buildTagPicker("language", "languages", model.languages)
  };
}

function buildSkillRows(model) {
  const standardSkills = getSkills();
  return model.skills.map((entry, index) => {
    const options = [
      ...availableOptions(standardSkills, model.skills, entry, "skill"),
      { value: LORE_SKILL, label: localize("Skills.Lore") }
    ];
    const path = `skills.${index}`;
    return {
      id: entry.id,
      path,
      lore: entry.lore,
      isLore: entry.skill === LORE_SKILL,
      options: withSelected(options, entry.skill),
      row: buildRow(model, { path: `${path}.value`, table: "skill" })
    };
  });
}

function buildSenseRows(model) {
  return model.senses.map((entry, index) => ({
    id: entry.id,
    path: `senses.${index}`,
    range: entry.range ?? "",
    types: withSelected(availableOptions(getSenses(), model.senses, entry), entry.type)
  }));
}

function buildAttributes(model) {
  return {
    attributes: ATTRIBUTES.map((key) => buildRow(model, { path: `statistics.${key}`, table: "attribute", label: getAttributeLabel(key) })),
    perception: buildRow(model, { path: "statistics.perception", table: "perception", label: localize("Stats.Perception") }),
    senses: buildSenseRows(model),
    canAddSense: hasUnused(getSenses(), model.senses),
    skills: buildSkillRows(model)
  };
}

function buildResistances(model) {
  return model.resistances.map((entry, index) => {
    const path = `resistances.${index}`;
    return {
      id: entry.id,
      path,
      kindLabel: localize(`Resistances.${entry.kind}`),
      exceptions: entry.exceptions.map((type) => getResistanceTypes(entry.kind).find(({ value }) => value === type)?.label ?? type).join(", "),
      types: withSelected(availableOptions(getResistanceTypes(entry.kind), model.resistances, entry), entry.type),
      row: buildRow(model, { path: `${path}.value`, table: "resistance" })
    };
  });
}

function buildDefenses(model) {
  return {
    armorClass: buildRow(model, { path: "statistics.armorClass", table: "armorClass", label: localize("Stats.ArmorClass") }),
    saves: SAVES.map((key) => buildRow(model, { path: `statistics.${key}`, table: "save", label: getSaveLabel(key) })),
    hitPoints: buildRow(model, { path: "statistics.hitPoints", table: "hitPoints", label: localize("Stats.HitPoints") }),
    resistances: buildResistances(model),
    canAdd: {
      resistance: hasUnused(getResistanceTypes("resistance"), model.resistances),
      weakness: hasUnused(getResistanceTypes("weakness"), model.resistances)
    },
    immunities: buildTagPicker("immunity", "immunities", model.immunities)
  };
}

function buildExtraDamage(strike, path) {
  return strike.extraDamage.map((line, index) => ({
    id: line.id,
    path: `${path}.extraDamage.${index}`,
    formula: line.formula,
    types: withSelected(getDamageTypes(), line.damageType)
  }));
}

function buildStrikes(model) {
  return {
    list: model.strikes.map((strike, index) => {
      const path = `strikes.${index}`;
      return {
        id: strike.id,
        path,
        name: strike.name,
        ranged: strike.ranged,
        reach: strike.reach,
        increment: strike.increment,
        damageTypes: withSelected(getDamageTypes(), strike.damageType),
        attack: buildRow(model, { path: `${path}.attack`, table: "strikeAttack" }),
        damage: buildRow(model, { path: `${path}.damage`, table: "strikeDamage", inputType: "text" }),
        traits: buildTagPicker("strike", `${path}.traits`, strike.traits),
        extraDamage: buildExtraDamage(strike, path)
      };
    })
  };
}

function buildNativeGroups(model) {
  const used = new Set(model.abilities.map(({ uuid }) => uuid));
  const available = getNativeAbilities().filter(({ uuid }) => !used.has(uuid));
  return NATIVE_GROUPS.map(({ id, costs }) => ({
    label: localize(`Abilities.Groups.${id}`),
    options: available.filter(({ cost }) => costs.includes(cost)).map(({ uuid, name }) => ({ value: uuid, label: name }))
  })).filter(({ options }) => options.length);
}

function buildAbilityList(model) {
  const costs = ABILITY_COSTS.map((value) => ({ value, label: localize(`Abilities.Costs.${value}`), glyph: getCostGlyph(value) }));
  const categories = ABILITY_CATEGORIES.map((value) => ({ value, label: localize(`Abilities.Categories.${value}`) }));
  return model.abilities.map((entry, index) => {
    const path = `abilities.${index}`;
    return {
      id: entry.id,
      path,
      native: Boolean(entry.uuid),
      name: entry.name,
      glyph: getCostGlyph(entry.cost),
      costLabel: localize(`Abilities.Costs.${entry.cost}`),
      categoryLabel: localize(`Abilities.Categories.${entry.category}`),
      costs: withSelected(costs, entry.cost),
      categories: withSelected(categories, entry.category),
      traits: buildTagPicker("ability", `${path}.traits`, entry.traits),
      description: entry.description
    };
  });
}

function buildAbilities(model) {
  return {
    nativeGroups: buildNativeGroups(model),
    list: buildAbilityList(model)
  };
}

function buildSlotPickers(spellcasting, level) {
  return getSpellLoadout(spellcasting, level).map(({ rank, spells }) => ({
    rank,
    label: getRankLabel(rank),
    slots: spells.map((uuid, index) => ({ index, name: uuid && getSpellName(uuid) }))
  }));
}

function buildSpellcastingSection(model) {
  const { spellcasting } = model;
  if (!spellcasting) return null;
  return {
    traditions: withSelected(getTraditions(), spellcasting.tradition),
    types: withSelected(getPreparationTypes(), spellcasting.type),
    slots: buildSlotPickers(spellcasting, model.level),
    difficultyClass: buildRow(model, { path: "spellcasting.dc", table: "spellDifficultyClass", label: localize("Stats.SpellDC") }),
    attack: buildRow(model, { path: "spellcasting.attack", table: "spellAttack", label: localize("Stats.SpellAttack") })
  };
}

function buildContext(model, section) {
  return {
    section,
    sections: SECTIONS.map(({ id, icon }) => ({ id, icon, label: localize(`Sections.${id}`), active: id === section })),
    identity: buildIdentity(model),
    attributes: buildAttributes(model),
    defenses: buildDefenses(model),
    strikes: buildStrikes(model),
    abilities: buildAbilities(model),
    spellcasting: buildSpellcastingSection(model),
    warnings: evaluateBalance(model).map(describeWarning),
    preview: buildPreview(model)
  };
}

function revokeRole(model) {
  const { skills, abilities, speed } = model.roleGrants;
  removeIds(model.skills, skills);
  removeIds(model.abilities, abilities);
  if (speed && model.speed === speed.to) model.speed = speed.from;
}

function grantSkills(model, { skills = [] }) {
  return skills
    .filter(({ skill }) => !model.skills.some((entry) => entry.skill === skill))
    .map(({ skill, tier }) => {
      const entry = addSkill(model, skill);
      entry.value.tier = tier;
      return entry.id;
    });
}

function grantAbility(model, { name, uuid, cost, category }) {
  const native = findNativeAbility(uuid);
  if (native) return addNativeAbility(model, native)?.id;
  const description = `@UUID[${uuid}]{${name}}`;
  return Object.assign(addCustomAbility(model), { name, cost, category, description }).id;
}

function grantRoleAbilities(model, { abilities = [] }) {
  return abilities
    .filter(({ name }) => !model.abilities.some((entry) => entry.name === name))
    .map((ability) => grantAbility(model, ability))
    .filter(Boolean);
}

function grantSpeed(model, { speedBonus }) {
  if (!speedBonus) return null;
  const from = model.speed;
  model.speed += speedBonus;
  return { from, to: model.speed };
}

function syncSpellcasting(model, { spellcasting: kit }) {
  if (!kit) {
    if (model.spellcasting?.roleGranted) model.spellcasting = null;
    return;
  }
  if (!model.spellcasting) {
    enableSpellcasting(model);
    model.spellcasting.roleGranted = true;
  }
  const { spellcasting } = model;
  if (!spellcasting.roleGranted) return;
  if (kit.tradition && kit.tradition !== spellcasting.tradition) setSpellTradition(spellcasting, kit.tradition);
  spellcasting.type = kit.type;
}

export function selectRole(model, roleId) {
  revokeRole(model);
  applyRole(model, roleId);
  const kit = ROLE_KITS[roleId] ?? {};
  model.roleGrants = {
    skills: grantSkills(model, kit),
    abilities: grantRoleAbilities(model, kit),
    speed: grantSpeed(model, kit)
  };
  syncSpellcasting(model, kit);
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { getProperty, setProperty } = foundry.utils;

function parseDatasetValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function getFirstUnusedSkill(model) {
  const used = new Set(model.skills.map(({ skill }) => skill));
  return getSkills().find(({ value }) => !used.has(value))?.value ?? LORE_SKILL;
}

const MUTATIONS = {
  setSection(_event, target) {
    this.section = target.dataset.section;
  },
  adjustLevel(_event, target) {
    adjustLevel(this.model, Number(target.dataset.delta));
  },
  setTier(_event, target) {
    selectTier(getProperty(this.model, target.dataset.path), target.dataset.tier);
  },
  setValue(_event, target) {
    setProperty(this.model, target.dataset.path, parseDatasetValue(target.dataset.value));
  },
  setRanged(_event, target) {
    setStrikeRanged(getProperty(this.model, target.dataset.path), this.model.role, target.dataset.value === "true");
  },
  setTradition(_event, target) {
    const { spellcasting } = this.model;
    if (spellcasting.tradition !== target.dataset.value) setSpellTradition(spellcasting, target.dataset.value);
  },
  addSkill() {
    addSkill(this.model, getFirstUnusedSkill(this.model));
  },
  addResistance(_event, target) {
    const { kind } = target.dataset;
    const types = getResistanceTypes(kind).map(({ value }) => value);
    addResistance(this.model, kind, findUnusedValue(types, this.model.resistances));
  },
  addStrike() {
    addStrike(this.model);
  },
  addSense() {
    addSense(this.model, findUnusedValue(getSenses().map(({ value }) => value), this.model.senses));
  },
  addCustomAbility() {
    addCustomAbility(this.model);
  },
  openInlineBuilder(_event, target) {
    const ability = getProperty(this.model, target.dataset.path);
    const editor = this.element.querySelector(`[data-editor="${target.dataset.path}.description"]`);
    const proxy = document.createElement("div");
    proxy.setAttribute("contenteditable", "true");
    proxy.innerHTML = editor.innerHTML;
    proxy.addEventListener("input", () => {
      ability.description = sanitizeDescription(proxy);
      this.render();
    });
    openInlineBuilderDialog(proxy, { level: this.model.level });
  },
  addOtherSpeed() {
    addOtherSpeed(this.model, findUnusedValue(SPEED_TYPES, this.model.otherSpeeds));
  },
  applyFix(_event, target) {
    const pending = evaluateBalance(this.model).find(({ id }) => id === target.dataset.warning);
    pending?.fixes[Number(target.dataset.fix)]?.apply();
  },
  addExtraDamage(_event, target) {
    addExtraDamage(getProperty(this.model, target.dataset.path), DEFAULT_EXTRA_DAMAGE_TYPE);
  },
  enableSpellcasting() {
    enableSpellcasting(this.model);
  },
  disableSpellcasting() {
    this.model.spellcasting = null;
  },
  clearSlot(_event, target) {
    setSlotSpell(this.model.spellcasting, Number(target.dataset.rank), Number(target.dataset.index), null);
  },
  removeEntry(_event, target) {
    removeById(getProperty(this.model, target.dataset.list), target.dataset.id);
  },
  removeTag(_event, target) {
    const { path, value } = target.dataset;
    if (path === TRAITS_PATH) {
      removeTrait(this.model, value);
      return;
    }
    removeValue(getProperty(this.model, path), value);
  }
};

function commitField(model, target) {
  const handler = FIELD_HANDLERS.find(([key]) => key in target.dataset)?.[1];
  if (!handler) return false;
  handler(model, target);
  return true;
}

function renderAfter(mutation) {
  return function (event, target) {
    mutation.call(this, event, target);
    return this.render();
  };
}

function browseSpells(_event, target) {
  return openSpellBrowser(this.model.spellcasting.tradition, Number(target.dataset.rank));
}

async function createCreature() {
  if (this.creating) return;
  this.creating = true;
  try {
    const focused = this.element.querySelector(":focus");
    if (focused) commitField(this.model, focused);
    const source = buildActorSource(this.model, await resolveSpellSources(this.model));
    if (!source.name) {
      ui.notifications.warn(localize("Warnings.NameRequired"));
      this.section = DEFAULT_SECTION;
      await this.render();
      this.element.querySelector(NAME_FIELD)?.focus();
      return;
    }

    source.items.push(...(await resolveNativeAbilityItems(this.model)));
    const actor = await getDocumentClass("Actor").create(source);
    await this.close();
    actor?.sheet.render({ force: true });
  } finally {
    this.creating = false;
  }
}

function sanitizeDescription(editor) {
  return editor.textContent.trim() ? foundry.utils.cleanHTML(editor.innerHTML) : "";
}

function bindDescription(model, editor) {
  setProperty(model, editor.dataset.editor, sanitizeDescription(editor));
}

function addNativeFromPicker(model, { value }) {
  const native = findNativeAbility(value);
  if (native) addNativeAbility(model, native);
}

async function enrichDescriptions(abilities) {
  const { enrichHTML } = foundry.applications.ux.TextEditor.implementation;
  await Promise.all(abilities.map(async (ability) => {
    ability.description = await enrichHTML(ability.description);
  }));
}

function bindValue(model, { dataset, value }) {
  const parsed = dataset.type === "number" ? Math.max(0, Math.round(Number(value)) || 0) : value;
  if (dataset.bind === "role") selectRole(model, parsed || null);
  else setProperty(model, dataset.bind, parsed);
}

function addTag(model, { dataset, value }) {
  if (!value) return;
  if (dataset.path === TRAITS_PATH) {
    addTrait(model, value);
    return;
  }
  const tags = getProperty(model, dataset.path);
  if (!tags.includes(value)) tags.push(value);
}

function overrideRow(model, { dataset, value }) {
  setRowOverride(model, dataset.table, getProperty(model, dataset.override), value);
}

const FIELD_HANDLERS = [
  ["override", overrideRow],
  ["bind", bindValue],
  ["tagSelect", addTag],
  ["nativeAbility", addNativeFromPicker],
  ["editor", bindDescription]
];

class CreatureBuilderDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: DIALOG_ID,
    classes: ["hbt-builder"],
    window: {
      title: `${I18N_PREFIX}.CreatureBuilder.Title`,
      icon: "fa-solid fa-dragon",
      resizable: false
    },
    position: {
      width: 1000,
      height: 700
    },
    actions: {
      ...Object.fromEntries(Object.entries(MUTATIONS).map(([name, mutation]) => [name, renderAfter(mutation)])),
      browseSpells,
      create: createCreature
    }
  };

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/creature-builder.hbs`,
      scrollable: [".hbt-body", ".hbt-sheet"]
    }
  };

  model = createModel();
  section = DEFAULT_SECTION;

  async _prepareContext() {
    await Promise.all([loadNativeAbilities(), loadSpells()]);
    const context = buildContext(this.model, this.section);
    await enrichDescriptions(context.preview.abilities);
    return context;
  }

  _onFirstRender() {
    this.element.addEventListener("change", (event) => this.#commitField(event.target));
    this.element.addEventListener("focusout", (event) => this.#commitEditedDescription(event.target));
    this.element.addEventListener("mousedown", (event) => {
      if (event.target.closest("[data-keep-focus]")) event.preventDefault();
    });
    this.element.addEventListener("dragover", (event) => this.#hoverSlot(event, true));
    this.element.addEventListener("dragleave", (event) => this.#hoverSlot(event, false));
    this.element.addEventListener("drop", (event) => this.#dropSpell(event));
    this.element.addEventListener("paste", (event) => {
      if (!event.target.dataset.editor) return;
      event.preventDefault();
      document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
    });
  }

  _onRender() {
    for (const select of this.element.querySelectorAll("[data-tag-select]")) select.selectedIndex = -1;
  }

  #hoverSlot(event, active) {
    const slot = event.target.closest("[data-slot-drop]");
    if (!slot) return;
    if (active) event.preventDefault();
    slot.classList.toggle("dragover", active);
  }

  #dropSpell(event) {
    const slot = event.target.closest("[data-slot-drop]");
    if (!slot) return;
    event.preventDefault();
    slot.classList.remove("dragover");
    const { uuid } = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    const { tradition } = this.model.spellcasting;
    const { rank, index } = slot.dataset;
    if (!getSpells(tradition, Number(rank)).some(({ value }) => value === uuid)) {
      ui.notifications.warn(localize("Warnings.IncompatibleSpell"));
      return;
    }
    setSlotSpell(this.model.spellcasting, Number(rank), Number(index), uuid);
    this.render();
  }

  #commitEditedDescription(target) {
    const { editor } = target.dataset;
    if (editor && sanitizeDescription(target) !== getProperty(this.model, editor)) this.#commitField(target);
  }

  #commitField(target) {
    if (commitField(this.model, target)) this.render();
  }
}

export function openCreatureBuilder() {
  const open = foundry.applications.instances.get(DIALOG_ID);
  if (open) return open.bringToFront();
  return new CreatureBuilderDialog().render({ force: true });
}
