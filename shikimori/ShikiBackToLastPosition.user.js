// ==UserScript==
// @name         Back to the last possition:Shikimori
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
// @description  try to take over the world!
// @author       Dark_zarich
// @grant        none
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiBackToLastPosition.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiBackToLastPosition.user.js
// ==/UserScript==

var scroll_bottom = 0;
$(".b-to-top").css("z-index", "10");

$(".b-to-top").click(function() {
  scroll_bottom = $("body").scrollTop();
  $("body").append("<div class='b-to-back' style='display: inline-block; position: fixed; top: 0; background: none; width: 120px; height: 100%; cursor: pointer; z-index: 5;'></div>");
  $(".b-to-back").click(function() {
    $('html, body').animate({
        scrollTop: scroll_bottom
    }, 500);
    $(".b-to-back").remove();
  });
});
