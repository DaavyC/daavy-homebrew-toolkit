import {
  AUTOMATION_FIELDS,
  CONDITION_LABEL_BY_SLUG,
  DAMAGE_TABLES,
  DAMAGE_TYPES,
  DC_TABLE,
  DMG_SUGGEST_LEVEL_MAX,
  DMG_SUGGEST_LEVEL_MIN,
  INLINEBUILDER_DAMAGE_TYPE_SELECT_PARTIAL,
  INLINEBUILDER_ICON_SEGMENT_PARTIAL,
  INLINEBUILDER_LEVEL_CONTROL_PARTIAL,
  MAIN_TEMPLATE_PART,
  PF2E_CONDITIONS,
  PF2E_CONDITION_MAP,
  PF2E_CONDITION_SET,
  TEMPLATE_CONFIG,
  VALUED_CONDITION_SET
} from "./constants.js";
import { convertAutomationHtmlToShortText, convertAutomationText, i18nKey, localize } from "./utils.js";

const proseMirrorViews = new WeakMap();

export function registerProseMirrorViews() {
  return Hooks.on("createProseMirrorEditor", (_uuid, plugins) => {
    plugins.inlineBuilder = new foundry.prosemirror.Plugin({
      view: view => {
        proseMirrorViews.set(view.dom, view);
        return { destroy: () => proseMirrorViews.delete(view.dom) };
      }
    });
  });
}

function getEditorEditable(editorRef) {
  if (!editorRef) return null;
  if (editorRef.classList?.contains("ProseMirror") || editorRef.getAttribute?.("contenteditable") === "true") return editorRef;
  return editorRef.querySelector?.('.ProseMirror, [contenteditable="true"], .editor-content')
    ?? editorRef.closest?.('.editor')?.querySelector?.('.ProseMirror, [contenteditable="true"], .editor-content')
    ?? null;
}

function editorHtml(editable) {
  const view = proseMirrorViews.get(editable);
  return view ? foundry.prosemirror.dom.serializeString(view.state.doc.content) : editable.innerHTML;
}

