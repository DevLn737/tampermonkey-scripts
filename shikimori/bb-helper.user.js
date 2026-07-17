// ==UserScript==
// @name         bb-helper
// @namespace    https://shikimori.rip/
// @version      1.1.3
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @match        *://shikimori.io/*
// @match        *://shiki.one/*
// @match        *://shikimori.rip/*
// @match        *://shikimori.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain_url=https://shikimori.rip
// @description  Добавляет возможность сохранять шаблоны BB-кода и использовать их
// @author       LifeH
// @grant        none
// @license MIT
// @require      https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.6/Sortable.min.js
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/bb-helper.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/bb-helper.user.js
// ==/UserScript==

(() => {
  'use strict';

  const defaultTemplates = [
    {
      "id": "folder-spoilers",
      "name": "Спойлеры",
      "folder": true,
      "templates": [
        {
          "id": "spoiler-is-fullwidth",
          "name": "Спойлер (fullwidth)",
          "code": "[spoiler=Спойлер is-fullwidth]Скрытый текст[/spoiler]"
        },
        {
          "id": "spoiler-is-fullwidth-is-centered",
          "name": "Спойлер (full+centered)",
          "code": "[spoiler=Спойлер is-fullwidth is-centered]Скрытый текст[/spoiler]"
        },
        {
          "id": "spoiler-is-fullwidth-is-centered-duble",
          "name": "Двойной спойлер",
          "code": "[div=cc-3]\n[div=right c-column mb-2 mr-4]\n[spoiler_block is-fullwidth is-centered]Скрытый текст[/spoiler_block]\n[/div]\n[div=left c-column mb-2 mr-4]\n[spoiler_block is-fullwidth is-centered]Скрытый текст[/spoiler_block]\n[/div]\nтекст\n[/div]"
        },
        {
          "id": "spoiler-is-fullwidth-is-centered-left",
          "name": "Спойлер справа",
          "code": "[div=cc-3]\n[div=right c-column mb-2 mr-4]\n[spoiler_block is-fullwidth is-centered]Скрытый текст[/spoiler_block]\n[/div]\nтекст\n[/div]"
        },
        {
          "id": "spoiler-is-fullwidth-is-centered-right",
          "name": "Спойлер слева",
          "code": "[div=cc-3]\n[div=left c-column mb-2 mr-4]\n[spoiler_block is-fullwidth is-centered]Скрытый текст[/spoiler_block]\n                [/div]\nтекст\n                [/div]"
        }
      ]
    },
    {
      "id": "folder-subheadlines",
      "name": "Заголовки",
      "folder": true,
      "templates": [
        {
          "id": "headline1",
          "name": "Большой заголовок",
          "code": "[div=headline m20]Большой заголовок[/div]"
        },
        {
          "id": "midheadline",
          "name": "Средний заголовок",
          "code": "[div=midheadline m20]Средний заголовок[/div]"
        },
        {
          "id": "subheadline1",
          "name": "Малый заголовок",
          "code": "[div=subheadline m20]Малый заголовок[/div]"
        },
        {
          "id": "subheadline2",
          "name": "дефолтный цвет",
          "code": "[div=subheadline]дефолтный цвет[/div]"
        },
        {
          "id": "subheadlines-with-tag",
          "name": "Заголовок с тегом",
          "code": "[div=headline d-flex align-items-center justify-content-between p-1]\n  [span]Заголовок с тегом[/span]\n  [div=b-anime_status_tag ongoing right m-0]Тег[/div]\n  [/div]"
        },
        {
          "id": "subheadline3",
          "name": "серый",
          "code": "[div=subheadline gray]серый[/div]"
        },
        {
          "id": "subheadline4",
          "name": "синий",
          "code": "[div=subheadline blue]синий[/div]"
        },
        {
          "id": "subheadline5",
          "name": "пыльносиний",
          "code": "[div=subheadline powderblue]пыльносиний[/div]"
        },
        {
          "id": "subheadline6",
          "name": "небосиний",
          "code": "[div=subheadline skyblue]небосиний[/div]"
        },
        {
          "id": "subheadline7",
          "name": "фиолетовый",
          "code": "[div=subheadline purple]фиолетовый[/div]"
        },
        {
          "id": "subheadline8",
          "name": "зелёный",
          "code": "[div=subheadline green]зелёный[/div]"
        },
        {
          "id": "subheadline9",
          "name": "жёлтый",
          "code": "[div=subheadline yellow]жёлтый[/div]"
        },
        {
          "id": "subheadline10",
          "name": "оранжевый",
          "code": "[div=subheadline orange]оранжевый[/div]"
        },
        {
          "id": "subheadline11",
          "name": "розовый",
          "code": "[div=subheadline pink]розовый[/div]"
        },
        {
          "id": "subheadline12",
          "name": "маджентовый",
          "code": "[div=subheadline magenta]маджентовый[/div]"
        },
        {
          "id": "subheadline13",
          "name": "коричневый",
          "code": "[div=subheadline brown]коричневый[/div]"
        }
      ]
    },
    {
      "id": "folder-tabs",
      "name": "Табы",
      "folder": true,
      "templates": [
        {
          "id": "tab1",
          "name": "Пример 1",
          "code": "[div=to-process data-dynamic=tabs]\n  [div=b-js-link active data-tab-switch]Tab 1[/div]\n  [div=b-js-link data-tab-switch]Tab 2[/div]\n  [div data-tab]Content 1[/div]\n  [div=hidden data-tab]Content 2[/div]\n  [/div]"
        },
        {
          "id": "tab2",
          "name": "Пример 2",
          "code": "[div=to-process data-dynamic=tabs]\n  [div=b-button active data-tab-switch]Tab 1[/div]\n  [div=b-button data-tab-switch]Tab 2[/div]\n  [div data-tab]Content 1[/div]\n  [div=hidden data-tab]Content 2[/div]\n  [/div]"
        },
        {
          "id": "tab3",
          "name": "Пример 3",
          "code": "[div=to-process data-dynamic=tabs]\n  [div=b-link_button inline active data-tab-switch]Tab 1[/div]\n  [div=b-link_button inline data-tab-switch]Tab 2[/div]\n  [div data-tab]Content 1[/div]\n  [div=hidden data-tab]Content 2[/div]\n  [/div]"
        },
        {
          "id": "tab4",
          "name": "Пример 4 вертикальный",
          "code": "[div=d-flex to-process data-dynamic=tabs]\n   [div=d-flex flex-column flex-shrink-0 mr-4]\n    [div=b-link_button active data-tab-switch]Tab 1[/div]\n    [div=b-link_button data-tab-switch]Tab 2[/div]\n    [div=b-link_button data-tab-switch]Tab 3[/div]\n    [div=b-link_button data-tab-switch]Tab 4[/div]\n   [/div]\n   [div=p-2 flex-fill data-tab]Content 1[/div]\n   [div=p-2 flex-fill hidden data-tab]Content 2[/div]\n   [div=p-2 flex-fill hidden data-tab]Content 3[/div]\n   [div=p-2 flex-fill hidden data-tab]Content 4[/div]\n  [/div]"
        }
      ]
    },
    {
      "id": "folder-image-and-vid",
      "name": "Изображения ",
      "folder": true,
      "templates": [
        {
          "id": "img1",
          "name": "Абзац с большой картинкой (слева)",
          "code": "[div=cc-3]\n    [div=c-column mb-2 mr-4]\n    [center][img w=360]https://i.imgur.com/aGMILHR.jpg[/img][/center]\n    [/div]\n    Текст\n    [div=clearfix][/div]\n    [/div]"
        },
        {
          "id": "img2",
          "name": "Абзац с большой картинкой (справа)",
          "code": "[div=cc-3]\n[div=c-column right mb-2 ml-4 mr-0]\n[center][img w=360]https://i.imgur.com/aGMILHR.jpg[/img][/center]\n[/div]\nТекст\n[div=clearfix][/div]\n[/div]"
        },
        {
          "id": "img3",
          "name": "Колонка с цитатой-подписью к изображению(слева)",
          "code": "[center][div=left b-quote d-inline-block p-2 pr-3 pl-3 m-0]\n    [img width=360]https://i.imgur.com/aGMILHR.jpg[/img]\n    Подпись\n    [/div][/center]"
        },
        {
          "id": "img4",
          "name": "Колонка с цитатой-подписью к изображению(справа)",
          "code": "[center][div=right b-quote d-inline-block p-2 pr-3 pl-3 m-0]\n    [img width=360]https://i.imgur.com/aGMILHR.jpg[/img]\n    Подпись\n    [/div][/center]"
        },
        {
          "id": "vid2",
          "name": "Колонка с цитатой-подписью к видео(слева)",
          "code": "[center][div=lift b-quote d-inline-block p-2 pr-3 pl-3 m-0]\nhttps://youtu.be/BL0YK8jryK0\n«Trust in you» by [sweet ARMS]\n[/div][/center]"
        },
        {
          "id": "vid1",
          "name": "Колонка с цитатой-подписью к видео(справа)",
          "code": "[center][div=right b-quote d-inline-block p-2 pr-3 pl-3 m-0]\nhttps://youtu.be/BL0YK8jryK0\n«Trust in you» by [sweet ARMS]\n[/div][/center]"
        },
        {
          "id": "char1",
          "name": "Блок персонажа(слева)",
          "code": "[div=left mb-2 mr-4]\n[character=496][img w=120 no-zoom]https://shikimori.one/system/characters/preview/496.jpg[/img][br] Сиро Эмия [/character]\n[/div]"
        },
        {
          "id": "char2",
          "name": "Блок персонажа(справа)",
          "code": "[div=right mb-2 mr-4]\n[character=496][img w=120 no-zoom]https://shikimori.one/system/characters/preview/496.jpg[/img][br] Сиро Эмия [/character]\n[/div]"
        },
        {
          "id": "char3",
          "name": "Колонка с цитатой-подписью к паре персонажей(слева)",
          "code": "[center][div=left b-quote d-inline-block p-2 pr-3 pl-3 m-0][div=d-flex]\n[character=496][img no-zoom]https://shikimori.one/system/characters/preview/496.jpg[/img][br]Сиро Эмия[/character]\n[character=496][img no-zoom]https://shikimori.one/system/characters/preview/497.jpg[/img][br]Сэйбер[/character]\n[/div][/div][/center]"
        },
        {
          "id": "char4",
          "name": "Колонка с цитатой-подписью к паре персонажей(справа)",
          "code": "[center][div=right b-quote d-inline-block p-2 pr-3 pl-3 m-0][div=d-flex]\n[character=496][img no-zoom]https://shikimori.one/system/characters/preview/496.jpg[/img][br]Сиро Эмия[/character]\n[character=496][img no-zoom]https://shikimori.one/system/characters/preview/497.jpg[/img][br]Сэйбер[/character]\n[/div][/div][/center]"
        }
      ]
    },
    {
      "id": "разное-1742059718284",
      "name": "Разное",
      "folder": true,
      "templates": [
        {
          "id": "anime_status_tag-review-positive-1742060047874",
          "name": "anime_status_tag review-positive",
          "code": "[div=b-anime_status_tag review-positive]TEST[/div]"
        },
        {
          "id": "anime_status_tag-review-neutral-1742059741253",
          "name": "anime_status_tag review-neutral",
          "code": "[div=b-anime_status_tag review-neutral]TEST[/div]"
        },
        {
          "id": "anime_status_tag-review-negative-1742059863925",
          "name": "anime_status_tag review-negative",
          "code": "[div=b-anime_status_tag review-negative]TEST[/div]"
        },
        {
          "id": "anime_status_tag-collection-1742059810407",
          "name": "anime_status_tag collection",
          "code": "[div=b-anime_status_tag collection]TEST[/div]"
        },
        {
          "id": "b-anime_status_tag-news-1742059769851",
          "name": "b-anime_status_tag news",
          "code": "[div=b-anime_status_tag news]TEST[/div]"
        },
        {
          "id": "anime_status_tag-censored-1742059787398",
          "name": "anime_status_tag censored",
          "code": "[div=b-anime_status_tag censored]TEST[/div]"
        },
        {
          "id": "anime_status_tag-ongoing-1742059888390",
          "name": "anime_status_tag ongoing",
          "code": "[div=b-anime_status_tag ongoing]TEST[/div]"
        },
        {
          "id": "anime_status_tag-offtopic-1742059898041",
          "name": "anime_status_tag offtopic",
          "code": "[div=b-anime_status_tag offtopic]TEST[/div]"
        },
        {
          "id": "anime_status_tag-critique-1742059912010",
          "name": "anime_status_tag critique",
          "code": "[div=b-anime_status_tag critique]TEST[/div]"
        },
        {
          "id": "anime_status_tag-contest-1742059922183",
          "name": "anime_status_tag contest",
          "code": "[div=b-anime_status_tag contest]TEST[/div]"
        },
        {
          "id": "anime_status_tag-other-1742060078178",
          "name": "anime_status_tag other",
          "code": "[div=b-anime_status_tag other]TEST[/div]"
        },
        {
          "id": "footer_vote-1742060178456",
          "name": "footer_vote",
          "code": "[div=b-footer_vote]\n[div=star]\n[/div]\n[div=notice]Этот отзыв полезен?[/div]\n[/div]"
        },
        {
          "id": "hot_topics-v2-1742060198003",
          "name": "hot_topics-v2",
          "code": "[div=b-hot_topics-v2 center m-0]\n[div=subject]\n1\n[/div]\n[div=subject]\n2\n[/div]\n[div=subject]\n3\n[/div]\n[div=subject]\n4\n[/div]\n[div=subject]\n5\n[/div]\n[div=subject]\n6\n[/div]\n[/div]"
        },
        {
          "id": "link_button-dark-active-1742060231034",
          "name": "link_button dark active",
          "code": "[div=b-link_button dark active]TEST[/div]"
        },
        {
          "id": "link_button-dark-create-topic-1742060257800",
          "name": "link_button dark create-topic",
          "code": "[div=b-link_button dark create-topic]test[/div]"
        }
      ]
    }
  ];

const bbCodeStorage = new Map();
let csrfToken = '';

// ====== сторедж ======
function getTemplates() {
  let stored = localStorage.getItem('bbTemplates');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return defaultTemplates;
    }
  }
  return defaultTemplates;
}
function saveTemplates(tpls) {
  localStorage.setItem('bbTemplates', JSON.stringify(tpls));
}
function generateId(name) {
  return name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
}

