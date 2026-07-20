// ==UserScript==
// @name         Shiki Score Calc
// @namespace    https://shikimori.rip/
// @version      2.1.0
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @match        *://shikimori.io/*
// @match        *://shiki.one/*
// @match        *://shikimori.rip/*
// @match        *://shikimori.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain_url=https://shikimori.rip
// @description  Компактный калькулятор оценки для Shikimori
// @author       Talleyran
// @license      MIT
// @grant        none
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiScoreCalc.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiScoreCalc.user.js
// ==/UserScript==

(function () {
	"use strict";

	const SAVE_SCORES = true;
	const STORAGE_PREFIX = "shiki-score-calc:v3";
	const V2_STORAGE_PREFIX = "shiki-score-calc:v2";

	const SHIKI_SCALE = [
		null,
		"Хуже некуда",
		"Ужасно",
		"Очень плохо",
		"Плохо",
		"Более-менее",
		"Нормально",
		"Хорошо",
		"Отлично",
		"Великолепно",
		"Эпик вин",
	];

	const COMMON_CRITERIA = {
		story: {
			id: "story",
			name: "История",
			weight: 20,
			description: "Замысел, связность, темп и развитие повествования.",
			levels: [
				"Разваливается и мешает",
				"Часто не работает",
				"Выполняет свою задачу",
				"Хорошо построена",
				"Выдающаяся",
			],
		},
		characters: {
			id: "characters",
			name: "Персонажи",
			weight: 20,
			description: "Характеры, мотивация, развитие и взаимодействия.",
			levels: [
				"Неубедительны и мешают",
				"Плоские или непоследовательные",
				"Выполняют свои роли",
				"Живые и хорошо раскрыты",
				"Исключительно сильный состав",
			],
		},
	};

	const PROFILES = {
		animes: [
			COMMON_CRITERIA.story,
			COMMON_CRITERIA.characters,
			{
				id: "drawing",
				name: "Рисовка",
				weight: 15,
				description: "Дизайн персонажей, фоны, палитра, детализация и стабильность изображения.",
				levels: [
					"Мешает восприятию",
					"Бедная или заметно неровная",
					"Аккуратная и уместная",
					"Выразительная и цельная",
					"Выдающийся визуальный стиль",
				],
			},
			{
				id: "staging",
				name: "Постановка",
				weight: 15,
				description: "Анимация, режиссура сцен, композиция кадра и монтаж.",
				levels: [
					"Сцены и движение разваливаются",
					"Скованная или невыразительная",
					"Справляется со своей задачей",
					"Сильно усиливает сцены",
					"Мастерская постановка",
				],
			},
			{
				id: "sound",
				name: "Звук",
				weight: 10,
				description: "Музыка, озвучка и звуковой дизайн.",
				levels: [
					"Мешает восприятию",
					"Слабый или неуместный",
					"Работает, не выделяясь",
					"Заметно усиливает сцены",
					"Выдающаяся звуковая работа",
				],
			},
			{
				id: "impression",
				name: "Впечатление",
				weight: 20,
				description: "Увлечённость, эмоции, запоминаемость и желание пересмотреть.",
				levels: [
					"Хотелось прекратить просмотр",
					"Скорее не понравилось",
					"Смешанное или ровное впечатление",
					"Очень понравилось",
					"Личный фаворит",
				],
			},
		],
		mangas: [
			COMMON_CRITERIA.story,
			COMMON_CRITERIA.characters,
			{
				id: "drawing",
				name: "Рисовка",
				weight: 15,
				description: "Стиль, детализация, выразительность и стабильность рисунка.",
				levels: [
					"Мешает чтению",
					"Бедная или заметно неровная",
					"Аккуратная и уместная",
					"Выразительная и цельная",
					"Выдающийся визуальный стиль",
				],
			},
			{
				id: "composition",
				name: "Композиция",
				weight: 15,
				description: "Панели, читаемость действия и визуальное повествование.",
				levels: [
					"Трудно читать и понимать",
					"Часто сбивает темп чтения",
					"Понятная и функциональная",
					"Выразительно ведёт историю",
					"Мастерское визуальное повествование",
				],
			},
			{
				id: "atmosphere",
				name: "Атмосфера",
				weight: 10,
				description: "Цельность мира, настроение и выразительность деталей.",
				levels: [
					"Мир не складывается",
					"Слабая или непоследовательная",
					"Работает на нужном уровне",
					"Убедительно погружает",
					"Полное погружение",
				],
			},
			{
				id: "impression",
				name: "Впечатление",
				weight: 20,
				description: "Увлечённость, эмоции, запоминаемость и желание перечитать.",
				levels: [
					"Хотелось бросить",
					"Скорее не понравилось",
					"Смешанное или ровное впечатление",
					"Очень понравилось",
					"Личный фаворит",
				],
			},
		],
		ranobe: [
			COMMON_CRITERIA.story,
			COMMON_CRITERIA.characters,
			{
				id: "text",
				name: "Текст",
				weight: 15,
				description: "Стиль, ясность, диалоги и качество доступного перевода.",
				levels: [
					"Тяжело и неясно",
					"Слабый или заметно неровный",
					"Понятный и функциональный",
					"Выразительный и уверенный",
					"Выдающийся авторский стиль",
				],
			},
			{
				id: "world",
				name: "Мир",
				weight: 15,
				description: "Цельность, атмосфера и убедительность мироустройства.",
				levels: [
					"Непоследовательный и мешает",
					"Слабо проработан",
					"Достаточен для истории",
					"Глубокий и убедительный",
					"Исключительно убедительный",
				],
			},
			{
				id: "illustrations",
				name: "Иллюстрации",
				weight: 10,
				description: "Качество, выразительность и вклад иллюстраций в произведение.",
				levels: [
					"Мешают произведению",
					"Слабые или неровные",
					"Уместные и аккуратные",
					"Выразительные и запоминающиеся",
					"Выдающиеся",
				],
			},
			{
				id: "impression",
				name: "Впечатление",
				weight: 20,
				description: "Увлечённость, эмоции, запоминаемость и желание перечитать.",
				levels: [
					"Хотелось бросить",
					"Скорее не понравилось",
					"Смешанное или ровное впечатление",
					"Очень понравилось",
					"Личный фаворит",
				],
			},
		],
	};

	const STYLES = `
		.scoreCalc {
			--score-calc-accent: #739dcc;
			--score-calc-line: rgba(133, 153, 181, 0.25);
			--score-calc-soft: rgba(115, 157, 204, 0.09);
			margin-top: 12px;
			color: inherit;
		}

		.score-calc-panel {
			border-top: 1px solid var(--score-calc-line);
		}

		.score-calc-item {
			border-bottom: 1px solid var(--score-calc-line);
		}

		.score-calc-item.is-open {
			background: var(--score-calc-soft);
		}

		.score-calc-row {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto 12px;
			align-items: center;
			gap: 7px;
			width: 100%;
			min-height: 32px;
			padding: 4px 8px;
			border: 0;
			border-radius: 0;
			background: transparent;
			color: inherit;
			font: inherit;
			text-align: left;
			cursor: pointer;
		}

		.score-calc-row:hover,
		.score-calc-row:focus-visible {
			background: var(--score-calc-soft);
			outline: none;
		}

		.score-calc-name {
			min-width: 0;
			font-size: 13px;
			line-height: 1.25;
			white-space: normal;
		}

		.score-calc-value {
			min-width: 26px;
			color: var(--score-calc-accent);
			font-size: 11px;
			font-weight: 700;
			text-align: right;
		}

		.score-calc-chevron {
			width: 7px;
			height: 7px;
			border-right: 1px solid currentColor;
			border-bottom: 1px solid currentColor;
			opacity: 0.48;
			transform: rotate(45deg) translate(-1px, -1px);
			transition: transform 160ms ease;
		}

		.score-calc-item.is-open .score-calc-chevron {
			transform: rotate(225deg) translate(-1px, -1px);
		}

		.score-calc-details {
			display: grid;
			grid-template-rows: 0fr;
			opacity: 0;
			transition: grid-template-rows 180ms ease, opacity 140ms ease;
		}

		.score-calc-item.is-open .score-calc-details {
			grid-template-rows: 1fr;
			opacity: 1;
		}

		.score-calc-details-inner {
			overflow: hidden;
		}

		.score-calc-details-content {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			column-gap: 6px;
			padding: 0 8px 6px;
		}

		.score-calc-description {
			grid-column: 1 / -1;
			margin: 0;
			opacity: 0.68;
			font-size: 10px;
			line-height: 1.25;
		}

		.score-calc-scale {
			position: relative;
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			align-items: start;
			grid-column: 1 / -1;
			height: 20px;
			margin-top: 7px;
		}

		.score-calc-scale::before,
		.score-calc-scale-fill {
			position: absolute;
			top: 6px;
			left: 10%;
			height: 2px;
			border-radius: 2px;
			content: "";
		}

		.score-calc-scale::before {
			right: 10%;
			background: var(--score-calc-line);
		}

		.score-calc-scale-fill {
			z-index: 1;
			width: calc((var(--score-value, 1) - 1) * 20%);
			background: var(--score-calc-accent);
			transition: width 160ms ease;
		}

		.score-calc-option {
			position: relative;
			z-index: 2;
			display: grid;
			justify-items: center;
		}

		.score-calc-option input {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			opacity: 0;
		}

		.score-calc-dot {
			display: block;
			width: 11px;
			height: 11px;
			border: 2px solid var(--score-calc-accent);
			border-radius: 50%;
			background: #fff;
			box-sizing: border-box;
			cursor: pointer;
			transition: transform 140ms ease, background 140ms ease, box-shadow 140ms ease;
		}

		.score-calc-option label:hover .score-calc-dot {
			transform: scale(1.22);
		}

		.score-calc-option input:checked + label .score-calc-dot {
			background: var(--score-calc-accent);
			box-shadow: 0 0 0 3px rgba(115, 157, 204, 0.18);
			transform: scale(1.25);
		}

		.score-calc-option input:focus-visible + label .score-calc-dot {
			outline: 2px solid var(--score-calc-accent);
			outline-offset: 3px;
		}

		.score-calc-level {
			align-self: center;
			min-height: 26px;
			font-size: 11px;
			line-height: 1.3;
			text-align: left;
		}

		.score-calc-level.is-placeholder {
			opacity: 0.5;
		}

		.score-calc-skip {
			align-self: center;
			margin: 0;
			padding: 2px 4px;
			border: 0;
			background: transparent;
			color: inherit;
			opacity: 0.48;
			font: inherit;
			font-size: 10px;
			cursor: pointer;
			text-decoration: underline;
			text-decoration-style: dotted;
			text-underline-offset: 2px;
		}

		.score-calc-skip:hover,
		.score-calc-skip:focus-visible {
			opacity: 0.85;
			outline: none;
		}

		.score-calc-result {
			padding: 10px 8px 2px;
		}

		.score-calc-result-main {
			display: flex;
			align-items: baseline;
			gap: 7px;
			min-height: 21px;
		}

		.score-calc-score {
			color: var(--score-calc-accent);
			font-size: 20px;
			font-weight: 700;
			line-height: 1;
		}

		.score-calc-verdict {
			font-size: 13px;
			font-weight: 600;
		}

		.score-calc-result-detail {
			margin-top: 3px;
			opacity: 0.62;
			font-size: 11px;
			line-height: 1.3;
		}

		@media (prefers-color-scheme: dark) {
			.score-calc-dot {
				background: #182033;
			}
		}

		@media (prefers-reduced-motion: reduce) {
			.score-calc-chevron,
			.score-calc-details,
			.score-calc-scale-fill,
			.score-calc-dot {
				transition: none;
			}
		}
	`;

	function shikiScoreCalc() {
		const pageMatch = window.location.pathname.match(/^\/(animes|mangas|ranobe)\/([^/]+)/);
		if (!pageMatch) return;

		const container = document.querySelector(".b-db_entry > .c-image");
		if (!container) return;

		const mediaType = pageMatch[1];
		const slug = pageMatch[2];
		const entryId = (slug.match(/\d+/) || [slug])[0];
		const entryKey = `${mediaType}:${entryId}`;
		const storageKey = `${STORAGE_PREFIX}:${entryKey}`;
		const criteria = PROFILES[mediaType];

		const existingBlock = document.querySelector(".scoreCalc");
		if (existingBlock?.dataset.entryKey === entryKey) return;
		existingBlock?.remove();

		injectStyles();

		const ratings = loadRatings({ storageKey, entryKey, slug, mediaType, criteria });
		const block = createCalculatorBlock(entryKey, criteria, ratings);
		container.appendChild(block);
		bindCalculator(block, storageKey, criteria, ratings);
		updateCalculator(block, criteria, ratings);
	}

	function createCalculatorBlock(entryKey, criteria, ratings) {
		const block = document.createElement("section");
		block.className = "scoreCalc";
		block.dataset.entryKey = entryKey;
		block.innerHTML = `
			<div class="subheadline">Калькулятор оценки</div>
			<div class="score-calc-panel">
				<div class="score-calc-list"></div>
				<div class="score-calc-result" aria-live="polite">
					<div class="score-calc-result-main">
						<span class="score-calc-score"></span>
						<strong class="score-calc-verdict">Оценка не рассчитана</strong>
					</div>
					<div class="score-calc-result-detail">Оценено 0 из ${criteria.length}</div>
				</div>
			</div>
		`;

		const list = block.querySelector(".score-calc-list");
		for (const criterion of criteria) {
			list.appendChild(createCriterionItem(entryKey, criterion, ratings[criterion.id]));
		}
		return block;
	}

	function createCriterionItem(entryKey, criterion, rating) {
		const item = document.createElement("div");
		const safeEntryKey = entryKey.replace(/[^a-zA-Z0-9_-]/g, "-");
		const detailsId = `score-calc-details-${safeEntryKey}-${criterion.id}`;
		item.className = "score-calc-item";
		item.dataset.criterion = criterion.id;
		item.innerHTML = `
			<button class="score-calc-row" type="button" aria-expanded="false" aria-controls="${detailsId}">
				<span class="score-calc-name">${criterion.name}</span>
				<span class="score-calc-value">—</span>
				<span class="score-calc-chevron" aria-hidden="true"></span>
			</button>
			<div class="score-calc-details" id="${detailsId}" aria-hidden="true" inert>
				<div class="score-calc-details-inner">
					<div class="score-calc-details-content">
						<p class="score-calc-description">${criterion.description}</p>
						<div class="score-calc-scale" role="radiogroup" aria-label="${criterion.name}" style="--score-value: 1">
							<span class="score-calc-scale-fill" aria-hidden="true"></span>
						</div>
						<div class="score-calc-level is-placeholder">Выберите уровень</div>
						<button class="score-calc-skip" type="button">Не оцениваю</button>
					</div>
				</div>
			</div>
		`;

		const scale = item.querySelector(".score-calc-scale");
		criterion.levels.forEach((level, index) => {
			const value = index + 1;
			const inputId = `score-calc-${safeEntryKey}-${criterion.id}-${value}`;
			const option = document.createElement("span");
			option.className = "score-calc-option";
			option.innerHTML = `
				<input class="score-calc-input" type="radio" id="${inputId}" name="score-calc-${safeEntryKey}-${criterion.id}" value="${value}" data-criterion="${criterion.id}" aria-label="${level}"${rating === value ? " checked" : ""}>
				<label for="${inputId}" data-level="${level}"><span class="score-calc-dot" aria-hidden="true"></span></label>
			`;
			scale.appendChild(option);
		});

		updateCriterionItem(item, criterion, rating);
		return item;
	}

	function bindCalculator(block, storageKey, criteria, ratings) {
		block.addEventListener("click", (event) => {
			const row = event.target.closest(".score-calc-row");
			if (row) {
				toggleCriterion(block, row.closest(".score-calc-item"));
				return;
			}

			const skipButton = event.target.closest(".score-calc-skip");
			if (!skipButton) return;

			const item = skipButton.closest(".score-calc-item");
			const criterion = criteria.find((value) => value.id === item.dataset.criterion);
			ratings[criterion.id] = "na";
			for (const input of item.querySelectorAll(".score-calc-input")) input.checked = false;
			updateCriterionItem(item, criterion, "na");
			saveRatings(storageKey, ratings);
			updateCalculator(block, criteria, ratings);
		});

		block.addEventListener("change", (event) => {
			const input = event.target.closest(".score-calc-input");
			if (!input) return;

			const criterion = criteria.find((value) => value.id === input.dataset.criterion);
			const item = input.closest(".score-calc-item");
			ratings[criterion.id] = Number(input.value);
			updateCriterionItem(item, criterion, ratings[criterion.id]);
			saveRatings(storageKey, ratings);
			updateCalculator(block, criteria, ratings);
		});

		block.addEventListener("mouseover", previewLevel);
		block.addEventListener("focusin", previewLevel);
		block.addEventListener("mouseout", restoreLevel);
		block.addEventListener("focusout", restoreLevel);
	}

	function toggleCriterion(block, selectedItem) {
		const willOpen = !selectedItem.classList.contains("is-open");
		for (const item of block.querySelectorAll(".score-calc-item")) {
			const isSelected = item === selectedItem && willOpen;
			item.classList.toggle("is-open", isSelected);
			item.querySelector(".score-calc-row").setAttribute("aria-expanded", String(isSelected));
			const details = item.querySelector(".score-calc-details");
			details.setAttribute("aria-hidden", String(!isSelected));
			details.toggleAttribute("inert", !isSelected);
		}
	}

	function previewLevel(event) {
		const label = getOptionLabel(event.target);
		if (!label) return;
		const level = label.closest(".score-calc-item").querySelector(".score-calc-level");
		level.textContent = label.dataset.level;
		level.classList.remove("is-placeholder");
	}

	function restoreLevel(event) {
		const label = getOptionLabel(event.target);
		if (!label || label.contains(event.relatedTarget)) return;
		const item = label.closest(".score-calc-item");
		const checked = item.querySelector(".score-calc-input:checked");
		const level = item.querySelector(".score-calc-level");
		if (checked) {
			level.textContent = checked.nextElementSibling.dataset.level;
			level.classList.remove("is-placeholder");
		} else if (item.dataset.skipped === "true") {
			level.textContent = "Критерий исключён из расчёта";
			level.classList.add("is-placeholder");
		} else {
			level.textContent = "Выберите уровень";
			level.classList.add("is-placeholder");
		}
	}

	function getOptionLabel(target) {
		const label = target.closest(".score-calc-option label");
		if (label) return label;
		const input = target.closest(".score-calc-input");
		return input?.nextElementSibling || null;
	}

	function updateCriterionItem(item, criterion, rating) {
		const value = item.querySelector(".score-calc-value");
		const scale = item.querySelector(".score-calc-scale");
		item.dataset.skipped = String(rating === "na");

		if (Number.isInteger(rating)) {
			value.textContent = `${rating}/5`;
			scale.style.setProperty("--score-value", rating);
		} else {
			value.textContent = rating === "na" ? "н/о" : "—";
			scale.style.setProperty("--score-value", 1);
		}
		setLevelText(item, criterion, rating);
	}

	function setLevelText(item, criterion, rating) {
		const level = item.querySelector(".score-calc-level");
		if (Number.isInteger(rating)) {
			level.textContent = criterion.levels[rating - 1];
			level.classList.remove("is-placeholder");
		} else if (rating === "na") {
			level.textContent = "Критерий исключён из расчёта";
			level.classList.add("is-placeholder");
		} else {
			level.textContent = "Выберите уровень";
			level.classList.add("is-placeholder");
		}
	}

	function updateCalculator(block, criteria, ratings) {
		const result = calculateResult(criteria, ratings);
		const score = block.querySelector(".score-calc-score");
		const verdict = block.querySelector(".score-calc-verdict");
		const detail = block.querySelector(".score-calc-result-detail");

		if (!result.complete) {
			score.textContent = "";
			verdict.textContent = "Оценка не рассчитана";
			detail.textContent = `Оценено ${result.resolvedCount} из ${criteria.length}`;
			return;
		}

		if (result.exactScore === null) {
			score.textContent = "";
			verdict.textContent = "Нет оцениваемых критериев";
			detail.textContent = "Выберите хотя бы один уровень";
			return;
		}

		score.textContent = `${result.shikiScore}/10`;
		verdict.textContent = SHIKI_SCALE[result.shikiScore];
		detail.textContent = `Точный расчёт: ${formatScore(result.exactScore)}`;
	}

	function calculateResult(criteria, ratings) {
		const resolved = criteria.filter((criterion) => ratings[criterion.id] !== undefined);
		const rated = criteria.filter((criterion) => Number.isInteger(ratings[criterion.id]));
		if (resolved.length < criteria.length) {
			return { complete: false, resolvedCount: resolved.length, exactScore: null, shikiScore: null };
		}
		if (rated.length === 0) {
			return { complete: true, resolvedCount: resolved.length, exactScore: null, shikiScore: null };
		}

		const totalWeight = rated.reduce((sum, criterion) => sum + criterion.weight, 0);
		const weightedAverage = rated.reduce(
			(sum, criterion) => sum + ratings[criterion.id] * criterion.weight,
			0,
		) / totalWeight;
		const exactScore = 1 + (9 * (weightedAverage - 1)) / 4;
		const shikiScore = Math.max(1, Math.min(10, Math.round(exactScore)));
		return { complete: true, resolvedCount: resolved.length, exactScore, shikiScore };
	}

	function formatScore(value) {
		return value.toFixed(1).replace(".", ",");
	}

	function loadRatings({ storageKey, entryKey, slug, mediaType, criteria }) {
		if (!SAVE_SCORES) return {};

		const current = readStorage(storageKey);
		if (current?.version === 3 && current.ratings && typeof current.ratings === "object") {
			return sanitizeRatings(current.ratings, criteria);
		}

		const v2Candidates = [
			`${V2_STORAGE_PREFIX}:${entryKey}`,
			`${V2_STORAGE_PREFIX}:${mediaType}:${slug}`,
		];
		for (const v2Key of v2Candidates) {
			const v2 = readStorage(v2Key);
			if (v2?.version === 2 && v2.values && typeof v2.values === "object") {
				const migrated = migrateV2Ratings(v2.values, mediaType);
				saveRatings(storageKey, migrated);
				return sanitizeRatings(migrated, criteria);
			}
		}

		const legacy = readStorage(`${slug}-score`);
		if (Array.isArray(legacy) && legacy.length >= 5) {
			const migrated = migrateLegacyRatings(legacy, mediaType);
			saveRatings(storageKey, migrated);
			return sanitizeRatings(migrated, criteria);
		}

		return {};
	}

	function readStorage(key) {
		try {
			const value = localStorage.getItem(key);
			return value === null ? null : JSON.parse(value);
		} catch (error) {
			console.error(`Shiki Score Calc: не удалось прочитать ${key}`, error);
			return null;
		}
	}

	function sanitizeRatings(values, criteria) {
		const result = {};
		for (const criterion of criteria) {
			const value = values[criterion.id];
			if (value === "na" || (Number.isInteger(value) && value >= 1 && value <= 5)) {
				result[criterion.id] = value;
			}
		}
		return result;
	}

	function migrateV2Ratings(values, mediaType) {
		const common = compactRatings({
			story: values.narrative,
			characters: values.characters,
			impression: values.impact,
		});

		if (mediaType === "animes") {
			return compactRatings({
				...common,
				drawing: values.visuals,
				staging: values.visuals,
				sound: values.audio,
			});
		}
		if (mediaType === "mangas") {
			return compactRatings({
				...common,
				drawing: values.art,
				composition: values.art,
				atmosphere: values.atmosphere,
			});
		}
		return compactRatings({
			...common,
			text: values.text,
			world: values.world,
		});
	}

	function migrateLegacyRatings(legacy, mediaType) {
		const converted = legacy.slice(0, 5).map((value) => {
			const parsed = Number.parseInt(value, 10);
			return Number.isInteger(parsed) && parsed >= 0 && parsed <= 2 ? parsed * 2 + 1 : undefined;
		});
		const storyValues = [converted[0], converted[1], converted[4]].filter(Number.isInteger);
		const story = storyValues.length
			? Math.round(storyValues.reduce((sum, value) => sum + value, 0) / storyValues.length)
			: undefined;
		const common = compactRatings({ story, characters: converted[2] });

		if (mediaType === "animes") {
			return compactRatings({ ...common, drawing: converted[3], staging: converted[3] });
		}
		if (mediaType === "mangas") {
			return compactRatings({ ...common, drawing: converted[3], composition: converted[3] });
		}
		return compactRatings({ ...common, text: converted[3] });
	}

	function compactRatings(values) {
		return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
	}

	function saveRatings(storageKey, ratings) {
		if (!SAVE_SCORES) return;
		try {
			localStorage.setItem(storageKey, JSON.stringify({ version: 3, ratings }));
		} catch (error) {
			console.error("Shiki Score Calc: не удалось сохранить оценки", error);
		}
	}

	function injectStyles() {
		if (document.getElementById("score-calc-styles")) return;
		const style = document.createElement("style");
		style.id = "score-calc-styles";
		style.textContent = STYLES;
		document.head.appendChild(style);
	}

	shikiScoreCalc();
	document.addEventListener("page:load", shikiScoreCalc);
	document.addEventListener("turbolinks:load", shikiScoreCalc);
	document.addEventListener("DOMContentLoaded", shikiScoreCalc);
})();