function writeEditorHtml(editable, html) {
  const view = proseMirrorViews.get(editable);
  if (view) {
    const content = foundry.prosemirror.dom.parseString(html).content;
    view.dispatch(view.state.tr.replaceWith(0, view.state.doc.content.size, content));
  } else {
    editable.innerHTML = html;
    editable.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function getInputValue(input) {
  return input?.value?.trim?.() ?? "";
}

function setInputValue(input, value) {
  if (!input) return;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function appendInputValue(input, value) {
  const current = getInputValue(input);
  setInputValue(input, current ? `${current} ${value}` : value);
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseInteger(value, fallback = 0) {
  const number = parseInt(value, 10);
  return Number.isFinite(number) ? number : fallback;
}

function findFirstEditorDivider(raw) {
  const htmlMatch = raw.match(/<hr[\s\S]*?\/?>/i);
  const dashMatch = raw.match(/>\s*---\s*</) || raw.match(/(^|\n)\s*---\s*(\n|$)/);
  const matches = [htmlMatch, dashMatch].filter(match => match?.index !== undefined);
  if (matches.length === 0) return null;

  const match = matches.reduce((earliest, current) => current.index < earliest.index ? current : earliest);
  return { index: match.index, text: match[0], isDash: match === dashMatch };
}

function findLastHtmlDivider(raw) {
  return [...String(raw ?? '').matchAll(/<hr[\s\S]*?\/?>/gi)].at(-1) ?? null;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function automationLinesToParagraphHtml(text, converter = line => line) {
  return String(text ?? '').split('\n').map(line => {
    const converted = converter(line);
    const idx = converted.indexOf(": ");
    if (idx >= 0) {
      const label = converted.slice(0, idx + 1);
      const rest = converted.slice(idx + 2);
      return `<p><strong>${escapeHtml(label)}</strong> ${escapeHtml(rest)}</p>`;
    }
    return `<p>${escapeHtml(converted)}</p>`;
  }).join("");
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
export function registerInlineBuilderPartials() {
  Handlebars.registerPartial("inlinebuilderLevelControl", INLINEBUILDER_LEVEL_CONTROL_PARTIAL);
  Handlebars.registerPartial("inlinebuilderIconSegment", INLINEBUILDER_ICON_SEGMENT_PARTIAL);
  Handlebars.registerPartial("inlinebuilderDamageTypeSelect", INLINEBUILDER_DAMAGE_TYPE_SELECT_PARTIAL);
}

function getInlineBuilderDialogOptions({
  id,
  classes = [],
  titleKey,
  icon,
  width,
  actions = {},
  window = {}
}) {
  return {
    id,
    classes: ["inlinebuilder", ...classes],
    tag: "div",
    window: {
      title: i18nKey(titleKey),
      icon,
      ...window
    },
    position: { width },
    actions
  };
}

let currentNpcActor = null;
let creatureLevelOverride = null;

export function setCurrentNpcActor(actor) {
  currentNpcActor = actor;
}

function getCreatureLevelFromSheet() {
  if (creatureLevelOverride !== null) return creatureLevelOverride;
  return currentNpcActor?.type === "npc"
    ? currentNpcActor.system?.details?.level?.value ?? null
    : null;
}

function parseConditionTags(text) {
  const conditions = new Map();
  if (!text) return conditions;

  for (const match of text.matchAll(/\{([^}]+)\}/g)) {
    const content = match[1].trim();
    if (content.startsWith("dmg-") || content.startsWith("pd-")) continue;

    const parts = content.split(/\s+/);
    const slug = parts[0].toLowerCase();
    const value = parts.length > 1 ? parseInteger(parts[1], 1) : 1;

    if (PF2E_CONDITION_SET.has(slug)) {
      conditions.set(slug, value);
    }
  }
  return conditions;
}

function getConditionTag(slug, value) {
  return VALUED_CONDITION_SET.has(slug) ? `{${slug} ${value}}` : `{${slug}}`;
}

function getConditionTagRegex(slug) {
  const valuePart = VALUED_CONDITION_SET.has(slug) ? '(?:\\s+\\d+)?' : '';
  return new RegExp(`\\{${slug}${valuePart}\\}`, 'i');
}

function upsertConditionTag(text, slug, value) {
  const tag = getConditionTag(slug, value);
  const regex = getConditionTagRegex(slug);
  return regex.test(text) ? text.replace(regex, tag) : [text, tag].filter(Boolean).join(" ");
}

function removeConditionTag(text, slug) {
  return text.replace(getConditionTagRegex(slug), '').replace(/\s+/g, ' ').trim();
}

function getAutomationFields() {
  return AUTOMATION_FIELDS.map(([key, labelKey, selector, name]) => [key, localize(labelKey), selector, name]);
}

function getAutomationResultByLabel() {
  return new Map(getAutomationFields().map(([key, label]) => [label, key]));
}

function getAutomationTemplateFields() {
  return getAutomationFields().map(([, label, selector, name]) => ({
  label: label.replace(/:$/, ""),
  inputId: selector.slice(1),
  name
}));
}

class DamageDialogV2 extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = getInlineBuilderDialogOptions({
    id: "inlinebuilder-damage-dialog",
    classes: ["inlinebuilder-comfort-dialog"],
    titleKey: "Window.AddDamage",
    icon: "fas fa-bolt",
    width: 320,
    actions: {
      add: DamageDialogV2.addDamage
    }
  });

  static PARTS = MAIN_TEMPLATE_PART;

  constructor(options = {}) {
    super(options);
    this.targetInput = options.targetInput ?? null;
    this.selectedMode = options.mode === "persistent" ? "persistent" : "normal";
  }

  async _prepareContext(_options) {
    return {
      damageDialogTemplate: true,
      damageTypes: DAMAGE_TYPES,
      damageTypeSelect: { name: "type-suggest" },
      isPersistent: this.selectedMode === "persistent",
      labels: {
        damage: localize("Labels.Damage"),
        formulaOnly: localize("Labels.FormulaOnly"),
        type: localize("Labels.Type"),
        damageType: localize("Labels.DamageTypeLower"),
        selectPlaceholder: localize("Labels.SelectPlaceholder"),
        add: localize("Labels.Add")
      }
    };
  }

  static async addDamage(_event, _target) {
    const dialog = this;
    const html = dialog.element;

    const damageInput = html.querySelector('input[name="damage"]');
    const typeSuggest = html.querySelector('select[name="type-suggest"]');
    if (!damageInput) return;

    const formula = damageInput.value.trim().replace(/\s+/g, '');
    const typeSuggestValue = typeSuggest?.value || "";
    if (!formula) {
      ui.notifications.warn(localize("Warnings.DamageFormulaRequired"));
      return;
    }
    if (!typeSuggestValue) {
      ui.notifications.warn(localize("Warnings.DamageTypeRequired"));
      return;
    }

    const type = typeSuggestValue;

    const tag = dialog.selectedMode === "persistent"
      ? `{pd-${formula}-${type}}`
      : `{dmg-${formula}-${type}}`;

    appendInputValue(dialog.targetInput, tag);

    dialog.close();
  }
}

function openDamageDialog(targetInput, mode = "normal") {
  new DamageDialogV2({
    targetInput,
    mode,
    window: { title: mode === "persistent" ? localize("Window.AddPersistentDamage") : localize("Window.AddDamage") }
  }).render(true);
}

class ConditionPickerDialogV2 extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = getInlineBuilderDialogOptions({
    id: "inlinebuilder-condition-picker",
    classes: ["inlinebuilder-picker-dialog"],
    titleKey: "Window.SelectCondition",
    icon: "fas fa-list-check",
    width: 480,
    actions: {
      selectCondition: ConditionPickerDialogV2.selectCondition,
      removeCondition: ConditionPickerDialogV2.removeCondition
    }
  });

  static PARTS = MAIN_TEMPLATE_PART;

  constructor(options = {}) {
    super(options);
    this.targetInput = options.targetInput ?? null;
    this.initialValue = options.initialValue ?? "";
    this.currentConditions = parseConditionTags(this.initialValue);
  }

  async _prepareContext(_options) {
    const conditions = PF2E_CONDITIONS
      .map(slug => {
        const isValued = VALUED_CONDITION_SET.has(slug);
        const isActive = this.currentConditions.has(slug);
        const value = this.currentConditions.get(slug) ?? 1;

        let actionClass = "";
        let actionTitle = localize("Tooltips.ClickAddCondition");
        let iconClass = "";
        let iconPath = `systems/pf2e/icons/conditions/${slug}.webp`;
        let label = CONDITION_LABEL_BY_SLUG.get(slug) ?? slug;

        if (slug === "persistent-damage") {
          actionClass = "add-action";
          actionTitle = localize("Tooltips.ClickAddPersistentDamage");
        } else if (slug === "damage") {
          actionClass = "add-action";
          actionTitle = localize("Tooltips.ClickAddDamage");
          iconClass = "fas fa-bolt";
          iconPath = "";
          label = localize("Labels.Damage");
        }

        return {
          slug,
          label,
          iconPath,
          iconClass,
          uuid: PF2E_CONDITION_MAP[slug] ?? "",
          isValued,
          isActive,
          value,
          actionClass,
          actionTitle
        };
      });

    return { conditionPickerTemplate: true, conditions };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;

    html.querySelectorAll(".cond-btn-card").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const slug = btn.dataset.cond;

        if (slug === "persistent-damage" || slug === "damage") {
          openDamageDialog(this.targetInput, slug === "damage" ? "normal" : "persistent");
          return;
        }

        await ConditionPickerDialogV2.selectCondition.call(this, e, btn);
      });

      btn.addEventListener("contextmenu", async (e) => {
        e.preventDefault();
        if (btn.classList.contains("add-action")) return;
        await ConditionPickerDialogV2.removeCondition.call(this, e, btn);
      });
    });
  }

  _updateConditionInTarget(slug, value) {
    this._setTargetValue(upsertConditionTag(getInputValue(this.targetInput), slug, value));
  }

  _removeConditionFromTarget(slug) {
    this._setTargetValue(removeConditionTag(getInputValue(this.targetInput), slug));
  }

  _setTargetValue(value) {
    if (!this.targetInput) return;
    setInputValue(this.targetInput, value);
  }

  _setCardValue(target, value) {
    const valueLabel = target.querySelector(".cond-value");
    if (valueLabel) valueLabel.textContent = String(value);
  }

  static async selectCondition(_event, target) {
    const dialog = this;

    const slug = target.dataset.cond;
    if (!slug) return;

    let value = 1;

    if (dialog.currentConditions.has(slug)) {
      value = Math.min(10, (dialog.currentConditions.get(slug) || 1) + 1);
    }

    dialog.currentConditions.set(slug, value);
    target.classList.add("active");
    dialog._setCardValue(target, value);
    dialog._updateConditionInTarget(slug, value);
  }

  static async removeCondition(_event, target) {
    const dialog = this;

    const slug = target.dataset.cond;
    if (!slug) return;
    if (!dialog.currentConditions.has(slug)) return;

    if (VALUED_CONDITION_SET.has(slug)) {
      const currentValue = dialog.currentConditions.get(slug) || 1;
      const newValue = currentValue - 1;

      if (newValue > 0) {
        dialog.currentConditions.set(slug, newValue);
        dialog._setCardValue(target, newValue);
        dialog._updateConditionInTarget(slug, newValue);
        return;
      }
    }

    dialog.currentConditions.delete(slug);
    target.classList.remove("active");
    dialog._setCardValue(target, 1);
    dialog._removeConditionFromTarget(slug);
  }
}

