// ==UserScript==
// @name         Shiki History Dates
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
// @description  Dates in history on shikimori.me
// @author       ImoutoChan
// @grant        none
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiHistoryDates.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiHistoryDates.user.js
// ==/UserScript==


var func = function() {
    'use strict';

    $(".date").text(function() {
        return (new Date($(this).attr("datetime")).toLocaleDateString('en-GB', {
            day : 'numeric',
            month : 'short',
            year : 'numeric',
            hour : 'numeric',
            minute : 'numeric'
        }));
    });
};

$(document).ready(func);
$(document).on('page:load', func);
$(document).on('turbolinks:load', func);
$(document).on('postloader:success', func);
