import { I18N_PREFIX, MODULE_ID, SETTINGS } from "./constants.js";
import { findSettingRow } from "./settings.js";
import { getHTMLElement } from "./utils.js";

const FEEDBACK_ENDPOINT = "https://feedback.daavyc.workers.dev";
const FEEDBACK_TEMPLATE = `modules/${MODULE_ID}/templates/feedback.hbs`;
const DONATE_URL = "https://ko-fi.com/daavy";
const DISCORD_URL = "https://discord.gg/ZmFZxdGrta";
const MAX_MESSAGE_LENGTH = 3000;
const FEEDBACK_I18N_PREFIX = `${I18N_PREFIX}.Feedback`;
const CATEGORIES = ["Bug", "Suggestion"];
const FEEDBACK_ACTIONS_CLASS = `${MODULE_ID}-settings-actions`;

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class FeedbackForm extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-feedback`,
    tag: "form",
    window: {
      title: `${FEEDBACK_I18N_PREFIX}.MenuLabel`,
      icon: "fa-solid fa-comment-dots",
      contentClasses: ["standard-form"]
    },
    position: {
      width: 500
    },
    form: {
      closeOnSubmit: false,
      handler: FeedbackForm.#onSubmit
    }
  };

  static PARTS = {
    form: {
      template: FEEDBACK_TEMPLATE,
      root: true
    }
  };

  #submitting = false;

  async _prepareContext() {
    return {
      maxLength: MAX_MESSAGE_LENGTH,
      categories: CATEGORIES.map((value) => ({ value, label: game.i18n.localize(`${FEEDBACK_I18N_PREFIX}.Categories.${value}`) }))
    };
  }

  static async #onSubmit(_event, form, formData) {
    if (this.#submitting) return;

    const category = String(formData.object.category ?? "").trim();
    const message = String(formData.object.message ?? "").trim();
    if (!CATEGORIES.includes(category) || !message || message.length > MAX_MESSAGE_LENGTH) {
      ui.notifications.warn(game.i18n.localize(`${FEEDBACK_I18N_PREFIX}.Invalid`));
      return;
    }

    if (!game.user.isGM) return;

    const submitButton = form.querySelector('button[type="submit"]');
    this.#submitting = true;
    if (submitButton) submitButton.disabled = true;

    try {
      const module = game.modules.get(MODULE_ID);
      const response = await fetch(FEEDBACK_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          category,
          moduleName: module?.title ?? MODULE_ID,
          moduleVersion: module?.version ?? "",
          foundryVersion: game.version ?? "",
          systemId: game.system?.id ?? "",
          systemVersion: game.system?.version ?? ""
        })
      });

      if (!response.ok) throw new Error(`Feedback request failed with status ${response.status}.`);

      ui.notifications.info(game.i18n.localize(`${FEEDBACK_I18N_PREFIX}.Success`));
      await this.close();
    } catch (error) {
      console.error(`${MODULE_ID} | Unable to send feedback.`, error);
      ui.notifications.error(game.i18n.localize(`${FEEDBACK_I18N_PREFIX}.Error`));
    } finally {
      this.#submitting = false;
      if (submitButton) submitButton.disabled = false;
    }
  }
}

export function injectFeedbackButton(renderedHtml) {
  const container = getHTMLElement(renderedHtml);
  if (!container || !game.user.isGM || container.querySelector(`.${FEEDBACK_ACTIONS_CLASS}`)) return;

  const firstRow = findSettingRow(container, SETTINGS.THEME);
  if (!firstRow) return;

  const documentRef = container.ownerDocument;
  const actions = documentRef.createElement("div");
  actions.className = FEEDBACK_ACTIONS_CLASS;

  actions.append(
    createActionButton(documentRef, {
      className: `${MODULE_ID}-donate-action`,
      icon: "fa-solid fa-heart",
      label: game.i18n.localize(`${I18N_PREFIX}.Donate.Label`),
      onClick: () => documentRef.defaultView.open(DONATE_URL, "_blank", "noopener,noreferrer")
    }),
    createActionButton(documentRef, {
      className: `${MODULE_ID}-discord-action`,
      icon: "fa-brands fa-discord",
      label: game.i18n.localize(`${I18N_PREFIX}.Discord.Label`),
      onClick: () => documentRef.defaultView.open(DISCORD_URL, "_blank", "noopener,noreferrer")
    }),
    createActionButton(documentRef, {
      className: `${MODULE_ID}-feedback-action`,
      icon: "fa-solid fa-comment-dots",
      label: game.i18n.localize(`${FEEDBACK_I18N_PREFIX}.MenuLabel`),
      title: game.i18n.localize(`${FEEDBACK_I18N_PREFIX}.MenuHint`),
      onClick: () => new FeedbackForm().render({ force: true })
    })
  );
  firstRow.before(actions);
}

function createActionButton(documentRef, { className, icon, label, onClick, title }) {
  const button = documentRef.createElement("button");
  button.type = "button";
  button.className = className;
  const iconElement = documentRef.createElement("i");
  iconElement.className = icon;
  button.append(iconElement, ` ${label}`);
  if (title !== undefined) button.title = title;
  button.addEventListener("click", onClick);
  return button;
}