function showConditionPicker(targetInput) {
  const initialValue = getInputValue(targetInput);
  new ConditionPickerDialogV2({ targetInput, initialValue }).render(true);
}

class ComfortEditDialogV2 extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = getInlineBuilderDialogOptions({
    id: "inlinebuilder-comfort-edit",
    classes: ["inlinebuilder-comfort-dialog"],
    titleKey: "Window.TextEditor",
    icon: "fas fa-edit",
    width: 520,
    actions: {
      save: ComfortEditDialogV2.saveContent,
      addCondition: ComfortEditDialogV2.addCondition
    }
  });

  static PARTS = MAIN_TEMPLATE_PART;

  constructor(options = {}) {
    super(options);
    this.initialValue = options.initialValue ?? "";
    this.callback = options.callback ?? null;
  }

  async _prepareContext(_options) {
    return {
      comfortEditTemplate: true,
      content: this.initialValue,
      labels: {
        addCondition: localize("Tooltips.AddCondition"),
        save: localize("Labels.SaveAction")
      }
    };
  }

  static async saveContent(_event, _target) {
    const dialog = this;
    const textarea = dialog.element.querySelector('textarea[name="content"]');

    if (!textarea) return;

    const content = textarea.value;
    dialog.callback?.(content);
    dialog.close();
  }

  static async addCondition(_event, _target) {
    const dialog = this;
    const textarea = dialog.element.querySelector('textarea[name="content"]');

    if (!textarea) return;

    showConditionPicker(textarea);
  }
}

