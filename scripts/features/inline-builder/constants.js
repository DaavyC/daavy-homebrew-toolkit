import { MODULE_ID } from "../../constants.js";

export const ADDONS_ID = "daavy-addons";
export const OUTCOME_SET = new Set(["criticalSuccess", "success", "failure", "criticalFailure"]);

export const PF2E_CONDITION_MAP = {
  "doomed": "Compendium.pf2e.conditionitems.Item.3uh1r86TzbQvosxv",
  "drained": "Compendium.pf2e.conditionitems.Item.4D2KBtexWXa6oUMR",
  "paralyzed": "Compendium.pf2e.conditionitems.Item.6uEgoh53GbXuHpTF",
  "deafened": "Compendium.pf2e.conditionitems.Item.9PR9y0bi4JPKnHPR",
  "controlled": "Compendium.pf2e.conditionitems.Item.9qGBRpbX9NEwtAAr",
  "fascinated": "Compendium.pf2e.conditionitems.Item.AdPVz7rbaVSRxHFg",
  "off-guard": "Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg",
  "stunned": "Compendium.pf2e.conditionitems.Item.dfCMdR4wnpbYNTix",
  "petrified": "Compendium.pf2e.conditionitems.Item.dTwPJuKgBQCMxixg",
  "stupefied": "Compendium.pf2e.conditionitems.Item.e1XGnhKNSQIm5IXg",
  "immobilized": "Compendium.pf2e.conditionitems.Item.eIcWbB5o3pP6OIMe",
  "unconscious": "Compendium.pf2e.conditionitems.Item.fBnFDH2MTzgFijKf",
  "sickened": "Compendium.pf2e.conditionitems.Item.fesd1n5eVhpCSS18",
  "fatigued": "Compendium.pf2e.conditionitems.Item.HL2l2VRSaQHu9lUw",
  "clumsy": "Compendium.pf2e.conditionitems.Item.i3OJZU2nk64Df3xm",
  "prone": "Compendium.pf2e.conditionitems.Item.j91X7x0XSomq8d60",
  "grabbed": "Compendium.pf2e.conditionitems.Item.kWc1fhmv9LBiTuei",
  "persistent-damage": "Compendium.pf2e.conditionitems.Item.lDVqvLKA6eF3Df60",
  "enfeebled": "Compendium.pf2e.conditionitems.Item.MIRkyAjyBeXivMa7",
  "quickened": "Compendium.pf2e.conditionitems.Item.nlCjDvLMf2EkV2dl",
  "fleeing": "Compendium.pf2e.conditionitems.Item.sDPxOjQ9kx2RZE8D",
  "frightened": "Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL",
  "dazzled": "Compendium.pf2e.conditionitems.Item.TkIyaNPgTZFBCCuh",
  "restrained": "Compendium.pf2e.conditionitems.Item.VcDeM8A5oI6VqhbM",
  "blinded": "Compendium.pf2e.conditionitems.Item.XgEqL1kFApUbl5Z2",
  "slowed": "Compendium.pf2e.conditionitems.Item.xYTAsEpcJE1Ccni3",
  "confused": "Compendium.pf2e.conditionitems.Item.yblD8fOR1J8rDwEQ",
  "invisible": "Compendium.pf2e.conditionitems.Item.zJxUflt9np0q4yML",
  "damage": "Damage"
};
export const PF2E_CONDITIONS = Object.keys(PF2E_CONDITION_MAP);
export const PF2E_CONDITION_SET = new Set(PF2E_CONDITIONS);
const VALUED_CONDITIONS =["doomed", "drained", "stunned", "stupefied", "sickened", "clumsy", "enfeebled", "frightened", "slowed"];
export const VALUED_CONDITION_SET = new Set(VALUED_CONDITIONS);
export const DAMAGE_TYPES = ["acid", "bleed", "bludgeoning", "cold", "electricity", "fire", "force", "mental", "piercing", "poison", "slashing", "sonic", "spirit", "vitality", "void"];

export const SORTED_DAMAGE_TYPES = [...DAMAGE_TYPES].sort((left, right) => right.length - left.length);
export const AUTOMATION_OUTCOME_BY_LABEL = new Map([
  ["critical success", "criticalSuccess"],
  ["success", "success"],
  ["failure", "failure"],
  ["critical failure", "criticalFailure"]
]);

