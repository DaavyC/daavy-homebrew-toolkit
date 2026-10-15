import { I18N_PREFIX, MODULE_ID, SETTINGS, THEMES } from "./constants.js";

const LIGHT_THEME_CLASS = `${MODULE_ID}-light`;

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.THEME, {
    name: `${I18N_PREFIX}.Settings.Theme.Name`,
    hint: `${I18N_PREFIX}.Settings.Theme.Hint`,
    scope: "client",
    config: true,
    type: String,
    choices: {
      [THEMES.DEFAULT]: `${I18N_PREFIX}.Settings.Theme.Default`,
      [THEMES.LIGHT]: `${I18N_PREFIX}.Settings.Theme.Light`
    },
    default: THEMES.DEFAULT,
    onChange: applyTheme
  });
}

export function applyTheme(theme = game.settings.get(MODULE_ID, SETTINGS.THEME)) {
  document.body.classList.toggle(LIGHT_THEME_CLASS, theme === THEMES.LIGHT);
}

export function findSettingRow(container, key) {
  const settingId = `${MODULE_ID}.${key}`;
  return container.querySelector(`[data-setting-id="${settingId}"]`)?.closest(".form-group")
    ?? container.querySelector(`[id$="${settingId}"]`)?.closest(".form-group")
    ?? null;
}
