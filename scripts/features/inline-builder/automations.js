import { MODULE_ID } from "../../constants.js";
import { ADDONS_ID, OUTCOME_SET, TEMPLATE_CONFIG, VALUED_CONDITION_SET } from "./constants.js";
import {
  createDamageSignature,
  extractAutomationConditions,
  extractDamageSpecs,
  getAutomationLineOutcome,
  i18nKey,
  localize
} from "./utils.js";

const processingMessages = new Set();
const pendingMessages = new Set();
const pendingTemplates = new Set();
const builderTemplateTypes = TEMPLATE_CONFIG.types.map(({ value }) => value).join("|");
const builderTemplatePattern = new RegExp(`@Template\\[type:(?:${builderTemplateTypes})\\|distance:[1-9]\\d*\\]`);

function areTargetAutomationsEnabled() {
  return game.modules.get(ADDONS_ID)?.active === true
    && game.settings.get(ADDONS_ID, "targetHelper") === true
    && game.settings.get(ADDONS_ID, "targetHelperAutomations") === true;
}

function isAutomationEnabled() {
  return game.user.isActiveGM && areTargetAutomationsEnabled();
}

function isTrustedSource(message) {
  return message.item?.actor && message.author
    && (message.author.isGM || message.item.actor.testUserPermission(message.author, "OWNER"));
}

function automationLines(description) {
  const container = document.createElement("div");
  container.innerHTML = description;
  const divider = Array.from(container.querySelectorAll("hr")).at(-1);
  let html = divider ? "" : container.innerHTML;
  for (let node = divider?.nextSibling; node; node = node.nextSibling) {
    html += node.outerHTML ?? node.textContent;
  }
  container.innerHTML = html.replace(/<\/p>|<br\s*\/?>|<\/div>|<\/li>/gi, "\n");
  return container.textContent.split("\n").map((line) => line.trim()).filter(Boolean);
}

function prepareAutomationMessage(message) {
  if (!areTargetAutomationsEnabled() || message.isDamageRoll || !isTrustedSource(message)) return;
  const lines = automationLines(message.item.system.description.value).filter((line) => getAutomationLineOutcome(line));
  if (!lines.length) return;
  message.updateSource({ [`flags.${MODULE_ID}.outcomeLines`]: lines });
  const container = document.createElement("div");
  container.innerHTML = message.content;
  let changed = false;
  for (const paragraph of container.querySelectorAll("p")) {
    if (!getAutomationLineOutcome(paragraph.textContent)) continue;
    for (const anchor of paragraph.querySelectorAll("a[data-damage-roll]")) {
      const label = document.createElement("span");
      label.textContent = anchor.textContent;
      anchor.replaceWith(label);
      changed = true;
    }
  }
  if (changed) message.updateSource({ content: container.innerHTML });
}

async function completedTargets(message, helper) {
  const targets = [];
  for (const { targetUuid, resultMessageId } of helper.saveResults ?? []) {
    if (!helper.targets?.includes(targetUuid)) continue;
    const saveMessage = game.messages.get(resultMessageId);
    const saveResult = saveMessage?.getFlag(ADDONS_ID, "targetHelperSaveResult");
    if (saveResult?.parentMessageId !== message.id || saveResult.targetUuid !== targetUuid) continue;
    if (!OUTCOME_SET.has(saveResult.outcome)) continue;
    const token = await fromUuid(targetUuid);
    if (token?.documentName === "Token" && token.actor && canAutomateTarget(token.actor)) {
      targets.push({ uuid: targetUuid, actor: token.actor, outcome: saveResult.outcome });
    }
  }
  return targets;
}

function canAutomateTarget(actor) {
  const mode = game.settings.get(ADDONS_ID, "targetHelperAutomationsNpcOnly");
  return [false, "false", "disabled"].includes(mode) || actor.type === "npc";
}

