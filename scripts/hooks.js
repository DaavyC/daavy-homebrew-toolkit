import { MODULE_ID } from "./constants.js";
import { injectFeedbackButton } from "./feedback.js";
import { registerCreatureBuilderHooks } from "./features/creature-builder/hooks.js";
import { registerInlineBuilderHooks } from "./features/inline-builder/hooks.js";
import { applyTheme, registerSettings } from "./settings.js";

export function registerHooks() {
  Hooks.once("init", registerSettings);

  Hooks.once("ready", () => {
    applyTheme();
    console.info(`${MODULE_ID} | Ready`);
  });

  Hooks.on("renderSettingsConfig", (_application, renderedHtml) => injectFeedbackButton(renderedHtml));
  registerCreatureBuilderHooks();
  registerInlineBuilderHooks();
}
