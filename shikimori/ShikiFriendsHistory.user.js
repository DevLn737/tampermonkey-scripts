// ==UserScript==
// @name         Shiki Friend's History
// @namespace    https://shikimori.rip/
// @version      1.2.9
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @match        *://shikimori.io/*
// @match        *://shiki.one/*
// @match        *://shikimori.rip/*
// @match        *://shikimori.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain_url=https://shikimori.rip
// @author       Chortowod (https://openuserjs.org/users/Chortowod)
// @description  Добавляет историю просмотренного друзей на страницу "Друзья", а также строку "Друзья" в выпадающий профиль в правом верхнем углу
// @license      MIT
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// @require      https://gist.githubusercontent.com/Chortowod/814b010c68fc97e5f900df47bf79059c/raw/chtw_settings.js?v1
// @copyright    2026, Chortowod (https://openuserjs.org/users/Chortowod)
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiFriendsHistory.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiFriendsHistory.user.js
// ==/UserScript==

let settings = new ChtwSettings('chtwFriendsHistory', '<a target="_blank" href="https://openuserjs.org/scripts/Chortowod/Shiki_Friends_History">История друзей</a>');
let friendsCustomIDs;
let style = 'summary { cursor: pointer } table td { padding: 0px 10px 0 0; }';
let redirectToFriends = document.getElementsByClassName('submenu-triangle')[1].getAttribute("href") + "/friends";
let domain = document.location.origin;

function initSettings() {
    settings.createOption('isEng', 'Названия на английском', false);
    settings.createOption('textColor', 'Цвет текста первых двух столбцов', '#f2f8ff', 'color');
    settings.createOption('backColor', 'Цвет задника таблицы', 'black', 'color');
    settings.createOption('linkColor', 'Цвет ссылок на аниме', '#34c34d', 'color');
    settings.createOption('timeShort', 'Только дата (без времени)', false);
    settings.createOption('entLimit', 'Сколько записей будет браться у каждого пользователя', 50, 'number');
    settings.createOption('daysLimit', 'За какой период будет браться информация (в днях)', 30, 'number');
    settings.createOption('friendsLimit', 'Сколько друзей брать в расчет', 10, 'number');
    settings.createOption('friendsCP', 'Вкл./выкл. возможность вписать конкретные профили для отслеживания', false);
    settings.createOption('friendsIDs', 'Список конкретных профилей (через запятую без пробелов)', '', 'text', true);
    friendsCustomIDs = (settings.getOption('friendsCP') && settings.getOption('friendsIDs')) ? settings.getOption('friendsIDs').split(',') : [];
}

function addFriends() {
    if (document.getElementById('ctwFriends')) return;
    let mainAppend = document.querySelector('.menu-dropdown.profile > .submenu');
    if (!mainAppend) return;
    let whatAppend = document.getElementsByClassName('icon-users')[0].cloneNode(true);
    whatAppend.href = redirectToFriends;
    whatAppend.id = 'ctwFriends';
    whatAppend.title = "Друзья";
    whatAppend.textContent = "Друзья";
    mainAppend.insertBefore(whatAppend, mainAppend.childNodes[5]);
}

