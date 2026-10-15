import { I18N_PREFIX } from "../../constants.js";
import {
  ABILITY_INDEX_FIELDS,
  ACTION_TYPE,
  CANTRIP_CATEGORY,
  CANTRIP_RANK,
  CANTRIP_TRAIT,
  CHECK_DC,
  CREATURE_TABLES,
  DAMAGE_FORMULA,
  DAMAGE_TYPE_PLACEHOLDER,
  DEFAULT_ABILITY_CATEGORY,
  DEFAULT_TIER,
  DICE_TERM,
  ESCAPE_DC,
  FAST_HEALING_FACTOR,
  FOCUS_TRAIT,
  GLYPHS,
  HEALING_RULE,
  MAX_SPELL_RANK,
  MELEE_TIER_KEYS,
  NATIVE_ABILITY_PACK,
  PREPARATION_TYPES,
  REACH_TRAIT,
  REGENERATION_FACTOR,
  REGENERATION_TYPE,
  ROLES,
  SCALED_DAMAGE_TYPE,
  SCALING_TIER,
  SENSE_SLUGS,
  SLOTS_BY_TYPE,
  SPELL_CATEGORY,
  SPELL_INDEX_FIELDS,
  SPELL_PACK,
  SPELL_TAB,
  TABLE_LEVELS
} from "./constants.js";

export function createId() {
  return foundry.utils.randomID();
}

export function clampLevel(level) {
  return Math.min(TABLE_LEVELS.max, Math.max(TABLE_LEVELS.min, level));
}

function getCell(table, tier, level) {
  return CREATURE_TABLES[table][tier]?.[level - TABLE_LEVELS.min] ?? null;
}

export function getTableValue(table, tier, level) {
  const cell = getCell(table, tier, level);
  return Array.isArray(cell) ? Math.ceil((cell[0] + cell[1]) / 2) : cell;
}

export function getAvailableTiers(table, level) {
  return Object.keys(CREATURE_TABLES[table]).filter((tier) => getCell(table, tier, level) !== null);
}

export function resolveTier(table, tier, level) {
  const available = getAvailableTiers(table, level);
  if (available.includes(tier)) return tier;

  const order = Object.keys(CREATURE_TABLES[table]);
  const position = order.indexOf(tier);
  return available.find((candidate) => order.indexOf(candidate) > position) ?? available.at(-1);
}

function averageDamage(text) {
  const terms = String(text).replace(/\s+/g, "").replace(/-/g, "+-").split("+").filter(Boolean);
  let total = 0;
  for (const term of terms) {
    const dice = term.match(DICE_TERM);
    const amount = dice ? (Number(dice[1]) * (Number(dice[2]) + 1)) / 2 : Number(term);
    if (!Number.isFinite(amount)) return null;
    total += amount;
  }
  return total;
}

function toNumber(value) {
  return typeof value === "string" ? averageDamage(value) : value;
}

export function classifyValue(table, value, level) {
  const target = toNumber(value);
  const tiers = getAvailableTiers(table, level);
  if (target === null) return tiers.at(Math.floor(tiers.length / 2));
  const distance = (tier) => Math.abs(toNumber(getTableValue(table, tier, level)) - target);
  return [...tiers].reverse().reduce((best, tier) => (distance(tier) < distance(best) ? tier : best));
}

function getScaledValue(table, level) {
  return getTableValue(table, resolveTier(table, SCALING_TIER, level), level);
}

function fillDescription(html, level) {
  const damage = getScaledValue("strikeDamage", level);
  const dc = getScaledValue("spellDifficultyClass", level);
  return html
    .replace(DAMAGE_FORMULA, `$1${damage}`)
    .replace(DAMAGE_TYPE_PLACEHOLDER, `[${SCALED_DAMAGE_TYPE}]`)
    .replace(CHECK_DC, `dc:${dc}`)
    .replace(ESCAPE_DC, `dc=${dc}`);
}

function scaleHealingRule(rule, level) {
  if (rule.key !== HEALING_RULE) return rule;
  const factor = rule.type === REGENERATION_TYPE ? REGENERATION_FACTOR : FAST_HEALING_FACTOR;
  return { ...rule, value: Math.round(averageDamage(getScaledValue("strikeDamage", level)) * factor) };
}

export function scaleAbilityItem(item, level) {
  const { description, rules } = item.system;
  return {
    ...item,
    system: {
      ...item.system,
      description: { ...description, value: fillDescription(description.value, level) },
      rules: rules.map((rule) => scaleHealingRule(rule, level))
    }
  };
}

let nativeAbilities = null;

export function getActionData(cost) {
  const actions = Number(cost);
  return actions ? { actionType: ACTION_TYPE, actions } : { actionType: cost, actions: null };
}

