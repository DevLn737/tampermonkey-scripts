// ==UserScript==
// @name         Shiki New Anime Links (Ruracker|MangaLib|Nyaa|Other)
// @namespace    https://shikimori.rip/
// @version      1.0.20
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @match        *://shikimori.io/*
// @match        *://shiki.one/*
// @match        *://shikimori.rip/*
// @match        *://shikimori.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain_url=https://shikimori.rip
// @author       Chortowod (https://openuserjs.org/scripts/Chortowod)
// @description  Добавляет пункты "Rutracker", "NNMClub", "MangaLib", "RanobeLib" и др. в список "На других сайтах" для поиска аниме|манги|ранобэ на торрентах/сайтах
// @license      MIT
// @require      https://gist.githubusercontent.com/Chortowod/814b010c68fc97e5f900df47bf79059c/raw/chtw_settings.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      vk.com
// @connect      vk.ru
// @connect      anime-joy.ru
// @connect      www.anime-joy.ru
// @copyright    2024, Chortowod
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiNewAnimeLinks.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiNewAnimeLinks.user.js
// ==/UserScript==

let settings = new ChtwSettings('chtwNewLinks', '<a target="_blank" href="https://openuserjs.org/scripts/Chortowod/Shiki_New_Anime_Links_(RurackerMangaLibNyaaOther)">Новые ссылки</a>');

function initSettings() {
    settings.createOption('rutracker', 'Rutracker');
    settings.createOption('rutrackerRU', 'Rutracker (RU)');
    settings.createOption('rutrackerOST', 'Rutracker (OST)');
    settings.createOption('nyaa', 'Nyaa');
    settings.createOption('nyaaOST', 'Nyaa (OST)');
    settings.createOption('nnmClub', 'NnmClub');
    settings.createOption('eraiRaws', 'Erai Raws');
    settings.createOption('kodik', 'Kodik (онлайн просмотр)');
    settings.createOption('smotretAnime', 'SmotretAnime');
    settings.createOption('animeLib', 'AnimeLib');
    settings.createOption('anilibria', 'Anilibria');
    settings.createOption('animego', 'Animego');
    settings.createOption('sovetRom', 'Sovetromantica');
    settings.createOption('funSubs', 'FunSubs');
    settings.createOption('ranobeHub', 'RanobeHub');
    settings.createOption('ranobeLib', 'RanobeLib');
    settings.createOption('rulate', 'Rulate');
    settings.createOption('mangaLib', 'MangaLib');
    settings.createOption('animeJoy', 'AnimeJoy');
    settings.createOption('yummyAnime', 'YummyAnime');
}

const ANIME_JOY_FALLBACK_ORIGIN = 'https://otakujoy.fun';
const ANIME_JOY_CACHE_KEY = 'animeJoyMirrorV2';
const ANIME_JOY_CACHE_TTL = 6 * 60 * 60 * 1000;
const ANIME_JOY_REJECTED_HOSTS = new Set(['animejoy.xyz']);
let animeJoyOriginRequest;

function requestPage(url) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url,
            timeout: 15000,
            onload: response => {
                if (response.status >= 200 && response.status < 400) resolve(response);
                else reject(new Error(`HTTP ${response.status}`));
            },
            onerror: () => reject(new Error('Ошибка сети')),
            ontimeout: () => reject(new Error('Тайм-аут запроса'))
        });
    });
}