async function applyCondition(actor, condition, applicationKey) {
  if (condition.isPersistent) {
    if (actor.itemTypes.condition.some((entry) => entry.getFlag(MODULE_ID, "applicationKey") === applicationKey)) return;
    const source = game.pf2e.ConditionManager.getCondition("persistent-damage").toObject();
    source.system.persistent = { formula: condition.formula, damageType: condition.damageType, dc: 15 };
    foundry.utils.setProperty(source, `flags.${MODULE_ID}.applicationKey`, applicationKey);
    await actor.createEmbeddedDocuments("Item", [source]);
  } else if (VALUED_CONDITION_SET.has(condition.name)) {
    const requested = Math.max(1, condition.value ?? 1);
    const existing = actor.getCondition(condition.name);
    if (existing?.value >= requested) return;
    if (existing) await game.pf2e.ConditionManager.updateConditionValue(existing.id, actor, requested);
    else await actor.increaseCondition(condition.name, { value: requested });
  } else if (!actor.hasCondition(condition.name)) {
    await actor.increaseCondition(condition.name);
  }
}

async function applyOutcomeConditions(message, targets, lines) {
  const processed = { ...message.getFlag(MODULE_ID, "processedConditions") };
  for (const target of targets) {
    for (const line of lines.filter((entry) => getAutomationLineOutcome(entry) === target.outcome)) {
      for (const condition of extractAutomationConditions(line)) {
        const key = `${target.actor.uuid}:${target.outcome}:${JSON.stringify(condition)}`;
        if (processed[key]) continue;
        await applyCondition(target.actor, condition, `${message.id}:${key}`);
        processed[key] = true;
        await message.setFlag(MODULE_ID, "processedConditions", { ...processed });
      }
    }
  }
}

function outcomeDamageJobs(targets, lines) {
  const jobs = new Map();
  for (const line of lines) {
    const outcome = getAutomationLineOutcome(line);
    const matchingTargets = targets.filter((target) => target.outcome === outcome);
    if (!matchingTargets.length) continue;
    for (const damage of extractDamageSpecs(line).filter((spec) => !spec.isPersistent)) {
      const signature = createDamageSignature(damage);
      const job = jobs.get(signature) ?? { damage, targets: new Set() };
      matchingTargets.forEach((target) => job.targets.add(target.uuid));
      jobs.set(signature, job);
    }
  }
  return jobs;
}

async function createOutcomeDamage(message, job, jobId) {
  const item = message.item;
  const DamageRoll = CONFIG.Dice.rolls.find((RollClass) => RollClass.name === "DamageRoll");
  const roll = await new DamageRoll(`${job.damage.formula}[${job.damage.damageType}]`, { actor: item.actor, item }).evaluate();
  return roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: item.actor }),
    flavor: foundry.utils.escapeHTML(item.name),
    whisper: [...message.whisper],
    blind: message.blind,
    flags: {
      pf2e: { origin: item.getOriginData(), context: { type: "damage-roll", sourceType: "attack", options: item.getRollOptions("item"), traits: job.damage.traits } },
      [MODULE_ID]: { damageJobId: jobId, sourceMessageId: message.id }
    }
  });
}

async function delegateOutcomeDamage(damageMessage, targets) {
  const helper = damageMessage.getFlag(ADDONS_ID, "targetHelper");
  if (helper?.automation) return;
  await damageMessage.setFlag(ADDONS_ID, "targetHelper", {
    "-=saveMessageId": null,
    targets,
    damageTargets: targets.map((targetUuid) => ({ targetUuid, rollIndexes: [0] })),
    damageResults: [],
    automation: { type: "attack", sourceMessageId: damageMessage.id, status: "pending", pendingTargets: targets }
  });
}

async function rollOutcomeDamage(message, targets, lines) {
  const processed = { ...message.getFlag(MODULE_ID, "processedDamageJobs") };
  const processedApplications = { ...message.getFlag(MODULE_ID, "processedDamage") };
  for (const [signature, job] of outcomeDamageJobs(targets, lines)) {
    const targetUuids = [...job.targets].filter((uuid) => !processedApplications[`${signature}:${uuid}`]).sort();
    if (!targetUuids.length) continue;
    const jobId = `${message.id}:${signature}:${targetUuids.join(",")}`;
    if (processed[jobId]) continue;
    const existing = game.messages.contents.find((entry) => entry.getFlag(MODULE_ID, "damageJobId") === jobId);
    const damageMessage = existing ?? await createOutcomeDamage(message, job, jobId);
    if (!damageMessage) throw new Error("Unable to create outcome damage message.");
    await delegateOutcomeDamage(damageMessage, targetUuids);
    targetUuids.forEach((uuid) => processedApplications[`${signature}:${uuid}`] = true);
    processed[jobId] = true;
    await message.update({
      [`flags.${MODULE_ID}.processedDamageJobs`]: { ...processed },
      [`flags.${MODULE_ID}.processedDamage`]: { ...processedApplications }
    });
  }
}

