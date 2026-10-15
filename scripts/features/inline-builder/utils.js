import { I18N_PREFIX } from "../../constants.js";
import { PF2E_CONDITION_MAP, PF2E_CONDITION_SET, SORTED_DAMAGE_TYPES, AUTOMATION_OUTCOME_BY_LABEL } from "./constants.js";

function localize(path) {
  return game.i18n.localize(i18nKey(path));
}

function normalizeText(value) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function parseShortDamageTag(content, prefix) {
  if (typeof content !== "string" || !content.toLowerCase().startsWith(prefix)) return null;

  const body = content.slice(prefix.length);
  const lowerBody = body.toLowerCase();
  for (const damageType of SORTED_DAMAGE_TYPES) {
    const suffix = `-${damageType.toLowerCase()}`;
    if (!lowerBody.endsWith(suffix)) continue;

    const formula = body.slice(0, body.length - suffix.length).trim();
    return formula ? { formula, type: damageType } : null;
  }

  return null;
}

function convertAutomationToken(match, inner) {
  const content = inner.trim();
  const persistentDamage = parseShortDamageTag(content, "pd-");
  if (persistentDamage) {
    return `@Damage[${persistentDamage.formula}[persistent,${persistentDamage.type}]]`;
  }

  const damage = parseShortDamageTag(content, "dmg-");
  if (damage) {
    return `@Damage[${damage.formula}[${damage.type}]]`;
  }

  const parts = content.split(/\s+/);
  let label = parts.join(" ");
  if (parts.length > 1 && /^\d+$/.test(parts.at(-1))) {
    const labelParts = parts.slice(0, -1);
    const labelSlug = labelParts.join(" ").toLowerCase().replace(/\s+/g, "-");
    if (PF2E_CONDITION_MAP[labelSlug] && labelSlug !== "damage") label = labelParts.join(" ");
  }

  const slug = label.toLowerCase().replace(/\s+/g, "-");
  const uuid = slug !== "damage" ? PF2E_CONDITION_MAP[slug] : null;
  return uuid ? `@UUID[${uuid}]{${content}}` : match;
}

function convertAutomationText(text) {
  return String(text ?? "").replace(/\{([^}]+)\}/g, convertAutomationToken);
}

function convertAutomationHtmlToShortText(content) {
  return String(content ?? "")
    .replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, (_match, inner) => `{${inner}}`)
    .replace(/@Damage\[([^[]+)\[persistent,([^\]]+)\]\]/ig, (_match, formula, type) => `{pd-${formula.trim()}-${type.trim()}}`)
    .replace(/@Damage\[([^[]+)\[([^\]]+)\]\]/ig, (match, formula, type) => {
      if (type.toLowerCase().includes("persistent")) return match;
      return `{dmg-${formula.trim()}-${type.trim()}}`;
    });
}

function getShortDamageTags(text, prefix) {
  return Array.from(String(text ?? "").matchAll(/\{([^{}]+)\}/g), (match) => parseShortDamageTag(match[1].trim(), prefix))
    .filter(Boolean).map(({ formula, type }) => ({ formula, damageType: type }));
}

function getAutomationLineOutcome(line) {
  const idx = String(line ?? "").indexOf(":");
  if (idx < 0) return null;

  return AUTOMATION_OUTCOME_BY_LABEL.get(normalizeText(String(line).slice(0, idx))) ?? null;
}

function extractDamageSpecs(text) {
  const specs = [];

  for (const damageMatch of String(text ?? "").matchAll(/@Damage\[([^[]+)\[([^\]]+)\](?:\|traits:([^\]]*))?\]/ig)) {
    const formula = damageMatch[1].trim();
    const damageType = damageMatch[2].trim();
    const traits = damageMatch[3] ? damageMatch[3].split(",").map((trait) => trait.trim()).filter(Boolean) : [];
    specs.push({
      formula,
      damageType,
      traits,
      isPersistent: damageType.toLowerCase().startsWith("persistent")
    });
  }

  for (const shortDamage of getShortDamageTags(text, "dmg-")) {
    specs.push({
      formula: shortDamage.formula,
      damageType: shortDamage.damageType,
      traits: [],
      isPersistent: false
    });
  }

  return specs;
}

function createDamageSignature(damage) {
  return [
    damage.formula,
    damage.damageType,
    ...(damage.traits ?? [])
  ].map((value) => normalizeText(value)).join("|");
}

function parseConditionTag(tag) {
  const parts = String(tag ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;

  const last = parts.at(-1);
  const value = /^\d+$/.test(last) ? Number.parseInt(parts.pop(), 10) : null;
  const slug = parts.join("-").replace(/[^a-z0-9-]/g, "");

  if (!slug || slug === "persistent-damage" || slug === "damage" || !PF2E_CONDITION_SET.has(slug)) return null;
  return { name: slug, value };
}

function extractAutomationConditions(line) {
  const idx = String(line ?? "").indexOf(":");
  if (idx < 0) return [];

  const conditionText = String(line).slice(idx + 1).trim();
  const foundConditions = [];
  const seen = new Set();

  function addUniquePersistentDamage(formula, damageType) {
    const key = `pd:${formula}:${damageType}`;
    if (seen.has(key)) return;
    seen.add(key);
    foundConditions.push({
      isPersistent: true,
      formula,
      damageType
    });
  }

  function addUniqueCondition(tag) {
    const condition = parseConditionTag(tag);
    if (!condition) return;

    const key = `condition:${condition.name}:${condition.value ?? ""}`;
    if (seen.has(key)) return;

    seen.add(key);
    foundConditions.push(condition);
  }

  for (const persistentMatch of conditionText.matchAll(/@Damage\[([^[]+)\[persistent,([^\]]+)\]\]/ig)) {
    addUniquePersistentDamage(persistentMatch[1].trim(), persistentMatch[2].trim());
  }

  for (const persistentDamage of getShortDamageTags(conditionText, "pd-")) {
    addUniquePersistentDamage(persistentDamage.formula, persistentDamage.damageType);
  }

  const textWithoutUuidTags = conditionText.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/ig, (_match, inner) => {
    addUniqueCondition(inner);
    return "";
  });

  for (const tagMatch of textWithoutUuidTags.matchAll(/\{([^}]+)\}/g)) {
    const tag = tagMatch[1].trim();
    const lowerTag = tag.toLowerCase();
    if (lowerTag.startsWith("pd-") || lowerTag.startsWith("dmg-")) continue;
    addUniqueCondition(tag);
  }

  return foundConditions;
}

export {
  localize,
  i18nKey,
  convertAutomationHtmlToShortText,
  convertAutomationText,
  createDamageSignature,
  extractAutomationConditions,
  extractDamageSpecs,
  getAutomationLineOutcome
};

function i18nKey(path) {
  return `${I18N_PREFIX}.InlineBuilder.${path}`;
}
