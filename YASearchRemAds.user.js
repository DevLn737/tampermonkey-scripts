// ==UserScript==
// @name         Удаление рекламы из поисковика
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Удаляет рекламные элементы из поисковой выдачи Яндекса
// @author       DevLn
// @match        https://yandex.ru/search/?text=*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';


    function removeAds() {
        // Выбираем все li на странице
        const elements = document.querySelectorAll('li');

        elements.forEach((li) => {
            const allChildren = li.querySelectorAll('*'); // Достаём все дочерние элементы в li

            // Проходим и ищем элементы внутри с текстом "реклама"
            allChildren.forEach((child) => {
                if (child.textContent.trim().toLowerCase() === 'реклама') {
                    console.log("Найден рекламный элемент:", child);
                    li.remove(); // Удаляем родительский <li>
                }
            });
        });
    }

    const startObserverWithDelay = () => {
        console.log("Задержка перед запуском скрипта...");
        setTimeout(() => {
            console.log("Страница загружена, запускаем скрипт.");

            removeAds();

            const observer = new MutationObserver(() => {
                removeAds(); 
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });

            console.log("Observer запущен.");
        }, 1000);
    };

    // Запуск после загрузки страницы
    window.addEventListener('load', startObserverWithDelay);
})();
