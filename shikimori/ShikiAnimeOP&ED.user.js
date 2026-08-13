// ==UserScript==
// @name         Shiki Anime OP/ED
// @namespace    https://shikimori.rip/
// @version      1.3.0
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
// @connect      api.animethemes.moe
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

function toTitles(value) {
    const values = Array.isArray(value) ? value : [value];
    return values.filter(title => typeof title === 'string' && title.trim()).map(title => title.trim());
}

function uniqueTitles(titles) {
    return [...new Map(titles.map(title => [title.toLocaleLowerCase(), title])).values()];
}

function getFallbackTitles() {
    return uniqueTitles(getFallbackTitle().split(/\s+\/\s+/).map(title => title.trim()).filter(Boolean));
}

async function getAnimeInfo(animeId) {
    const fallbackTitles = getFallbackTitles();

    try {
        const response = await fetch(`${siteName}/api/animes/${animeId}`, {
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error(`Shikimori API returned HTTP ${response.status}`);

        const anime = await response.json();
        const englishTitles = toTitles(anime.english);
        const titles = uniqueTitles([
            ...englishTitles,
            ...toTitles(anime.name),
            ...toTitles(anime.synonyms),
            ...toTitles(anime.japanese),
            ...fallbackTitles
        ]);

        return {
            searchTitle: englishTitles[0] || toTitles(anime.name)[0] || fallbackTitles[0] || '',
            titles,
            year: Number.parseInt(String(anime.aired_on || '').slice(0, 4), 10) || null
        };
    } catch (error) {
        log('Не удалось получить английское название:', error);
        return { searchTitle: fallbackTitles[0] || '', titles: fallbackTitles, year: null };
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

function requestExternalPage(url, animeId, sourceName) {
    return new Promise((resolve, reject) => {
        const request = GM_xmlhttpRequest({
            method: 'GET',
            url,
            timeout: 15000,
            onload: response => {
                if (response.status >= 200 && response.status < 300) resolve(response.responseText);
                else reject(new Error(`${sourceName} returned HTTP ${response.status}`));
            },
            onerror: () => reject(new Error(`Ошибка сети при запросе ${sourceName}`)),
            ontimeout: () => reject(new Error(`${sourceName} не ответил за 15 секунд`)),
            onabort: () => reject(new Error(`Запрос ${sourceName} отменён`))
        });
        activeMalRequest = { animeId, abort: () => request.abort() };
    });
}

function requestMalPage(animeId) {
    return requestExternalPage(`https://myanimelist.net/anime/${animeId}`, animeId, 'MyAnimeList');
}

function normalizeTitle(title) {
    return String(title || '')
        .normalize('NFKC')
        .toLocaleLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}

function themeSequence(theme, fallback) {
    return Number(theme.sequence) || Number(String(theme.slug || '').match(/\d+/)?.[0]) || fallback;
}

function extractAnimeThemes(anime) {
    const themes = Array.isArray(anime?.animethemes) ? anime.animethemes : [];
    const collect = type => themes
        .filter(theme => theme.type === type && theme.song?.title)
        .sort((left, right) => themeSequence(left, 1) - themeSequence(right, 1))
        .map((theme, index) => {
            const artists = Array.isArray(theme.song.artists)
                ? theme.song.artists.map(artist => artist?.name).filter(Boolean)
                : [];
            const artistText = artists.length ? ` by ${artists.join(', ')}` : '';
            return `#${themeSequence(theme, index + 1)} ${theme.song.title}${artistText}`;
        });

    return { openings: collect('OP'), endings: collect('ED') };
}

function chooseAnimeThemesResult(animeList, titles, year) {
    const normalizedTitles = new Set(titles.map(normalizeTitle).filter(Boolean));
    return [...animeList]
        .filter(anime => Array.isArray(anime.animethemes) && anime.animethemes.length)
        .sort((left, right) => {
            const score = anime => {
                const names = [anime.name, ...(Array.isArray(anime.synonyms) ? anime.synonyms : [])];
                const exactTitle = names.some(name => normalizedTitles.has(normalizeTitle(name)));
                return (exactTitle ? 2 : 0) + (year && anime.year === year ? 1 : 0);
            };
            return score(right) - score(left);
        })[0] || null;
}

async function requestAnimeThemes(animeId, animeInfo) {
    const titles = uniqueTitles(animeInfo.titles).slice(0, 3);

    for (const title of titles) {
        const url = new URL('https://api.animethemes.moe/anime');
        url.searchParams.set('q', title);
        url.searchParams.set('include', 'animethemes.song.artists,synonyms');

        try {
            const responseText = await requestExternalPage(url.toString(), animeId, 'AnimeThemes');
            const data = JSON.parse(responseText);
            const anime = chooseAnimeThemesResult(data.anime || [], titles, animeInfo.year);
            const themes = extractAnimeThemes(anime);
            if (themes.openings.length || themes.endings.length) return themes;
        } catch (error) {
            log(`AnimeThemes не вернул данные для «${title}»:`, error);
        }
    }

    return { openings: [], endings: [] };
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
        const animeInfoPromise = getAnimeInfo(animeId);
        let openings = [];
        let endings = [];

        try {
            const malHtml = await requestMalPage(animeId);
            const doc = new DOMParser().parseFromString(malHtml, 'text/html');
            openings = getMusic(doc, ['opnening', 'opening']);
            endings = getMusic(doc, 'ending');
        } catch (error) {
            log('MyAnimeList недоступен, используется AnimeThemes:', error);
        }

        const animeInfo = await animeInfoPromise;

        if (!openings.length && !endings.length) {
            ({ openings, endings } = await requestAnimeThemes(animeId, animeInfo));
        }

        if (!isAnimePage() || getAnimeId() !== animeId) return;

        const searchTitle = animeInfo.searchTitle || getFallbackTitle();

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
