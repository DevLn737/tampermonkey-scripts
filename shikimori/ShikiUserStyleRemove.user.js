// ==UserScript==
// @name         Shiki User Style Remove
// @namespace    https://shikimori.rip/
// @version      1.0.1
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @match        *://shikimori.io/*
// @match        *://shiki.one/*
// @match        *://shikimori.rip/*
// @match        *://shikimori.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain_url=https://shikimori.rip
// @description  Disabled Shiki User Styles
// @author       kaur
// @grant        none
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiUserStyleRemove.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiUserStyleRemove.user.js
// ==/UserScript==

const func = () => $('#custom_css').remove();

$(document).ready(func);
$(document).on('page:load', func);
$(document).on('turbolinks:load', func);