function addFriendHistory() {
    if (!location.href.includes("/friends")) return;
    if (document.getElementById('ctwFriendsHistory')) return;
    let allEntries = [];
    let friendsID = [];
    let timeOptions = settings.getOption('timeShort') ? {year: 'numeric', month: 'long', day: 'numeric'} : {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'};
    let timeSeparate = {hour: 'numeric', minute: 'numeric'};

    if (settings.getOption('friendsCP'))
        friendsID = friendsCustomIDs;
    else
        $(".b-user.c-column.named_avatar").each(function() { friendsID.push(this.textContent); } );

    let friendsCounter = 0;
    let mainAppend = document.querySelector('.l-page > div');
    let whatAppend = document.createElement('details');
    whatAppend.classList.add('block', 'is-own-profile');

    let whatAppendSummary = document.createElement('summary');
    whatAppendSummary.innerText = 'История просмотра друзей';
    whatAppendSummary.classList.add('subheadline');
    GM_addStyle(style);

    let whatAppendDiv = document.createElement('div');
    whatAppendDiv.classList.add('cc');
    whatAppendDiv.innerText = 'Loading...';

    whatAppend.append(whatAppendSummary);
    whatAppend.append(whatAppendDiv);

    whatAppend.id = 'ctwFriendsHistory';
    mainAppend.append(whatAppend);

    if (friendsID.length > settings.getOption('friendsLimit'))
        friendsID = friendsID.slice(0, settings.getOption('friendsLimit'));

    let colors = ['#ce00ff20', '#0035ff20', '#ff000020', '#9bff0020', '#ff8f0020', '#00c2ff20'];

    friendsID.forEach(function (id, index) {
        setTimeout(function(){
            $.ajax({
                url: domain+'/api/users/'+id+'/history?limit='+settings.getOption('entLimit'),
                success: function(data) {
                    if (data.length === 0) {
                        console.log('Что-то пошло не так.');
                    }
                    else {
                        let color = colors.pop();
                        data.forEach(function (item) {
                            let currentDate = new Date();
                            let itemDate = new Date(item.created_at)
                            if (currentDate - itemDate < (settings.getOption('daysLimit') * 60 * 60 * 24 * 1000)) {
                                item.id = id;
                                item.color = color;
                                allEntries.push(item);
                            }
                        })
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    whatAppend.getElementsByClassName('cc')[0].innerText = 'Произошла ошибка при загрузке. Обновите страницу или посмотрите причину ошибки в консоли разработчика.';
                    console.log("Status: " + textStatus + " | Error: " + errorThrown);
                },
                complete: function() {
                    friendsCounter++;
                }
            });
        }, (index+1)*250);

    });

    let countdownPing = 60;

    let countdownShower = setInterval(function(){
        if (friendsCounter === friendsID.length) {
            clearInterval(countdownShower);
            allEntries.sort(function (a, b) {
                if (a.created_at > b.created_at) return 1;
                if (a.created_at < b.created_at) return -1;
                return 0;
            });
            allEntries.reverse();
            whatAppend.getElementsByClassName('cc')[0].innerText = '';
            let table = document.createElement('table');
            allEntries.forEach(function (item) {
                if (!item.target)
                    return;
                let titleName = settings.getOption('isEng') ? item.target.name : (item.target.russian || item.target.name);
                if (titleName.length > 80)
                    titleName = titleName.slice(0, 80)+'...';
                let animeLink = "<a style='color: "+settings.getOption('linkColor')+";' href='"+domain+item.target.url+"'>"+titleName+"</a>"
                let tr = document.createElement('tr');
                let td1 = document.createElement('td');
                let td2 = document.createElement('td');
                let td3 = document.createElement('td');
                let td4 = document.createElement('td');
                let td5 = document.createElement('td');
                tr.style.backgroundColor = item.color;
                td1.innerHTML = item.id;
                td2.innerHTML = new Date(item.created_at).toLocaleString("ru", timeOptions);
                td2.title = new Date(item.created_at).toLocaleString("ru", timeSeparate);
                td3.innerHTML = animeLink;
                td4.innerHTML = item.description;
                if (item.description.includes('Удалено') || item.description.includes('Брошено'))
                    td4.style.color = '#ff2a00';
                else if (item.description.includes('Добавлено'))
                    td4.style.color = '#04f1ff';
                else if (item.description.includes('эпизод') || item.description.includes('Смотрю') || item.description.includes('глав') || item.description.includes('Читаю'))
                    td4.style.color = '#1cd616';
                else if (item.description.includes('цен') || item.description === 'Просмотрено' || item.description === 'Прочитано')
                    td4.style.color = '#b2ff00';
                else if (item.description.includes('Пере'))
                    td4.style.color = '#ff9200';
                td5.innerHTML = item.target.url.includes('/animes') ? 'Аниме' : (item.target.url.includes('/mangas') ? 'Манга' : 'Ранобе');
                tr.append(td1);
                tr.append(td2);
                tr.append(td5);
                tr.append(td3);
                tr.append(td4);
                table.append(tr);
            });
            table.style.background = settings.getOption('backColor');
            table.style.color = settings.getOption('textColor');
            table.style.width = '100%';
            whatAppend.getElementsByClassName('cc')[0].append(table);
        }
        else if (countdownPing === 0) {
            clearInterval(countdownShower);
            whatAppend.getElementsByClassName('cc')[0].innerText = 'Произошла ошибка при загрузке. Обновите страницу или посмотрите причину ошибки в консоли разработчика.';
            console.log("Количество друзей в профиле не совпало с полученным ответом по API.");
        }
        else
            countdownPing--;
    }, 250);
}

function ready(fn) {
    document.addEventListener('page:load', fn);
    document.addEventListener('turbolinks:load', fn);
    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") fn();
    else document.addEventListener('DOMContentLoaded', fn);
}

ready(initSettings);
ready(addFriends);
ready(addFriendHistory);
