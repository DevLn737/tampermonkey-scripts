// ==UserScript==
// @name         Shiki Score Calc
// @namespace    https://shikimori.rip/
// @version      1.0.2
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @match        *://shikimori.io/*
// @match        *://shiki.one/*
// @match        *://shikimori.rip/*
// @match        *://shikimori.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain_url=https://shikimori.rip
// @description  Rating Score Calc for Shikimori users
// @author       Talleyran
// @license      MIT
// @grant        none
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiScoreCalc.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiScoreCalc.user.js
// ==/UserScript==

function shikiScoreCalc() {

	//если хотим хранить в памяти браузера выставленные оценки для каждого тайтла
	const saveScoresInLocalStorage = true;

	const pages = /(\/)(animes|mangas|ranobe)(\/)/g;
	if (document.location.href.match(pages) == null) {
		return; //мы не на странице аниме, манги или ранобе
	}

	const container = document.querySelector(".b-db_entry>.c-image");
	if (!container) {
		console.log("not a title page");
		return; //мы не на странице тайтла, блок показывать негде
	}

	let scoreCalcBlock = document.querySelector('.scoreCalc');
	if (!scoreCalcBlock) {
		scoreCalcBlock = document.createElement("div");
		scoreCalcBlock.classList.add("scoreCalc");
		scoreCalcBlock.innerHTML += "<div class='subheadline'>Калькулятор оценки</div>";
		container.appendChild(scoreCalcBlock);
	} else {
		return; //уже вывели калькулятор, второй раз не надо
	}

	const scores = [
		{ id:"concept", name: "Концепция", value: 1},
		{ id:"plot", name: "Сюжет", value: 1},
		{ id:"characters", name: "Персонажи", value: 1},
		{ id:"realization", name: "Исполнение", value: 1},
		{ id:"ending", name: "Концовка", value: 1},
	];

	const titleId = document.location.href.split("/").pop() + "-score";

	if (saveScoresInLocalStorage && localStorage[titleId] != undefined) {
		try {
			let savedScores = JSON.parse(localStorage[titleId]);
			if (Array.isArray(savedScores)) {
				for (let [index, value] of scores.entries()) {
					value.value = parseInt(savedScores[index]);
				}
			} else {
				throw new Error("значение не является массивом оценок!");
			}
		} catch (e) {
			console.error("Битые данные в LocalStorage: " + e);
		}
	}

	const values = [
		{ id: "negative", name: "", value: 0, bg: '#fff1f2', color: "#e8a092"},
		{ id: "neutral", name: "", value: 1, bg: "#f6fcfd", color: "#7aaebd"},
		{ id: "positive", name: "", value: 2, bg:"#eff9e6", color: "#85bd7a"},
	];

	const styles = `
		.score-calc-value {
		display: flex;
		align-items: center;
	    padding-left: 0.5rem;
	    border-left: 5px solid currentColor;
		}

		.score-calc-value span {
			margin-right: auto;
		}

		.score-calc-value input {
			visibility: hidden;
			border: 0;
			width: 0;
			height: 0;
		}

		.score-calc-value label {
			opacity: 0.5;
			font-size: 1.5rem;
			user-select: none;
			font-family: "shikimori";
			padding: 0 5px;
			cursor: pointer;
		}

		.score-calc-value input:checked+label {
			opacity: 1;
		}

		.score-calc-total {
			font-weight: bold;
			margin: 0.5rem 0;
		}
	`;

	const style = document.createElement('style');
	style.innerHTML = styles;
	document.head.appendChild(style);

	for (let score of scores) {
		let div = document.createElement("div");
		div.classList.add("score-calc-value");
		div.innerHTML = `<span>${score.name}</span>`;
		for (let value of values) {
			let id = score.id + "_" + value.id;
			let checked = "";
			if (value.value == score.value) {
				checked = "checked";
				div.style.background = value.bg;
				div.style.color = value.color;
			}
			div.innerHTML += `<input class='score-calc-radio' type='radio' id='${id}' name="${score.id}" value="${value.value}" ${checked} data-color='${value.color}' data-bg='${value.bg}'><label for='${id}' class="b-reviews_navigation navigation-node-negative label">${value.name}</label>`;
		}
		scoreCalcBlock.appendChild(div);
	}
	scoreCalcBlock.innerHTML += `<div class='score-calc-total'>Итого: <span class='value'>5</span> из 10</div>`;

	calcResult(null);

	let radios = document.querySelectorAll(".score-calc-radio");
	for (let radio of radios) {
		radio.addEventListener("click", calcResult);
	}

	function calcResult(event) {
		if (event != null) {
			event.target.parentNode.style.background = event.target.dataset.bg;
			event.target.parentNode.style.color = event.target.dataset.color;
		}
		let total = 0;
		let savedScores = [];
		for (let score of scores) {
			let value = parseInt(document.querySelector(`input[name='${score.id}']:checked`).value);
			total += value;
			savedScores.push(value);
		}

		if (saveScoresInLocalStorage) {
			localStorage.setItem(titleId, JSON.stringify(savedScores));
		}
		if (total == 0) total = 1;
		document.querySelector('.score-calc-total .value').innerText = total;
	}
}
shikiScoreCalc();
document.addEventListener('page:load', shikiScoreCalc);
document.addEventListener('turbolinks:load', shikiScoreCalc);
document.addEventListener('DOMContentLoaded', shikiScoreCalc);