export const DAMAGE_TABLES = {
  area: {
    limited: { "-1": "1d6", 0: "1d10", 1: "2d6", 2: "3d6", 3: "4d6", 4: "5d6", 5: "6d6", 6: "7d6", 7: "8d6", 8: "9d6", 9: "10d6", 10: "11d6", 11: "12d6", 12: "13d6", 13: "14d6", 14: "15d6", 15: "16d6", 16: "17d6", 17: "18d6", 18: "19d6", 19: "20d6", 20: "21d6", 21: "22d6", 22: "23d6", 23: "24d6", 24: "25d6" },
    unlimited: { "-1": "1d4", 0: "1d6", 1: "2d4", 2: "2d6", 3: "2d8", 4: "3d6", 5: "2d10", 6: "4d6", 7: "4d6", 8: "5d6", 9: "5d6", 10: "6d6", 11: "6d6", 12: "5d8", 13: "7d6", 14: "4d12", 15: "8d6", 16: "8d6", 17: "8d6", 18: "9d6", 19: "9d6", 20: "6d10", 21: "10d6", 22: "8d8", 23: "11d6", 24: "11d6" }
  },
  strike: {
    extreme: { "-1": "1d6+1", 0: "1d6+3", 1: "1d8+4", 2: "1d12+4", 3: "1d12+8", 4: "2d10+7", 5: "2d12+7", 6: "2d12+10", 7: "2d12+12", 8: "2d12+15", 9: "2d12+17", 10: "2d12+20", 11: "2d12+22", 12: "3d12+19", 13: "3d12+21", 14: "3d12+24", 15: "3d12+26", 16: "3d12+29", 17: "3d12+31", 18: "3d12+34", 19: "4d12+29", 20: "4d12+32", 21: "4d12+34", 22: "4d12+37", 23: "4d12+39", 24: "4d12+42" },
    high: { "-1": "1d4+1", 0: "1d6+2", 1: "1d6+3", 2: "1d10+4", 3: "1d10+6", 4: "2d8+5", 5: "2d8+7", 6: "2d8+9", 7: "2d10+9", 8: "2d10+11", 9: "2d10+13", 10: "2d12+13", 11: "2d12+15", 12: "3d10+14", 13: "3d10+16", 14: "3d10+18", 15: "3d12+17", 16: "3d12+18", 17: "3d12+19", 18: "3d12+20", 19: "4d10+20", 20: "4d10+22", 21: "4d10+24", 22: "4d10+26", 23: "4d12+24", 24: "4d12+26" },
    moderate: { "-1": "1d4", 0: "1d4+2", 1: "1d6+2", 2: "1d8+4", 3: "1d8+6", 4: "2d6+5", 5: "2d6+6", 6: "2d6+8", 7: "2d8+8", 8: "2d8+9", 9: "2d8+11", 10: "2d10+11", 11: "2d10+12", 12: "3d8+12", 13: "3d8+14", 14: "3d8+15", 15: "3d10+14", 16: "3d10+15", 17: "3d10+16", 18: "3d10+17", 19: "4d8+17", 20: "4d8+19", 21: "4d8+20", 22: "4d8+22", 23: "4d10+20", 24: "4d10+22" },
    low: { "-1": "1d4", 0: "1d4+1", 1: "1d4+2", 2: "1d6+3", 3: "1d6+5", 4: "2d4+4", 5: "2d4+6", 6: "2d4+7", 7: "2d6+6", 8: "2d6+8", 9: "2d6+9", 10: "2d6+10", 11: "2d8+10", 12: "3d6+10", 13: "3d6+11", 14: "3d6+13", 15: "3d6+14", 16: "3d6+15", 17: "3d6+16", 18: "3d6+17", 19: "4d6+14", 20: "4d6+15", 21: "4d6+17", 22: "4d6+18", 23: "4d6+19", 24: "4d6+21" }
  }
};

export const DC_TABLE = {
  extreme: { "-1": 19, 0: 19, 1: 20, 2: 22, 3: 23, 4: 25, 5: 26, 6: 27, 7: 29, 8: 30, 9: 32, 10: 33, 11: 34, 12: 36, 13: 37, 14: 39, 15: 40, 16: 41, 17: 43, 18: 44, 19: 46, 20: 47, 21: 48, 22: 50, 23: 51, 24: 52 },
  high: { "-1": 16, 0: 16, 1: 17, 2: 18, 3: 20, 4: 21, 5: 22, 6: 24, 7: 25, 8: 26, 9: 28, 10: 29, 11: 30, 12: 32, 13: 33, 14: 34, 15: 36, 16: 37, 17: 38, 18: 40, 19: 41, 20: 42, 21: 44, 22: 45, 23: 46, 24: 48 },
  moderate: { "-1": 13, 0: 13, 1: 14, 2: 15, 3: 17, 4: 18, 5: 19, 6: 21, 7: 22, 8: 23, 9: 25, 10: 26, 11: 27, 12: 29, 13: 30, 14: 31, 15: 33, 16: 34, 17: 35, 18: 37, 19: 38, 20: 39, 21: 41, 22: 42, 23: 43, 24: 45 }
};

