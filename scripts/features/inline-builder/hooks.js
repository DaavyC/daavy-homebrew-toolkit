import { MODULE_ID } from "../../constants.js";
import { getHTMLElement } from "../../utils.js";
import { registerAutomationHooks } from "./automations.js";
import {
  openInlineBuilderDialog,
  registerInlineBuilderPartials,
  registerProseMirrorViews,
  setCurrentNpcActor
} from "./inline-builder.js";
import { localize } from "./utils.js";

let editorInjectionFrame = null;
const pendingEditorInjectionRoots = new Set();

function queueInlineBuilderEditorInjection(root) {
  const element = getHTMLElement(root) ?? root;
  if (!(element instanceof Element || element instanceof DocumentFragment)) return;

  pendingEditorInjectionRoots.add(element);
  if (editorInjectionFrame !== null) return;

  editorInjectionFrame = window.requestAnimationFrame(() => {
    editorInjectionFrame = null;
    const roots = Array.from(pendingEditorInjectionRoots);
    pendingEditorInjectionRoots.clear();
    roots.forEach(injectInlineBuilderEditorButton);
  });
}

function canShowInlineBuilderEditorButton(editor) {
  if (!(editor instanceof HTMLElement)) return false;
  if (editor.closest("#chat-message, #chat-notifications, #chat, #chat-form, #chat-controls, #chat-log, #sidebar, .chat-sidebar")) return false;
  return !!editor.querySelector('.ProseMirror[contenteditable]:not([contenteditable="false"]), [contenteditable]:not([contenteditable="false"])');
}

function injectInlineBuilderEditorButton(container) {
  const root = getHTMLElement(container) ?? container;
  if (!root) return;

  const editors = new Set();
  if (root.matches?.(".editor")) editors.add(root);
  root.closest?.(".editor") && editors.add(root.closest(".editor"));
  root.querySelectorAll?.(".editor").forEach(editor => editors.add(editor));

  editors.forEach(editor => {
    editor.querySelectorAll(".editor-menu .inlinebuilder-editor-btn, menu.editor-menu .inlinebuilder-editor-btn")
      .forEach(button => button.closest("li")?.remove() ?? button.remove());

    if (!canShowInlineBuilderEditorButton(editor)) {
      editor.querySelector(":scope > .inlinebuilder-editor-btn")?.remove();
      editor.classList.remove("inlinebuilder-editor-host");
      return;
    }

    if (editor.querySelector(":scope > .inlinebuilder-editor-btn")) return;

    editor.classList.add("inlinebuilder-editor-host");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "inlinebuilder-editor-btn";
    btn.setAttribute("data-tooltip", localize("Window.InlineBuilder"));
    btn.innerHTML = '<i class="fa-solid fa-wand-sparkles fa-fw"></i>';

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const editorContainer = this.closest(".editor");
      openInlineBuilderDialog(editorContainer);
    });

    editor.appendChild(btn);
  });
}

function handleRenderedSheet(app, html) {
  if (app.actor?.type === "npc") setCurrentNpcActor(app.actor);
  setTimeout(() => {
    queueInlineBuilderEditorInjection(html);
  }, 150);
}

function observeEditors() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.target instanceof Element) queueInlineBuilderEditorInjection(mutation.target);
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        queueInlineBuilderEditorInjection(node);
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["contenteditable"]
  });
}

function registerInlineBuilderKeybinding() {
  game.keybindings.register(MODULE_ID, "openDialog", {
    name: localize("Keybindings.OpenDialog.Name"),
    hint: localize("Keybindings.OpenDialog.Hint"),
    editable: [{ key: "KeyT", modifiers: ["Control", "Shift"] }],
    onDown: () => {
      openInlineBuilderDialog();
      return true;
    },
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });
}

export function registerInlineBuilderHooks() {
  Hooks.once("init", () => {
    registerInlineBuilderPartials();
    registerInlineBuilderKeybinding();
  });
  registerProseMirrorViews();
  registerAutomationHooks();
  Hooks.on("renderActorSheet", handleRenderedSheet);
  Hooks.on("renderItemSheet", handleRenderedSheet);
  Hooks.on("renderApplicationV2", (app, html) => {
    if (app.actor || app.item) handleRenderedSheet(app, html);
  });
  Hooks.once("ready", observeEditors);
}
