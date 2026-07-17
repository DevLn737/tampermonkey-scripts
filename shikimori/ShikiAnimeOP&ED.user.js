// ==UserScript==
// @name         Shiki Anime OP/ED
// @namespace    https://shikimori.rip/
// @version      1.2.1
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @match        *://shikimori.io/*
// @match        *://shiki.one/*
// @match        *://shikimori.rip/*
// @match        *://shikimori.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain_url=https://shikimori.rip
// @description  Отображает опенинги и эндинги на странице аниме
// @author       ShaDream & Chortowod
// @connect      myanimelist.net
// @connect      www.myanimelist.net
// @copyright    2026, ShaDream, Chortowod (https://openuserjs.org/users/ShaDream)
// @require      https://gist.githubusercontent.com/Chortowod/814b010c68fc97e5f900df47bf79059c/raw/chtw_settings.js?v1
// @grant        GM_xmlhttpRequest
// @license      MIT
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiAnimeOP%26ED.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiAnimeOP%26ED.user.js
// ==/UserScript==

const siteName = window.location.origin;
const settings = new ChtwSettings('chtwOPandED', '<a target="_blank" href="https://openuserjs.org/scripts/Chortowod/Shiki_Anime_OPED">OP/ED</a>');

let debug = false;
let settingsInitialized = false;
let stylesAdded = false;
let loadingAnimeId = null;
let activeMalRequest = null;

const insertAfter = (element, reference) => reference.parentNode.insertBefore(element, reference.nextSibling);

function log(...messages) {
    if (debug) console.log('[Shiki Anime OP/ED]', ...messages);
}

function initSettings() {
    if (settingsInitialized) return;

    settings.createOption('youtube', 'Поиск по "Исполнитель - название"', true);
    settings.createOption('youtubeSimple', 'Поиск по "Аниме OP"', true);
    settings.createOption('isDebug', 'Режим отладки', false);
    settings.createOption('isFull', 'opening вместо op в поиске', false);
    debug = settings.getOption('isDebug');
    settingsInitialized = true;
}

function getAnimeId() {
    return window.location.pathname.match(/\/animes\/(\d+)(?:-|\/|$)/)?.[1] || null;
}

function isAnimePage() {
    return Boolean(getAnimeId() && document.getElementById('animes_show'));
}

function isAdded(animeId) {
    return Boolean(document.querySelector(`.main-sound-container[data-anime-id="${animeId}"]`));
}

function getFallbackTitle() {
    return document.querySelector('meta[property="og:title"]')?.content?.trim() || '';
}