async function showComfortEditDialog(targetInput) {
  const initialValue = getInputValue(targetInput);

  return new Promise(resolve => {
    const dialog = new ComfortEditDialogV2({
      initialValue,
      callback: resolve
    });
    dialog.addEventListener("close", () => resolve(undefined), { once: true });
    dialog.render(true);
  });
}

function getSuggestionLabels() {
  return {
    level: localize("Labels.Level"),
    creatureLevel: localize("Labels.CreatureLevel"),
    intensity: localize("Labels.Intensity"),
    dcCategory: localize("Labels.DcCategory"),
    type: localize("Labels.Type"),
    damageProfile: localize("Labels.DamageProfile"),
    area: localize("Labels.Area"),
    strike: localize("Labels.Strike"),
    damageCategory: localize("Labels.DamageCategory"),
    unlimited: localize("Labels.Unlimited"),
    limited: localize("Labels.Limited"),
    extreme: localize("Labels.Extreme"),
    high: localize("Labels.High"),
    moderate: localize("Labels.Moderate"),
    low: localize("Labels.Low")
  };
}

function getIntensityOptions(values) {
  const labels = getSuggestionLabels();
  return values.map(value => ({ value, label: labels[value] ?? value }));
}

function getLeveledTableValue(table, fallback) {
  const level = getCreatureLevelFromSheet();
  if (level === null) return fallback;
  return table[level] ?? fallback;
}

function getDefaultDamageFormula() {
  return getLeveledTableValue(DAMAGE_TABLES.area.unlimited, "4d6");
}

function getDefaultDC() {
  return getLeveledTableValue(DC_TABLE.moderate, "21");
}

function renderNpcLevelDialog(DialogClass, mapResult = result => result) {
  if (getCreatureLevelFromSheet() === null) {
    ui.notifications.warn(localize("Warnings.NoNpcSheet"));
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    const dialog = new DialogClass({ callback: result => resolve(mapResult(result)) });
    dialog.addEventListener("close", () => resolve(null), { once: true });
    dialog.render(true);
  });
}

function adjustDisplayedLevel(app, target, selector) {
  const delta = parseInteger(target.dataset.delta, 0);
  if (!delta) return;

  app.currentLevel = clampNumber(app.currentLevel + delta, DMG_SUGGEST_LEVEL_MIN, DMG_SUGGEST_LEVEL_MAX);
  const levelSpan = app.element.querySelector(selector);
  if (levelSpan) levelSpan.textContent = app.currentLevel;
}

class DCSuggestionDialogV2 extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = getInlineBuilderDialogOptions({
    id: "inlinebuilder-dc-suggestion",
    titleKey: "Window.DcSuggestion",
    icon: "fas fa-shield-alt",
    width: 320,
    actions: {
      adjustLevel: DCSuggestionDialogV2.adjustLevel,
      confirmDC: DCSuggestionDialogV2.confirmDC
    }
  });

  static PARTS = MAIN_TEMPLATE_PART;

  constructor(options = {}) {
    super(options);
    this.callback = options.callback ?? null;
    this.currentLevel = getCreatureLevelFromSheet() ?? 0;
  }

  async _prepareContext(_options) {
    return {
      dcSuggestionTemplate: true,
      baseLevel: getCreatureLevelFromSheet() ?? 0,
      currentLevel: this.currentLevel,
      levelControlId: "dc-suggest-level",
      labels: getSuggestionLabels(),
      intensities: getIntensityOptions(["extreme", "high", "moderate"])
    };
  }

  static async adjustLevel(_event, target) {
    adjustDisplayedLevel(this, target, "#dc-suggest-level");
  }

  static async confirmDC(_event, target) {
    const app = this;
    const level = app.currentLevel;
    const intensity = target?.dataset?.intensity ?? "moderate";
    const table = DC_TABLE[intensity];
    const dc = table[level];

    if (!dc) {
      ui.notifications.warn(localize("Warnings.DcNotFound"));
      return;
    }

    app.callback?.({ intensity, level, dc });
    app.close();
  }
}

