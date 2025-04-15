// ==UserScript==
// @name         Lua Playlist Generator (Khinsider)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Генератор Lua-плейлиста для khinsider.com
// @author       You
// @match        https://downloads.khinsider.com/*
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// ==/UserScript==

(function () {
    'use strict';

    const isTrackPage = document.querySelector("audio#audio");

    // === Вкладка с треком ===
    if (isTrackPage) {
        (async () => {
            const audio = document.querySelector("audio#audio");
            const title = decodeURIComponent(audio.src.split('/').pop().replace('.mp3', ''));
            const url = audio.src;

            // Индекс можно передать в URL: ?index=5
            const params = new URLSearchParams(location.search);
            const index = parseInt(params.get("index"), 10);

            if (!isNaN(index)) {
                await GM_setValue(`track_${index}`, { title, url });
                console.log(`Сохранили трек ${index + 1}: ${title}`);
            } else {
                console.warn("Не передан index в URL");
            }

            setTimeout(() => window.close(), 6000);
        })();
        return;
    }

    // === Главная вкладка альбома ===
    const LINK_SELECTOR = ".playlistDownloadSong a";
    const PLAYLIST_NAME = document.querySelector("h2")?.textContent.trim() || "Playlist";

    const button = document.createElement("button");
    button.textContent = "Скачать плейлист";
    button.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        padding: 10px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    `;
    document.body.appendChild(button);

    button.addEventListener("click", async () => {
        const links = Array.from(document.querySelectorAll(LINK_SELECTOR));
        const total = links.length;

        // Очищаем старые значения
        const keys = await GM_listValues();
        for (const key of keys) {
            if (key.startsWith("track_")) await GM_setValue(key, null);
        }

        console.log(`Открываем ${total} треков по одному...`);

        for (let i = 0; i < total; i++) {
            const href = links[i].href + `?index=${i}`;
            window.open(href, "_blank");
            await new Promise(res => setTimeout(res, 500)); // пауза между вкладками
        }

        // Ожидаем сбор всех треков
        const tracks = [];
        const checkInterval = setInterval(async () => {
            tracks.length = 0;

            for (let i = 0; i < total; i++) {
                const track = await GM_getValue(`track_${i}`);
                if (track) {
                    tracks[i] = track;
                }
            }

            console.log(`Собрано ${tracks.filter(Boolean).length}/${total}...`);

            if (tracks.filter(Boolean).length === total) {
                clearInterval(checkInterval);
                buildAndDownload(tracks);
            }
        }, 3000);
    });

    function buildAndDownload(tracks) {
        let lua = `playlist = {\n`;
        tracks.forEach((track, i) => {
            lua += `    -- Трек ${i + 1}\n`;
            lua += `    [${i + 1}] = {\n`;
            lua += `        title = '${track.title.replace(/'/g, "\\'")}',\n`;
            lua += `        url = '${track.url}'\n`;
            lua += `    }${i < tracks.length - 1 ? ',' : ''}\n`;
        });
        lua += `}`;

        GM_download({
            url: "data:text/plain," + encodeURIComponent(lua),
            name: `${PLAYLIST_NAME}.txt`,
            saveAs: true
        });

        console.log("Плейлист скачан!");
    }
})();
