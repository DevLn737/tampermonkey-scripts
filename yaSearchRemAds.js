// ==UserScript==
// @name         Удаление рекламы из поисковика
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Удаляет рекламные элементы из поисковой выдачи яндекса
// @author       DevLn
// @match        https://yandex.ru/search/?text=*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function removeAds() {
        // Получаем все элементы списка поисковика
        const items = document.querySelectorAll('li.serp-item');

        items.forEach(item => {
            // Ищем внутри элемента span с классом "OVTYUeOUmB" и текстом "реклама"
            const adLabel = item.querySelector('span.OVTYUeOUmB');
            const adShopLabel = item.querySelector('span.RbTyUgQseM');
            if (adShopLabel && adShopLabel.textContent.includes('Реклама')) {
                item.remove();  // Удаляем элемент
                //console.log('Удалена реклама:', item);
            }
            if (adLabel && adLabel.textContent.includes('реклама')) {
                item.remove();  // Удаляем элемент
                //console.log('Удалена реклама:', item);
            }
        });
    }

    // Запускаем функцию при загрузке страницы
    window.addEventListener('load', removeAds);

    // Запускаем при динамическом изменении DOM
    const observer = new MutationObserver(removeAds);
    observer.observe(document.body, { childList: true, subtree: true });
})();