class DamageSuggestionDialogV2 extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = getInlineBuilderDialogOptions({
    id: "inlinebuilder-damage-suggestion",
    titleKey: "Window.DamageSuggestion",
    icon: "fas fa-dragon",
    width: 320,
    actions: {
      selectType: DamageSuggestionDialogV2.selectType,
      selectSub: DamageSuggestionDialogV2.selectSub,
      adjustLevel: DamageSuggestionDialogV2.adjustLevel
    }
  });

  static PARTS = MAIN_TEMPLATE_PART;

  constructor(options = {}) {
    super(options);
    this.currentStep = 1;
    this.baseLevel = getCreatureLevelFromSheet() ?? 0;
    this.currentLevel = this.baseLevel;
    this.selectedType = null;
    this.selectedSub = null;
    this.callback = options.callback ?? null;
  }

  async _prepareContext(_options) {
    return {
      damageSuggestionTemplate: true,
      baseLevel: this.baseLevel,
      currentLevel: this.currentLevel,
      levelControlId: "dmg-suggest-level",
      showStep1: this.currentStep === 1,
      showStep2: this.currentStep === 2,
      isArea: this.selectedType === "area",
      isStrike: this.selectedType === "strike",
      labels: getSuggestionLabels()
    };
  }

  static async selectType(_event, target) {
    const type = target.dataset.type;
    if (!type) return;

    this.selectedType = type;
    this.currentStep = 2;
    this.selectedSub = null;
    await this.render(true);
  }

  static async selectSub(_event, target) {
    const sub = target.dataset.sub;
    if (!sub) return;

    this.selectedSub = sub;
    await DamageSuggestionDialogV2.confirmDamage.call(this, null, target);
  }

  static async adjustLevel(_event, target) {
    adjustDisplayedLevel(this, target, "#dmg-suggest-level");
  }

  static async confirmDamage(_event, _target) {
    if (!this.selectedType || !this.selectedSub) {
      ui.notifications.warn(localize("Warnings.DamageTypeIntensityRequired"));
      return;
    }

    const table = DAMAGE_TABLES[this.selectedType]?.[this.selectedSub];
    if (!table) {
      ui.notifications.warn(localize("Warnings.DamageTableNotFound"));
      return;
    }

    const formula = table[this.currentLevel];
    if (!formula) {
      ui.notifications.warn(localize("Warnings.FormulaNotFound"));
      return;
    }

    if (this.callback) {
      this.callback(formula);
    }

    await this.close();
  }

}

async function showDCSuggestionDialog() {
  return renderNpcLevelDialog(DCSuggestionDialogV2, result => result?.dc ?? null);
}

async function showDamageSuggestionDialog() {
  return renderNpcLevelDialog(DamageSuggestionDialogV2);
}

function generateTemplateString(type, distance) {
  if (!type || !distance) return null;
  return `@Template[type:${type}|distance:${distance}]`;
}

function generateDamageString(formula, damageType, traits = []) {
  if (!formula || !damageType) return null;
  const traitsPart = traits.length > 0 ? `|traits:${traits.join(',')}` : '';
  return `@Damage[${formula}[${damageType}]${traitsPart}]`;
}

function generateCheckString(saveType, dc, basic = true, showDC = "all") {
  if (!saveType || !dc) return null;
  const basicPart = basic ? "|basic:true" : "";
  return `@Check[type:${saveType}|dc:${dc}${basicPart}|showDC:${showDC}]`;
}