export const TEMPLATE_CONFIG = {
  types: [
    { value: "burst", icon: "fa-circle", tooltipKey: "TemplateTypes.Burst" },
    { value: "cone", icon: "fa-angle-left", tooltipKey: "TemplateTypes.Cone" },
    { value: "square", icon: "fa-square", tooltipKey: "TemplateTypes.Square" },
    { value: "line", icon: "fa-grip-lines", tooltipKey: "TemplateTypes.Line" }
  ],
  saveTypes: [
    { value: "fortitude", icon: "fa-chess-rook", tooltipKey: "SaveTypes.Fortitude" },
    { value: "reflex", icon: "fa-person-running", tooltipKey: "SaveTypes.Reflex" },
    { value: "will", icon: "fa-brain", tooltipKey: "SaveTypes.Will" }
  ],
  showDCOptions: [
    { value: "all", icon: "fa-users", tooltipKey: "ShowDCOptions.All" },
    { value: "owner", icon: "fa-user", tooltipKey: "ShowDCOptions.Owner" },
    { value: "gm", icon: "fa-crown", tooltipKey: "ShowDCOptions.Gm" },
    { value: "none", icon: "fa-eye-slash", tooltipKey: "ShowDCOptions.None" }
  ],
  traits: [
    { value: "area-damage", icon: "fa-burst", tooltipKey: "Traits.AreaDamage" },
    { value: "splash", icon: "fa-droplet", tooltipKey: "Traits.Splash" },
    { value: "persistent", icon: "fa-clock", tooltipKey: "Traits.Persistent" }
  ]
};

export const INLINEBUILDER_LEVEL_CONTROL_PARTIAL = `
<div class="inlinebuilder-row">
  <div class="inlinebuilder-label">
    <label>{{labels.level}}</label>
    <span>{{labels.creatureLevel}}</span>
  </div>
  <div class="inlinebuilder-control dmg-level-row">
    <button type="button" class="dmg-level-btn" data-action="adjustLevel" data-delta="-1">&minus;</button>
    <span id="{{levelControlId}}" class="dmg-level-value">{{currentLevel}}</span>
    <button type="button" class="dmg-level-btn" data-action="adjustLevel" data-delta="1">+</button>
  </div>
</div>`;
export const INLINEBUILDER_ICON_SEGMENT_PARTIAL = `
{{#each options}}
<button type="button" class="icon-btn {{../buttonClass}}{{#if (eq this.value ../activeValue)}} active{{/if}}" data-value="{{this.value}}" data-tooltip="{{this.tooltip}}">
  <i class="fas {{this.icon}}"></i>
</button>
{{/each}}`;
export const INLINEBUILDER_DAMAGE_TYPE_SELECT_PARTIAL = `
<select{{#if damageTypeSelect.id}} id="{{damageTypeSelect.id}}"{{/if}} name="{{damageTypeSelect.name}}">
  <option value="">{{labels.selectPlaceholder}}</option>
  {{#each damageTypes}}
  <option value="{{this}}">{{this}}</option>
  {{/each}}
</select>`;

export const MAIN_TEMPLATE_PART = {
  form: { template: `modules/${MODULE_ID}/templates/inline-builder.hbs` }
};

export const CONDITION_LABEL_BY_SLUG = new Map(PF2E_CONDITIONS.map(slug => [
  slug,
  slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
]));

export const DMG_SUGGEST_LEVEL_MIN = -1;
export const DMG_SUGGEST_LEVEL_MAX = 24;

export const AUTOMATION_FIELDS = [
  ["sc", "Automation.CriticalSuccess", "#auto-sc", "autoSc"],
  ["s", "Automation.Success", "#auto-s", "autoS"],
  ["f", "Automation.Failure", "#auto-f", "autoF"],
  ["fc", "Automation.CriticalFailure", "#auto-fc", "autoFc"]
];