export function getCost(actionType, actions) {
  return actionType === ACTION_TYPE ? String(actions ?? 1) : actionType;
}

export function getCostGlyph(cost) {
  return GLYPHS[cost] ?? "";
}

function toNativeAbility({ uuid, name, system }) {
  return {
    uuid,
    name,
    cost: getCost(system.actionType?.value, system.actions?.value),
    category: system.category ?? DEFAULT_ABILITY_CATEGORY,
    traits: system.traits?.value ?? []
  };
}

export async function loadNativeAbilities() {
  if (nativeAbilities) return nativeAbilities;
  const index = await game.packs.get(NATIVE_ABILITY_PACK).getIndex({ fields: ABILITY_INDEX_FIELDS });
  nativeAbilities = [...index]
    .filter(({ system }) => !SENSE_SLUGS.has(system.slug))
    .map(toNativeAbility).sort((left, right) => left.name.localeCompare(right.name, game.i18n.lang));
  return nativeAbilities;
}

export function getNativeAbilities() {
  return nativeAbilities ?? [];
}

export function findNativeAbility(uuid) {
  return getNativeAbilities().find((entry) => entry.uuid === uuid);
}

async function resolveNativeAbilityItem(uuid, level) {
  const document = await fromUuid(uuid);
  return document ? scaleAbilityItem(game.items.fromCompendium(document), level) : null;
}

export async function resolveNativeAbilityItems(model) {
  const natives = model.abilities.filter(({ uuid }) => uuid);
  const items = await Promise.all(natives.map(({ uuid }) => resolveNativeAbilityItem(uuid, model.level)));
  return items.filter(Boolean);
}

export function getRoleTier(roleId, key) {
  return ROLES[roleId]?.[key] ?? DEFAULT_TIER;
}

export function getStrikeTier(roleId, { ranged }, key) {
  const meleeTier = ranged ? undefined : ROLES[roleId]?.[MELEE_TIER_KEYS[key]];
  return meleeTier ?? getRoleTier(roleId, key);
}

export function hasMeleePenalty(roleId) {
  return Object.values(MELEE_TIER_KEYS).some((key) => ROLES[roleId]?.[key]);
}

export function getHighestSpellRank(level) {
  return Math.min(MAX_SPELL_RANK, Math.ceil(Math.max(1, level) / 2));
}

function countSlots({ full, newest }, rank, level) {
  if (rank === MAX_SPELL_RANK) return 1;
  const opensThisLevel = rank === getHighestSpellRank(level) && Math.max(1, level) % 2 === 1;
  return opensThisLevel ? newest : full;
}

export function getSlotKey(rank, index) {
  return `${rank}.${index}`;
}

export function getSpellSlots(type, level) {
  const progression = SLOTS_BY_TYPE[type];
  if (!progression) return [];

  const ranks = Array.from({ length: getHighestSpellRank(level) }, (_, index) => {
    const rank = index + 1;
    return { rank, slots: countSlots(progression, rank, level) };
  });
  return progression.cantrips ? [{ rank: CANTRIP_RANK, slots: progression.cantrips }, ...ranks] : ranks;
}

export function getSpellLoadout({ type, spells }, level) {
  return getSpellSlots(type, level).map(({ rank, slots }) => ({
    rank,
    spells: Array.from({ length: slots }, (_, index) => spells[getSlotKey(rank, index)] ?? null)
  }));
}

async function resolveSpellSource(uuid) {
  const document = await fromUuid(uuid);
  return document ? [uuid, game.items.fromCompendium(document)] : null;
}

export async function resolveSpellSources({ spellcasting, level }) {
  if (!spellcasting) return new Map();
  const uuids = new Set(getSpellLoadout(spellcasting, level).flatMap(({ spells }) => spells).filter(Boolean));
  const sources = await Promise.all([...uuids].map(resolveSpellSource));
  return new Map(sources.filter(Boolean));
}

function buildSpellItem(source, entryId) {
  return { ...source, _id: createId(), system: { ...source.system, location: { value: entryId } } };
}

export function buildSpellItems(spellcasting, level, sources, entryId) {
  const items = new Map();
  const prepared = {};
  for (const { rank, spells } of getSpellLoadout(spellcasting, level)) {
    spells.forEach((uuid, index) => {
      if (!sources.has(uuid)) return;
      const key = `${uuid}@${rank}`;
      if (!items.has(key)) items.set(key, buildSpellItem(sources.get(uuid), entryId));
      const slot = (prepared[`slot${rank}`] ??= { prepared: {} });
      slot.prepared[index] = { id: items.get(key)._id };
    });
  }
  return { items: [...items.values()], prepared };
}

const traitCatalogs = {};

function localizeKey(key) {
  return game.i18n.localize(key);
}