function parseDescriptionBlock(text) {
  const out = { template: null, check: null, damage: null };
  if (!text) return out;

  const templateLabel = escapeRegExp(localize("Description.Template"));
  const savingThrowLabel = escapeRegExp(localize("Description.SavingThrow"));
  const damageLabel = escapeRegExp(localize("Description.Damage"));

  const templateMatch = text.match(new RegExp(`(?:Template:|${templateLabel})\\s*@Template\\[type:(\\w+)\\|distance:(\\d+)\\]`, 'i'));
  if (templateMatch) {
    out.template = { type: templateMatch[1], distance: parseInteger(templateMatch[2]) };
  }

  const checkMatch = text.match(new RegExp(`(?:Saving Throw:|${savingThrowLabel})\\s*@Check\\[type:(\\w+)\\|dc:(\\d+)(?:\\|basic:(true|false))?\\|showDC:(\\w+)\\]`, 'i'));
  if (checkMatch) {
    out.check = {
      saveType: checkMatch[1],
      dc: parseInteger(checkMatch[2]),
      basic: checkMatch[3] === "true",
      showDC: checkMatch[4]
    };
  }

  const damageMatch = text.match(new RegExp(`(?:Damage:|${damageLabel})\\s*@Damage\\[([^[]+)\\[(\\w+)\\](?:\\|traits:([^\\]]*))?\\]`, 'i'));
  if (damageMatch) {
    const traits = damageMatch[3]
      ? damageMatch[3].split(",").map(trait => trait.trim()).filter(Boolean)
      : [];
    out.damage = { formula: damageMatch[1], damageType: damageMatch[2], traits };
  }

  return out;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectExistingAutomations(editorRef) {
  const result = { sc: "", s: "", f: "", fc: "" };
  const automationResultByLabel = getAutomationResultByLabel();
  const editable = getEditorEditable(editorRef);
  if (!editable) return result;
  const html = editorHtml(editable);
  const lastDivider = findLastHtmlDivider(html);
  let targetHtml = html;
  if (lastDivider) {
    targetHtml = html.substring(lastDivider.index + lastDivider[0].length);
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = targetHtml;
  tmp.querySelectorAll("p").forEach(p => {
    const strong = p.querySelector("strong");
    if (!strong) return;
    const label = strong.textContent.trim();
    const paragraph = p.cloneNode(true);
    paragraph.querySelector("strong").remove();
    let content = paragraph.textContent.trim();
    content = convertAutomationHtmlToShortText(content.replace(/^[:\s]+/, ''));
    const resultKey = automationResultByLabel.get(label);
    if (resultKey) result[resultKey] = content;
  });
  return result;
}

function applyAutomationToEditorContent(editorRef, applyText) {
  const editable = getEditorEditable(editorRef);
  if (!editable) return false;
  const raw = editorHtml(editable);
  const newContent = updatedAutomationHtml(raw, applyText);
  if (newContent === raw) return false;
  writeEditorHtml(editable, newContent);
  return true;
}

function updatedAutomationHtml(raw, applyText) {
  const divider = findLastHtmlDivider(raw);
  const section = document.createElement("div");
  section.innerHTML = divider ? raw.slice(divider.index + divider[0].length) : raw;
  const automationParagraphs = [...section.querySelectorAll("p")].filter(paragraph => {
    const label = paragraph.querySelector("strong")?.textContent.trim();
    return getAutomationFields().some(([, expected]) => expected === label);
  });
  const automationHtml = applyText.trim() ? automationLinesToParagraphHtml(applyText, convertAutomationText) : "";
  if (!automationParagraphs.length) return automationHtml ? [raw, automationHtml].filter(Boolean).join("<hr>") : raw;
  automationParagraphs.forEach(paragraph => paragraph.remove());
  const beforeSection = divider ? raw.slice(0, divider.index).trim() : "";
  return [beforeSection, section.innerHTML.trim(), automationHtml].filter(Boolean).join("<hr>");
}

function localizeOption(option) {
  return { ...option, tooltip: localize(option.tooltipKey) };
}

function getInlineBuilderLabels() {
  return {
    sectionsAria: localize("Labels.SectionsAria"),
    areaTemplate: localize("Labels.AreaTemplate"),
    damage: localize("Labels.Damage"),
    savingThrow: localize("Labels.SavingThrow"),
    automations: localize("Labels.Automations"),
    templateType: localize("Labels.TemplateType"),
    distance: localize("Labels.Distance"),
    decreaseDistance: localize("Tooltips.DecreaseDistance"),
    increaseDistance: localize("Tooltips.IncreaseDistance"),
    resetDistance: localize("Tooltips.ResetDistance"),
    formula: localize("Labels.Formula"),
    suggestBasedOnLevel: localize("Tooltips.SuggestBasedOnLevel"),
    damageType: localize("Labels.DamageType"),
    selectPlaceholder: localize("Labels.SelectPlaceholder"),
    traits: localize("Labels.Traits"),
    save: localize("Labels.Save"),
    dc: localize("Labels.Dc"),
    basic: localize("Labels.Basic"),
    basicSave: localize("Tooltips.BasicSave"),
    showAs: localize("Labels.ShowAs"),
    addCondition: localize("Tooltips.AddCondition"),
    textEditor: localize("Tooltips.TextEditor"),
    apply: localize("Labels.Apply")
  };
}

class InlineBuilderDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = getInlineBuilderDialogOptions({
    id: "inlinebuilder-dialog",
    titleKey: "Window.InlineBuilder",
    icon: "fas fa-pen",
    width: 520,
    window: {
      resizable: false,
      minimizable: true
    },
    actions: { insertAll: InlineBuilderDialog.insertAll }
  });

  static PARTS = MAIN_TEMPLATE_PART;

  activeSections = new Set(["template"]);
  selectedTemplateType = null;
  selectedSaveType = null;
  selectedShowDC = "all";
  selectedTraits = new Set();

  constructor(options = {}) {
    super(options);
    this.editorRef = options.editorRef ?? null;
    this.creatureLevel = options.level ?? null;
    creatureLevelOverride = this.creatureLevel;
    this.addEventListener("close", () => {
      if (creatureLevelOverride === this.creatureLevel) creatureLevelOverride = null;
    }, { once: true });
  }

  async _prepareContext(_options) {
    return {
      mainTemplate: true,
      labels: getInlineBuilderLabels(),
      templateTypes: TEMPLATE_CONFIG.types.map(localizeOption),
      damageTypes: DAMAGE_TYPES,
      damageTypeSelect: { id: "damage-type", name: "damageType" },
      saveTypes: TEMPLATE_CONFIG.saveTypes.map(localizeOption),
      showDCOptions: TEMPLATE_CONFIG.showDCOptions.map(localizeOption),
      traits: TEMPLATE_CONFIG.traits.map(localizeOption),
      automationFields: getAutomationTemplateFields(),
      defaultDamage: getDefaultDamageFormula(),
      defaultDC: getDefaultDC()
    };
  }

  _fitToContent() {
    if (!this.element) return;
    this.element.style.width = "520px";
    this.element.style.removeProperty("height");
    const content = this.element.querySelector(".window-content");
    content?.style.removeProperty("height");
    content?.style.removeProperty("max-height");
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this._bindSectionToggles();
    this._bindSegmentButtons();
    this._bindAuxiliaryButtons();
    this._hydrateFromEditor();
    this._syncBasicSaveState();
    this._fitToContent();
  }

  _setInput(selector, value) {
    const input = this.element.querySelector(selector);
    if (input) input.value = value;
  }

  _setSectionActive(section, active) {
    if (active) this.activeSections.add(section);
    else this.activeSections.delete(section);
    this.element.querySelector(`.inlinebuilder-toggle[data-section="${section}"]`)?.classList.toggle('active', active);
    this.element.querySelector(`fieldset[data-section="${section}"]`)?.style.setProperty('display', active ? 'block' : 'none');
  }

  _syncBasicSaveState() {
    const basicSaveInput = this.element.querySelector("#basic-save");
    if (!basicSaveInput) return;

    const damageActive = this.activeSections.has("damage");
    basicSaveInput.checked = damageActive;
    basicSaveInput.disabled = !damageActive;
  }

  _bindSectionToggles() {
    this.element.querySelectorAll(".inlinebuilder-toggle").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const section = btn.dataset.section;
        this._setSectionActive(section, !btn.classList.contains("active"));
        this._syncBasicSaveState();
        this._fitToContent();
      });
    });

    this.element.querySelector("#basic-save")?.addEventListener("change", (event) => {
      if (!event.currentTarget.checked) this._setSectionActive("damage", false);
      this._syncBasicSaveState();
      this._fitToContent();
    });
  }

  _bindSegment(selector, setter) {
    this.element.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.element.querySelectorAll(selector).forEach(button => button.classList.remove("active"));
        btn.classList.add("active");
        setter(btn.dataset.value);
      });
    });
  }

  _bindSegmentButtons() {
    this._bindSegment(".template-type-btn", value => { this.selectedTemplateType = value; });
    this._bindSegment(".save-type-btn", value => { this.selectedSaveType = value; });
    this._bindSegment(".show-dc-btn", value => { this.selectedShowDC = value; });

    this.element.querySelectorAll(".trait-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const trait = btn.dataset.value;
        if (btn.classList.contains("active")) {
          btn.classList.remove("active");
          this.selectedTraits.delete(trait);
        } else {
          btn.classList.add("active");
          this.selectedTraits.add(trait);
        }
      });
    });
  }

  _bindAuxiliaryButtons() {
    const distanceInput = this.element.querySelector("#template-distance");
    const adjustDistance = (event, delta) => {
      event.preventDefault();
      const amount = event.shiftKey ? 10 : 5;
      const current = parseInteger(distanceInput?.value, 0);
      setInputValue(distanceInput, Math.max(0, current + (delta * amount)));
    };

    this.element.querySelectorAll(".add-condition").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const targetInput = this.element.querySelector(btn.dataset.target);
        showConditionPicker(targetInput);
      });
    });

    this.element.querySelectorAll(".comfort-edit").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const targetInput = this.element.querySelector(btn.dataset.target);
        const content = await showComfortEditDialog(targetInput);
        if (content !== undefined) setInputValue(targetInput, content);
      });
    });

    this.element.querySelector("#distance-increase")?.addEventListener("click", e => adjustDistance(e, 1));
    this.element.querySelector("#distance-decrease")?.addEventListener("click", e => adjustDistance(e, -1));
    this.element.querySelector("#distance-reset")?.addEventListener("click", (e) => {
      e.preventDefault();
      setInputValue(distanceInput, 0);
    });

    this.element.querySelector("#suggest-damage-btn")?.addEventListener("click", async (e) => {
      e.preventDefault();
      const formula = await showDamageSuggestionDialog();
      if (formula) this._setInput("#damage-formula", formula);
    });

    this.element.querySelector("#suggest-dc-btn")?.addEventListener("click", async (e) => {
      e.preventDefault();
      const dc = await showDCSuggestionDialog();
      if (dc) setInputValue(this.element.querySelector("#dc-value"), dc);
    });
  }

  _hydrateFromEditor() {
    if (!this.editorRef) return;

    const parsed = parseDescriptionBlock(InlineBuilderDialog._getContentAboveFirstHR(this.editorRef));

    if (parsed.template) {
      this._setSectionActive("template", true);
      this.selectedTemplateType = parsed.template.type;
      this._setInput("#template-distance", parsed.template.distance);
      this.element.querySelector(`.template-type-btn[data-value="${parsed.template.type}"]`)?.classList.add('active');
    }

    if (parsed.check) {
      this._setSectionActive("check", true);
      this.selectedSaveType = parsed.check.saveType;
      this.selectedShowDC = parsed.check.showDC;
      this._setInput("#dc-value", parsed.check.dc);
      const basicCheck = this.element.querySelector("#basic-save");
      if (basicCheck) basicCheck.checked = parsed.check.basic;
      this.element.querySelector(`.save-type-btn[data-value="${parsed.check.saveType}"]`)?.classList.add('active');
      this.element.querySelector(`.show-dc-btn[data-value="${parsed.check.showDC}"]`)?.classList.add('active');
    }

    if (parsed.damage) {
      this._setSectionActive("damage", true);
      this._setInput("#damage-formula", parsed.damage.formula);
      this._setInput("#damage-type", parsed.damage.damageType);
      parsed.damage.traits.forEach(trait => {
        this.selectedTraits.add(trait);
        this.element.querySelector(`.trait-btn[data-value="${trait}"]`)?.classList.add('active');
      });
    }

    const existingAutomation = detectExistingAutomations(this.editorRef);
    for (const [key, , selector] of getAutomationFields()) {
      if (existingAutomation[key]) this._setInput(selector, existingAutomation[key]);
    }
    if (getAutomationFields().some(([key]) => existingAutomation[key])) {
      this._setSectionActive("automation", true);
    }
  }

  static _getContentAboveFirstHR(editorRef) {
    const editable = getEditorEditable(editorRef);
    if (!editable) return "";
    const raw = editorHtml(editable);
    const divider = findFirstEditorDivider(raw);
    const aboveHtml = raw.slice(0, divider?.index ?? raw.length).trim();
    if (!aboveHtml) return "";
    const div = document.createElement("div");
    div.innerHTML = aboveHtml;
    return (div.textContent || div.innerText || "").trim();
  }

  static _applyToEditorContent(editorRef, applyText) {
    const editable = getEditorEditable(editorRef);
    if (!editable) { return false; }
    const raw = editorHtml(editable);
    const divider = findFirstEditorDivider(raw);
    const fromHrOnward = divider
      ? (divider.isDash ? "<hr>" + raw.slice(divider.index + divider.text.length).trim() : raw.slice(divider.index).trim())
      : raw;
    const applyHtml = automationLinesToParagraphHtml(applyText);
    const newContent = applyHtml + (fromHrOnward.startsWith("<hr") ? fromHrOnward : "<hr>" + fromHrOnward);
    writeEditorHtml(editable, newContent);
    return true;
  }

  static async insertAll(_event, target) {
    try {
      const form = target.closest(".inlinebuilder-content");
      const lines = builderLines(this, form);
      const autoLines = this.activeSections.has("automation")
        ? getAutomationFields().map(([, label, selector]) => {
          const content = getInputValue(form.querySelector(selector));
          return content ? `${label} ${content}` : '';
        }).filter(Boolean)
        : [];
      if (!lines.length && !autoLines.length) throw new InvalidBuilderInput("Warnings.SectionRequired");
      await applyBuilderOutput(this, lines, autoLines);
    } catch (error) {
      if (!(error instanceof InvalidBuilderInput)) throw error;
      ui.notifications.warn(localize(error.message));
    }
  }

}

