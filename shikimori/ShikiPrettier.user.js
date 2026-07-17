// ==UserScript==
// @name         ShikiPrettier
// @namespace    https://shikimori.rip/
// @version      1.3.1
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @match        *://shikimori.io/*
// @match        *://shiki.one/*
// @match        *://shikimori.rip/*
// @match        *://shikimori.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain_url=https://shikimori.rip
// @description  Prettier for shikimori style editor
// @author       Dedonych
// @include      /https?:\/\/(www\.)?shiki(mori)?\.([a-z]+?)\/.*/
// @require      https://unpkg.com/prettier@3.3.3/standalone.js
// @require      https://unpkg.com/prettier@3.3.3/plugins/postcss.js
// @grant        none
// @license      MIT
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiPrettier.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiPrettier.user.js
// ==/UserScript==
{
  const setup = () => {
    if (document.getElementById("prettier-btn")) return;
    //check for current page as edit/styles
    if (
      !location.pathname.includes("/edit/styles") ||
      !document.querySelector(".CodeMirror")
    )
      return setTimeout(() => setup(), 1000);
    //create button "Prettier"
    const btn = Object.assign(document.createElement("input"), {
      type: "submit",
      onclick: async function (e) {
        e.preventDefault();
        this.disabled = true;
        this.value = "loading...";
        const cm = document.querySelector(".CodeMirror").CodeMirror;
        const code = cm.getValue();
        try {
          const formatted = await prettier.format(code, {
            parser: "css",
            plugins: prettierPlugins,
          });
          cm.setValue(formatted);
        } catch (err) {
          const {
            cause: { reason, line, column },
            codeFrame,
          } = err;
          createErrorPrettier(reason, line, column, codeFrame);
        } finally {
          this.disabled = false;
          this.value = "Prettier";
        }
      },
      value: "Prettier",
      id: "prettier-btn",
      style: "margin-right:16px;background:#49749e",
    });

    document
      .querySelectorAll(".p-profiles-edit .editor-container .buttons").forEach(e=>e.prepend(btn.cloneNode()));
  };
// On error
  function createErrorPrettier(error, line, column, frame) {
    if (document.querySelector(".shiki-prettier_error")) {
      document.querySelector(".shiki-prettier_error").remove();
    }
    const errorElementDiv = Object.assign(document.createElement("div"), {
      className:
        "toastify on error toastify-right toastify-top shiki-prettier_error",
      innerHTML: `
          <b>ShikiPrettier Error:</b>
          <p>${error}</p>
          <p>line: ${line}; column:${column}</p>
          <pre>${frame}</pre>
          `,
      style: "transform: translate(0px, 0px); top: 15px;",
    });
    const btnClose = Object.assign(document.createElement("button"), {
      className: "toast-close",
      onclick: () => {
        errorElementDiv.classList.remove("on");
        setTimeout(() => errorElementDiv.remove(), 400);
      },
    });
    errorElementDiv.append(btnClose);
    setTimeout(() => errorElementDiv.remove(), 10000);
    document.body.prepend(errorElementDiv);
  }
  addEventListener("turbolinks:load", setup);
  addEventListener("DOMContentLoaded", setup);
  setup();
}
