// ==UserScript==
// @name         Рейтинг Шики
// @namespace    https://shikimori.rip/
// @version      1.8.1
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @match        *://shikimori.io/*
// @match        *://shiki.one/*
// @match        *://shikimori.rip/*
// @match        *://shikimori.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain_url=https://shikimori.rip
// @description  Добавляет среднюю оценку пользователей Шикимори на страницы тайтлов и личную среднюю оценку на страницы списков.
// @author       grin3671
// @license      MIT
// @grant        none
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiRatingAlternative.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiRatingAlternative.user.js
// ==/UserScript==

(function() {
  'use strict';

  function checkPage () {
    let currentURL = location.pathname.substring(1).split('/');
    let selector;
    switch (currentURL[0]) {
      case 'animes':
      case 'mangas':
      case 'ranobe':
        selector = 'rates_scores_stats';
        console.debug(document.getElementById(selector).getAttribute('data-stats'));
        if (document.getElementById(selector).getAttribute('data-stats') == null) return;
        showScore(selector, getScore(selector));
        break;
    }
    switch (currentURL[1]) {
      case 'list':
        selector = 'scores';
        console.debug(document.getElementById(selector).getAttribute('data-stats'));
        if (document.getElementById(selector).getAttribute('data-stats') == null) return;
        showScore(selector, getScore(selector, 'name'));
        break;
    }
  }

  function getScore (id, key) {
    let data, total, rates;
    data = JSON.parse(document.getElementById(id).getAttribute('data-stats'));
    total = data.reduce((a, b) => a + (key ? +b.value : +b[1]), 0);
    rates = data.reduce((a, b) => a + (key ? +b[key] * +b.value : +b[0] * +b[1]), 0);
    console.debug('Средняя оценка:', (rates / total).toFixed(2));
    return { total, rates };
  }

  function showScore (selector, score) {
    let subheadline, elem;
    subheadline = document.getElementById(selector).parentElement.querySelector('.subheadline');
    if (subheadline.children.length == 0) {
      elem = document.createElement('div');
      elem.style.float = 'right';
      elem.textContent = (score.rates / score.total).toFixed(2) + ' (' + score.total + ')';
      subheadline.appendChild(elem);
    }
  }

  checkPage();

  document.addEventListener('page:load', checkPage);
  document.addEventListener('turbolinks:load', checkPage);
})();