function initStorage() {
  bbCodeStorage.clear();
  const tpls = getTemplates();
  function addTemplates(arr) {
    arr.forEach(item => {
      if (item.folder) {
        if (Array.isArray(item.templates)) {
          addTemplates(item.templates);
        }
      } else {
        bbCodeStorage.set(item.id, item.code);
      }
    });
  }
  addTemplates(tpls);
}

// ====== превью ======
async function fetchPreview(combinedText, attempt = 1) {
  try {
    const response = await fetch("/api/shiki_editor/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({ text: combinedText })
    });
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('429');
      } else {
        throw new Error(`status: ${response.status}`);
      }
    }
    const data = await response.json();
    return data.html;
  } catch (error) {
    if (error.message === '429' && attempt < 5) {
      console.warn(`[BB-Helper] 429, ждем 5 сек (попытка ${attempt})...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return fetchPreview(combinedText, attempt + 1);
    }
    throw error;
  }
}
// ====== мейн ======
const init = () => {
  csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
  createModal();
  addMenuButton();
  initStorage();
  setupHandlers();
};

//модалка
let currentModalFolder = null;
async function createModal() {
  const modal = document.createElement('div');
  modal.id = 'bb-helper-modal';
  modal.style.cssText = `
    display: none;
    position: fixed;
    top: 60px;
    right: 20px;
    background: #fff;
    z-index: 99999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    border-radius: 8px;
    width: 400px;
    height: 300px;
    overflow: hidden;
    border: 1px solid #e0e0e0;
    font-family: system-ui;
    min-width: 300px;
    min-height: 200px;
  `;

  modal.innerHTML = `
    <div id="bb-modal-header" style="position: sticky; top: 0; background: #fff; z-index: 1000; display: flex; justify-content: space-between; align-items: center; padding: 5px 10px; border-bottom: 1px solid #e0e0e0;">
      <button id="bb-modal-back" style="display:none; padding: 5px 10px; background: #ddd; border: none; border-radius: 4px; cursor: pointer;">← Назад</button>
      <div id="bb-modal-breadcrumb" style="font-size: 14px;">Корневой уровень</div>
      <button id="bb-helper-close" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
    </div>
    <div id="bb-modal-content" style="padding: 10px; overflow: auto; height: calc(100% - 50px);">
      <div id="bb-templates-list"></div>
    </div>
    <!-- Ручка для изменения размеров (левый нижний угол) -->
    <div id="bb-modal-resizer-corner" style="
    position: absolute;
    bottom: 0;
    left: 0;
    width: 15px;
    height: 15px;
    cursor: nesw-resize;
    z-index: 101;"></div>
  `;

  document.body.appendChild(modal);

  document.getElementById('bb-helper-close').addEventListener('click', () => {
    modal.style.display = 'none';
    currentModalFolder = null;
  });

  document.getElementById('bb-modal-back').addEventListener('click', () => {
    currentModalFolder = null;
    loadTemplates();
  });

  const resizerCorner = document.getElementById('bb-modal-resizer-corner');
  let isResizing = false;
  let lastDownX = 0, lastDownY = 0;

  resizerCorner.addEventListener('mousedown', (e) => {
    isResizing = true;
    lastDownX = e.clientX;
    lastDownY = e.clientY;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const dx = lastDownX - e.clientX;
    const dy = e.clientY - lastDownY;
    modal.style.width = modal.offsetWidth + dx + 'px';
    modal.style.height = modal.offsetHeight + dy + 'px';
    lastDownX = e.clientX;
    lastDownY = e.clientY;
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
  });

  await loadTemplates();
}

// шаблоны
async function loadTemplates() {
  const list = document.getElementById('bb-templates-list');
  const breadcrumb = document.getElementById('bb-modal-breadcrumb');
  const backBtn = document.getElementById('bb-modal-back');
  let items;
  if (currentModalFolder === null) {
    items = getTemplates();
    breadcrumb.textContent = '/';
    backBtn.style.display = 'none';
  } else {
    items = currentModalFolder.templates || [];
    breadcrumb.textContent = currentModalFolder.name;
    backBtn.style.display = 'block';
  }

  // сбор в 1
  const flat = [];
  function collectTemplates(arr) {
    arr.forEach(item => {
      if (!item.folder) {
        flat.push(item);
      }
    });
  }
  collectTemplates(items);
  const previewMap = {};

  if (flat.length > 0) {
    const combinedText = flat
      .map(template => template.code.trim())
      .join("\n__SPLIT__\n");
    try {
      const combinedHtml = await fetchPreview(combinedText);
      const parts = combinedHtml.split("__SPLIT__");
      for (let i = 0; i < flat.length; i++) {
        previewMap[flat[i].id] = parts[i];
      }
    } catch (error) {
      console.error("[BB-Helper] Ошибка предпросмотра:", error);
      flat.forEach(template => {
        previewMap[template.id] = 'Ошибка загрузки превью';
      });
    }
  }

  list.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.style.padding = '8px';
    div.style.border = '1px solid #ccc';
    div.style.borderRadius = '4px';
    div.style.marginBottom = '6px';
    div.style.cursor = item.folder ? 'pointer' : 'grab';

    if (item.folder) {
      // Папка
      div.innerHTML = `<strong>📁 ${item.name}</strong>`;
      div.addEventListener('click', () => {
        currentModalFolder = item;
        loadTemplates();
      });
    } else {
      // Обычный шаблон
      div.innerHTML = `
        <div class="preview-container"
             style="min-width: 300px; overflow-x: auto; padding: 5px;">
          <div style="font-weight: 500; margin-bottom: 5px;">${item.name}</div>
          <div style="font-size:12px; color:#666;">${previewMap[item.id] || ''}</div>
        </div>
      `;
      div.addEventListener('click', () => {});
      div.draggable = true;
      div.addEventListener('dragstart', (e) => {
        const code = bbCodeStorage.get(item.id);
        e.dataTransfer.setData('text/plain', code);
        e.dataTransfer.effectAllowed = 'copy';
      });
    }

    list.appendChild(div);
  });
}

const addMenuButton = () => {
  const createButton = () => {
    const button = document.createElement('button');
    button.title = "Шаблоны";
    button.classList.add("icon", "icon-preview", "is-button");
    button.innerHTML = `<span style="display:flex;align-items:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" style="fill:currentColor">
            <path d="M14 17H7V15H14V17M17 13H7V11H17V13M17 9H7V7H17V9M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3Z"/>
          </svg>
          Шаблоны
        </span>`;

    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      font-size: 13px;
      height: 19px;
      border: none;
      background: none;
      padding: 2px 4px;
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.getElementById('bb-helper-modal');
      if (!modal) return;
      if (modal.style.display === 'block') {
        modal.style.display = 'none';
        currentModalFolder = null;
      } else {
        currentModalFolder = null;
        modal.style.display = 'block';
        loadTemplates();
      }
    });

    return button;
  };

  const tryAddButton = () => {
    const menuGroup = document.querySelector('.menu_group-controls');
    if (menuGroup) {
      menuGroup.appendChild(createButton());
      return true;
    }
    return false;
  };

  if (tryAddButton()) return;

  const observer = new MutationObserver((mutations, obs) => {
    if (tryAddButton()) {
      obs.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

//drop
const setupHandlers = () => {
  const editorContainer = document.querySelector('.editor-container');
  if (!editorContainer) return;
  const isCodeMode = editorContainer.classList.contains('is-source');
  if (isCodeMode) {
    const textarea = editorContainer.querySelector('textarea.ProseMirror');
    if (!textarea) return;
    editorContainer.addEventListener('dragover', handleDragOver);
    editorContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const code = e.dataTransfer.getData('text/plain');
      if (code) {
        insert(code, textarea, true);
      }
    });
  } else {
    const editor = editorContainer.querySelector('.ProseMirror');
    if (!editor) return;
    editor.addEventListener('dragover', handleDragOver);
    editor.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const code = e.dataTransfer.getData('text/plain');
      if (code) {
        insert(code, editor, false);
      }
    });
  }
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
};

//вставка
const insert= (code, editor, isCodeMode) => {
  if (isCodeMode) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const newValue = editor.value.slice(0, start) + code + editor.value.slice(end);
    editor.value = newValue;
    editor.selectionStart = editor.selectionEnd = start + code.length;
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const frag = document.createDocumentFragment();
    code.split('\n').forEach((line, index) => {
      if (index > 0) {
        frag.appendChild(document.createElement('br'));
      }
      frag.appendChild(document.createTextNode(line));
    });
    range.insertNode(frag);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }
};

// ====== GUI ======
let isEditing = false;
let editingIndex = null;

function updateParentSelect() {
  const select = document.getElementById('tpl-parent');
  if (!select) return;
  select.innerHTML = '<option value="none">Без папки</option>';
  const tpls = getTemplates();
  tpls.forEach(item => {
    if (item.folder) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name;
      select.appendChild(option);
    }
  });
  select.disabled = false;
}

function templateGUI() {
  const settingsBlock = document.querySelector('.block.edit-page.misc');
  if (!settingsBlock) return;
  if (document.querySelector('.bb-template-config')) return;

  let container = document.createElement('div');
  container.className = 'bb-template-config';
  container.style.padding = '20px';
  container.style.border = '1px solid #ccc';
  container.style.marginTop = '20px';
  container.style.background = '#f9f9f9';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  container.innerHTML = `
    <h3 style="margin-bottom: 20px; text-align: center;">Настройка шаблонов</h3>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <input type="text" id="tpl-name" placeholder="Название" style="padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
      <textarea id="tpl-code" placeholder="BB-код шаблона (оставьте пустым для папки)" style="padding: 8px; border-radius: 4px; border: 1px solid #ccc; resize: vertical;"></textarea>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="toggle-switch" style="position: relative; width: 40px; height: 20px;">
          <input type="checkbox" id="tpl-folder" style="opacity: 0; width: 100%; height: 100%; margin: 0; padding: 0; position: absolute; z-index: 2; cursor: pointer;">
          <span class="slider" style="
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 20px;
          "></span>
        </div>
        <label for="tpl-folder" style="font-size:14px;">Это папка</label>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <label for="tpl-parent" style="font-size:14px;">Родительская папка:</label>
        <select id="tpl-parent" style="padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
          <option value="none">Без папки</option>
        </select>
      </div>
      <button id="tpl-add" style="padding: 10px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Добавить шаблон</button>
    </div>
    <div id="tpl-list" style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;"></div>
  `;
  settingsBlock.appendChild(container);

  let resetBtn = document.createElement('button');
  resetBtn.id = 'tpl-reset';
  resetBtn.textContent = 'Сбросить данные';
  resetBtn.style.cssText = `
    margin-top: 10px;
    padding: 10px;
    background-color: #F44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  container.appendChild(resetBtn);
  resetBtn.addEventListener('click', () => {
    if (confirm('Внимание: Все шаблоны будут сброшены на стандартные. Продолжить?')) {
      saveTemplates(defaultTemplates);
      updateTemplatesList();
      updateParentSelect();
      initStorage();
      clearTemplateForm();
      alert('Данные сброшены до стандартных.');
    }
  });

  let style = document.createElement('style');
  style.textContent = `
    .toggle-switch input:checked + .slider {
      background-color: #4CAF50;
    }
    .toggle-switch .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    .toggle-switch input:checked + .slider:before {
      transform: translateX(20px);
    }
  `;
  document.head.appendChild(style);

  document.getElementById('tpl-folder').addEventListener('change', (e) => {
    document.getElementById('tpl-parent').disabled = e.target.checked;
  });

  document.getElementById('tpl-add').addEventListener('click', () => {
    let name = document.getElementById('tpl-name').value.trim();
    let code = document.getElementById('tpl-code').value.trim();
    let isFolder = document.getElementById('tpl-folder').checked;
    let parentId = document.getElementById('tpl-parent').value;
    if (!name || (!isFolder && !code)) {
      alert('Пожалуйста, заполните поля.');
      return;
    }
    let allTpls = getTemplates();
    let newElement = isFolder
      ? { id: generateId(name), name, folder: true, templates: [] }
      : { id: generateId(name), name, code };

    if (isEditing && editingIndex !== null) {
      if (typeof editingIndex === 'object') {
        let currentFolder = allTpls[editingIndex.parent];
        let currentTemplate = currentFolder.templates[editingIndex.child];
        let updatedElement = { ...currentTemplate, name, code };
        if (parentId && parentId !== "none") {
          if (parentId === currentFolder.id) {
            currentFolder.templates[editingIndex.child] = updatedElement;
          } else {
            currentFolder.templates.splice(editingIndex.child, 1);
            let targetFolder = allTpls.find(item => item.folder && item.id === parentId);
            if (targetFolder) {
              targetFolder.templates.push(updatedElement);
            } else {
              allTpls.push(updatedElement);
            }
          }
        } else {
          currentFolder.templates.splice(editingIndex.child, 1);
          allTpls.push(updatedElement);
        }
      } else {
        if (allTpls[editingIndex].folder) {
          allTpls[editingIndex].name = name;
        } else {
          if (parentId && parentId !== "none") {
            let elem = allTpls.splice(editingIndex, 1)[0];
            newElement = { ...elem, name, code };
            let folder = allTpls.find(item => item.folder && item.id === parentId);
            if (folder) {
              folder.templates.push(newElement);
            } else {
              allTpls.push(newElement);
            }
          } else {
            allTpls[editingIndex] = newElement;
          }
        }
      }
      isEditing = false;
      editingIndex = null;
      document.getElementById('tpl-add').textContent = 'Добавить шаблон';
      document.getElementById('tpl-folder').disabled = false;
      document.getElementById('tpl-parent').disabled = false;
    } else {
      if (parentId && parentId !== "none") {
        let folder = allTpls.find(item => item.folder && item.id === parentId);
        if (folder) {
          folder.templates.push(newElement);
        } else {
          allTpls.push(newElement);
        }
      } else {
        allTpls.push(newElement);
      }
    }
    saveTemplates(allTpls);
    updateTemplatesList();
    clearTemplateForm();
    initStorage();
  });

  updateTemplatesList();
  updateParentSelect();
}

function clearTemplateForm() {
  document.getElementById('tpl-name').value = '';
  document.getElementById('tpl-code').value = '';
  document.getElementById('tpl-folder').checked = false;
  document.getElementById('tpl-folder').disabled = false;
  document.getElementById('tpl-parent').value = 'none';
  document.getElementById('tpl-parent').disabled = false;
  document.getElementById('tpl-add').textContent = 'Добавить шаблон';
  isEditing = false;
  editingIndex = null;
}

function updateTemplatesList() {
  let list = document.getElementById('tpl-list');
  list.innerHTML = '';
  let tpls = getTemplates();
  tpls.forEach((item, index) => {
    if (item.folder) {
      let folderDiv = document.createElement('div');
      folderDiv.className = 'tpl-folder';
      folderDiv.setAttribute('data-index', index);
      folderDiv.style.border = '1px solid #aaa';
      folderDiv.style.padding = '10px';
      folderDiv.style.marginBottom = '10px';
      folderDiv.style.background = '#eee';
      folderDiv.innerHTML = `
        <div class="folder-header" style="display:flex; justify-content: space-between; align-items: center; cursor: pointer;">
          <span class="folder-icon" style="font-size:18px; margin-right:5px;">📂</span>
          <strong>${item.name}</strong>
          <div>
            <button onclick="editTemplate(${index})" style="padding: 5px 10px; background-color: #FFC107; color: white; border: none; border-radius: 4px; cursor: pointer;">Редактировать</button>
            <button onclick="deleteTemplate(${index})" style="padding: 5px 10px; background-color: #F44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Удалить</button>
          </div>
        </div>
        <div class="folder-templates" style="margin-top: 10px; padding-left: 10px; border-left: 2px dashed #ccc;"></div>
      `;
      let inner = folderDiv.querySelector('.folder-templates');
      if (item.templates && item.templates.length) {
        item.templates.forEach((tpl, tplIndex) => {
          let tplDiv = document.createElement('div');
          tplDiv.className = 'tpl-item';
          tplDiv.style.display = 'flex';
          tplDiv.style.justifyContent = 'space-between';
          tplDiv.style.alignItems = 'center';
          tplDiv.style.padding = '5px';
          tplDiv.style.border = '1px solid #ccc';
          tplDiv.style.borderRadius = '4px';
          tplDiv.style.marginBottom = '5px';
          tplDiv.innerHTML = `
            <span>${tpl.name}</span>
            <div>
              <button onclick="editTemplate(${index}, ${tplIndex}, true)" style="padding: 3px 8px; background-color: #FFC107; color: white; border: none; border-radius: 4px; cursor: pointer;">Редактировать</button>
              <button onclick="deleteTemplate(${index}, ${tplIndex}, true)" style="padding: 3px 8px; background-color: #F44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Удалить</button>
            </div>
          `;
          inner.appendChild(tplDiv);
        });
        new Sortable(inner, {
          group: { name: 'templates', pull: false, put: false },
          animation: 150,
          onEnd: function (evt) {
            let allTpls = getTemplates();
            let folderId = evt.from.closest('.tpl-folder').getAttribute('data-index');
            let folder = allTpls[folderId];
            if (folder && folder.templates) {
              let movedItem = folder.templates.splice(evt.oldIndex, 1)[0];
              folder.templates.splice(evt.newIndex, 0, movedItem);
              allTpls[folderId] = folder;
              saveTemplates(allTpls);
              updateTemplatesList();
              initStorage();
            }
          }
        });
      } else {
        inner.innerHTML = `<div style="font-size:13px; color:#777;">(Пустая папка)</div>`;
      }
      list.appendChild(folderDiv);
    } else {
      let card = document.createElement('div');
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.padding = '10px';
      card.style.border = '1px solid #ccc';
      card.style.borderRadius = '8px';
      card.style.background = '#fff';
      card.style.marginBottom = '10px';
      card.innerHTML = `
        <span>${item.name}</span>
        <div>
          <button onclick="editTemplate(${index})" style="padding: 5px 10px; background-color: #FFC107; color: white; border: none; border-radius: 4px; cursor: pointer;">Редактировать</button>
          <button onclick="deleteTemplate(${index})" style="padding: 5px 10px; background-color: #F44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Удалить</button>
        </div>
      `;
      list.appendChild(card);
    }
  });
  new Sortable(list, {
    group: { name: 'templates', pull: false, put: false },
    animation: 150,
    onEnd: function (evt) {
      let tpls = getTemplates();
      let movedItem = tpls.splice(evt.oldIndex, 1)[0];
      tpls.splice(evt.newIndex, 0, movedItem);
      saveTemplates(tpls);
      updateTemplatesList();
      initStorage();
    }
  });
  updateParentSelect();
}

// редактирование/удаление
function editTemplate(parentIndex, tplIndex, isNested) {
  let tpls = getTemplates();
  if (isNested) {
    let tpl = tpls[parentIndex].templates[tplIndex];
    document.getElementById('tpl-name').value = tpl.name;
    document.getElementById('tpl-code').value = tpl.code;
    document.getElementById('tpl-folder').checked = false;
    //в папке можно изменять папку (шаблон)
    document.getElementById('tpl-folder').disabled = true; // тип менять нельзя
    document.getElementById('tpl-parent').disabled = false;
    document.getElementById('tpl-parent').value = tpls[parentIndex].id;
    isEditing = true;
    editingIndex = { parent: parentIndex, child: tplIndex };
    document.getElementById('tpl-add').textContent = 'Сохранить изменения';
  } else {
    let item = tpls[parentIndex];
    document.getElementById('tpl-name').value = item.name;
    if (item.folder) {
      document.getElementById('tpl-code').value = '';
      document.getElementById('tpl-folder').checked = true;
      document.getElementById('tpl-folder').disabled = true;
      document.getElementById('tpl-parent').value = 'none';
      document.getElementById('tpl-parent').disabled = true;
    } else {
      document.getElementById('tpl-code').value = item.code;
      document.getElementById('tpl-folder').checked = false;
      document.getElementById('tpl-folder').disabled = true;
      document.getElementById('tpl-parent').value = 'none';
      document.getElementById('tpl-parent').disabled = false;
    }
    isEditing = true;
    editingIndex = parentIndex;
    document.getElementById('tpl-add').textContent = 'Сохранить изменения';
  }
}
function deleteTemplate(parentIndex, tplIndex, isNested) {
  if (confirm('Вы уверены, что хотите удалить этот шаблон?')) {
    let tpls = getTemplates();
    if (isNested) {
      tpls[parentIndex].templates.splice(tplIndex, 1);
    } else {
      tpls.splice(parentIndex, 1);
    }
    saveTemplates(tpls);
    updateTemplatesList();
    initStorage();
  }
}
window.editTemplate = editTemplate;
window.deleteTemplate = deleteTemplate;

function ready(fn) {
  document.addEventListener('page:load', fn);
  document.addEventListener('turbolinks:load', fn);
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
ready(templateGUI);
ready(init);
})();