function toOptions(record, getLabelKey = (entry) => entry) {
  return Object.entries(record).map(([value, entry]) => ({ value, label: localizeKey(getLabelKey(entry)) }));
}

function compareLabels(left, right) {
  return left.label.localeCompare(right.label, game.i18n.lang);
}

export function getSizes() {
  return toOptions(CONFIG.PF2E.actorSizes);
}

export function getRarities() {
  return toOptions(CONFIG.PF2E.rarityTraits);
}

export function getAttributeLabel(attribute) {
  return localizeKey(CONFIG.PF2E.abilities[attribute]);
}

export function getSaveLabel(save) {
  return localizeKey(CONFIG.PF2E.saves[save]);
}

export function getSkills() {
  return toOptions(CONFIG.PF2E.skills, (skill) => skill.label);
}

export function getDamageTypes() {
  return toOptions(CONFIG.PF2E.damageTypes);
}

export function getResistanceTypes(kind) {
  const types = kind === "weakness" ? CONFIG.PF2E.weaknessTypes : CONFIG.PF2E.resistanceTypes;
  return toOptions(types).filter(({ label }) => label).sort(compareLabels);
}

export function getTraditions() {
  return toOptions(CONFIG.PF2E.magicTraditions);
}

export function getPreparationTypes() {
  return PREPARATION_TYPES.map((value) => ({ value, label: localizeKey(CONFIG.PF2E.preparationType[value]) }));
}

const TAG_RECORDS = {
  creature: () => CONFIG.PF2E.creatureTraits,
  strike: () => CONFIG.PF2E.npcAttackTraits,
  language: () => CONFIG.PF2E.languages,
  immunity: () => CONFIG.PF2E.immunityTypes,
  ability: () => CONFIG.PF2E.actionTraits
};

export function getSenses() {
  return toOptions(CONFIG.PF2E.senses).sort(compareLabels);
}

function loadTraitCatalog(kind) {
  traitCatalogs[kind] ??= toOptions(TAG_RECORDS[kind]())
    .filter(({ value, label }) => label && !REACH_TRAIT.test(value))
    .sort(compareLabels);
  return traitCatalogs[kind];
}

function getUnavailableLanguages() {
  return game.settings.get("pf2e", "homebrew.languageRarities").unavailable;
}

export function getTraitCatalog(kind) {
  const catalog = loadTraitCatalog(kind);
  if (kind !== "language") return catalog;
  const unavailable = getUnavailableLanguages();
  return catalog.filter(({ value }) => !unavailable.has(value));
}

export function getTraitLabel(kind, slug) {
  return loadTraitCatalog(kind).find(({ value }) => value === slug)?.label ?? slug;
}

function qualify(key) {
  return `${I18N_PREFIX}.CreatureBuilder.${key}`;
}

export function localize(key) {
  return game.i18n.localize(qualify(key));
}

export function localizeIfPresent(key) {
  return game.i18n.has(qualify(key)) ? localize(key) : "";
}

export function format(key, data) {
  return game.i18n.format(qualify(key), data);
}

let spells = null;

function isCastable({ system }) {
  return !system.ritual && !system.traits.value.includes(FOCUS_TRAIT);
}

function toSpell({ uuid, name, system }) {
  const rank = system.traits.value.includes(CANTRIP_TRAIT) ? CANTRIP_RANK : system.level.value;
  return { uuid, name, rank, traditions: system.traits.traditions ?? [] };
}

export async function loadSpells() {
  if (spells) return spells;
  const index = await game.packs.get(SPELL_PACK).getIndex({ fields: SPELL_INDEX_FIELDS });
  spells = [...index]
    .filter(isCastable)
    .map(toSpell)
    .sort((left, right) => left.name.localeCompare(right.name, game.i18n.lang));
  return spells;
}

export function getSpells(tradition, rank) {
  return (spells ?? [])
    .filter((spell) => spell.rank === rank && spell.traditions.includes(tradition))
    .map(({ uuid, name }) => ({ value: uuid, label: name }));
}

export function getSpellName(uuid) {
  return spells?.find((spell) => spell.uuid === uuid)?.name ?? "";
}

function check(group, keys) {
  group.selected = keys;
  for (const [key, option] of Object.entries(group.options)) option.selected = keys.includes(key);
}

export async function openSpellBrowser(tradition, rank) {
  const browser = game.pf2e.compendiumBrowser;
  const filter = await browser.tabs[SPELL_TAB].getFilterData();
  const isCantrip = rank === CANTRIP_RANK;
  check(filter.checkboxes.category, [isCantrip ? CANTRIP_CATEGORY : SPELL_CATEGORY]);
  check(filter.checkboxes.traditions, [tradition]);
  check(filter.checkboxes.rank, isCantrip ? [] : [String(rank)]);
  return browser.openTab(SPELL_TAB, { filter });
}
