// ==UserScript==
// @name         Shiki Collections List
// @namespace    https://shikimori.rip/
// @version      1.3.3
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @match        *://shikimori.io/*
// @match        *://shiki.one/*
// @match        *://shikimori.rip/*
// @match        *://shikimori.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain_url=https://shikimori.rip
// @author       Chortowod
// @description  Возможность добавлять коллекции в список, который доступен в профиле, справа от личных данных (под ником)
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.listValues
// @grant        GM.deleteValue
// @license      MIT
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// @copyright    2026, Chortowod
// jshint esversion: 8
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiCollectionsList.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiCollectionsList.user.js
// ==/UserScript==



const style = ` #ctwFavCollection { margin-left: 4px; font-size: 26px; } #ctwFavCollection:hover { font-size: 30px; cursor: pointer; } `;

function checker() {
    // Если элемент уже есть, то скипаем функцию (но привязываем событие на всякий случай)
    if (document.getElementById('ctwFavCollection')) {
        document.getElementById('ctwFavCollection').addEventListener ("click", addToCollection);
        return;
    }
    if (document.getElementById('ctwCollectionButton')) {
        document.getElementById('ctwCollectionButton').addEventListener ("click", showCollection);
        return;
    }
    // Если мы на странице с коллекциями...
    if (location.href.includes("/collections/") && document.querySelector("h1")) {
        // ...то создаем "кнопочку"-сердечко
        addHeart();
        return;
    }
    // Если мы на странице своего профиля...
    if (document.getElementById("profiles_show")) {
        const myID = JSON.parse($('body').attr('data-user')).id;
        const currentProfileID = $('.profile-head').attr('data-user-id');
        // ...то создаем кнопочку для просмотра коллекции (нестрогое сравнение намеренно)
        if (myID == currentProfileID)
            addButton();
    }
}

async function showCollection() {
    const collectionItems = await GM.listValues();
    let notesCount = 0;
    // создание нового окна
    let newWindowCollection = window.open("", '_blank');
    newWindowCollection.document.body.innerHTML = "";
    newWindowCollection.document.write("<h2>Ваши сохраненные коллекции:</h2>");
    let body = newWindowCollection.document.getElementsByTagName("body")[0];
    // вытягивание переменных из локальной БД расширения
    for (const item of collectionItems) {
        let name = await GM.getValue(item);
        let collectionItem = document.createElement("a");
        let collectionItemDelete = document.createElement("span");
        collectionItemDelete.textContent = "❌";
        collectionItemDelete.id = "ctwFavCollectionDelete";
        collectionItemDelete.style.cursor = 'pointer';
        collectionItemDelete.title = 'Удалить?';
        collectionItemDelete.addEventListener("click", function() {
            GM.deleteValue(item);
            collectionItem.style.display = 'none';
            collectionItemDelete.style.display = 'none';
            collectionItemDelete.nextSibling.style.display = 'none';
        });
        collectionItem.href = item;
        collectionItem.textContent = name.substring(0, name.length - 1);
        collectionItem.style.textDecoration = 'none';
        body.appendChild(collectionItem);
        body.appendChild(collectionItemDelete);
        newWindowCollection.document.write("<br>");
        notesCount++;
    }
    let countdownPing = 50;
    let countdownShower = setInterval(function(){
        if (notesCount === collectionItems.length) {
            clearInterval(countdownShower);
            newWindowCollection.document.close();
        }
        else if (countdownPing === 0) {
            clearInterval(countdownShower);
            console.log('Нет ответа.');
        }
        else
            countdownPing--;
    }, 100);
}
async function addToCollection() {
    // проверяем, есть ли в коллекции
    if (await GM.getValue(location.href)) {
        if (confirm('Уже есть в коллекции! Удалить?'))
        {
            // если выбираем удалить, то удаляем из локальной БД данную переменную
            GM.deleteValue(location.href);
            alert('Удалено.');
            return;
        }
        else return;
    }
    // если нет, то добавляем переменную с названием ссылки на коллекцию в локальную БД расширения
    // также добавляем название коллекции в саму переменную
    let collectionName = document.querySelector("h1").textContent;
    await GM.setValue(location.href, collectionName);
    alert('Сохранено!');
}

function addHeart() {
    let headerContainer = document.querySelector("h1");
    let collectionFav = document.createElement("a");
    collectionFav.id = 'ctwFavCollection';
    collectionFav.title = "Добавить в коллекцию";
    collectionFav.textContent = "❤";
    GM_addStyle(style);
    // Прикрепляем сердечко справа от названия коллекции
    headerContainer.appendChild(collectionFav);
    // Функция по нажатию на сердечко
    collectionFav.addEventListener ("click", addToCollection);
}
function addButton() {
    // Создание кнопки под "profile-head"
    let collectionButton = document.createElement("button");
    collectionButton.innerHTML = "Мои коллекции";
    collectionButton.id = 'ctwCollectionButton';
    collectionButton.style.background = 'transparent';
    let parent = document.getElementsByClassName("notice")[0];
    parent.appendChild(collectionButton);

    // Добавление функции по клику
    collectionButton.addEventListener("click", showCollection);
}

function ready(fn) {
    document.addEventListener('page:load', fn);
    document.addEventListener('turbolinks:load', fn);
    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") fn();
    else document.addEventListener('DOMContentLoaded', fn);
}

ready(checker);
