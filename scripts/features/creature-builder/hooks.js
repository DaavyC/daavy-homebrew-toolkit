import { I18N_PREFIX } from "../../constants.js";
import { getHTMLElement } from "../../utils.js";
import { BESTIARY_BUTTON_SELECTOR, BUTTON_CLASS } from "./constants.js";
import { openCreatureBuilder } from "./creature-builder.js";

function addCreatureBuilderButton(_application, renderedHtml) {
  const root = getHTMLElement(renderedHtml);
  const bestiaryButton = root?.querySelector(BESTIARY_BUTTON_SELECTOR);
  if (!game.user.isGM || !bestiaryButton || root.querySelector(`.${BUTTON_CLASS}`)) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = BUTTON_CLASS;

  const icon = document.createElement("i");
  icon.className = "fa-solid fa-dragon";
  const label = document.createElement("span");
  label.textContent = game.i18n.localize(`${I18N_PREFIX}.CreatureBuilder.OpenButton`);

  button.append(icon, label);
  button.addEventListener("click", openCreatureBuilder);
  bestiaryButton.before(button);
}

export function registerCreatureBuilderHooks() {
  Hooks.on("renderActorDirectory", addCreatureBuilderButton);
}
