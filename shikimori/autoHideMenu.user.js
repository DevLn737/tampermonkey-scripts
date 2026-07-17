// ==UserScript==
// @name         autoHideMenu
// @namespace    https://shikimori.rip/
// @version      1.1.1
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @match        *://shikimori.io/*
// @match        *://shiki.one/*
// @match        *://shikimori.rip/*
// @match        *://shikimori.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain_url=https://shikimori.rip
// @description  Hide menu on scroll.
// @author       grin3671
// @grant        none
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/autoHideMenu.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/autoHideMenu.user.js
// ==/UserScript==

'use strict';

function insertStyle(menuHeight) {
  var style, css;

  css = '.l-top_menu-v2 { transition: transform .24s ease; }';
  css += ' .l-top_menu-v2.is-hidden { transform: translateY(-' + menuHeight + 'px); }';
  css += ' .l-top_menu-v2.is-hover, .l-top_menu-v2:hover { transform: translateY(0); }';

  style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(css));

  document.head.appendChild(style);
}

function autoHideMenu () {
  var menu = document.querySelector('.l-top_menu-v2'),
      initial = 0,
      menuHeight = menu.offsetHeight;

  insertStyle(menuHeight);

  window.addEventListener('scroll', function () {
    var value = this.scrollY;
    if ( value > initial && value > menuHeight ) {
      menu.classList.add('is-hidden');
    } else {
      menu.classList.remove('is-hidden');
    }
    if (value + this.innerHeight == document.body.scrollHeight) {
      menu.classList.remove('is-hidden');
    }
		initial = value;
  });

  window.addEventListener('mousemove', function (e) {
    if (menuHeight > e.clientY) {
      menu.classList.add('is-hover');
    } else {
      menu.classList.remove('is-hover');
    }
  });
}

function ready (f) {
  document.addEventListener('page:load', f);
  document.addEventListener('turbolinks:load', f);

  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
    f();
  } else {
    document.addEventListener('DOMContentLoaded', f);
  }
}

ready(autoHideMenu);