async function getEnglishTitle(animeId) {
    try {
        const response = await fetch(`${siteName}/api/animes/${animeId}`, {
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error(`Shikimori API returned HTTP ${response.status}`);

        const anime = await response.json();
        return anime.english?.trim() || '';
    } catch (error) {
        log('Не удалось получить английское название:', error);
        return '';
    }
}

function createYoutubeLink(label, query) {
    const url = new URL('https://www.youtube.com/results');
    url.searchParams.set('search_query', query.trim());

    const link = document.createElement('a');
    link.innerText = label;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.href = url.toString();
    return link;
}

function getDetailedSearchQuery(song) {
    return song
        .replace(/^#\d+\s*/, '')
        .replace(/\s*\(eps?.*$/i, '')
        .trim();
}

function getSimpleSearchQuery(title, isOpening, number) {
    const type = settings.getOption('isFull')
        ? (isOpening ? 'opening' : 'ending')
        : (isOpening ? 'op' : 'ed');
    const suffix = number > 0 ? ` ${number + 1}` : '';
    return `${title} ${type}${suffix}`.trim();
}

function createMusic(songs, container, searchTitle) {
    const isOpening = container.classList.contains('op');

    songs.forEach((song, index) => {
        const sound = document.createElement('span');
        sound.innerText = song;
        sound.className = 'value sound';
        container.appendChild(sound);

        if (settings.getOption('youtube')) {
            const query = getDetailedSearchQuery(song);
            if (query) sound.appendChild(createYoutubeLink(' -> YouTube', query));
        }

        if (settings.getOption('youtubeSimple') && searchTitle) {
            const query = getSimpleSearchQuery(searchTitle, isOpening, index);
            sound.appendChild(createYoutubeLink(' / YouTube (simple)', query));
        }
    });
}

function createMusicSection(main, heading, songs, searchTitle) {
    if (!songs.length) return;

    const container = document.createElement('div');
    container.className = `sound-container ${heading === "OP'S" ? 'op' : 'ed'}`;
    main.appendChild(container);

    const title = document.createElement('div');
    title.innerText = heading;
    title.className = 'subheadline m5';
    container.appendChild(title);
    createMusic(songs, container, searchTitle);
}

function createExpander(main) {
    main.style.maxHeight = '150px';

    const expandContainer = document.createElement('div');
    expandContainer.className = 'b-height_shortener open-music';
    insertAfter(expandContainer, main);

    const shade = document.createElement('div');
    shade.className = 'shade';
    expandContainer.appendChild(shade);

    const expander = document.createElement('div');
    expander.className = 'expand';
    expandContainer.appendChild(expander);

    const label = document.createElement('span');
    label.innerText = 'Развернуть';
    expander.appendChild(label);

    expandContainer.addEventListener('click', () => {
        expandContainer.remove();
        main.style.animation = 'oped-height 15s cubic-bezier(.19,1,.22,1) forwards';
    }, { once: true });
}

function createOPEDList(openings, endings, searchTitle, animeId) {
    if (!openings.length && !endings.length) return false;

    const insertionPoint = document.querySelector('.b-db_entry');
    if (!insertionPoint || getAnimeId() !== animeId) return false;

    document.querySelectorAll('.main-sound-container, .open-music').forEach(element => element.remove());

    const main = document.createElement('div');
    main.className = 'main-sound-container';
    main.dataset.animeId = animeId;
    insertAfter(main, insertionPoint);

    createMusicSection(main, "OP'S", openings, searchTitle);
    createMusicSection(main, "ED'S", endings, searchTitle);

    if (openings.length > 4 || endings.length > 4) createExpander(main);
    createStyle();
    return true;
}

function createStyle() {
    if (stylesAdded) return;

    settings.addStyle(`
.main-sound-container { margin-bottom: 15px; overflow: hidden; }
.sound-container { display: inline-block; vertical-align: top; width: 48%; }
.sound-container:only-child { width: 100%; }
.sound-container.op:not(:only-child) { margin-right: 3%; }
.sound { padding-top: 5px; margin: 5px; display: block; }
.open-music { margin-bottom: 15px; }
@keyframes oped-height { from { max-height: 150px; } to { max-height: 2000px; } }
@media screen and (max-width: 768px) { .sound-container { width: 100%; } }
`);
    stylesAdded = true;
}

function getMusic(doc, classNames) {
    const names = Array.isArray(classNames) ? classNames : [classNames];
    const music = names
        .map(className => doc.getElementsByClassName(`theme-songs js-theme-songs ${className}`)[0])
        .find(Boolean);
    if (!music) return [];

    const songs = [];
    const authors = music.getElementsByClassName('theme-song-artist');

    for (let index = 0; index < authors.length; index++) {
        const author = authors[index];
        const row = author.parentNode;
        if (!row) continue;

        const episodes = row.getElementsByClassName('theme-song-episode')[0]?.textContent?.trim() || '';
        const titleElement = row.getElementsByClassName('theme-song-title')[0];
        let songTitle = titleElement?.textContent?.trim() || '';

        if (!songTitle) {
            const textNode = [...row.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            songTitle = textNode?.textContent?.trim() || '';
        }

        const artist = author.textContent?.trim() || '';
        const description = [songTitle, artist, episodes].filter(Boolean).join(' ');
        if (description) songs.push(`#${songs.length + 1} ${description}`);
    }

    return songs;
}

function requestMalPage(animeId) {
    return new Promise((resolve, reject) => {
        const request = GM_xmlhttpRequest({
            method: 'GET',
            url: `https://myanimelist.net/anime/${animeId}`,
            timeout: 15000,
            onload: response => {
                if (response.status >= 200 && response.status < 300) resolve(response.responseText);
                else reject(new Error(`MyAnimeList returned HTTP ${response.status}`));
            },
            onerror: () => reject(new Error('Ошибка сети при запросе MyAnimeList')),
            ontimeout: () => reject(new Error('MyAnimeList не ответил за 15 секунд')),
            onabort: () => reject(new Error('Запрос MyAnimeList отменён'))
        });
        activeMalRequest = { animeId, abort: () => request.abort() };
    });
}

async function loadMal() {
    initSettings();
    if (!isAnimePage()) return;

    const animeId = getAnimeId();
    if (!animeId || isAdded(animeId) || loadingAnimeId === animeId) return;

    if (activeMalRequest && activeMalRequest.animeId !== animeId) activeMalRequest.abort();
    loadingAnimeId = animeId;
    log(`Загрузка OP/ED для аниме ${animeId}`);

    try {
        const [malHtml, englishTitle] = await Promise.all([
            requestMalPage(animeId),
            getEnglishTitle(animeId)
        ]);

        if (!isAnimePage() || getAnimeId() !== animeId) return;

        const doc = new DOMParser().parseFromString(malHtml, 'text/html');
        const openings = getMusic(doc, ['opnening', 'opening']);
        const endings = getMusic(doc, 'ending');
        const searchTitle = englishTitle || getFallbackTitle();

        if (createOPEDList(openings, endings, searchTitle, animeId)) {
            log(`Добавлено: OP ${openings.length}, ED ${endings.length}`);
        } else {
            log('MyAnimeList не вернул список OP/ED');
        }
    } catch (error) {
        log('Не удалось загрузить OP/ED:', error);
    } finally {
        if (loadingAnimeId === animeId) loadingAnimeId = null;
        if (activeMalRequest?.animeId === animeId) activeMalRequest = null;
    }
}

function ready(fn) {
    document.addEventListener('page:load', fn);
    document.addEventListener('turbolinks:load', fn);
    if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
}

ready(initSettings);
ready(loadMal);