class InvalidBuilderInput extends Error {}

function builderTemplateLine(app, form) {
  if (!app.activeSections.has("template")) return "";
  const distance = parseInteger(form.querySelector("#template-distance").value, NaN);
  if (!app.selectedTemplateType) throw new InvalidBuilderInput("Warnings.AreaTypeRequired");
  if (!Number.isFinite(distance) || distance <= 0) throw new InvalidBuilderInput("Warnings.AreaDistanceRequired");
  return `${localize("Description.Template")} ${generateTemplateString(app.selectedTemplateType, distance)}`;
}

function builderCheckLine(app, form) {
  if (!app.activeSections.has("check")) return "";
  const dc = parseInteger(form.querySelector("#dc-value").value, NaN);
  if (!app.selectedSaveType) throw new InvalidBuilderInput("Warnings.SaveTypeRequired");
  if (!Number.isFinite(dc) || dc <= 0) throw new InvalidBuilderInput("Warnings.DcRequired");
  const basic = form.querySelector("#basic-save").checked;
  return `${localize("Description.SavingThrow")} ${generateCheckString(app.selectedSaveType, dc, basic, app.selectedShowDC)}`;
}

function builderDamageLine(app, form) {
  if (!app.activeSections.has("damage")) return "";
  const formula = form.querySelector("#damage-formula").value.trim();
  const damageType = form.querySelector("#damage-type").value;
  if (!formula) throw new InvalidBuilderInput("Warnings.DamageFormulaRequired");
  if (!damageType) throw new InvalidBuilderInput("Warnings.DamageTypeRequired");
  return `${localize("Description.Damage")} ${generateDamageString(formula, damageType, [...app.selectedTraits])}`;
}

function builderLines(app, form) {
  return [builderTemplateLine(app, form), builderCheckLine(app, form), builderDamageLine(app, form)].filter(Boolean);
}

async function applyBuilderOutput(app, lines, autoLines) {
  const applyText = lines.join('\n');
  if (app.editorRef && (!lines.length || InlineBuilderDialog._applyToEditorContent(app.editorRef, applyText))) {
    applyAutomationToEditorContent(app.editorRef, autoLines.join('\n'));
    await app.close();
    ui.notifications.info(localize("Notifications.Applied"));
    return;
  }
  try {
    await navigator.clipboard.writeText([...lines, ...autoLines].join('\n'));
  } catch (error) {
    ui.notifications.error(localize("Notifications.CopyFailed"));
    throw error;
  }
  ui.notifications.info(localize("Notifications.CopiedNoEditor"));
  await app.close();
}

export function openInlineBuilderDialog(editorRef = null, { level = null } = {}) {
  new InlineBuilderDialog({ editorRef, level }).render(true);
}