async function processAutomations(message) {
  if (!isAutomationEnabled() || !isTrustedSource(message)) return;
  const lines = message.getFlag(MODULE_ID, "outcomeLines");
  if (!Array.isArray(lines) || !lines.every((line) => typeof line === "string")) return;
  if (processingMessages.has(message.id)) {
    pendingMessages.add(message.id);
    return;
  }
  const helper = message.getFlag(ADDONS_ID, "targetHelper");
  if (!helper?.save || !["complete", "manual", undefined].includes(helper.automation?.status)) return;
  processingMessages.add(message.id);
  try {
    const targets = await completedTargets(message, helper);
    await applyOutcomeConditions(message, targets, lines);
    if (!helper.save.options.includes("damaging-effect")) await rollOutcomeDamage(message, targets, lines);
  } finally {
    processingMessages.delete(message.id);
    if (pendingMessages.delete(message.id)) queueAutomations(message);
  }
}

function queueAutomations(message) {
  void processAutomations(message).catch((error) => {
    console.error(`${MODULE_ID} | Outcome automation failed.`, error);
    ui.notifications.error(i18nKey("Warnings.AutomationFailed"), { localize: true });
  });
}

function queueTemplate(message, options) {
  if (!canvas.ready || !message.isAuthor || options.render === false
    || message.isDamageRoll || message.isCheckRoll || message.rolls.length) return;
  if (!game.modules.get(ADDONS_ID)?.active
    || !game.settings.get(ADDONS_ID, "targetHelper")
    || !game.settings.get(ADDONS_ID, "templateHelper")) return;
  const item = message.item;
  if (!builderTemplatePattern.test(item?.system.description.value ?? "")) return;
  const spell = item.isOfType("spell") ? item : item.isOfType("consumable") ? item.embeddedSpell : null;
  if (spell?.system.area && typeof spell.placeTemplate === "function") return;
  pendingTemplates.add(message.id);
  activateQueuedTemplates();
}

function activateQueuedTemplates() {
  for (const id of pendingTemplates) {
    const link = document.querySelector(`[data-message-id="${id}"] a[data-effect-area]`);
    if (!link) continue;
    pendingTemplates.delete(id);
    link.click();
  }
}

function restoreBuilderSavingThrow(message, html) {
  if (!html.querySelector(".daavy-addons-target-helper-controls")) return;
  const label = localize("Description.SavingThrow");
  const original = document.createElement("div");
  original.innerHTML = game.pf2e.TextEditor.processUserVisibility(message.content, {
    relativeTo: message.item, rollData: message.getRollData()
  });
  const source = [...original.querySelectorAll("p")].find(paragraph =>
    paragraph.textContent.trim().startsWith(label) && paragraph.querySelector("[data-pf2-check]")
  );
  if (!source) return;
  const target = [...html.querySelectorAll("p")].find(paragraph =>
    paragraph.textContent.trim().startsWith(label) && !paragraph.querySelector("[data-pf2-check]")
  );
  if (target) target.append(" ", source.querySelector("[data-pf2-check]").cloneNode(true));
}

export function registerAutomationHooks() {
  Hooks.on("preCreateChatMessage", prepareAutomationMessage);
  Hooks.on("createChatMessage", queueAutomations);
  Hooks.on("updateChatMessage", (message, changes) => {
    const path = `flags.${ADDONS_ID}.targetHelper`;
    if (Object.keys(changes).some((key) => key === path || key.startsWith(`${path}.`)) || foundry.utils.hasProperty(changes, path)) {
      queueAutomations(message);
    }
  });
  Hooks.on("createChatMessage", queueTemplate);
  Hooks.on("deleteChatMessage", message => pendingTemplates.delete(message.id));
  Hooks.on("renderChatMessageHTML", restoreBuilderSavingThrow);
  Hooks.once("ready", () => {
    for (const message of game.messages.contents) queueAutomations(message);
    new MutationObserver(activateQueuedTemplates).observe(document.body, { childList: true, subtree: true });
  });
}
