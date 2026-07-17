// ==UserScript==
// @name         Shiki New Anime Links (Ruracker|MangaLib|Nyaa|Other)
// @namespace    https://shikimori.rip/
// @version      1.0.19
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
    let parent = document.querySelector(".subheadline.m8").parentElement;
    let rutrackerLink = parent.childNodes[1].cloneNode(true);
    let rutrackerLinkRu = parent.childNodes[1].cloneNode(true);
    rutrackerLink.children[0].target = "_blank";
    rutrackerLink.children[0].textContent = "Rutracker (англ. название)";
    rutrackerLinkRu.children[0].target = "_blank";
    rutrackerLinkRu.children[0].textContent = "Rutracker (рус. название)";

    if (location.href.includes("/mangas/") && !document.getElementById('linkRutracker')) {
        if (settings.getOption('mangaLib') && !document.querySelector(".mangalib") && !document.getElementById('linkMangaFind')) {
            let mangaFindLink = parent.childNodes[1].cloneNode(true);
            mangaFindLink.children[0].href = "https://mangalib.me/manga-list?dir=desc&name=" + title + "&sort=rate";
            mangaFindLink.children[0].target = "_blank";
            mangaFindLink.children[0].id = "linkMangaFind";
            mangaFindLink.children[0].textContent = "MangaLib";
            parent.insertBefore(mangaFindLink, parent.childNodes[1]);
        }
        if (settings.getOption('rutracker')) {
            rutrackerLink.children[0].href = ruTrackerL + "2461,2462,2463,2464,2465,2473,281,862&nm=" + title;
            rutrackerLink.children[0].id = "linkRutracker";
            parent.insertBefore(rutrackerLink, parent.childNodes[1]);
        }
        settings.addStyle(style_manga);
    }

    if (location.href.includes("/ranobe/") && !document.getElementById('linkRutracker')) {
        if (settings.getOption('ranobeLib') && !document.querySelector('.ranobelib') && !document.getElementById('linkRanobeLib')) {
            let ranobeLibLink = parent.childNodes[1].cloneNode(true);
            ranobeLibLink.children[0].href = "https://ranobelib.me/manga-list?sort=rate&dir=desc&name=" + title;
            ranobeLibLink.children[0].target = "_blank";
            ranobeLibLink.children[0].id = "linkRanobeLib";
            ranobeLibLink.children[0].textContent = "RanobeLib";
            parent.insertBefore(ranobeLibLink, parent.childNodes[1]);
        }

        if (settings.getOption('ranobeHub') && !document.getElementById('linkRanobeHub')) {
            let ranobeHubLink = parent.childNodes[1].cloneNode(true);
            ranobeHubLink.children[0].href = "https://ranobehub.org/search?query=" + title;
            ranobeHubLink.children[0].target = "_blank";
            ranobeHubLink.children[0].id = "linkRanobeHub";
            ranobeHubLink.children[0].textContent = "RanobeHub (главы)";
            parent.insertBefore(ranobeHubLink, parent.childNodes[1]);
        }

        if (settings.getOption('rulate') && !document.getElementById('linkRanobeRulate')) {
            let ranobeRulateLink = parent.childNodes[1].cloneNode(true);
            ranobeRulateLink.children[0].href = "https://tl.rulate.ru/search?from=header&t=" + title;
            ranobeRulateLink.children[0].target = "_blank";
            ranobeRulateLink.children[0].id = "linkRanobeRulate";
            ranobeRulateLink.children[0].textContent = "Rulate";
            parent.insertBefore(ranobeRulateLink, parent.childNodes[1]);
        }

        if (settings.getOption('rutracker')) {
            rutrackerLink.children[0].href = ruTrackerL + "2458&nm=" + title;
            rutrackerLink.children[0].id = "linkRutracker";
            parent.insertBefore(rutrackerLink, parent.childNodes[1]);
        }
        settings.addStyle(style_ranobe);
    }

    if (location.href.includes("/animes/") && !document.getElementById('linkRutracker')) {
        if (settings.getOption('funSubs') && !document.querySelector(".kage_project") && !document.getElementById("linkFunSubs")) {
            let funSubsLink = parent.childNodes[1].cloneNode(true);
            funSubsLink.children[0].id = "linkFunSubs";
            funSubsLink.children[0].target = "_blank";
            funSubsLink.children[0].textContent = "FunSubs";
            funSubsLink.children[0].removeAttribute("href");
            funSubsLink.children[0].onclick = function () {
                let dummy = document.createElement("textarea");
                document.body.appendChild(dummy);
                dummy.value = title;
                dummy.select();
                document.execCommand("copy");
                document.body.removeChild(dummy);
                window.open("http://www.fansubs.ru/search.php", "_black");
            };
            parent.insertBefore(funSubsLink, parent.childNodes[1]);
        }

        if (settings.getOption('smotretAnime') && !document.getElementById("smotretLink")) {
            let smotretLink = parent.childNodes[1].cloneNode(true);
            smotretLink.children[0].href = "https://smotret-anime.online/catalog/search?q=" + title;
            smotretLink.children[0].target = "_blank";
            smotretLink.children[0].id = "smotretLink";
            smotretLink.children[0].textContent = "Smotret Anime";
            parent.insertBefore(smotretLink, parent.childNodes[1]);
        }

        if (settings.getOption('animego') && !document.getElementById("animegoLink")) {
            let animegoLink = parent.childNodes[1].cloneNode(true);
            animegoLink.children[0].href = "https://animego.org/search/anime?q=" + (titleRu || title);
            animegoLink.children[0].target = "_blank";
            animegoLink.children[0].id = "animegoLink";
            animegoLink.children[0].textContent = "AnimeGo";
            parent.insertBefore(animegoLink, parent.childNodes[1]);
        }

        if (settings.getOption('animeJoy') && !document.getElementById("animeJoy")) {
            let animeJoyLink = parent.childNodes[1].cloneNode(true);
            animeJoyLink.children[0].target = "_blank";
            animeJoyLink.children[0].id = "animeJoy";
            animeJoyLink.children[0].textContent = "AnimeJoy";
            updateAnimeJoyLink(animeJoyLink.children[0], titleRu || title);
            parent.insertBefore(animeJoyLink, parent.childNodes[1]);
        }

        if (settings.getOption('yummyAnime') && !document.getElementById("yummyAnime")) {
            let yummyAnimeLink = parent.childNodes[1].cloneNode(true);
            yummyAnimeLink.children[0].href = makeDleSearchUrl(yummyAnimeL, titleRu || title);
            yummyAnimeLink.children[0].target = "_blank";
            yummyAnimeLink.children[0].id = "yummyAnime";
            yummyAnimeLink.children[0].textContent = "YummyAnime";
            parent.insertBefore(yummyAnimeLink, parent.childNodes[1]);
        }

        if (settings.getOption('anilibria') && !document.getElementById("linkAnilibria")) {
            let animegoLink = parent.childNodes[1].cloneNode(true);
            animegoLink.children[0].href = anilibriaL + 'search?find=' + (title);
            animegoLink.children[0].target = "_blank";
            animegoLink.children[0].id = "linkAnilibria";
            animegoLink.children[0].textContent = "AniLibria";
            parent.insertBefore(animegoLink, parent.childNodes[1]);
        }

        if (settings.getOption('animeLib') && !document.getElementById("animeLib")) {
            let animeLibLink = parent.childNodes[1].cloneNode(true);
            animeLibLink.children[0].href = animeLibL + title;
            animeLibLink.children[0].target = "_blank";
            animeLibLink.children[0].id = "animeLib";
            animeLibLink.children[0].textContent = "Animelib";
            parent.insertBefore(animeLibLink, parent.childNodes[1]);
        }

        if (settings.getOption('sovetRom') && !document.getElementById("sovetRom")) {
            let sovetRomLink = parent.childNodes[1].cloneNode(true);
            sovetRomLink.children[0].href = sovetRomL + title;
            sovetRomLink.children[0].target = "_blank";
            sovetRomLink.children[0].id = "sovetRom";
            sovetRomLink.children[0].textContent = "SovetRomantica";
            parent.insertBefore(sovetRomLink, parent.childNodes[1]);
        }

        if (settings.getOption('kodik') && !document.getElementById("linkKodik")) {
            let kodik = parent.childNodes[1].cloneNode(true);
            kodik.children[0].href = kodikL + getAnimeID();
            kodik.children[0].target = "_blank";
            kodik.children[0].id = "linkKodik";
            kodik.children[0].textContent = "Kodik (онлайн просмотр)";
            parent.insertBefore(kodik, parent.childNodes[1]);
        }

        if (settings.getOption('nnmClub') && !document.getElementById("NNMLink")) {
            let nnmLink = parent.childNodes[1].cloneNode(true);
            nnmLink.children[0].href = nnmClubL + "620,621,622,623,624,625,626,627,628,632,634,635,638,644,646&nm=" + title;
            nnmLink.children[0].target = "_blank";
            nnmLink.children[0].id = "NNMLink";
            nnmLink.children[0].textContent = "NNM-Club";
            parent.insertBefore(nnmLink, parent.childNodes[1]);
        }

        if (settings.getOption('eraiRaws') && !document.getElementById("eraiRaws")) {
            let eraiLink = parent.childNodes[1].cloneNode(true);
            eraiLink.children[0].href = eraiRawsL + title;
            eraiLink.children[0].target = "_blank";
            eraiLink.children[0].id = "eraiRaws";
            eraiLink.children[0].textContent = "Erai Raws";
            parent.insertBefore(eraiLink, parent.childNodes[1]);
        }

        if (settings.getOption('nyaaOST') && !document.getElementById("linkNyaaOST")) {
            let nyaaLinkOST = parent.childNodes[1].cloneNode(true);
            nyaaLinkOST.children[0].href = "https://nyaa.si/?f=0&c=2_0&q=" + title;
            nyaaLinkOST.children[0].target = "_blank";
            nyaaLinkOST.children[0].id = "linkNyaaOST";
            nyaaLinkOST.children[0].textContent = "Nyaa.si [OST]";
            parent.insertBefore(nyaaLinkOST, parent.childNodes[1]);
        }

        if (settings.getOption('nyaa') && !document.getElementById("linkNyaa")) {
            let nyaaLink = parent.childNodes[1].cloneNode(true);
            nyaaLink.children[0].href = "https://nyaa.si/?f=0&c=0_0&q=" + title;
            nyaaLink.children[0].target = "_blank";
            nyaaLink.children[0].id = "linkNyaa";
            nyaaLink.children[0].textContent = "Nyaa.si";
            parent.insertBefore(nyaaLink, parent.childNodes[1]);
        }

        if (settings.getOption('rutrackerOST') && !document.getElementById("linkRutrackerOST")) {
            let rutrackerLinkOST = parent.childNodes[1].cloneNode(true);
            rutrackerLinkOST.children[0].href = ruTrackerL + "1388,282&nm=" + title;
            rutrackerLinkOST.children[0].target = "_blank";
            rutrackerLinkOST.children[0].id = "linkRutrackerOST";
            rutrackerLinkOST.children[0].textContent = "Rutracker [OST]";
            parent.insertBefore(rutrackerLinkOST, parent.childNodes[1]);
        }

        if (settings.getOption('rutrackerRU') && !document.getElementById("linkRutrackerRu")) {
            rutrackerLinkRu.children[0].href = ruTrackerL + "1105,1106,1386,1387,1389,1390,1391,1642,2484,2491,2544,33,404,599,809,893&nm=" + titleRu;
            rutrackerLinkRu.children[0].id = "linkRutrackerRu";
            parent.insertBefore(rutrackerLinkRu, parent.childNodes[1]);
        }

        if (settings.getOption('rutracker')) {
            rutrackerLink.children[0].href = ruTrackerL + "1105,1106,1386,1387,1389,1390,1391,1642,2484,2491,2544,33,404,599,809,893&nm=" + title;
            rutrackerLink.children[0].id = "linkRutracker";
            parent.insertBefore(rutrackerLink, parent.childNodes[1]);
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