function normalizeAnimeJoyOrigin(value) {
    if (!value) return null;

    let candidate = value
        .replace(/\\u002f/gi, '/')
        .replace(/\\\//g, '/')
        .replace(/&amp;/gi, '&')
        .trim()
        .replace(/[),.;!?]+$/g, '');

    try {
        candidate = decodeURIComponent(candidate);
    } catch (_) {
        // Строка уже декодирована.
    }

    if (!/^https?:\/\//i.test(candidate)) candidate = 'https://' + candidate;

    try {
        const parsed = new URL(candidate);
        const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
        const excludedHosts = ['vk.com', 'vk.ru', 'anime-joy.ru'];
        if (excludedHosts.some(domain => host === domain || host.endsWith('.' + domain))) return null;
        if ([...ANIME_JOY_REJECTED_HOSTS].some(domain => host === domain || host.endsWith('.' + domain))) return null;
        return parsed.origin;
    } catch (_) {
        return null;
    }
}

function normalizeAnimeJoySource(source) {
    return String(source || '')
        .replace(/\\u002f/gi, '/')
        .replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\\\//g, '/')
        .replace(/&amp;/gi, '&');
}

function findAnimeJoyOrigins(text, requireNotice = false) {
    const origins = [];
    const addOrigin = value => {
        const origin = normalizeAnimeJoyOrigin(value);
        if (origin && !origins.includes(origin)) origins.push(origin);
    };

    const mirrorNotice = /(?:используйте|нов(?:ое|ый)\s+(?:зеркало|адрес)|зеркал[оа])[^\n\r]{0,200}?(https?:\/\/)?([a-z0-9](?:[a-z0-9-]*\.)+[a-z]{2,})/gi;
    for (const match of String(text || '').matchAll(mirrorNotice)) {
        addOrigin((match[1] || 'https://') + match[2]);
    }

    if (requireNotice || origins.length) return origins;

    const brandedDomain = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)*(?:anime-?joy|otaku-?joy)[a-z0-9-]*\.[a-z]{2,}/gi;
    for (const match of String(text || '').matchAll(brandedDomain)) addOrigin(match[0]);
    return origins;
}

function extractPostId(value) {
    const text = String(value || '');
    const wallMatch = text.match(/wall-?\d+_(\d+)/i);
    if (wallMatch) return Number(wallMatch[1]);

    const pairMatch = text.match(/^-?\d+_(\d+)$/);
    if (pairMatch) return Number(pairMatch[1]);

    const postMatch = text.match(/^post[-_]?-?\d+_(\d+)$/i);
    return postMatch ? Number(postMatch[1]) : null;
}

function extractLatestVkPostOrigin(source) {
    const normalized = normalizeAnimeJoySource(source);
    const candidates = [];

    // Сначала читаем настоящие контейнеры постов, если VK вернул HTML-ленту.
    try {
        const doc = new DOMParser().parseFromString(normalized, 'text/html');
        const postElements = doc.querySelectorAll('[data-post-id], [data-post_id], [id^="post-"], [id^="post_"]');
        for (const post of postElements) {
            const idValues = [
                post.getAttribute('data-post-id'),
                post.getAttribute('data-post_id'),
                post.id,
                post.querySelector('a[href*="wall-"]')?.getAttribute('href')
            ];
            const postId = idValues.map(extractPostId).find(Number.isFinite);
            if (!Number.isFinite(postId)) continue;

            for (const origin of findAnimeJoyOrigins(post.textContent, true)) {
                candidates.push({ postId, origin });
            }
        }
    } catch (_) {
        // Ниже есть разбор встроенных JSON/HTML-данных без DOM.
    }

    // VK может вернуть посты внутри JSON. Делим ответ на блоки по явным ID постов.
    const markers = [];
    const markerPattern = /wall-?\d+_(\d+)|["']post_id["']\s*:\s*(\d+)/gi;
    for (const match of normalized.matchAll(markerPattern)) {
        const postId = Number(match[1] || match[2]);
        if (Number.isFinite(postId)) markers.push({ index: match.index, postId });
    }

    const markerByPostId = new Map();
    for (const marker of markers) {
        if (!markerByPostId.has(marker.postId)) markerByPostId.set(marker.postId, marker);
    }
    const uniqueMarkers = [...markerByPostId.values()].sort((a, b) => a.index - b.index);

    for (let index = 0; index < uniqueMarkers.length; index++) {
        const marker = uniqueMarkers[index];
        const end = uniqueMarkers[index + 1]?.index ?? Math.min(normalized.length, marker.index + 12000);
        const postText = normalized.slice(marker.index, end);
        for (const origin of findAnimeJoyOrigins(postText, true)) {
            candidates.push({ postId: marker.postId, origin });
        }
    }

    // Закреплённый старый пост может идти первым в HTML, поэтому решает максимальный ID.
    candidates.sort((a, b) => b.postId - a.postId);
    return candidates[0]?.origin || null;
}

function extractAnimeJoySiteOrigin(source, finalUrl = '') {
    const redirectedOrigin = normalizeAnimeJoyOrigin(finalUrl);
    if (redirectedOrigin && /(?:anime-?joy|otaku-?joy)/i.test(new URL(redirectedOrigin).hostname)) {
        return redirectedOrigin;
    }

    const normalized = normalizeAnimeJoySource(source);
    const counts = new Map();
    const hrefPattern = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi;
    for (const match of normalized.matchAll(hrefPattern)) {
        const origin = normalizeAnimeJoyOrigin(match[2]);
        if (!origin || !/(?:anime-?joy|otaku-?joy)/i.test(new URL(origin).hostname)) continue;
        counts.set(origin, (counts.get(origin) || 0) + 1);
    }

    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (!ranked.length || (ranked[1] && ranked[0][1] === ranked[1][1])) return null;
    return ranked[0][0];
}

async function resolveAnimeJoyOrigin(title = '', forceRefresh = false) {
    const cached = GM_getValue(ANIME_JOY_CACHE_KEY, null);
    if (!forceRefresh && cached?.origin && Date.now() - cached.checkedAt < ANIME_JOY_CACHE_TTL) {
        return cached.origin;
    }

    if (animeJoyOriginRequest) return animeJoyOriginRequest;

    animeJoyOriginRequest = (async () => {
        const sources = [
            { type: 'vk', url: 'https://vk.com/animejoyru' },
            { type: 'site', url: title ? makeDleSearchUrl('https://www.anime-joy.ru', title) : 'https://www.anime-joy.ru/' },
            { type: 'site', url: 'https://www.anime-joy.ru/' }
        ];

        for (const source of sources) {
            try {
                const response = await requestPage(source.url);
                const origin = source.type === 'vk'
                    ? extractLatestVkPostOrigin(response.responseText)
                    : extractAnimeJoySiteOrigin(response.responseText, response.finalUrl);
                if (origin) {
                    GM_setValue(ANIME_JOY_CACHE_KEY, { origin, checkedAt: Date.now() });
                    return origin;
                }
            } catch (error) {
                console.debug(`[Shiki New Anime Links] Не удалось проверить ${source.url}:`, error);
            }
        }

        return cached?.origin || ANIME_JOY_FALLBACK_ORIGIN;
    })().finally(() => {
        animeJoyOriginRequest = null;
    });

    return animeJoyOriginRequest;
}

function makeDleSearchUrl(origin, title) {
    return `${origin}/index.php?do=search&subaction=search&story=${encodeURIComponent(title)}`;
}

function createExternalLink(parent, id, text, url = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'b-external_link b-menu-line';

    const link = document.createElement('a');
    link.className = 'b-link';
    link.id = id;
    link.textContent = text;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (url) link.href = url;

    wrapper.appendChild(link);
    parent.insertBefore(wrapper, parent.children[1] || null);
    return link;
}

async function updateAnimeJoyLink(link, title) {
    const cached = GM_getValue(ANIME_JOY_CACHE_KEY, null);
    const initialOrigin = cached?.origin || ANIME_JOY_FALLBACK_ORIGIN;
    link.href = makeDleSearchUrl(initialOrigin, title);
    link.title = 'Зеркало AnimeJoy обновляется автоматически';

    const actualOrigin = await resolveAnimeJoyOrigin(title);
    if (link.isConnected) link.href = makeDleSearchUrl(actualOrigin, title);
}

function newLinks() {
    if (!location.href.includes("/animes/") && !location.href.includes("/mangas/") && !location.href.includes("/ranobe/")) return false;
    if (document.getElementById('linkRutracker')) return false;
    if (!document.querySelector(".subheadline.m8") || !document.querySelector("meta[itemprop='alternativeHeadline']")) return false;

    // необходимые переменные для сокращения
    let ruTrackerL = 'https://rutracker.org/forum/tracker.php?f=';
    let sovetRomL = 'https://sovetromantica.com/anime?query=';
    let eraiRawsL = 'https://www.erai-raws.info/?s=';
    let nnmClubL = 'https://nnmclub.to/forum/tracker.php?f=';
    let animeLibL = 'https://anilib.me/ru/catalog?q='
    let anilibriaL = 'https://darklibria.it/';
    let kodikL = 'https://kodikdb.com/find-player?shikimoriID=';
    let ruTrImg = 'https://imgur.com/HIExDt8.png';
    let yummyAnimeL = 'https://yummyanime.tv';
    let bckgrSize = 'background-size: 19px 19px; -webkit-background-size: 19px 19px;';

    let style_anime = `
.b-external_link.official_site a:before { background-size: cover !important; }
#linkRutracker.b-link:before { background: url(${ruTrImg}) no-repeat; }
#linkRutrackerRu.b-link:before { background: url(${ruTrImg}) no-repeat; }
#linkRutrackerOST.b-link:before { background: url(${ruTrImg}) no-repeat; }
#linkFunSubs.b-link:before { background: url(https://imgur.com/mGsXeXt.png) no-repeat; }
#eraiRaws.b-link:before { background: url(https://www.erai-raws.info/favicon.ico) no-repeat; }
#animeLib.b-link:before { background: url(https://anilib.me//images/logo/al/favicon.ico) no-repeat; }
#NNMLink.b-link:before { background: url(https://nnmclub.to/favicon.ico) no-repeat; }
#smotretLink.b-link:before { background: url(https://smotret-anime.online/favicon.ico) no-repeat; }
#animegoLink.b-link:before { background: url(https://animego.org/favicon.ico) no-repeat; }
#animeJoy.b-link:before { background: url(https://www.anime-joy.ru/favicon.ico) no-repeat; }
#yummyAnime.b-link:before { background: url(https://yummyanime.tv/favicon.ico) no-repeat; }
#sovetRom.b-link:before { background: url(https://sovetromantica.com/favicon.ico) no-repeat; }
#linkAnilibria.b-link:before { background: url(https://darklibria.it/favicon.ico) no-repeat; }
#linkNyaa.b-link:before, #linkNyaaOST.b-link:before { background: url(https://www.google.com/s2/favicons?sz=64&domain_url=https://nyaa.si) no-repeat; }
#linkKodik.b-link:before { background: url(https://kodikdb.com/assets/images/favicon.png) no-repeat; }

#linkRutracker.b-link:before, #linkRutrackerRu.b-link:before, #linkRutrackerOST.b-link:before,
#linkFunSubs.b-link:before, #NNMLink.b-link:before, #animegoLink.b-link:before,
#linkNyaa.b-link:before, #linkNyaaOST.b-link:before, #linkAnilibria.b-link:before,
#eraiRaws.b-link:before, #sovetRom.b-link:before, #linkKodik.b-link:before { ${bckgrSize} }
`;
    let style_manga = `
#linkRutracker.b-link:before { background: url(${ruTrImg}) no-repeat; }
#linkMangaFind.b-link:before { background: url(https://mangalib.me/favicon.ico) no-repeat; }

#linkRutracker.b-link:before, #linkMangaFind.b-link:before { ${bckgrSize} }
`;
    let style_ranobe = `
#linkRutracker.b-link:before { background: url(${ruTrImg}) no-repeat; }
#linkRanobeLib.b-link:before { background: url(https://imgur.com/UoyBf5V.png) no-repeat; }
#linkRanobeHub.b-link:before { background: url(https://ranobehub.org/favicon.ico) no-repeat; }
#linkRanobeRulate.b-link:before { background: url(https://tl.rulate.ru/favicon.ico) no-repeat; }

#linkRutracker.b-link:before, #linkRanobeLib.b-link:before, #linkRanobeHub.b-link:before,
#linkRanobeRulate3.b-link:before { ${bckgrSize} }
`;

    let title = document.querySelector("meta[property='og:title']").getAttribute('content');
    let titleRu = document.querySelector("meta[itemprop='alternativeHeadline']").getAttribute('content');
    const externalLinksHeadline = [...document.querySelectorAll('.subheadline.m8')]
        .find(element => element.textContent.trim() === 'На других сайтах');
    if (!externalLinksHeadline) return false;
    const parent = externalLinksHeadline.parentElement;

    if (location.href.includes("/mangas/") && !document.getElementById('linkRutracker')) {
        if (settings.getOption('mangaLib') && !document.querySelector(".mangalib") && !document.getElementById('linkMangaFind')) {
            createExternalLink(parent, 'linkMangaFind', 'MangaLib', "https://mangalib.me/manga-list?dir=desc&name=" + title + "&sort=rate");
        }
        if (settings.getOption('rutracker')) {
            createExternalLink(parent, 'linkRutracker', 'Rutracker (англ. название)', ruTrackerL + "2461,2462,2463,2464,2465,2473,281,862&nm=" + title);
        }
        settings.addStyle(style_manga);
    }

    if (location.href.includes("/ranobe/") && !document.getElementById('linkRutracker')) {
        if (settings.getOption('ranobeLib') && !document.querySelector('.ranobelib') && !document.getElementById('linkRanobeLib')) {
            createExternalLink(parent, 'linkRanobeLib', 'RanobeLib', "https://ranobelib.me/manga-list?sort=rate&dir=desc&name=" + title);
        }

        if (settings.getOption('ranobeHub') && !document.getElementById('linkRanobeHub')) {
            createExternalLink(parent, 'linkRanobeHub', 'RanobeHub (главы)', "https://ranobehub.org/search?query=" + title);
        }

        if (settings.getOption('rulate') && !document.getElementById('linkRanobeRulate')) {
            createExternalLink(parent, 'linkRanobeRulate', 'Rulate', "https://tl.rulate.ru/search?from=header&t=" + title);
        }

        if (settings.getOption('rutracker')) {
            createExternalLink(parent, 'linkRutracker', 'Rutracker (англ. название)', ruTrackerL + "2458&nm=" + title);
        }
        settings.addStyle(style_ranobe);
    }

    if (location.href.includes("/animes/") && !document.getElementById('linkRutracker')) {
        if (settings.getOption('funSubs') && !document.querySelector(".kage_project") && !document.getElementById("linkFunSubs")) {
            const funSubsLink = createExternalLink(parent, 'linkFunSubs', 'FunSubs');
            funSubsLink.onclick = function () {
                let dummy = document.createElement("textarea");
                document.body.appendChild(dummy);
                dummy.value = title;
                dummy.select();
                document.execCommand("copy");
                document.body.removeChild(dummy);
                window.open("http://www.fansubs.ru/search.php", "_black");
            };
        }

        if (settings.getOption('smotretAnime') && !document.getElementById("smotretLink")) {
            createExternalLink(parent, 'smotretLink', 'Smotret Anime', "https://smotret-anime.online/catalog/search?q=" + title);
        }

        if (settings.getOption('animego') && !document.getElementById("animegoLink")) {
            createExternalLink(parent, 'animegoLink', 'AnimeGo', "https://animego.org/search/anime?q=" + (titleRu || title));
        }

        if (settings.getOption('animeJoy') && !document.getElementById("animeJoy")) {
            const animeJoyLink = createExternalLink(parent, 'animeJoy', 'AnimeJoy');
            updateAnimeJoyLink(animeJoyLink, titleRu || title);
        }

        if (settings.getOption('yummyAnime') && !document.getElementById("yummyAnime")) {
            createExternalLink(parent, 'yummyAnime', 'YummyAnime', makeDleSearchUrl(yummyAnimeL, titleRu || title));
        }

        if (settings.getOption('anilibria') && !document.getElementById("linkAnilibria")) {
            createExternalLink(parent, 'linkAnilibria', 'AniLibria', anilibriaL + 'search?find=' + title);
        }

        if (settings.getOption('animeLib') && !document.getElementById("animeLib")) {
            createExternalLink(parent, 'animeLib', 'Animelib', animeLibL + title);
        }

        if (settings.getOption('sovetRom') && !document.getElementById("sovetRom")) {
            createExternalLink(parent, 'sovetRom', 'SovetRomantica', sovetRomL + title);
        }

        if (settings.getOption('kodik') && !document.getElementById("linkKodik")) {
            createExternalLink(parent, 'linkKodik', 'Kodik (онлайн просмотр)', kodikL + getAnimeID());
        }

        if (settings.getOption('nnmClub') && !document.getElementById("NNMLink")) {
            createExternalLink(parent, 'NNMLink', 'NNM-Club', nnmClubL + "620,621,622,623,624,625,626,627,628,632,634,635,638,644,646&nm=" + title);
        }

        if (settings.getOption('eraiRaws') && !document.getElementById("eraiRaws")) {
            createExternalLink(parent, 'eraiRaws', 'Erai Raws', eraiRawsL + title);
        }

        if (settings.getOption('nyaaOST') && !document.getElementById("linkNyaaOST")) {
            createExternalLink(parent, 'linkNyaaOST', 'Nyaa.si [OST]', "https://nyaa.si/?f=0&c=2_0&q=" + title);
        }

        if (settings.getOption('nyaa') && !document.getElementById("linkNyaa")) {
            createExternalLink(parent, 'linkNyaa', 'Nyaa.si', "https://nyaa.si/?f=0&c=0_0&q=" + title);
        }

        if (settings.getOption('rutrackerOST') && !document.getElementById("linkRutrackerOST")) {
            createExternalLink(parent, 'linkRutrackerOST', 'Rutracker [OST]', ruTrackerL + "1388,282&nm=" + title);
        }

        if (settings.getOption('rutrackerRU') && !document.getElementById("linkRutrackerRu")) {
            createExternalLink(parent, 'linkRutrackerRu', 'Rutracker (рус. название)', ruTrackerL + "1105,1106,1386,1387,1389,1390,1391,1642,2484,2491,2544,33,404,599,809,893&nm=" + titleRu);
        }

        if (settings.getOption('rutracker')) {
            createExternalLink(parent, 'linkRutracker', 'Rutracker (англ. название)', ruTrackerL + "1105,1106,1386,1387,1389,1390,1391,1642,2484,2491,2544,33,404,599,809,893&nm=" + title);
        }
        settings.addStyle(style_anime);
    }
}

function getAnimeID() {
    let full_url = window.location.href;
    let start = full_url.lastIndexOf('/') + 1;
    for (; isNaN(parseInt(full_url[start]));)
        start++;
    let number = "";
    for (; !isNaN(parseInt(full_url[start]));) {
        number += full_url[start];
        start++;
    }
    return number;
}

function ready(fn) {
    document.addEventListener('page:load', fn);
    document.addEventListener('turbolinks:load', fn);
    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") fn();
    else document.addEventListener('DOMContentLoaded', fn);
}

ready(initSettings);
ready(newLinks);
