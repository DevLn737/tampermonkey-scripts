// ==UserScript==
// @name         ShikiUtils
// @namespace    https://shikimori.rip/
// @version      4.4.5
// @match        *://shikimori.org/*
// @match        *://shikimori.one/*
// @match        *://shikimori.me/*
// @match        *://shikimori.io/*
// @match        *://shiki.one/*
// @match        *://shikimori.rip/*
// @match        *://shikimori.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain_url=https://shikimori.rip
// @description  Полезные утилиты для шикимори + GUI
// @author       LifeH
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// @require      https://cdn.jsdelivr.net/npm/@melloware/coloris@0.25.0/dist/umd/coloris.min.js
// @require      https://update.greasyfork.org/scripts/552841/1821865/ShikiTreeLib.js
// @require      https://cdn.jsdelivr.net/npm/axios@1.12.2/dist/axios.min.js
// @require      https://cdn.jsdelivr.net/npm/d3@3.5.17/d3.min.js
// @require      https://cdn.jsdelivr.net/npm/openpgp@6.2.2/dist/openpgp.min.js
// @resource     colorisCSS https://cdn.jsdelivr.net/npm/@melloware/coloris@0.25.0/dist/coloris.min.css
// @license      MIT
// @downloadURL  https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiUtils.user.js
// @updateURL    https://github.com/DevLn737/tampermonkey-scripts/raw/refs/heads/main/shikimori/ShikiUtils.user.js
// ==/UserScript==

(function () {
  "use strict";
  /* eslint-disable no-undef */

  const DOMAIN = "shikimori.io"
  let username = null;
  let userId = null;
  const userDataEl = document.querySelector("[data-user]");
  let siteLocale = null;
  const localeEl = document.querySelector("[data-locale]");
  let chineseFilterApply = null;

  function updateSiteLocale() {
    if (localeEl) {
      try {
        siteLocale = localeEl.getAttribute("data-locale") || null;
        sessionStorage.setItem("siteLocale", siteLocale);
      } catch (err) {
        console.error("[updateSiteLocale]:", err);
        siteLocale = sessionStorage.getItem("siteLocale") || null;
      }
    } else {
      siteLocale = sessionStorage.getItem("siteLocale") || siteLocale;
    }
  }
  function getSiteLocale() {
    updateSiteLocale();
    return siteLocale;
  }

  let IS_RU = getSiteLocale() === "ru";

  function updateUserData() {
    if (userDataEl) {
      try {
        const userData = JSON.parse(userDataEl.getAttribute("data-user"));
        username = userData.url ? userData.url.split("/").pop() : null;
        userId = userData.id || null;
        sessionStorage.setItem("username", username);
        sessionStorage.setItem("userId", userId);
      } catch (err) {
        console.error("[updateUserData]:", err);
        username = sessionStorage.getItem("username") || null;
        userId = sessionStorage.getItem("userId") || null;
      }
    } else {
      username = sessionStorage.getItem("username") || username;
      userId = sessionStorage.getItem("userId") || userId;
    }
  }
  function getUsername() {
    updateUserData();
    return username;
  }
  function getUserId() {
    updateUserData();
    return userId;
  }
  function ready(fn) {
    document.addEventListener("page:load", fn);
    document.addEventListener("turbolinks:load", fn);
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  function createNotice({ key, title, version, changes, onClose }) {
    const currentVersion = key.match(/ShikiUtils_([\d.]+)_-notice/)?.[1];
    if (currentVersion) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = k?.match(/ShikiUtils_([\d.]+)_-notice/)?.[1];
        if (v && v !== currentVersion) {
          localStorage.removeItem(k);
          i--;
        }
      }
    }
    if (localStorage.getItem(key)) return;

    const modal = document.createElement("div");
    modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.7); z-index: 999999;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Inter', 'Segoe UI', sans-serif;
  `;

    const changesList = changes.map(([type, items]) => `
    <li style="margin-top:6px;"><b>${type}:</b></li>
    ${items.map(i => `<li>${i}</li>`).join("")}
  `).join("");

    modal.innerHTML = `
    <div style="background:#1c1c1f; color:#ddd; padding:25px 35px; border-radius:14px;
      max-width:520px; box-shadow:0 0 25px rgba(0,0,0,0.6); font-size:15px;
      line-height:1.6; border:1px solid rgba(255,255,255,0.1); position:relative;
      text-align:left; animation:fadeIn 0.4s ease;">
      <h2 style="margin-top:0; color:#9fdb88; font-size:22px; text-align:center;">
        Обновление <span style="color:#aaf;">ShikiUtils ${version}</span>!
      </h2>
      <p><b>${title}</b></p>
      <ul style="padding-left:20px; margin-top:5px;">${changesList}</ul>
      <p style="margin-top:10px;">
        Подробное описание всех функций, changelog и место для обратной связи:<br>
        <a href="/forum/site/610497" target="_blank"
          style="color:#80cfff; text-decoration:none; font-weight:500;">
          Тута -> Топик на форуме
        </a>
      </p>
      <div style="text-align:center; margin-top:20px;">
        <button id="closeShikiUtilsNotice" style="padding:8px 18px;
          background:linear-gradient(90deg,#5cb85c,#4cae4c); border:none; color:white;
          border-radius:6px; cursor:pointer; font-size:14px;
          transition:background 0.2s ease,transform 0.1s ease;">Окак</button>
      </div>
      <img src="https://media.tenor.com/r6TGLs81M4UAAAAi/touhou-sakuya.gif"
        style="position:absolute; width:64px; height:64px; top:0; left:0;
          animation:moveAround 6s linear infinite alternate, spin 4s linear infinite;
          pointer-events:none; user-select:none;">
      <style>
        @keyframes fadeIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes moveAround {
          0%{top:0;left:0} 25%{top:0;left:calc(100% - 64px)}
          50%{top:calc(100% - 64px);left:calc(100% - 64px)} 75%{top:calc(100% - 64px);left:0}
          100%{top:0;left:0}
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        #closeShikiUtilsNotice:hover {
          background:linear-gradient(90deg,#6ed36e,#5cc45c);
          transform:scale(1.03);
        }
      </style>
    </div>
  `;

    document.body.appendChild(modal);

    document.getElementById("closeShikiUtilsNotice").addEventListener("click", () => {
      modal.remove();
      localStorage.setItem(key, "true");
      onClose?.();
    });
  }

  createNotice({
    key: "ShikiUtils_4.4.2_-notice",
    version: "v4.4.2",
    title: "Что изменилось:",
    changes: [
      ["Добавлено", [
      "• Поиск в гуи ",
      "• Сворачивание категорий в гуи ",
      ]],
      // ["Изменено", [
      // "• ",
      // ]],
      // ["Удалено", [
      // "• ",
      // ]],
      ["Баг фикс", [
        "• Chinese filter - ошибка слияния",
      ]],
    ],
  });

  GM_registerMenuCommand("Настройки", () => {
    try {
      location.href = `/${getUsername()}/edit/misc`;
    } catch (e) {
      console.error("[ShikiUtils]", e);
    }
  });

  GM_registerMenuCommand("Топик", () => {
    try {
      location.href = `/forum/site/610497`;
    } catch (e) {
      console.error("[ShikiUtils]", e);
    }
  });

  const cssCopyIcon = `<svg width="16px" height="16px" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-220.000000, -1239.000000)" fill="#000000"><g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M183.7248,1085.149 L178.2748,1079.364 C178.0858,1079.165 177.8238,1079.001 177.5498,1079.001 L165.9998,1079.001 C164.8958,1079.001 163.9998,1080.001 163.9998,1081.105 L163.9998,1088.105 C163.9998,1088.657 164.4478,1089.105 164.9998,1089.105 C165.5528,1089.105 165.9998,1088.657 165.9998,1088.105 L165.9998,1082.105 C165.9998,1081.553 166.4478,1081.001 166.9998,1081.001 L175.9998,1081.001 L175.9998,1085.105 C175.9998,1086.21 176.8958,1087.001 177.9998,1087.001 L181.9998,1087.001 L181.9998,1088.105 C181.9998,1088.657 182.4478,1089.105 182.9998,1089.105 C183.5528,1089.105 183.9998,1088.657 183.9998,1088.105 L183.9998,1085.838 C183.9998,1085.581 183.9018,1085.335 183.7248,1085.149 L183.7248,1085.149 Z M182.9998,1091.001 L179.9998,1091.001 C178.8958,1091.001 177.9998,1092.001 177.9998,1093.105 L177.9998,1094.105 C177.9998,1095.21 178.8958,1096.001 179.9998,1096.001 L181.4998,1096.001 C181.7758,1096.001 181.9998,1096.224 181.9998,1096.501 C181.9998,1096.777 181.7758,1097.001 181.4998,1097.001 L178.9998,1097.001 C178.4528,1097.001 178.0098,1097.493 178.0028,1098.04 C178.0098,1098.585 178.4528,1099.001 178.9998,1099.001 L181.9998,1099.001 L182.0208,1099.001 C183.1138,1099.001 183.9998,1098.219 183.9998,1097.126 L183.9998,1096.084 C183.9998,1094.991 183.1138,1094.001 182.0208,1094.001 L181.9998,1094.001 L180.4998,1094.001 C180.2238,1094.001 179.9998,1093.777 179.9998,1093.501 C179.9998,1093.224 180.2238,1093.001 180.4998,1093.001 L182.9998,1093.001 C183.5528,1093.001 183.9998,1092.605 183.9998,1092.053 L183.9998,1092.027 C183.9998,1091.474 183.5528,1091.001 182.9998,1091.001 L182.9998,1091.001 Z M177.9998,1098.053 C177.9998,1098.048 178.0028,1098.044 178.0028,1098.04 C178.0028,1098.035 177.9998,1098.031 177.9998,1098.027 L177.9998,1098.053 Z M175.9998,1091.001 L172.9998,1091.001 C171.8958,1091.001 170.9998,1092.001 170.9998,1093.105 L170.9998,1094.105 C170.9998,1095.21 171.8958,1096.001 172.9998,1096.001 L174.4998,1096.001 C174.7758,1096.001 174.9998,1096.224 174.9998,1096.501 C174.9998,1096.777 174.7758,1097.001 174.4998,1097.001 L171.9998,1097.001 C171.4528,1097.001 171.0098,1097.493 171.0028,1098.04 C171.0098,1098.585 171.4528,1099.001 171.9998,1099.001 L174.9998,1099.001 L175.0208,1099.001 C176.1138,1099.001 176.9998,1098.219 176.9998,1097.126 L176.9998,1096.084 C176.9998,1094.991 176.1138,1094.001 175.0208,1094.001 L174.9998,1094.001 L173.4998,1094.001 C173.2238,1094.001 172.9998,1093.777 172.9998,1093.501 C172.9998,1093.224 173.2238,1093.001 173.4998,1093.001 L175.9998,1093.001 C176.5528,1093.001 176.9998,1092.605 176.9998,1092.053 L176.9998,1092.027 C176.9998,1091.474 176.5528,1091.001 175.9998,1091.001 L175.9998,1091.001 Z M170.9998,1098.053 C170.9998,1098.048 171.0028,1098.044 171.0028,1098.04 C171.0028,1098.035 170.9998,1098.031 170.9998,1098.027 L170.9998,1098.053 Z M169.9998,1092.027 L169.9998,1092.053 C169.9998,1092.605 169.5528,1093.001 168.9998,1093.001 L167.9998,1093.001 C166.7858,1093.001 165.8238,1094.083 166.0278,1095.336 C166.1868,1096.32 167.1108,1097.001 168.1068,1097.001 L168.9998,1097.001 C169.5528,1097.001 169.9998,1097.474 169.9998,1098.027 L169.9998,1098.053 C169.9998,1098.605 169.5528,1099.001 168.9998,1099.001 L168.1718,1099.001 C166.0828,1099.001 164.2168,1097.473 164.0188,1095.393 C163.7918,1093.008 165.6608,1091.001 167.9998,1091.001 L168.9998,1091.001 C169.5528,1091.001 169.9998,1091.474 169.9998,1092.027 L169.9998,1092.027 Z" id="file_css-[#1767]"> </path> </g> </g> </g> </g></svg>`;
  const CopyIcon = `<svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M17.5 14H19C20.1046 14 21 13.1046 21 12V5C21 3.89543 20.1046 3 19 3H12C10.8954 3 10 3.89543 10 5V6.5M5 10H12C13.1046 10 14 10.8954 14 12V19C14 20.1046 13.1046 21 12 21H5C3.89543 21 3 20.1046 3 19V12C3 10.8954 3.89543 10 5 10Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`;
  const TreeIcon = `<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --><svg fill="#000000" width="16px" height="16px" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg"><path d="M156,92V80H144a16.01833,16.01833,0,0,0-16,16v64a16.01833,16.01833,0,0,0,16,16h12V164a16.01833,16.01833,0,0,1,16-16h40a16.01833,16.01833,0,0,1,16,16v40a16.01833,16.01833,0,0,1-16,16H172a16.01833,16.01833,0,0,1-16-16V192H144a32.03635,32.03635,0,0,1-32-32V136H84v8a16.01833,16.01833,0,0,1-16,16H36a16.01833,16.01833,0,0,1-16-16V112A16.01833,16.01833,0,0,1,36,96H68a16.01833,16.01833,0,0,1,16,16v8h28V96a32.03635,32.03635,0,0,1,32-32h12V52a16.01833,16.01833,0,0,1,16-16h40a16.01833,16.01833,0,0,1,16,16V92a16.01833,16.01833,0,0,1-16,16H172A16.01833,16.01833,0,0,1,156,92Z"/></svg>`;

  function animPage() {
    return window.location.href.includes("/animes");
  }


  GM_addStyle(GM_getResourceText("colorisCSS"));

  //! %===================Default Config===================%
  const defaultConfig = {
    CATButtons: { type: "category", name: "Buttons" },

    UserIdCopyBtn: {
      enabled: true,
      title: "Copy user ID button",
      description: "Кнопка под аватаркой пользователя, чтобы скопировать его ID",
      settings: {
        btnTitle: {
          value: "Скопировать ID",
          title: "Title кнопки",
          description: "Подсказка при наведении",
        },
        btnStyles: {
          type: "css",
          value:
            `width:16px;
height:16px;
cursor:pointer;
display:flex;
align-items:center;
justify-content:center;
margin:10px;
text-align:center;
z-index:9999;`,
          title: "Стили кнопки",
          description: "",
        },
        svgIcon: {
          value: CopyIcon || "<svg>...</svg>",
          title: "SVG иконка",
          description: "HTML/SVG код иконки",
        },
      },
    },
    UserCssCopyBtn: {
      enabled: true,
      title: "Copy user CSS button",
      description: "Кнопка под аватаркой пользователя, чтобы скопировать его CSS",
      settings: {
        btnTitle: {
          value: "Скопировать CSS",
          title: "Title кнопки",
          description: "Текст подсказки при наведении",
        },
        btnStyles: {
          type: "css",
          value:
            `width:16px;
height:16px;
cursor:pointer;
display:flex;
align-items:center;
justify-content:center;
margin:10px;
text-align:center;
z-index:9999;`,
          title: "Стили кнопки",
          // description: "",
        },
        svgIcon: {
          value: cssCopyIcon || "<svg>...</svg>",
          title: "SVG иконка",
          description: "HTML/SVG код иконки",
        },
      },
    },
    CommCopyBtn: {
      enabled: true,
      title: "Copy comment link button",
      description: "Кнопка рядом с комментарием, чтобы скопировать ссылку на комментарий",
      settings: {
        btnTitle: {
          value: "Скопировать ссылку",
          title: "Title кнопки",
          description: "Подсказка при наведении",
        },
        btnStyles: {
          type: "css",
          value:
            `height: 14px;
margin: 0px 5px;
vertical-align: middle;
cursor: pointer;
display: inline-block;
font-size: 13px;
text-align: center;
width: 24px;`,
          title: "Стили кнопки",
          description: "",
        },
        svgIcon: {
          value: CopyIcon || "<svg>...</svg>",
          title: "SVG иконка",
          description: "HTML/SVG код иконки",
        },
      },
    },
    CommTreeBtn: {
      enabled: true,
      title: "Comment tree button",
      description: "Кнопка рядом с комментарием, чтобы показать древо",
      settings: {
        btnTitle: {
          value: "Показать древо",
          title: "Title кнопки",
          description: "Подсказка при наведении",
        },
        btnStyles: {
          type: "css",
          value:
            `height: 14px;
margin: 0px 5px;
vertical-align: middle;
cursor: pointer;
display: inline-block;
font-size: 13px;
text-align: center;
width: 24px;`,
          title: "Стили кнопки",
          description: "",
        },
        svgIcon: {
          value: TreeIcon || "<svg>...</svg>",
          title: "SVG иконка",
          description: "HTML/SVG код иконки",
        },
      },
    },
    ImageIdCopyBtn: {
      enabled: true,
      title: "Copy image code button",
      description: "Кнопка на изображении, чтобы скопировать код изображения",
      settings: {
        btnTitle: {
          value: "Скопировать код изображения",
          title: "Title кнопки",
          description: "Подсказка при наведении",
        },
        btnStyles: {
          type: "css",
          value:
            `width:16px;
height:16px;
cursor:pointer;
position:absolute;
top:5px;
right:5px;
z-index:10;`,
          title: "Стили кнопки",
          // description: "",
        },
        svgIcon: {
          value: CopyIcon || "<svg>...</svg>",
          title: "SVG иконка",
          description: "HTML/SVG код иконки",
        },
      },
    },
    ClubCssCopyBtn: {
      enabled: true,
      title: "Copy club CSS button",
      description: "Кнопка над аватаркой клуба, чтобы скопировать его CSS",
      settings: {
        btnTitle: {
          value: "Скопировать CSS клуба",
          title: "Title кнопки",
          description: "Подсказка при наведении",
        },
        btnStyles: {
          type: "css",
          value:
            `width:16px;
height:16px;
cursor:pointer;
display:inline-block;
text-align:center;
position:absolute;
top:-30px;
left:50%;
transform:translateX(-50%);
z-index:9999;
transition:transform 0.2s ease;`,
          title: "Стили кнопки",
          description: "",
        },
        svgIcon: {
          value: cssCopyIcon || "<svg>...</svg>",
          title: "SVG иконка",
          description: "HTML/SVG код иконки",
        },
      },
    },
    CopyCodeBtn: {
      enabled: true,
      title: "Code copy button",
      description: "Кнопка в блоке кода, чтобы скопировать код",
      settings: {
        btnTitle: {
          value: "Скопировать код",
          title: "Title кнопки",
          description: "Подсказка при наведении",
        },
        btnStyles: {
          title: "Стили кнопки",
          type: "css",
          value:
            `position:absolute;
top:6px;
right:6px;
width:18px;
height:18px;
padding:0;
display:flex;
align-items:center;
justify-content:center;
font-size:14px;
line-height:1;
cursor:pointer;
background:transparent;
border:none;
border-radius:4px;
transition:background 0.25s ease, transform 0.2s ease;
z-index:2;`,
        },
        svgIcon: {
          value: CopyIcon || "<svg>...</svg>",
          title: "SVG иконка",
          description: "HTML/SVG код иконки",
        },
      },
    },
    switchBtn: {
      enabled: true,
      title: "Domain switch button",
      description: "Кнопка для смены домена",
      settings: {
        DisplayMode: {
          type: "mode",
          title: "Режим",
          options: ["glyph", "icon"],
          value: "glyph",
        },
        btnTitle: {
          value: "Сменить домен",
          title: "Title кнопки",
          description: "Подсказка при наведении",
        },
        btnStyles: {
          dependsOn: { key: "DisplayMode", value: "icon" },
          type: "css",
          title: "Стили кнопки",
          description: "",
          value: `position:absolute;
right:-22px;
bottom:2px;
display:flex;
align-items:center;
justify-content:center;
border-radius:4px;
opacity:.7;
cursor:pointer;
z-index:10;
`,
        },
        svgIcon: {
          dependsOn: { key: "DisplayMode", value: "icon" },
          title: "SVG иконка",
          description: "HTML/SVG код иконки",
          value: `
<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
<svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18 10L21 7M21 7L18 4M21 7H7M6 14L3 17M3 17L6 20M3 17H17" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
      `,
        },
      },
    },
    CATFilters: { type: "category", name: "Filters" },
    ShikiRating: {
      enabled: true,
      title: "Shikimori rating filter",
      description: "Дополнительный фильтр, сортирующий аниме по рейтингу Shikimori",
      settings: {
        template: {
          value: "По рейтингу (Шикимори)",
          title: "Название фильтра",
        },
      },
    },
    StudioFilter: {
      enabled: true,
      title: "Studios filter",
      description: "Дополнительный фильтр для сортировки аниме по студии",
      settings: {
        template: {
          value: "Показать список",
          title: "Имя спойлера",
        },
        apiUrl: {
          value: "/api/studios",
          title: "api url",
        }
      },
    },
    ChineseFilter: {
      enabled: true,
      title: "Chinese filter",
      description: "Дополнительный фильтр, убирающий китайщину",
      settings: {
        template: {
          value: "Без китайщины",
          title: "Название фильтра",
        },
        idsList: {
          title: "Ссылка на список айди",
          value: "https://raw.githubusercontent.com/shikigraph/Fumo/refs/heads/main/ChineseIds.json",
        },
        mergeEntries: {
          type: "boolean",
          value: true,
          title: "Объединять тайтлы",
          description: "Убирает пустоты между блоками",
        },
      },
    },
    ForumCharacterFilter: {
      enabled: true,
      title: "Forum Character Filter",
      description: "Дополнительный фильтр, убирающий персонажей на форуме",
      settings: {
        template: {
          value: "Без персонажей",
          title: "Имя фильтра",
        },
      },
    },
    hideNews: {
      enabled: true,
      title: "News Filter",
      description: "Фильтры для новостей по ID юзера и тегам",
      settings: {
        userid: {
          type: "ids",
          value: "123,123",
          title: "User IDS",
          description: "Блеклист юзеров",
        },
        tags: {
          type: "tags",
          value: "тег1,тег2",
          title: "Теги новостей",
          description: "Блеклист тегов",
        },
      },
    },
    workTypeFilter: {
      enabled: true,
      title: "Work Type Filter",
      description: 'позволяет сортировать "тип работы" на странице человека',
      settings: {
        containerStyles: {
          type: "css",
          title: "Стили контейнера фильтров",
          value: `position: initial;
display: flex;
flex-wrap: wrap;
margin-bottom: 10px;
gap: 4px 0px;`,
        },
      },
    },
    CATHelpers: { type: "category", name: "Helpers" },
    NotificationHelperConfig: {
      enabled: true,
      title: "Notification helper",
      description: "Позволяет выбрать несколько уведомлений в почте и удалить их",
      settings: {
        highlightColor: {
          inline: true,
          type: "color",
          value: "#D0E8FF",
          title: "Цвет выделения",
        },
        deleteColor: {
          inline: true,
          type: "color",
          value: "#FFB3B3",
          title: "Цвет удаления",

        },
        throttledColor: {
          inline: true,
          type: "color",
          value: "#FFFF99",
          title: "Цвет при 429",
        },
        transitionSpeed: {
          type: "range",
          value: 0.3,
          title: "Скорость transition (сек)",
          min: 0,
          max: 10,
          step: 0.1,
        },
        delay429: {
          type: "number",
          value: 10000,
          title: "Таймаут после 429 (мс)",
        },
        buttonText: { type: "text", value: "Удалить выбранные", title: "Текст кнопки" },
        buttonStyle: {
          type: "css",
          title: "Стили кнопки",
          value:
            `position: fixed;
bottom: 60px;
right: 20px;
padding: 10px;
background: red;
color: white;
border: none;
cursor: pointer;
z-index: 1000;`,
        },
      },
    },
    HistoryHelperConfig: {
      enabled: true,
      title: "History helper",
      description: "Позволяет выбрать несколько записей в истории и удалить их",
      settings: {
        highlightColor: {
          inline: true,
          type: "color",
          value: "#D0E8FF",
          title: "Цвет выделения",
        },
        deleteColor: {
          inline: true,
          type: "color",
          value: "#FFB3B3",
          title: "Цвет удаления",
        },
        throttledColor: {
          inline: true,
          type: "color",
          value: "#FFFF99",
          title: "Цвет при 429",
        },
        transitionSpeed: {
          type: "range",
          value: 0.3,
          title: "Скорость transition (сек)",
          min: 0,
          max: 10,
          step: 0.1,
        },
        delay429: {
          type: "number",
          value: 10000,
          title: "Таймаут после 429 (мс)",
        },
        buttonText: {
          type: "text",
          value: "Удалить выбранные",
          title: "Текст кнопки",
        },
        buttonStyle: {
          type: "css",
          title: "Стили кнопки",
          value:
            `position: fixed;
bottom: 60px;
right: 20px;
padding: 10px;
background: red;
color: white;
border: none;
cursor: pointer;
z-index: 1000;`,
        },
      },
    },
    FavoriteHelperConfig: {
      enabled: true,
      title: "Favorites helper",
      description: "Позволяет выбрать несколько и удалить их",
      settings: {
        highlightColor: {
          inline: true,
          type: "color",
          value: "#D0E8FF",
          title: "Цвет выделения",
        },
        deleteColor: {
          inline: true,
          type: "color",
          value: "#FFB3B3",
          title: "Цвет удаления",
        },
        throttledColor: {
          inline: true,
          type: "color",
          value: "#FFFF99",
          title: "Цвет при 429",
        },
        transitionSpeed: {
          type: "range",
          value: 0.3,
          title: "Скорость transition (сек)",
          min: 0,
          max: 10,
          step: 0.1,
        },
        delay429: {
          type: "number",
          value: 10000,
          title: "Таймаут после 429 (мс)",
        },
        buttonText: {
          type: "text",
          value: "Удалить выбранные",
          title: "Текст кнопки",
        },
        buttonStyle: {
          type: "css",
          title: "Стили кнопки",
          value:
            `position: fixed;
bottom: 60px;
right: 20px;
padding: 10px;
background: red;
color: white;
border: none;
cursor: pointer;
z-index: 1000;`,
        },
      },
    },
    CATMisc: { type: "category", name: "Misc" },
    PGPModule: {
      enabled: true,
      title: "PGP Encryption",
      description: "Шифрование комментариев через OpenPGP",
      settings: {
        PubKeyRecipient: {
          title: "Публичные ключи собеседников",
          type: "pairs",
          layout: "block",
          dependsOn: { key: "SharedMode", value: false },
          value: [
            { user: "", key: "" },
          ]
        },
        AutoEncryptOnType: {
          type: "boolean",
          value: false,
          title: "Авто шифрование",
          description: "Каждый отправленный комментарий шифруется",

        },
        encryptBtnStyles: {
          type: "css",
          title: "Стили кнопки шифрования",
          value: `display: inline-flex;
align-items: center;
justify-content: center;
height: 19px;
width: 27px;
padding: 0 4px;`,
        },
        EncryptForMyself: {
          type: "boolean",
          value: true,
          title: "Расшифровывать свое сообщение",
          // description:"",
          dependsOn: { key: "SharedMode", value: false },
        },
        SharedMode: {
          type: "boolean",
          value: true,
          title: "Общее шифрование для пользователей скрипта",
        },
        PubKeySelf: {
          type: "css",
          value: "",
          title: "Твой публичный ключ",
          dependsOn: { key: "SharedMode", value: false },
          // description: ""
        },
        PrivKeySelf: {
          type: "css",
          value: "",
          title: "Твой приватный ключ",
          dependsOn: { key: "SharedMode", value: false },
          // description: ""
        },
        KeyPassphrase: {
          type: "css",
          value: "",
          title: "Пароль",
          dependsOn: { key: "SharedMode", value: false },
          // description: ""
        },
        GenerateKeysBtn: {
          type: "button",
          value: "Сгенерировать ключи",
          dependsOn: { key: "SharedMode", value: false },
          title: " "
        }
      }
    },
    MoreStatistic: {
      enabled: true,
      title: "More Statistic",
      description: "Дополнительная статистика",
      settings: {
        enableAvgScoreInList: {
          type: "boolean",
          title: "Показывать среднюю оценку в списке",
          value: true,
          category: "Средняя оценка в списке",
          inline: true,
        },
        avgScoreTemplate: {
          title: "Шаблон текста",
          value: "Оценки (ср. {avgscore})",
          description: "Используйте {avgscore} для вставки средней оценки",
          category: "Средняя оценка в списке",
          dependsOn: { key: "enableAvgScoreInList", value: true },
        },
        headlineStyles: {
          type: "css",
          title: 'Стиль для оценки',
          value: `font-size: 15px;
margin-left: 5px;`,
          category: "Средняя оценка в списке",
          dependsOn: { key: "enableAvgScoreInList", value: true },

        },
        enableFriendsAvg: {
          inline: true,
          type: "boolean",
          title: "Показывать среднюю оценку друзей на странице тайтла",
          value: true,
          category: "Средняя оценка друзей",
        },
        friendsAvgTemplate: {
          title: "Шаблон текста",
          value: "У друзей (ср. {avgscore})",
          description: "Используйте {avgscore} для вставки средней оценки",
          category: "Средняя оценка друзей",
          dependsOn: { key: "enableFriendsAvg", value: true },
        },
        friendsEpInfo: {
          type: "boolean",
          value: true,
          title: "Показывать количество просмотренных эпизодов",
          category: "Средняя оценка друзей",
          dependsOn: { key: "enableFriendsAvg", value: true },
        },
        showZeroEp: {
          type: "boolean",
          value: true,
          title: "Показывать 0 эп./гл.",
          category: "Средняя оценка друзей",
          dependsOn: { key: "enableFriendsAvg", value: true },

        },
        friendsApiDelay: {
          type: "number",
          value: 500,
          title: "Задержка между запросами к апи (мс)",
          category: "Средняя оценка друзей",
          dependsOn: { key: "enableFriendsAvg", value: true },
        },
        enableBanCount: {
          inline: true,
          type: "boolean",
          title: "Показывать количество банов в списке банов",
          value: true,
          category: "Количество банов",
        },
        banCountTemplate: {
          title: "Шаблон текста",
          value: "Баны: {count}",
          description: "Используйте {count} для количества банов",
          category: "Количество банов",
          dependsOn: { key: "enableBanCount", value: true },
        },
        enableWatchTime: {
          inline: true,
          type: "boolean",
          title: "Показывать время для просмотра аниме",
          value: true,
          category: "Время просмотра",
        },
        watchTimeTemplate: {
          title: "Шаблон текста",
          value: "Общее время просмотра:",
          category: "Время просмотра",
          dependsOn: { key: "enableWatchTime", value: true },
        },
      },
    },
    ShikiScore: {
      enabled: true,
      title: "Shiki Rating",
      description: "Добавляет рейтинг на основе оценок shikimori с возможностью менять формулу",
      settings: {
        showShikiScore: {
          inline: true,
          type: "boolean",
          title: "Показывать рейтинг Shikimori",
          value: true,
          category: "Shikimori",
        },
        ShimoriDisplayMode: {
          inline: false,
          type: "mode",
          title: "Тип отображения",
          options: ["stars", "headline"],
          value: "stars",
          description:
            `headline - рядом с подзаголовоком "Оценки людей"`,
          category: "Shikimori",
          dependsOn: { key: "showShikiScore", value: true },
        },
        customFormulaLabel: {
          value: "Оценка Shikimori",
          title: "Надпись под рейтингом",
          category: "Shikimori",
          dependsOn: { key: "showShikiScore", value: true },
        },
        customFormula: {
          value: "sum / total",
          title: "Формула для Shikimori",
          description: "Подробней в топике юзерскрипта",
          category: "Shikimori",
          dependsOn: { key: "showShikiScore", value: true },
        },
        originalLabel: {
          value: "Оценка MAL",
          title: "Надпись под оригинальной оценкой",
          category: "Shikimori",
          dependsOn: { key: "showShikiScore", value: true },
        },

        showAniListScore: {
          inline: true,
          type: "boolean",
          title: "Показывать рейтинг AniList",
          value: true,
          category: "AniList",
        },
        AniListDisplayMode: {
          inline: false,
          type: "mode",
          title: "Тип отображения",
          options: ["stars", "headline"],
          value: "stars",
          description: `headline - рядом с подзаголовоком "Оценки людей"`,
          category: "AniList",
          dependsOn: { key: "showAniListScore", value: true },
        },
        AniListCustomFormulaLabel: {
          value: "Оценка AniList",
          title: "Надпись под рейтингом AniList",
          category: "AniList",
          dependsOn: { key: "showAniListScore", value: true },
        },
        AniListCustomFormula: {
          value: "averageScore / 10",
          title: "Формула для AniList",
          category: "AniList",
          dependsOn: { key: "showAniListScore", value: true },
        },
        originalScoreStyles: {
          type: "css",
          title: 'Стиль для надписи под рейтингом (тип отображения "stars")',
          value:
            `text-align: left;
color: #7b8084;
font-size: 12px;`,
          category: "AniList/Shikimori",
        },
        headlineScoreStyles: {
          type: "css",
          title: 'Стиль для надписи (тип отображения "headline")',
          value: `font-size: 15px;`,
          category: "AniList/Shikimori",
        },
        showTotalRates: {
          inline: true,
          type: "boolean",
          title: "Показывать общее количество оценок",
          value: true,
          category: "Other",
        },
        scoreLabels: {
          type: "css",
          title: "Метки оценок (одна на строку, от 1 до 10)",
          value: `Хуже некуда
Ужасно
Очень плохо
Плохо
Более-менее
Нормально
Хорошо
Отлично
Великолепно
Эпик вин!`,
          category: "Other",
        },
        debug: {
          type: "boolean",
          value: false,
          title: "console data debug",
          category: "Other",
        }
      },
    },
    FriendsHistory: {
      enabled: true,
      title: "Friends History",
      description: "Добавляет историю друзей в списке друзей",
      settings: {
        apilimit: {
          type: "number",
          value: 50,
          title: "Количество загружаемой истории у друга (100 максимум)",
        },
        delay: {
          type: "number",
          value: 1000,
          title: "Задержка между запросами",
        },
        headlineText: {
          value: "История друзей",
          title: "Заголовок блока",
        },
        progressTemplate: {
          value: "Загружено {loaded} / {total} друзей...",
          title: "Шаблон прогресса",
          description: "Используйте {loaded} и {total}",
        },
        doneTemplate: {
          value: "Загрузка завершена. Загружено {loaded} / {total}",
          title: "Шаблон завершения",
          description: "Используйте {loaded} и {total}",
        },
        tooltipHideDelay: {
          type: "number",
          value: 100,
          title: "Задержка скрытия тултипа (мс)",
        },
        tooltipFetchDelay: {
          type: "number",
          value: 200,
          title: "Задержка загрузки тултипа (мс)",
        },
        tooltipAppearDelay: {
          type: "number",
          value: 200,
          title: "Задержка появления тултипа (мс)",
        },
      },
    },
    DUBlinks: {
      enabled: true,
      title: "DUB links",
      description: "ссылки на оффициальные ресурсы даберов/саберов",
      settings: {
        linksUrl: {
          title: "Ссылка на список",
          value: "https://raw.githubusercontent.com/shikigraph/Fumo/refs/heads/main/Dublinks.json",
        }
      },
    },
    autoSpoiler: {
      enabled: false,
      title: "Auto spoiler",
      description: "Скрывает все изображения под спойлер",
      settings: {
        mode: {
          type: "mode",
          title: "Тип эффекта",
          options: ["blur(BETA)", "spoiler"],
          value: "spoiler",
        },
        template: {
          value: "image",
          title: "название спойлера",
          // description: "название спойлера.",
        },
      },
    },
    removeBlur: {
      enabled: true,
      title: "Remove Blur",
      description: "Убирает цензуру с постеров аниме",
      settings: {
        hoverOnly: {
          type: "boolean",
          value: false,
          title: "Убирать блюр только при наведении",
        },
      },
    },
    NoAgeLimits: {
      enabled: true,
      title: "Custom age",
      description: "Убирает ограничение на выбор года рождения в настройках",
    },
    commentsLoader: {
      enabled: true,
      title: "Comments Loader",
      description: "Добавляет возможность выбирать, сколько комментариев загрузить",
      settings: {
        inputStyles: {
          type: "css",
          value: `width: 50px;
margin: 0 5px;`,
          title: "Стили поля ввода",
        },
      },
    },
    pollsHelper: {
      enabled: true,
      title: "Polls Helper",
      description: "Показывает айди и голоса в голосованиях",
    },
    showTopicId: {
      enabled: false,
      title: "Topic id info",
      description: "Показывает айди топика",
    },
  };

  //! %=================== Utils ===================%

  const SHARED_KEYS = {
    pub: `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEaSJFdBYJKwYBBAHaRw8BAQdATFpl2YulxVU9Lv4ANia0zGW6zR9hGMmO
vGaAP9m+RP7NGFNoaWtpVXRpbHMgPFNoaWtpQFV0aWxzPsLAEwQTFgoAhQWC
aSJFdAMLCQcJELjhWKHooxlSRRQAAAAAABwAIHNhbHRAbm90YXRpb25zLm9w
ZW5wZ3Bqcy5vcmcOAswt3ooqJ7pwTRsWGM+wRlerNPbp18e7j4iXJWL8EQUV
CggODAQWAAIBAhkBApsDAh4BFiEEye/9xNxUOvo8Z7wquOFYoeijGVIAAJGm
AP9zi4NDIgvzfiDa+EDa46gph3jGhtl0KXaonnlOJivMNAEAiDTBja3yIMYw
xdP0kCY9w1HoBJdbMVbqnbiAHyvctgnOOARpIkV0EgorBgEEAZdVAQUBAQdA
RzNW+P4mPHkoUzX46kPIBOV1g9Ggr+2epcKAGgqqOkUDAQgHwr4EGBYKAHAF
gmkiRXQJELjhWKHooxlSRRQAAAAAABwAIHNhbHRAbm90YXRpb25zLm9wZW5w
Z3Bqcy5vcmfKiC3q033TbDialYw0gCEl3X6G18BZ1E1VUwlycem0zAKbDBYh
BMnv/cTcVDr6PGe8KrjhWKHooxlSAAACZgD+K3pZ4cfDrvY/UZkv3id5YneG
sJ+mixlzPpJK5SnNroEA/3vKyxcZAfI2M/QCJ8Hu5UZRTzSh7/0Mudb6OJ5+
cikP
=qEdF
-----END PGP PUBLIC KEY BLOCK-----
`,

    priv: `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEaSJFdBYJKwYBBAHaRw8BAQdATFpl2YulxVU9Lv4ANia0zGW6zR9hGMmO
vGaAP9m+RP4AAP9zkNTTAolX67n6UMf1Nmn0nUeLjvl8f1zsdNShUYIugBNr
zRhTaGlraVV0aWxzIDxTaGlraUBVdGlscz7CwBMEExYKAIUFgmkiRXQDCwkH
CRC44Vih6KMZUkUUAAAAAAAcACBzYWx0QG5vdGF0aW9ucy5vcGVucGdwanMu
b3JnDgLMLd6KKie6cE0bFhjPsEZXqzT26dfHu4+IlyVi/BEFFQoIDgwEFgAC
AQIZAQKbAwIeARYhBMnv/cTcVDr6PGe8KrjhWKHooxlSAACRpgD/c4uDQyIL
834g2vhA2uOoKYd4xobZdCl2qJ55TiYrzDQBAIg0wY2t8iDGMMXT9JAmPcNR
6ASXWzFW6p24gB8r3LYJx10EaSJFdBIKKwYBBAGXVQEFAQEHQEczVvj+Jjx5
KFM1+OpDyATldYPRoK/tnqXCgBoKqjpFAwEIBwAA/0KdnyOo0iCAoXGeNQYI
/+L/f6xcrWWuL63paoKLOFzwEZTCvgQYFgoAcAWCaSJFdAkQuOFYoeijGVJF
FAAAAAAAHAAgc2FsdEBub3RhdGlvbnMub3BlbnBncGpzLm9yZ8qILerTfdNs
OJqVjDSAISXdfobXwFnUTVVTCXJx6bTMApsMFiEEye/9xNxUOvo8Z7wquOFY
oeijGVIAAAJmAP4relnhx8Ou9j9RmS/eJ3lid4awn6aLGXM+kkrlKc2ugQD/
e8rLFxkB8jYz9AInwe7lRlFPNKHv/Qy51vo4nn5yKQ8=
=OoP3
-----END PGP PRIVATE KEY BLOCK-----
`
  };
  const delay = ms => new Promise(res => setTimeout(res, ms));

  function getId() {
    const pathParts = window.location.pathname.split("/");
    const idPart = pathParts[2] || "";
    const match = idPart.match(/^[a-z]*(\d+)/);
    return match ? match[1] : null;
  }
  function getOriginalTitle() {
    const titleElement = document.querySelector(".head h1");
    if (!titleElement) return null;

    const separator = titleElement.querySelector(".b-separator.inline");
    if (!separator) return null;

    const locale = getSiteLocale();

    let originalTitle = null;

    if (locale === "en") {
      originalTitle = separator.previousSibling?.textContent?.trim();
    } else {
      originalTitle = separator.nextSibling?.textContent?.trim();
    }

    return originalTitle || null;
  }
  async function generateKeys(name, email, passphrase) {
    const keys = await openpgp.generateKey({
      type: "ecc",
      curve: "curve25519",
      userIDs: [{ name, email }],
      format: "armored",
      passphrase: passphrase || undefined
    });
    return keys;
  }
  const Editor = { //todo поддержка старого
    getState() {
      const ta = document.querySelector(".editor-container textarea");
      if (ta) return { type: "textarea", el: ta, text: ta.value };
      const pm = document.querySelector(".editor-container .ProseMirror");
      if (pm) return { type: "prosemirror", el: pm, text: pm.innerText || pm.textContent };
      return { type: "none", text: "" };
    },

    getText() {
      return this.getState().text?.trim() || "";
    },

    getSelection() {
      const state = this.getState();
      if (state.type === "textarea") {
        const { selectionStart: s, selectionEnd: e, value } = state.el;
        return s !== e ? value.slice(s, e) : value;
      }
      if (state.type === "prosemirror") {
        const sel = window.getSelection();
        return sel?.toString().trim() || state.text;
      }
      return "";
    },

    insert(text, state = this.getState()) {
      if (!text || state.type === "none") return;

      if (state.type === "textarea") {
        const ta = state.el;
        const s = ta.selectionStart;
        const e = ta.selectionEnd;
        ta.value = s !== e ? ta.value.slice(0, s) + text + ta.value.slice(e) : ta.value + text;
        ta.setSelectionRange(s, s + text.length);
        ta.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }

      if (state.type === "prosemirror") {
        const editor = state.el;
        const sel = window.getSelection();
        const hasSelection = sel?.rangeCount > 0 && !sel.isCollapsed;
        const lines = text.split("\n");

        if (hasSelection) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          for (let i = lines.length - 1; i >= 0; i--) {
            if (i !== lines.length - 1) range.insertNode(document.createElement("br"));
            range.insertNode(document.createTextNode(lines[i]));
          }
        } else {
          const p = editor.querySelector("p:last-child") || editor.appendChild(document.createElement("p"));
          p.innerHTML = "";
          const frag = document.createDocumentFragment();
          for (let i = lines.length - 1; i >= 0; i--) {
            frag.prepend(document.createTextNode(lines[i]));
            if (i !== 0) frag.prepend(document.createElement("br"));
          }
          p.appendChild(frag);
        }

        if (!editor.querySelector(".ProseMirror-trailingBreak")) {
          const br = document.createElement("br");
          br.classList.add("ProseMirror-trailingBreak");
          editor.appendChild(br);
        }

        editor.dispatchEvent(new Event("input", { bubbles: true }));
      }
    },

    clear(state = this.getState()) {
      if (state.type === "textarea") {
        state.el.value = "";
        state.el.dispatchEvent(new Event("input", { bubbles: true }));
      } else if (state.type === "prosemirror") {
        state.el.innerHTML = "<p><br class='ProseMirror-trailingBreak'></p>";
        state.el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    },

  };
  function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  }
  function escapeHTML(str) { // так много смысла(нет)
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  //! %=================== CFG ===================%

  const CONFIG_KEY = "ShikiUtilsConfig";

  function isCategoryEntry(obj) {
    return obj?.type === "category";
  }
  function loadConfig() {
    let saved = null;

    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (err) {
      console.warn("[ShikiUtils] loadConfig: конфигу пизда - сброс", err);
      localStorage.removeItem(CONFIG_KEY);
    }

    if (!saved || typeof saved !== "object") {
      return structuredClone(defaultConfig);
    }

    const result = structuredClone(defaultConfig);

    for (const key of Object.keys(defaultConfig)) {
      const def = defaultConfig[key];
      if (isCategoryEntry(def)) continue;

      const userVal = saved[key];

      if (!userVal || typeof userVal !== "object") continue;

      if (typeof userVal.enabled === "boolean") {
        result[key].enabled = userVal.enabled;
      }

      if (def.settings && userVal.settings && typeof userVal.settings === "object") {
        for (const sKey of Object.keys(def.settings)) {
          const userSet = userVal.settings[sKey];
          if (!userSet || typeof userSet !== "object") continue;

          if ("value" in userSet) {
            result[key].settings[sKey].value = userSet.value;
          }
        }
      }
    }

    return result;
  }
  function saveConfig() {
    const toSave = {};

    for (const key of Object.keys(config)) {
      if (isCategoryEntry(config[key])) continue;

      const mod = config[key];
      const entry = { enabled: mod.enabled };

      if (mod.settings) {
        entry.settings = {};
        for (const sKey of Object.keys(mod.settings)) {
          entry.settings[sKey] = { value: mod.settings[sKey].value };
        }
      }

      toSave[key] = entry;
    }

    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.error("[ShikiUtils] saveConfig:", err);
    }
  }

  let config = loadConfig();

  //! %=================== Builders ===================%

  function btnBuilder({
    tag = "a",
    classes = [],
    title = "",
    dataset = {},
    styles = {},
    svgIcon = "",
    onClick = null,
  }) {
    const btn = document.createElement(tag);
    classes.forEach((cls) => btn.classList.add(cls));
    if (title) btn.title = title;
    for (const key in dataset) btn.dataset[key] = dataset[key];
    for (const key in styles) btn.style[key] = styles[key];
    btn.innerHTML = svgIcon;

    const transitionStyle = "stroke 0.3s ease, fill 0.3s ease";

    btn.addEventListener("mouseenter", () => {
      const svg = btn.querySelector("svg");
      if (svg) {
        svg.querySelectorAll("path").forEach((path) => {
          path.style.transition = transitionStyle;
          let computedStroke = window.getComputedStyle(path).stroke;
          if (
            computedStroke &&
            computedStroke !== "none" &&
            computedStroke !== "rgba(0, 0, 0, 0)"
          ) {
            if (!path.dataset.originalStroke) {
              path.dataset.originalStroke = computedStroke;
            }
            path.style.stroke = "var(--link-hover-color)";
          } else {
            let computedFill = window.getComputedStyle(path).fill;
            if (!path.dataset.originalFill) {
              path.dataset.originalFill = computedFill;
            }
            path.style.fill = "var(--link-hover-color)";
          }
        });
      }
    });

    btn.addEventListener("mouseleave", () => {
      const svg = btn.querySelector("svg");
      if (svg) {
        svg.querySelectorAll("path").forEach((path) => {
          path.style.transition = transitionStyle;
          if (path.dataset.originalStroke) {
            path.style.stroke = path.dataset.originalStroke;
          } else if (path.dataset.originalFill) {
            path.style.fill = path.dataset.originalFill;
          }
        });
      }
    });

    if (onClick) {
      btn.addEventListener("click", async (e) => {
        await onClick(e);
        btn.style.transform = "scale(1.5)";
        setTimeout(() => (btn.style.transform = "scale(1)"), 200);
      });
    }

    return btn;
  }
  function helperBuilder({
    configKey,
    itemSelector,
    checkboxClass,
    deleteButtonSelector = null,
    deleteMethod,
    deleteUrlAttr = null,
    getDeleteUrl = null,
    showOnHover,
    checkboxContainerSelector,
    selectionModeBtn = null,
    clickableSelector = null,
  }) {
    if (deleteButtonSelector && !document.querySelector(deleteButtonSelector)) return;
    if (!deleteButtonSelector && !getDeleteUrl) return;

    const cfg = config[configKey].settings;

    let button = null;
    let lastChecked = null;
    let isThrottled = false;
    let selectionMode = false;

    if (selectionModeBtn) {
      const { target, text = "Режим выбора" } = selectionModeBtn;
      if (target) {
        target.style.position = "relative";
        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = text;//todo css v cfg
        toggleBtn.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        padding: 5px 12px;
        border-radius: 5px;
        transition: background-color 0.2s ease;
        z-index: 1000;
      `;

        function updateToggleColor() {
          toggleBtn.style.backgroundColor = selectionMode ? "green" : "red"; //todo v cfg
        }
        updateToggleColor();

        toggleBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          selectionMode = !selectionMode;
          updateToggleColor();

          if (!selectionMode) {
            document.querySelectorAll(`.${checkboxClass}:checked`).forEach(cb => {
              cb.checked = false;
              updateHighlight(cb);
            });
            updateDeleteButton();
          }
        });
        target.appendChild(toggleBtn);
      }
    }

    function addCheckbox(item) {
      item.querySelector(`.${checkboxClass}`)?.remove();

      const container = checkboxContainerSelector ? item.querySelector(checkboxContainerSelector) : item;
      if (!container) return;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = checkboxClass;
      checkbox.style.display = "none";

      if (showOnHover && !selectionModeBtn) {
        item.addEventListener("mouseenter", () => {
          checkbox.style.display = "inline-block";
        });
        item.addEventListener("mouseleave", () => {
          if (!checkbox.checked) checkbox.style.display = "none";
        });
      }

      if (selectionModeBtn) {
        item.addEventListener("click", (e) => {
          if (!selectionMode) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        }, true);

        item.addEventListener("mousedown", (e) => {
          if (selectionMode) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        }, true);
      }

      if (clickableSelector) {
        item.querySelectorAll(clickableSelector).forEach(el => {
          el.addEventListener("click", (e) => {
            if (selectionMode) {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          }, true);
        });
      }

      function handleCheckbox(event) {
        shiftSelect(event, checkbox);
        updateHighlight(checkbox);
      }

      checkbox.addEventListener("click", handleCheckbox);
      checkbox.addEventListener("change", handleCheckbox);

      container.prepend(checkbox);
    }

    document.querySelectorAll(itemSelector).forEach(addCheckbox);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.matches(itemSelector)) {
            addCheckbox(node);
          } else if (node.nodeType === 1) {
            node.querySelectorAll(itemSelector).forEach(addCheckbox);
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("turbolinks:load", () => {
      button?.remove();
      button = null;
      selectionMode = false;
    }, { once: true });
    function shiftSelect(event, checkbox) {
      if (event.shiftKey && lastChecked) {
        const checkboxes = [...document.querySelectorAll(`.${checkboxClass}`)];
        const start = checkboxes.indexOf(lastChecked);
        const end = checkboxes.indexOf(checkbox);
        checkboxes
          .slice(Math.min(start, end), Math.max(start, end) + 1)
          .forEach((cb) => {
            cb.checked = lastChecked.checked;
            updateHighlight(cb);
          });
      }
      lastChecked = checkbox;
      updateDeleteButton();
    }

    function updateHighlight(checkbox) {
      const item = checkbox.closest(itemSelector);
      if (!item) return;
      item.style.backgroundColor = checkbox.checked ? cfg.highlightColor?.value : null;
      item.style.transition = `background-color ${cfg.transitionSpeed?.value}s ease`;
    }

    function updateDeleteButton() {
      const selectedItems = document.querySelectorAll(`.${checkboxClass}:checked`);
      if (selectedItems.length > 0) {
        if (!button) {
          button = document.createElement("button");
          button.id = `${configKey}-delete-button`;
          button.textContent = cfg.buttonText?.value;
          button.style.cssText = cfg.buttonStyle?.value;
          button.addEventListener("click", () => deleteSelected());
          document.body.appendChild(button);
        }
      } else if (button) {
        button.remove();
        button = null;
      }
    }

    async function deleteSelected() {
      if (isThrottled) return;
      const token = document.querySelector('meta[name="csrf-token"]')?.content;
      if (!token) return;

      const selectedItems = document.querySelectorAll(`.${checkboxClass}:checked`);
      for (const checkbox of selectedItems) {
        const item = checkbox.closest(itemSelector);
        if (!item) continue;

        item.style.backgroundColor = cfg.deleteColor?.value;
        item.style.transition = `background-color ${cfg.transitionSpeed?.value}s ease`;

        const deleteUrl = getDeleteUrl
          ? getDeleteUrl(item)
          : item.querySelector(deleteButtonSelector)?.getAttribute(deleteUrlAttr);
        if (!deleteUrl) continue;

        try {
          const response = await fetch(deleteUrl, {
            method: deleteMethod,
            credentials: "include",
            headers: {
              "User-Agent": navigator.userAgent,
              "X-CSRF-Token": token,
            },
            body: new URLSearchParams({
              _method: "delete",
              authenticity_token: token,
            }),
            redirect: "manual",
          });

          if (response.type === "opaqueredirect" || response.status === 302 || response.ok) {
            await new Promise((r) => setTimeout(r, 300));
            item.remove();
          } else if (response.status === 429) {
            item.style.backgroundColor = cfg.throttledColor?.value;
            isThrottled = true;
            if (button) button.disabled = true;
            setTimeout(() => {
              isThrottled = false;
              if (button) button.disabled = false;
              deleteSelected();
            }, cfg.delay429?.value);
            return;
          }
        } catch (err) {
          console.error("[ShikiUtils]", err);
        }
      }

      if (button) {
        button.remove();
        button = null;
      }
    }
  }

  //! %===================================================== Function =====================================================%

  //! %=================== Filters ====================%

  //* %=================== Forum Character Filter ===================%

  function ForumCharacterFilter() {
    const menu = document.querySelector(".l-menu.ajax-opacity .b-forums .simple_form.b-form.edit_user_preferences");
    const storageKey = "ForumCharacterFilterActive";
    let active = localStorage.getItem(storageKey) === "true";
    const cfg = config.ForumCharacterFilter;
    function addCheckbox() {
      if (!menu || menu.querySelector(".forum-character-filter")) return;

      const div = document.createElement("div");
      div.className = "forum special forum-character-filter";
      div.innerHTML = `
        <div class="link-with-input">
          <input type="checkbox" id="forumCharacterFilterCheckbox">
          <a class="link" href="#">${cfg.settings.template?.value || "Без персонажей"}
          </a>
        </div>
      `;
      menu.appendChild(div);

      const checkbox = div.querySelector("#forumCharacterFilterCheckbox");
      checkbox.checked = active;
      checkbox.addEventListener("change", () => {
        active = checkbox.checked;
        localStorage.setItem(storageKey, active);
        applyFilter();
      });
    }

    function applyFilter() {
      if (!menu) return;
      document.querySelectorAll("article").forEach((article) => {
        const meta = article.querySelector('meta[itemprop="name"]');
        if (meta && meta.content === (IS_RU ? "Обсуждение персонажа" : "Character thread")) {
          article.style.display = active ? "none" : "";
        }
      });
    }

    function syncCheckbox() {
      const checkbox = document.querySelector("#forumCharacterFilterCheckbox");
      if (checkbox && checkbox.checked !== active) {
        checkbox.checked = active;
      }
    }

    addCheckbox();
    applyFilter();
    syncCheckbox();
    const observer = new MutationObserver(() => {
      addCheckbox();
      syncCheckbox();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  //* %=================== Chinese filter ====================%
  function ChineseFilter() {
    const cfg = config.ChineseFilter;
    const storageKey = "ChineseFilterActive";
    const idsCacheKey = "ChineseFilterIds";
    const idsCacheTimeKey = "ChineseFilterIdsTime";
    const idsUrl = cfg.settings.idsList?.value;
    const updateInterval = 24 * 60 * 60 * 1000;

    let active = localStorage.getItem(storageKey) === "true";
    let ids = new Set();

    async function loadIds() {
      try {
        const now = Date.now();
        const lastUpdate = parseInt(localStorage.getItem(idsCacheTimeKey) || "0", 10);
        const cached = localStorage.getItem(idsCacheKey);
        if (cached && now - lastUpdate < updateInterval) {
          ids = new Set(JSON.parse(cached));
          applyFilter();
          return;
        }
        await refreshIds();
      } catch (err) {
        console.error("[ShikiUtils]: loadIds:", err);
      }
    }

    async function refreshIds() {
      try {
        const resp = await fetch(idsUrl, { cache: "no-store" });
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const data = await resp.json();
        if (Array.isArray(data)) {
          const parsed = data.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
          ids = new Set(parsed);
          localStorage.setItem(idsCacheKey, JSON.stringify(parsed));
          localStorage.setItem(idsCacheTimeKey, Date.now().toString());
          applyFilter();
        }
      } catch (err) {
        console.error("[ShikiUtils]: refreshIds:", err);
      }
    }

    function addCheckbox() {
      const container = document.querySelector(".b-block_list.kinds.anime-params");
      if (!container || container.querySelector(".chinese-filter")) return;
      const li = document.createElement("li");
      li.className = "chinese-filter";
      li.innerHTML = `
    <span class="filter item-add fake"></span>
    <input type="checkbox" id="chineseFilterCheckbox" autocomplete="off">
    ${cfg.settings.template?.value || "Без китайщины"}`;
      container.appendChild(li);
      const checkbox = li.querySelector("#chineseFilterCheckbox");
      checkbox.checked = active;
      if (active) li.classList.add("selected");
      checkbox.addEventListener("change", () => {
        active = checkbox.checked;
        localStorage.setItem(storageKey, active);
        li.classList.toggle("selected", active);
        applyFilter();
      });
    }


    function mergeEntries() {
      const allCcEntries = Array.from(document.querySelectorAll(".cc-entries"));
      if (allCcEntries.length < 2) return;

      const hasHeadlines = document.querySelector(".headline") !== null;

      if (!hasHeadlines) {
        const first = allCcEntries[0];
        allCcEntries.slice(1).forEach((cc) => {
          Array.from(cc.querySelectorAll("article.c-anime"))
            .forEach((a) => first.appendChild(a));
          cc.style.display = "none";
        });
        return;
      }

      const groups = new Map();
      allCcEntries.forEach((cc) => {
        let prev = cc.previousElementSibling;
        while (prev) {
          if (prev.classList.contains("headline")) {
            const key = prev.textContent.trim();
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(cc);
            return;
          }
          prev = prev.previousElementSibling;
        }
      });

      groups.forEach((entries) => {
        if (entries.length < 2) return;
        const first = entries[0];
        entries.slice(1).forEach((cc) => {
          Array.from(cc.querySelectorAll("article.c-anime"))
            .forEach((a) => first.appendChild(a));
          cc.style.display = "none";
        });
      });
    }

    function applyFilter() {
      if (!ids.size) return;
      if (active && cfg.settings.mergeEntries?.value) mergeEntries();
      document.querySelectorAll("article.c-anime").forEach((article) => {
        const animeId = parseInt(article.id, 10);
        if (active && ids.has(animeId)) article.remove();
      });
    }

    chineseFilterApply = applyFilter;

    function syncCheckbox() {
      const checkbox = document.querySelector("#chineseFilterCheckbox");
      const li = document.querySelector(".chinese-filter");
      if (checkbox) {
        checkbox.checked = active;
        if (li) li.classList.toggle("selected-fake", active);
      }
    }

    addCheckbox();
    loadIds();
    syncCheckbox();

    const observer = new MutationObserver(() => {
      addCheckbox();
      syncCheckbox();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  //* %=================== Studio Filter ====================%

  async function StudioFilter() {
    const cfg = config.StudioFilter.settings;
    const hiddenBlocks = document.querySelectorAll(".block.hidden");
    let filterBlock = null;

    hiddenBlocks.forEach((block) => {
      if (block.querySelector(".subheadline.m5")?.textContent.includes("Студия") || block.querySelector(".subheadline.m5")?.textContent.includes("Studio")) {
        filterBlock = block;
      }
    });

    if (!filterBlock) return;

    let studioList = filterBlock.querySelector(".b-block_list.studios.anime-params");
    if (!studioList) {
      studioList = document.createElement("ul");
      studioList.className = "b-block_list studios anime-params";
      filterBlock.appendChild(studioList);
    }

    try {
      const response = await fetch(cfg.apiUrl?.value || "/api/studios", {
        headers: {
          "User-Agent": navigator.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(response.status);
      }

      const studios = await response.json();
      const realStudios = studios.filter((studio) => studio.real);
      // spoiler
      const spoilerContainer = document.createElement("div");
      spoilerContainer.className = "b-spoiler";

      const spoilerLabel = document.createElement("label");
      spoilerLabel.textContent = cfg.template.value;
      spoilerLabel.style.cursor = "pointer";

      const spoilerContent = document.createElement("div");
      spoilerContent.className = "content only-show";
      spoilerContent.style.display = "none";

      const spoilerInner = document.createElement("div");
      spoilerInner.className = "inner";

      spoilerInner.appendChild(studioList);
      spoilerContent.appendChild(spoilerInner);
      spoilerContainer.appendChild(spoilerLabel);
      spoilerContainer.appendChild(spoilerContent);

      filterBlock.appendChild(spoilerContainer);

      // ev
      spoilerLabel.addEventListener("click", () => {
        spoilerLabel.style.display = "none";
        spoilerContent.style.display = "block";
        spoilerContainer.dispatchEvent(new Event("spoiler:open"));
      });

      realStudios.forEach((studio) => {
        const studioItem = document.createElement("li");
        studioItem.dataset.field = "studio";
        studioItem.dataset.value = `${studio.id}-${studio.filtered_name}`;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";

        studioItem.appendChild(checkbox);
        studioItem.appendChild(document.createTextNode(` ${studio.name}`));
        studioList.appendChild(studioItem);
      });

      filterBlock.classList.remove("hidden");
    } catch (err) {
      console.error("[ShikiUtils]", err);
    }
  }

  //* %=================== Shiki Rating Filter ====================%
  function ShikiRating() {//todo фикс score_2
    const filtersContainer = document.querySelector(".b-block_list.orders.anime-params.subcontent");
    if (!filtersContainer) return;

    const ShikiSort = document.createElement("li");
    ShikiSort.setAttribute("data-field", "order");
    ShikiSort.setAttribute("data-value", "score_2");

    ShikiSort.innerHTML = config.ShikiRating.settings.template.value;

    const referenceElement = filtersContainer.querySelector('li[data-field="order"][data-value="ranked"]');

    if (referenceElement) {
      filtersContainer.insertBefore(ShikiSort, referenceElement.nextSibling);
    } else {
      filtersContainer.appendChild(ShikiSort);
    }
  }

  //* %=================== News Filter ====================%
  function hideNews() {
    const blockedUserIds = config.hideNews.settings.userid.value
      .split(",")
      .map((id) => id.trim());
    const blockedTags = config.hideNews.settings.tags.value
      .split(",")
      .map((tag) => tag.trim().toLowerCase());

    document
      .querySelectorAll("article.b-news_wall-topic")
      .forEach((article) => {
        const userId = article.getAttribute("data-user_id");

        if (blockedUserIds.includes(userId)) {
          article.style.display = "none";
          return;
        }

        const tagElements = article.querySelectorAll(".tags .b-anime_status_tag");
        const articleTags = Array.from(tagElements).map((el) =>
          el.getAttribute("data-text").toLowerCase()
        );

        if (articleTags.some((tag) => blockedTags.includes(tag))) {
          article.style.display = "none";
        }
      });
  }

  //* %=================== Work Type Filter ====================%
  function workTypeFilter() {
    const cfg = config.workTypeFilter.settings;
    const mainContainer = document.querySelector(".l-content");
    const contentContainer = document.querySelector(".cc-5");
    if (!mainContainer || !contentContainer) return;
    if (mainContainer.querySelector('[data-shikiutils="works-filter"]')) return;

    const articles = Array.from(contentContainer.querySelectorAll("article"));
    if (!articles.length) return;

    articles.forEach((article, index) => {
      if (article.dataset.originalIndex === undefined) {
        article.dataset.originalIndex = index;
      }
    });

    const typesSet = new Set();
    articles.forEach((article) => {
      const textDiv = article.querySelector(".text");
      if (textDiv) {
        textDiv.textContent
          .split(",")
          .map((t) => t.trim())
          .forEach((t) => {
            if (t) typesSet.add(t);
          });
      }
    });
    const types = Array.from(typesSet);
    if (!types.length) return;

    const style = document.createElement("style");
    style.textContent = `
  .b-options-floated[data-shikiutils="works-filter"] {
    ${cfg.containerStyles?.value}
  }
`;
    document.head.appendChild(style);

    const filterBlock = document.createElement("div");
    filterBlock.className = "b-options-floated mobile-phone";
    filterBlock.dataset.shikiutils = "works-filter";

    function reorderArticles() {
      const visible = [];
      const hidden = [];

      articles.forEach((article) => {
        if (article.style.display === "none") hidden.push(article);
        else visible.push(article);
      });

      visible.sort((a, b) => parseInt(a.dataset.originalIndex) - parseInt(b.dataset.originalIndex));
      hidden.sort((a, b) => parseInt(a.dataset.originalIndex) - parseInt(b.dataset.originalIndex));

      [...visible, ...hidden].forEach((a) => contentContainer.appendChild(a));
    }

    types.forEach((type) => {
      const filterBtn = document.createElement("a");
      filterBtn.textContent = type;

      filterBtn.addEventListener("click", () => {
        const isSelected = filterBtn.classList.contains("selected");

        filterBlock
          .querySelectorAll("a")
          .forEach((a) => a.classList.remove("selected"));

        if (!isSelected) {
          filterBtn.classList.add("selected");

          articles.forEach((article) => {
            const textDiv = article.querySelector(".text");
            if (textDiv) {
              const articleTypes = textDiv.textContent
                .split(",")
                .map((t) => t.trim());
              article.style.display = articleTypes.includes(type) ? "" : "none";
            }
          });
        } else {
          articles.forEach((article) => (article.style.display = ""));
        }

        reorderArticles();
      });

      filterBlock.appendChild(filterBtn);
    });

    mainContainer.prepend(filterBlock);
  }

  //! %=================== Helpers ====================%

  //* %=================== Notification Helper ====================%
  function NotificationHelper() {
    helperBuilder({
      configKey: "NotificationHelperConfig",
      itemSelector: ".b-message, .b-dialog",
      checkboxClass: "notification-checkbox",
      deleteButtonSelector: ".item-delete-confirm",
      deleteMethod: "DELETE",
      deleteUrlAttr: "action",
      showOnHover: true,
      checkboxContainerSelector: "aside.buttons div.main-controls",
    });
  }
  //* %=================== History Helper ====================%
  function HistoryHelper() {
    helperBuilder({
      configKey: "HistoryHelperConfig",
      itemSelector: ".b-user_history-line",
      checkboxClass: "history-checkbox",
      deleteButtonSelector: ".destroy",
      deleteMethod: "POST",
      deleteUrlAttr: "href",
      showOnHover: false,
      checkboxContainerSelector: null,
    });
  }
  //* %=================== Favorites Helper ====================%
  function FavoriteHelper() {
    if (!document.querySelector(".block.is-own-profile")) return;

    const head = document.querySelector(".head.misc.is-own-profile");

    helperBuilder({
      configKey: "FavoriteHelperConfig",
      itemSelector: ".c-column.b-catalog_entry",
      checkboxClass: "favorites-checkbox",
      deleteMethod: "DELETE",
      getDeleteUrl: (item) => {
        let type = null;
        if (item.classList.contains("c-anime")) type = "Anime";
        else if (item.classList.contains("c-manga")) type = "Manga";
        else if (item.classList.contains("c-character")) type = "Character";
        else if (item.classList.contains("c-person")) type = "Person";
        if (!type || !item.id) return null;
        return `/api/favorites/${type}/${item.id}`;
      },
      showOnHover: false,
      checkboxContainerSelector: null,
      selectionModeBtn: head ? { target: head, text: "Режим выбора" } : null,
      clickableSelector: "a",
    });
  }

  //! %=================== Buttons ====================%

  //* %=================== Club Css Copy Btn ====================%
  function processClubCssCopyBtn(menu) {
    if (menu.querySelector('.copy-club-css')) return;
    const cfg = config.ClubCssCopyBtn.settings;
    const stylesObj = Object.fromEntries(
      cfg.btnStyles?.value
        .split(';')
        .filter(Boolean)
        .map((s) => s.split(':').map((x) => x.trim()))
        .filter(([k]) => k)
    );
    const button = btnBuilder({
      tag: 'a',
      classes: ['copy-club-css', 'b-tooltipped'],
      title: cfg.btnTitle?.value,
      styles: stylesObj,
      svgIcon: cfg.svgIcon?.value,
      onClick: async () => {
        const match = window.location.href.match(/\/clubs\/(\d+)-/);
        if (!match) return;
        const clubId = match[1];
        try {
          const clubResp = await fetch(`/api/clubs/${clubId}`);
          const clubData = await clubResp.json();
          const styleId = clubData.style_id;
          if (!styleId) throw new Error('no styleId');
          const styleResp = await fetch(`/api/styles/${styleId}`);
          const styleData = await styleResp.json();
          if (!styleData.compiled_css) throw new Error('no compiled_css');
          await navigator.clipboard.writeText(styleData.compiled_css);
        } catch (err) {
          console.error('[ShikiUtils] ClubCssCopyBtn:', err);
        }
      },
    });
    menu.prepend(button);
  }

  function ClubCssCopyBtn() {
    document.querySelectorAll('.b-clubs-menu').forEach(processClubCssCopyBtn);
  }

  //* %=================== Comm Copy Btn ====================%
  function processCommCopyBtn(comment) {
    if (comment.querySelector('.copy-comment-link')) return;
    const commentId = comment.id;
    if (!commentId) return;
    const cfg = config.CommCopyBtn.settings;
    const button = btnBuilder({
      tag: 'span',
      classes: ['copy-comment-link'],
      title: cfg.btnTitle?.value,
      svgIcon: cfg.svgIcon?.value,
      onClick: () =>
        navigator.clipboard
          .writeText(location.origin + `/comments/${commentId}`)
          .catch(console.error),
    });
    button.style.cssText = cfg.btnStyles?.value;
    comment.querySelector('.main-controls')?.appendChild(button);
  }

  function CommCopyBtn() {
    document.querySelectorAll('.b-comment').forEach(processCommCopyBtn);
  }

  //* %=================== CommTreeBtn ====================%
  function processCommTreeBtn(comment) {
    if (comment.querySelector('.comment-tree-btn')) return;
    const commentId = comment.id;
    if (!commentId) return;
    const cfg = config.CommTreeBtn.settings;
    const button = btnBuilder({
      tag: 'span',
      classes: ['comment-tree-btn'],
      title: cfg.btnTitle?.value || 'Показать древо комментариев',
      svgIcon: cfg.svgIcon?.value,
      onClick: async () => {
        try {
          const visited = new Set();
          const nodes = [];
          const links = [];
          const commentCache = new Map();

          async function getCommentData(id) {
            if (commentCache.has(id)) return commentCache.get(id);
            const resp = await fetch(`/api/comments/${id}`);
            if (!resp.ok) return null;
            const data = await resp.json();
            commentCache.set(id, data);
            return data;
          }

          async function parseCommentTree(id, parentId = null) {
            if (visited.has(id)) return;
            visited.add(id);
            const data = await getCommentData(id);
            if (!data) return;

            const author = data.user?.nickname || 'unknown';
            const date = new Date(data.created_at).getFullYear();

            if (!nodes.some((n) => n.id === data.id)) {
              nodes.push({
                id: data.id,
                date,
                image_url: data.user?.image?.x64 || '',
                author,
                weight: 10,
              });
            }

            if (parentId) {
              if (!links.some((l) => l.source_id === parentId && l.target_id === data.id)) {
                links.push({ source_id: data.id, target_id: parentId, weight: 1, relation: 'sequel' });
              }
            }

            const replies = [...data.body.matchAll(/\[replies=([0-9,]+)\]/g)]
              .flatMap((m) => m[1].split(',').map((x) => x.trim()).filter(Boolean));
            const repliesTo = [...data.body.matchAll(/\[comment=(\d+);/g)].map((m) => m[1]);
            const quotesTo = [...data.body.matchAll(/>?c(\d+);/g)].map((m) => m[1]);

            if (replies.length === 0 && repliesTo.length === 0 && !parentId) {
              links.push({ source_id: data.id, target_id: data.id, weight: 1, relation: 'other' });
              return;
            }

            for (const repId of replies) {
              if (!visited.has(repId)) {
                await parseCommentTree(repId, data.id);
              } else if (!links.some((l) => l.source_id === data.id && l.target_id === Number(repId))) {
                links.push({ source_id: Number(repId), target_id: data.id, weight: 1, relation: 'sequel' });
              }
            }

            for (const refId of repliesTo) {
              if (!visited.has(refId)) await parseCommentTree(refId, null);
              if (!links.some((l) => l.source_id === data.id && l.target_id === Number(refId))) {
                links.push({ source_id: data.id, target_id: Number(refId), weight: 1, relation: 'sequel' });
              }
            }

            for (const quoteId of quotesTo) {
              if (!visited.has(quoteId)) await parseCommentTree(quoteId, null);
              if (!links.some((l) => l.source_id === data.id && l.target_id === Number(quoteId))) {
                links.push({ source_id: data.id, target_id: Number(quoteId), weight: 1, relation: 'sequel' });
              }
            }
          }

          await parseCommentTree(commentId);
          localStorage.setItem('ShikiUtils_CommTreeData', JSON.stringify({
            current_id: Number(commentId), nodes, links,
          }));
          localStorage.setItem('shikiDialogFromButton', 'true');
          window.location.href = `/animes/59846/franchise`;
        } catch (err) {
          console.error('[ShikiUtils] CommTreeBtn onClick:', err);
        }
      },
    });
    button.style.cssText = cfg.btnStyles?.value;
    comment.querySelector('.main-controls')?.appendChild(button);
  }
  function CommTreeBtn() {
    document.querySelectorAll('.b-comment').forEach(processCommTreeBtn);

    function cleanUp() {
      document.querySelector('.graph')?.querySelectorAll('svg').forEach((el) => el.remove());
      document.querySelectorAll('.head.misc').forEach((el) => el.remove());
    }

    async function renderCommentTreeGraph() {
      if (!window.location.href.includes('/franchise')) return;
      if (localStorage.getItem('shikiDialogFromButton') !== 'true') return;
      const stored = localStorage.getItem('ShikiUtils_CommTreeData');
      if (!stored) return;
      try {
        const data = JSON.parse(stored);
        localStorage.removeItem('ShikiUtils_CommTreeData');
        localStorage.removeItem('shikiDialogFromButton');
        cleanUp();
        const container = document.querySelector('.graph');
        const graph = new window.FranchiseGraph(data);
        setTimeout(() => graph.render_to(container), 2000);
      } catch (err) {
        console.error('[ShikiUtils] renderCommentTreeGraph:', err);
      }
    }

    ready(() => setTimeout(() => renderCommentTreeGraph(), 2000));
  }

  //* %=================== User CSS Copy Btn ===================%
  function ProfileBtnContainer(avatar) {
    let container = avatar.querySelector('.ShikiUtils-buttons');
    if (container) return container;
    container = document.createElement('div');
    container.className = 'ShikiUtils-buttons';
    Object.assign(container.style, { //todo v cfg ?
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      marginTop: '5px',
      marginLeft: '5px',
    });
    const profileActions = avatar.querySelector('.profile-actions');
    profileActions ? profileActions.parentNode.insertBefore(container, profileActions.nextSibling) : avatar.appendChild(container);
    return container;
  }
  async function processUserCssCopyBtn(avatar) {
    const btnContainer = ProfileBtnContainer(avatar);
    if (btnContainer.querySelector('.copy-profile-css')) return;
    const profileHead = avatar.closest('.profile-head');
    if (!profileHead) return;
    const userId = profileHead.dataset.userId;
    if (!userId) return;
    const cfg = config.UserCssCopyBtn.settings;
    const button = btnBuilder({
      tag: 'a',
      classes: ['copy-profile-css', 'b-tooltipped'],
      title: cfg.btnTitle?.value,
      dataset: { direction: 'top' },
      svgIcon: cfg.svgIcon?.value,
      onClick: async () => {
        try {
          const userResp = await fetch(`/api/users/${userId}`);
          const userData = await userResp.json();
          const styleId = userData.style_id;
          if (!styleId) throw new Error('no styleId');
          const styleResp = await fetch(`/api/styles/${styleId}`);
          const styleData = await styleResp.json();
          await navigator.clipboard.writeText(styleData.compiled_css);
        } catch (err) {
          console.error('[ShikiUtils] UserCssCopyBtn:', err);
        }
      },
    });
    button.style.cssText = cfg.btnStyles?.value;
    btnContainer.appendChild(button);
  }
  function UserCssCopyBtn() {
    document.querySelectorAll('.c-brief .avatar').forEach(processUserCssCopyBtn);
  }

  //* %=================== User ID Copy Btn ===================%
  function processUserIdCopyBtn(avatar) {
    const btnContainer = ProfileBtnContainer(avatar);
    if (btnContainer.querySelector('.copy-profile-id')) return;
    const profileHead = avatar.closest('.profile-head');
    if (!profileHead) return;
    const userId = profileHead.dataset.userId;
    if (!userId) return;
    const cfg = config.UserIdCopyBtn.settings;
    const button = btnBuilder({
      tag: 'a',
      classes: ['copy-profile-id', 'b-tooltipped'],
      title: cfg.btnTitle?.value,
      dataset: { direction: 'top' },
      svgIcon: cfg.svgIcon?.value,
      onClick: () =>
        navigator.clipboard.writeText(userId).catch((err) => console.error('[ShikiUtils]', err)),
    });
    button.style.cssText = cfg.btnStyles?.value;
    btnContainer.appendChild(button);
  }
  function UserIdCopyBtn() {
    document.querySelectorAll('.c-brief .avatar').forEach(processUserIdCopyBtn);
  }

  //* %=================== Image Id Copy Btn ===================%
  function processImageIdCopyBtn(imageWrapper) {
    if (imageWrapper.querySelector('.copy-image-id-button')) return;
    const imageData = imageWrapper.getAttribute('data-attrs');
    if (!imageData) return;
    try {
      const parsed = JSON.parse(imageData);
      const imageId = parsed.id;
      if (!imageId) return;
      const cfg = config.ImageIdCopyBtn.settings;
      const button = btnBuilder({
        tag: 'span',
        classes: ['copy-image-id-button'],
        title: cfg.btnTitle?.value,
        svgIcon: cfg.svgIcon?.value,
        onClick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          return navigator.clipboard.writeText(`[image=${imageId}]`).catch(console.error);
        },
      });
      button.style.cssText = cfg.btnStyles?.value;
      imageWrapper.style.position = 'relative';
      imageWrapper.appendChild(button);
    } catch (err) {
      console.error('[ShikiUtils] processImageIdCopyBtn:', err);
    }
  }
  function ImageIdCopyBtn() {
    document.querySelectorAll('.b-image').forEach(processImageIdCopyBtn);
  }

  //* %=================== Code Copy Btn ===================%
  function processCopyCodeBtn(pre) {
    if (pre.querySelector('.copy-code-button')) return;
    const codeEl = pre.querySelector('code');
    if (!codeEl) return;
    const cfg = config.CopyCodeBtn.settings;
    try {
      const button = btnBuilder({
        tag: 'span',
        classes: ['copy-code-button'],
        title: cfg.btnTitle?.value,
        svgIcon: cfg.svgIcon?.value,
        onClick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          return navigator.clipboard.writeText(codeEl.textContent.trim()).catch(console.error);
        },
      });
      button.style.cssText = cfg.btnStyles?.value;
      pre.appendChild(button);
    } catch (err) {
      console.error('[ShikiUtils] processCopyCodeBtn:', err);
    }
  }
  function CopyCodeBtn() {
    document.querySelectorAll('pre.b-code-v2').forEach(processCopyCodeBtn);
  }

  //* %=================== switchBtn ===================%
  function switchBtn() {
    const cfg = config.switchBtn.settings;
    const logo = document.querySelector(".logo-container");
    if (!logo || logo.querySelector(".switch-button")) return;

    try {
      const DisplayMode = cfg.DisplayMode.value;

      if (DisplayMode === "glyph") {
        const glyphs = document.querySelectorAll(".glyph, .glyph.glyph-logged-out");
        if (!glyphs.length) return;

        glyphs.forEach((glyph) => {
          glyph.style.cursor = "pointer";
          glyph.title = cfg.btnTitle?.value || "";

          if (!glyph.dataset.shikiutils) {
            glyph.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              location.href = location.href.replace(
                location.hostname,
                location.hostname.endsWith(".rip") ? DOMAIN : "shikimori.rip"
              );
            });
            glyph.dataset.shikiutils = "true";
          }
        });

        return;
      }

      const button = btnBuilder({
        tag: "span",
        classes: ["switch-button"],
        title: cfg.btnTitle?.value,
        onClick: (event) => {
          event.preventDefault();
          event.stopPropagation();
          location.href = location.href.replace(
            location.hostname,
            location.hostname.endsWith(".rip") ? DOMAIN : "shikimori.rip"
          );
        },
      });

      button.style.cssText = cfg.btnStyles?.value;
      logo.style.position = "relative";

      if (cfg.svgIcon?.value) {
        const svgWrapper = document.createElement("span");
        svgWrapper.innerHTML = cfg.svgIcon.value;
        button.appendChild(svgWrapper);
      }

      logo.appendChild(button);
    } catch (err) {
      console.error("[ShikiUtils] switchBtn:", err);
    }
  }
  //! %=================== Misc ====================%


  //* %=================== More Statistic ===================%
  async function MoreStatistic() {
    const cfg = config.MoreStatistic.settings;

    if (cfg.enableAvgScoreInList?.value) {
      const barBlock = document.querySelector(".bar.simple.horizontal");
      if (barBlock) {
        const head = document.querySelector(".scores .subheadline.m5");
        if (!head || !head.querySelector("[data-shikiutils='AvgScoreInList']")) {
          let sum = 0;
          let total = 0;

          barBlock.querySelectorAll(".line").forEach(line => {
            const score = parseInt(line.querySelector(".x_label")?.textContent);
            const bar = line.querySelector(".bar");
            const count = parseInt(bar?.getAttribute("title"));
            if (!isNaN(score) && !isNaN(count)) {
              sum += score * count;
              total += count;
            }
          });

          if (total > 0 && head) {
            const avg = +(sum / total).toFixed(2);
            head.textContent = cfg.avgScoreTemplate.value.replace("{avgscore}", avg);
            const marker = document.createElement("span");
            marker.dataset.shikiutils = "AvgScoreInList";
            marker.style.display = "none";
            head.appendChild(marker);
          }
        }
      }
    }

    if (cfg.enableFriendsAvg?.value) { //todo выводить created_at
      const userId = getUserId();
      const ablock = document.querySelector(".b-animes-menu .block");

      if (userId && ablock) {
        let friendsList = [];
        if (cfg.friendsEpInfo?.value) {
          try {
            const friendsResp = await fetch(`/api/users/${userId}/friends?limit=100`);
            friendsList = await friendsResp.json();
          } catch (err) {
            console.error("[ShikiUtils] friendsResp:", err);
          }
        }

        const friendMap = new Map();
        friendsList.forEach(f => friendMap.set(f.nickname, f.id));

        const block = Array.from(document.querySelectorAll(".b-animes-menu .block"))
          .find(b => b.querySelector(".friend-rate"));

        const subhead = block?.querySelector(".subheadline.m5");

        if (block && subhead && !subhead.querySelector("[data-shikiutils='FriendsAvg']")) {
          let rawScores = [];
          block.querySelectorAll(".friend-rate .status").forEach(status => {
            const m = status.textContent.match(/–\s*(\d+)/);
            if (m) rawScores.push(parseInt(m[1], 10));
          });

          if (rawScores.length) {
            const avg = (rawScores.reduce((a, b) => a + b, 0) / rawScores.length).toFixed(1);
            subhead.textContent = cfg.friendsAvgTemplate.value.replace("{avgscore}", avg);
          }

          const marker = document.createElement("span");
          marker.dataset.shikiutils = "FriendsAvg";
          marker.style.display = "none";
          subhead.appendChild(marker);

          if (cfg.friendsEpInfo?.value && friendsList.length) {
            let targetType = "Anime";
            if (location.pathname.includes("/mangas/") || location.pathname.includes("/ranobe/")) {
              targetType = "Manga";
            }

            const statuses = ["Брошено", "Смотрю", "Отложено", "Пересматриваю", "Читаю", "Перечитываю", "Dropped", "Watching", "Rewatching", "On Hold", "Reading", "Rereading"];
            const friendLines = Array.from(block.querySelectorAll(".b-menu-line.friend-rate, .b-show_more-more .friend-rate"))
              .filter(line => {
                const st = line.querySelector(".status")?.textContent.trim();
                return statuses.some(s => st?.startsWith(s));
              });

            const animeId = getId();

            if (friendLines.length && animeId) {
              for (const line of friendLines) {
                const statusEl = line.querySelector(".status");
                const userEl = line.querySelector(".b-user16 a[title]");
                if (!statusEl || !userEl) continue;

                const nickname = userEl.getAttribute("title").trim();
                const friendId = friendMap.get(nickname);
                if (!friendId) continue;

                await delay(cfg.friendsApiDelay?.value);

                let userRates;
                try {
                  // const resp = await fetch(`/api/v2/user_rates?user_id=${friendId}&target_type=${targetType}`);
                  const resp = await fetch(`/api/v2/user_rates?user_id=${friendId}&target_type=${targetType}&target_id=${animeId}`);
                  if (resp.status === 429) {
                    console.warn("[ShikiUtils] 429 жди");
                    await delay((cfg.friendsApiDelay?.value ?? 500) * 5);
                    continue;
                  }
                  userRates = await resp.json();
                } catch (err) {
                  console.error("[ShikiUtils] user_rates err:", err);
                  continue;
                }

                const rate = userRates.find(r =>
                  String(r.target_id) === String(animeId) && r.target_type === targetType
                );
                if (!rate) continue;

                let newStatus = statusEl.textContent.split("–")[0].trim();

                if (rate.score) newStatus += ` – ${rate.score}`;

                if (targetType === "Anime") {
                  const ep = rate.episodes;
                  if (ep || (ep === 0 && cfg.showZeroEp?.value)) newStatus += IS_RU ? ` (${ep} эп.)` : ` (${ep} ep.)`;
                }

                if (targetType === "Manga") {
                  const ch = rate.chapters;
                  if (ch || (ch === 0 && cfg.showZeroEp?.value)) newStatus += IS_RU ? ` (${ch} гл.)` : ` (${ch} ch.)`;
                }

                statusEl.textContent = newStatus;
              }
            }
          }
        }
      }
    }

    if (cfg.enableBanCount?.value) {
      if (window.location.pathname.endsWith("/moderation")) {
        const head = document.querySelector(".subheadline.m5");
        if (head && !head.querySelector("[data-shikiutils='BanCount']")) {
          const bans = document.querySelectorAll(".b-ban").length;
          head.textContent = cfg.banCountTemplate.value.replace("{count}", bans);
          const marker = document.createElement("span");
          marker.dataset.shikiutils = "BanCount";
          marker.style.display = "none";
          head.appendChild(marker);
        }
      }
    }

    if (cfg.enableWatchTime?.value) {
      if (animPage()) {
        try {
          function elementFinder(doc, ...keyTexts) {
            const lines = doc.querySelectorAll(".b-entry-info .line-container .line");
            for (const line of lines) {
              const key = line.querySelector(".key");
              if (!key) continue;
              const text = key.textContent.toLowerCase();
              for (const k of keyTexts) {
                if (text.includes(k.toLowerCase())) return line.querySelector(".value");
              }
            }
            return null;
          }

          function parseDur(durationText) {
            const txt = durationText.toLowerCase();
            const hoursMatch = /(\d+)\s*(?:час|hour)/.exec(txt);
            const minsMatch = /(\d+)\s*(?:мин|min)/.exec(txt);
            return (hoursMatch ? parseInt(hoursMatch[1]) * 60 : 0) +
              (minsMatch ? parseInt(minsMatch[1]) : 0);
          }

          function rotEbal(number, one, two, five) {
            const n1 = Math.abs(number) % 10;
            const n2 = Math.abs(number) % 100;
            if (n2 > 10 && n2 < 20) return five;
            if (n1 > 1 && n1 < 5) return two;
            if (n1 === 1) return one;
            return five;
          }

          function formatTime(totalMins) {
            const days = Math.floor(totalMins / 1440);
            const hours = Math.floor((totalMins % 1440) / 60);
            const mins = totalMins % 60;
            const parts = [];
            if (days > 0) parts.push(`${days} ${rotEbal(days, "день", "дня", "дней")}`);
            if (hours > 0) parts.push(`${hours} ${rotEbal(hours, "час", "часа", "часов")}`);
            if (mins > 0) parts.push(`${mins} ${rotEbal(mins, "минута", "минуты", "минут")}`);
            return parts.join(", ");
          }

          const episodesEl = elementFinder(document, "Эпизоды", "Episodes");
          const durationEl = elementFinder(document, "Длительность эпизода", "Episode duration");

          if (episodesEl && durationEl) {
            const episodes = parseInt(episodesEl.textContent.trim());
            const durMins = parseDur(durationEl.textContent.trim());

            if (episodes && durMins && !document.querySelector(".time-block")) {
              const timeBlock = document.createElement("div");
              timeBlock.classList.add("line", "time-block");
              timeBlock.innerHTML = `
              <div class="key">${cfg.watchTimeTemplate.value}</div>
              <div class="value"><span>${formatTime(episodes * durMins)}</span></div>
            `;
              durationEl.parentNode.parentNode.appendChild(timeBlock);
            }
          }
        } catch (err) {
          console.error("[ShikiUtils] watchTime:", err);
        }
      }
    }
  }

  //* %=================== Friends History ===================%
  let friendsHistoryAbortController = null;
  document.addEventListener("turbolinks:before-visit", () => {
    friendsHistoryAbortController?.abort();
    friendsHistoryAbortController = null;
  });

  function FriendsHistoryTooltip() {
    if (document.body.dataset.shikiutilsTooltip) return;
    document.body.dataset.shikiutilsTooltip = "true";

    const cfg = config.FriendsHistory.settings;

    let tooltipElem = null;
    let hideTimeout = null;
    let fetchTimeout = null;
    let appearTimeout = null;
    const cache = new Map();
    let isTooltipHovered = false;

    document.addEventListener("turbolinks:before-visit", () => {
      clearTimeout(hideTimeout);
      clearTimeout(fetchTimeout);
      clearTimeout(appearTimeout);
      tooltipElem?.remove();
      tooltipElem = null;
    }, { once: true });

    function getTooltip() {
      if (!tooltipElem) {
        tooltipElem = document.createElement("div");
        tooltipElem.className = "tooltip tooltip-left";
        tooltipElem.style.position = "absolute";
        tooltipElem.style.zIndex = "9999";
        tooltipElem.style.display = "none";
        tooltipElem.style.pointerEvents = "auto";
        tooltipElem.style.transition = "opacity 0.15s ease";
        tooltipElem.style.opacity = "0";
        tooltipElem.innerHTML = `
        <div class="tooltip-inner">
          <div class="tooltip-arrow"></div>
          <div class="clearfix">
            <div class="tooltip-details">
              <div class="b-catalog_entry-tooltip">Загрузка...</div>
            </div>
          </div>
        </div>
      `;

        tooltipElem.addEventListener("mouseenter", () => {
          isTooltipHovered = true;
          clearTimeout(hideTimeout);
        });

        tooltipElem.addEventListener("mouseleave", () => {
          isTooltipHovered = false;
          hideTooltipWithDelay();
        });

        document.body.appendChild(tooltipElem);
      }
      return tooltipElem;
    }

    function hideTooltipWithDelay() {
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        if (!tooltipElem) return;
        if (!isTooltipHovered) {
          tooltipElem.style.opacity = "0";
          tooltipElem.style.display = "none";
        }
      }, cfg.tooltipHideDelay?.value ?? 150);
    }

    document.addEventListener("mouseover", (e) => {
      const link = e.target.closest(".db-entry[data-tooltip-url]");
      if (!link) return;

      clearTimeout(hideTimeout);
      clearTimeout(fetchTimeout);
      clearTimeout(appearTimeout);

      const tooltipUrl = link.dataset.tooltipUrl;
      if (!tooltipUrl) return;

      appearTimeout = setTimeout(() => {
        const tooltip = getTooltip();
        tooltip.style.display = "block";
        tooltip.style.opacity = "0";
        tooltip.querySelector(".b-catalog_entry-tooltip").innerHTML = "Загрузка...";

        const mouseX = e.pageX;
        const mouseY = e.pageY;
        const offset = 20;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const scrollY = window.scrollY;

        const isRightSide = mouseX < screenWidth / 2;
        tooltip.classList.remove("tooltip-left", "tooltip-right");
        tooltip.classList.add(isRightSide ? "tooltip-right" : "tooltip-left");

        const tooltipHeight = tooltip.offsetHeight || 200;
        const tooltipWidth = tooltip.offsetWidth || 300;
        const offsetY = 75;
        let topPos = mouseY - tooltipHeight / 2 - offsetY;
        let leftPos = isRightSide ? mouseX + offset : mouseX - tooltipWidth - offset;

        if (topPos < scrollY + 10) topPos = scrollY + 10;
        if (topPos + tooltipHeight > scrollY + screenHeight - 10) {
          topPos = scrollY + screenHeight - tooltipHeight - 10;
        }

        tooltip.style.top = `${topPos}px`;
        tooltip.style.left = `${Math.max(leftPos, 10)}px`;

        if (cache.has(tooltipUrl)) {
          tooltip.querySelector(".b-catalog_entry-tooltip").innerHTML = cache.get(tooltipUrl);
          tooltip.style.opacity = "1";
        } else {
          fetchTimeout = setTimeout(async () => {
            try {
              const resp = await fetch(`${tooltipUrl}/tooltip`);
              const html = await resp.text();
              const tmp = document.createElement("div");
              tmp.innerHTML = html;
              const inner = tmp.querySelector(".b-catalog_entry-tooltip");
              const innerHTML = inner ? inner.innerHTML : "Ошибка загрузки";
              cache.set(tooltipUrl, innerHTML);
              tooltip.querySelector(".b-catalog_entry-tooltip").innerHTML = innerHTML;
            } catch (err) {
              console.error("[ShikiUtils] Tooltip load error:", err);
              tooltip.querySelector(".b-catalog_entry-tooltip").innerHTML = "Ошибка загрузки.";
            }
            tooltip.style.opacity = "1";
          }, cfg.tooltipFetchDelay?.value ?? 200);
        }
      }, cfg.tooltipAppearDelay?.value ?? 200);

      link.addEventListener("mouseleave", () => {
        clearTimeout(appearTimeout);
        clearTimeout(fetchTimeout);
        hideTooltipWithDelay();
      }, { once: true });

    }, true);
  }

  async function FriendsHistory() { //todo выбор друзей + логика для 100+ друзей
    const cfg = config.FriendsHistory.settings;
    const profileBlock = document.querySelector(".block.is-own-profile");
    if (!profileBlock) return;
    if (profileBlock.querySelector('.history-headline')) return;

    const username = getUsername();
    const userId = getUserId();
    // console.log("[ShikiUtils] FriendsHistory: username =", username, "userId =", userId);
    if (!username || !userId) return;
    friendsHistoryAbortController?.abort();
    friendsHistoryAbortController = new AbortController();
    const signal = friendsHistoryAbortController.signal;

    FriendsHistoryTooltip();
    const friendsResp = await fetch(`/api/users/${userId}/friends?limit=100`, { signal });
    if (!friendsResp.ok) return;
    const friends = await friendsResp.json();
    if (!friends.length) return;

    const headline = document.createElement("h2");
    headline.className = "subheadline history-headline";
    headline.textContent = cfg.headlineText?.value || "История друзей";
    profileBlock.appendChild(headline);

    const historyContainer = document.createElement("div");
    historyContainer.className = "history-container";
    profileBlock.appendChild(historyContainer);

    const progressElem = document.createElement("div");
    progressElem.style.margin = "5px 0";
    progressElem.textContent = (cfg.progressTemplate?.value || "Загружено {loaded} / {total} друзей...").replace("{loaded}", 0).replace("{total}", friends.length);
    profileBlock.insertBefore(progressElem, historyContainer);

    function timeAgo(date) {
      const diffSec = Math.floor((new Date() - date) / 1000);

      const declension = (num, words) => {
        num = Math.abs(num) % 100;
        const n1 = num % 10;
        if (num > 10 && num < 20) return words[2];
        if (n1 > 1 && n1 < 5) return words[1];
        if (n1 === 1) return words[0];
        return words[2];
      };

      if (diffSec < 60) {
        return "несколько секунд назад";
      }

      const minutes = Math.floor(diffSec / 60);
      if (minutes < 60) {
        return `${minutes} ${declension(minutes, ["минуту", "минуты", "минут",])} назад`;
      }

      const hours = Math.floor(diffSec / 3600);
      if (hours < 24) {
        return `${hours} ${declension(hours, ["час", "часа", "часов"])} назад`;
      }

      const days = Math.floor(diffSec / 86400);
      if (days < 7) {
        return `${days} ${declension(days, ["день", "дня", "дней"])} назад`;
      }

      const weeks = Math.floor(days / 7);
      if (weeks < 5) {
        return `${weeks} ${declension(weeks, ["неделю", "недели", "недель",])} назад`;
      }

      const months = Math.floor(days / 30.44);
      if (months < 12) {
        return `${months} ${declension(months, ["месяц", "месяца", "месяцев",])} назад`;
      }

      const years = Math.floor(days / 365.25);
      return `${years} ${declension(years, ["год", "года", "лет"])} назад`;
    }

    function getTimeCategory(date) {
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "сегодня";
      if (diffDays === 1) return "вчера";
      if (diffDays <= 7) return "в течение недели";

      const weeks = Math.floor(diffDays / 7);
      if (weeks === 1) return "неделю назад";
      if (weeks === 2) return "две недели назад";
      if (weeks === 3) return "три недели назад";
      if (weeks === 4) return "четыре недели назад";

      const months = Math.floor(diffDays / 30.44);
      if (months < 12) {
        const word = months === 1 ? "месяц" : months >= 2 && months <= 4 ? "месяца" : "месяцев";
        return `${months} ${word} назад`;
      }

      const years = Math.floor(diffDays / 365.25);
      const word = years === 1 ? "год" : years >= 2 && years <= 4 ? "года" : "лет";
      return `${years} ${word} назад`;
    }

    const allEntries = [];
    const categories = {};

    let loadedCount = 0;

    for (const friend of friends) {
      if (signal.aborted) return;
      try {
        const resp = await fetch(`/api/users/${friend.id}/history?limit=${cfg.apilimit.value}`);
        if (!resp.ok) continue;

        let history;
        try {
          history = await resp.json();
        } catch {
          console.warn(`[ShikiUtils] ${friend.nickname} 1488 `);
          continue;
        }
        if (!Array.isArray(history)) continue;

        history.forEach((entry) => {
          const createdAt = new Date(entry.created_at);
          if (isNaN(createdAt)) return;
          allEntries.push({ friend, entry, createdAt });
        });

        allEntries.sort((a, b) => b.createdAt - a.createdAt);

        historyContainer.innerHTML = "";
        for (const key in categories) delete categories[key];

        allEntries.forEach(({ friend, entry, createdAt }) => {
          const label = getTimeCategory(createdAt);
          if (!categories[label]) {
            const dayHeader = document.createElement("div");
            dayHeader.className = "mischeadline";
            dayHeader.textContent = label;
            historyContainer.appendChild(dayHeader);
            categories[label] = dayHeader;
          }

          const line = document.createElement("div");
          line.className = "b-user_history-line";
          line.dataset.id = entry.id;

          const avatar = friend.image?.x48 || "";

          const targetNameEn = escapeHTML(entry.target?.name || "-");
          const targetNameRu = escapeHTML(entry.target?.russian?.trim() || "");
          const targetUrl = (entry.target?.url || "").startsWith("/") ? entry.target.url : "#";

          let targetHTML = "";
          if (entry.target) {
            if (targetNameRu) {
              targetHTML = `
      <a class="db-entry bubbled-processed" href="${targetUrl}" data-tooltip-url="${targetUrl}">
        <span class="name-en">${targetNameEn}</span>
        <span class="name-ru">${targetNameRu}</span>
      </a>`;
            } else {
              targetHTML = `<a class="db-entry bubbled-processed" href="${targetUrl}" data-tooltip-url="${targetUrl}">${targetNameEn}</a>`;
            }
          }

          line.innerHTML = `
  <strong style="margin-right:5px;"><a href="/${escapeHTML(friend.nickname)}">${escapeHTML(friend.nickname)}</a>:</strong>
  <a class="id" href="$/${friend.nickname}/history/${entry.id}">#</a>
  <span>
      ${targetHTML}
      &nbsp;${escapeHTML(entry.description.replace(/Просмотрено и оценено/, "просмотрено и оценено"))}
  </span>
  <time class="date" datetime="${createdAt.toISOString()}" title="${createdAt.toLocaleString()}">
      ${timeAgo(createdAt)}
  </time>
`;

          const wrapper = document.createElement("div");
          wrapper.style.display = "flex"; //todo css v cfg
          wrapper.style.alignItems = "center";
          wrapper.style.gap = "8px";
          wrapper.style.marginBottom = "8px";

          const avatarElem = document.createElement("a");
          avatarElem.href = `/${friend.nickname}`;
          avatarElem.title = friend.nickname;
          avatarElem.style.marginRight = "8px";
          avatarElem.style.flexShrink = "0";
          avatarElem.innerHTML = `<img src="${escapeHTML(avatar)}" alt="${escapeHTML(friend.nickname)}" style="width:24px;height:24px;border-radius:50%;">`;

          line.style.lineHeight = "1.3";
          line.style.wordBreak = "break-word";
          wrapper.appendChild(avatarElem);

          const content = document.createElement("div");
          content.style.flex = "1";

          content.appendChild(line);

          wrapper.appendChild(content);

          historyContainer.appendChild(wrapper);
        });

        loadedCount++;
        progressElem.textContent = (cfg.progressTemplate?.value || "Загружено {loaded} / {total} друзей...").replace("{loaded}", loadedCount).replace("{total}", friends.length);
        if (signal.aborted) return;
        await delay(config.FriendsHistory.settings.delay.value);

      } catch (err) {
        console.error(`[ShikiUtils] FriendsHistory: ${friend.nickname}:`, err);
      }
    }

    progressElem.textContent = (cfg.doneTemplate?.value || "Загрузка завершена. Загружено {loaded} / {total}").replace("{loaded}", loadedCount).replace("{total}", friends.length);
  }

  //* %=================== Shiki Rating ====================%
  function ShikiScore() {
    const cfg = config.ShikiScore.settings;

    const statsEl = document.querySelector("#rates_scores_stats");
    if (!statsEl) return;

    let stats;
    try {
      stats = JSON.parse(statsEl.dataset.stats);
    } catch (err) {
      console.error("[ShikiUtils] rates_scores_stats err:", err);
      return;
    }
    if (!Array.isArray(stats) || stats.length === 0) return;

    let total = 0, sum = 0;
    const scoreCounts = {};

    for (const [s, c] of stats) {
      const score = +s, count = +c;
      if (!isNaN(score) && !isNaN(count)) {
        total += count;
        sum += score * count;
        scoreCounts[`score${score}`] = count;
      }
    }
    if (!total) return;

    const safePars = el =>
      el ? parseInt(el.textContent.replace(/\D+/g, ""), 10) || 0 : 0;

    const statusesEl = document.querySelector("#rates_statuses_stats");
    let completed = 0, planned = 0, watching = 0, dropped = 0, on_hold = 0, totalListed = 0;
    if (statusesEl) {
      try {
        const st = JSON.parse(statusesEl.dataset.stats);
        for (const [status, count] of st) {
          switch (status) {
            case "completed": completed = +count; break;
            case "planned": planned = +count; break;
            case "watching": watching = +count; break;
            case "dropped": dropped = +count; break;
            case "on_hold": on_hold = +count; break;
          }
        }
        totalListed = completed + planned + watching + dropped + on_hold;
      } catch (err) {
        console.warn("[ShikiUtils] rates_statuses_stats err:", err);
      }
    }

    if (cfg.showTotalRates?.value) {
      const statsEl = document.querySelector("#rates_scores_stats");
      if (statsEl && !statsEl.querySelector('[data-shiki-total="true"]')) {
        const totalEl = document.createElement("div");
        totalEl.dataset.shikiTotal = "true";
        totalEl.className = "total-rates";
        totalEl.textContent = `Всего оценок: ${total}`;
        setTimeout(() => statsEl.appendChild(totalEl), 1000);
      }
    }

    const favourites = safePars(document.querySelector(".b-favoured .count"));
    const reviewsNav = document.querySelector(".b-reviews_navigation, .navigation-container");
    let reviewsAll = 0, reviewsPos = 0, reviewsNeu = 0, reviewsNeg = 0;
    if (reviewsNav) {
      reviewsAll = safePars(reviewsNav.querySelector(".navigation-node-all .count"));
      reviewsPos = safePars(reviewsNav.querySelector(".navigation-node-positive .count"));
      reviewsNeu = safePars(reviewsNav.querySelector(".navigation-node-neutral .count"));
      reviewsNeg = safePars(reviewsNav.querySelector(".navigation-node-negative .count"));
    }

    const comments = safePars(document.querySelector(IS_RU ? '.subheadline a[title="Все комментарии"] .count' : '.subheadline a[title="All comments"] .count'));

    if (cfg.debug?.value) {
      console.group("[ShikiScore Debug]");
      console.log({ sum, total, completed, planned, watching, dropped, on_hold, totalListed, favourites, reviewsAll, reviewsPos, reviewsNeu, reviewsNeg, comments });
      console.groupCollapsed("scoreCounts");
      console.log(scoreCounts);
      console.groupEnd();
      console.log("Formula:", cfg.customFormula?.value);
      console.groupEnd();
    }

    let avg = null;
    try {
      if (cfg.customFormula?.value?.trim()) {
        const fn = new Function(
          "sum", "total",
          "completed", "planned", "watching", "dropped", "on_hold", "totalListed",
          "favourites",
          "reviewsAll", "reviewsPos", "reviewsNeu", "reviewsNeg",
          "comments",
          "scores",
          "return " + cfg.customFormula?.value
        );
        avg = Number(
          fn(
            sum, total,
            completed, planned, watching, dropped, on_hold, totalListed,
            favourites,
            reviewsAll, reviewsPos, reviewsNeu, reviewsNeg,
            comments,
            scoreCounts
          )
        );
        if (isNaN(avg)) throw new Error("NaN");
        avg = +avg.toFixed(2);
      } else {
        avg = +(sum / total).toFixed(2);
      }
    } catch (err) {
      console.error("[ShikiUtils] oшибка в формуле:", err);
      avg = "N/A";
    }

    const scoreBlock = document.querySelector(".scores");
    if (!scoreBlock) return;

    scoreBlock.querySelector(".score.MAL-label")?.remove();
    if (cfg.originalLabel?.value?.trim()) {
      const orig = scoreBlock.querySelector(".b-rate");
      if (orig) {
        const label = document.createElement("p");
        label.className = "score MAL-label";
        label.style = cfg.originalScoreStyles?.value;
        label.textContent = cfg.originalLabel?.value;
        orig.insertAdjacentElement("afterend", label);
      }
    }
    if (cfg.showShikiScore?.value) {
      const notice = avg === "N/A" ? "Ошибка в формуле" : scoreText(avg);
      const scoreClass = avg === "N/A" ? "score-error" : `score-${Math.round(avg)}`;
      const ShimoriDisplayMode = cfg.ShimoriDisplayMode?.value;

      if (ShimoriDisplayMode === "stars") {
        scoreBlock.querySelector(".b-rate.shiki-average-score")?.remove();
        scoreBlock.querySelector(".score.shiki-label")?.remove();

        const customRate = document.createElement("div");
        customRate.className = "b-rate shiki-average-score";
        customRate.innerHTML = `
        <div class="stars-container">
          <div class="hoverable-trigger"></div>
          <div class="stars score ${scoreClass}"></div>
          <div class="stars hover"></div>
          <div class="stars background"></div>
        </div>
        <div class="text-score">
          <div class="score-value ${scoreClass}">${avg}</div>
          <div class="score-notice">${notice}</div>
        </div>
      `;
        const customLabel = document.createElement("p");
        customLabel.className = "score shiki-label";
        customLabel.style = cfg.originalScoreStyles?.value;
        customLabel.textContent = cfg.customFormulaLabel?.value;

        scoreBlock.append(customRate);
        scoreBlock.append(customLabel);
      } else if (ShimoriDisplayMode === "headline") {
        const subheadlines = document.querySelectorAll(".block .subheadline");
        let targetSubheadline = null;
        const scoresWord = IS_RU ? "Оценки людей" : "Scores";
        for (const el of subheadlines) {
          if (el.textContent.trim().includes(scoresWord)) {
            targetSubheadline = el;
            break;
          }
        }
        if (!targetSubheadline) return;
        if (targetSubheadline.querySelector('[data-shiki-score="true"]')) return;

        const span = document.createElement("span");
        span.className = "shiki-headline-score";
        span.dataset.shikiScore = "true";
        span.style = cfg.headlineScoreStyles?.value;
        span.textContent = avg === "N/A" ? " | N/A" : ` | ${avg}`;
        targetSubheadline.appendChild(span);
      }
    }
    if (cfg.showAniListScore?.value) {
      const originalTitle = getOriginalTitle();
      if (!originalTitle) return;

      const cacheKey = `ShikiUtils_AniList_${originalTitle}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        applyAniListScore(JSON.parse(cached), cfg, scoreBlock);
      } else {
        const path = window.location.pathname;
        let mediaType = "ANIME";
        let sourceFilter = "";

        if (path.includes("/mangas/")) {
          mediaType = "MANGA";
        } else if (path.includes("/ranobe/")) {
          mediaType = "MANGA";
          sourceFilter = 'source_in: [LIGHT_NOVEL],';
        }

        const query = `
    query ($search: String) {
      Media(search: $search, type: ${mediaType}, ${sourceFilter}) {
        averageScore
      }
    }`;
        const variables = { search: originalTitle };

        fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables })
        })
          .then(res => res.json())
          .then(data => {
            const aniScore = data?.data?.Media?.averageScore;
            if (!aniScore) return;
            sessionStorage.setItem(cacheKey, JSON.stringify({ averageScore: aniScore }));
            applyAniListScore({ averageScore: aniScore }, cfg, scoreBlock);
          })
          .catch(err => console.error("[ShikiUtils] anilist fetch err:", err));
      }
    }

    function applyAniListScore({ averageScore }, cfg, scoreBlock) {
      let scoreVal;
      try {
        if (cfg.AniListCustomFormula?.value?.trim()) {
          const fn = new Function("averageScore", "return " + cfg.AniListCustomFormula.value);
          scoreVal = Number(fn(averageScore));
          scoreVal = +scoreVal.toFixed(2);
        } else {
          scoreVal = +(averageScore / 10).toFixed(2);
        }
      } catch (err) {
        console.error("[ShikiUtils] Ошибка в формуле AniList:", err);
        scoreVal = "N/A";
      }

      const scoreClass = scoreVal === "N/A" ? "score-error" : `score-${Math.round(scoreVal)}`;
      const labelText = cfg.AniListCustomFormulaLabel?.value || "Оценка AniList";

      if (cfg.AniListDisplayMode?.value === "stars") {
        scoreBlock.querySelector(".b-rate.anilist-average-score")?.remove();
        scoreBlock.querySelector(".score.anilist-label")?.remove();

        const aniRate = document.createElement("div");
        aniRate.className = "b-rate anilist-average-score";
        aniRate.innerHTML = `
      <div class="stars-container">
        <div class="hoverable-trigger"></div>
        <div class="stars score ${scoreClass}"></div>
        <div class="stars hover"></div>
        <div class="stars background"></div>
      </div>
      <div class="text-score">
        <div class="score-value ${scoreClass}">${scoreVal}</div>
        <div class="score-notice">${scoreVal === "N/A" ? "Ошибка в формуле" : scoreText(scoreVal)}</div>
      </div>
    `;

        const aniLabel = document.createElement("p");
        aniLabel.className = "score anilist-label";
        aniLabel.style = cfg.originalScoreStyles?.value;
        aniLabel.textContent = labelText;

        scoreBlock.append(aniRate);
        scoreBlock.append(aniLabel);
      } else {
        const subheadlines = document.querySelectorAll(".block .subheadline");
        let targetSubheadline = null;
        const scoresWord = IS_RU ? "Оценки людей" : "Scores";
        for (const el of subheadlines) {
          if (el.textContent.trim().includes(scoresWord)) {
            targetSubheadline = el;
            break;
          }
        }
        if (!targetSubheadline) return;
        if (targetSubheadline.querySelector('[data-anilist-score="true"]')) return;

        const span = document.createElement("span");
        span.className = "anilist-headline-score";
        span.dataset.anilistScore = "true";
        span.style = cfg.headlineScoreStyles?.value;
        span.textContent = ` | ${scoreVal}`;
        targetSubheadline.appendChild(span);
      }
    }

  }
  function scoreText(score) {
    const cfg = config.ShikiScore.settings;
    const labels = cfg.scoreLabels?.value
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (!labels || labels.length < 10) {
      const defaults = ["Хуже некуда", "Ужасно", "Очень плохо", "Плохо", "Более-менее", "Нормально", "Хорошо", "Отлично", "Великолепно", "Эпик вин!"];
      return defaults[Math.min(Math.floor(score), 10) - 1] || defaults[9];
    }

    return labels[Math.min(Math.floor(score), 10) - 1] || labels[9];
  }

  //* %=================== Auto Spoiler ====================%
  function autoSpoilerComment(comment) {
    const mode = config.autoSpoiler.settings.mode.value;
    const body = comment.querySelector('.body');
    if (!body) return;

    function makeSpoiler(images) {
      const spoilerDiv = document.createElement('div');
      spoilerDiv.className = 'b-spoiler_block';
      spoilerDiv.dataset.dynamic = 'spoiler_block';
      const spoilerText = document.createElement('span');
      spoilerText.tabIndex = 0;
      spoilerText.textContent = config.autoSpoiler.settings.template.value;
      spoilerText.addEventListener('click', () => spoilerDiv.classList.toggle('is-opened'));
      const imagesContainer = document.createElement('div');
      images.forEach((img) => imagesContainer.appendChild(img));
      spoilerDiv.append(spoilerText, imagesContainer);
      return spoilerDiv;
    }

    let images = [];
    Array.from(body.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('b-image')) {
        const img = node.querySelector('img');
        if (!img) return;
        if (mode === 'blur') {
          img.classList.add('b-blur', 'is-moderation_censored');
        } else {
          images.push(node);
        }
      } else if (images.length > 0 && mode === 'spoiler') {
        body.insertBefore(makeSpoiler(images), node);
        images = [];
      }
    });
    if (images.length > 0 && mode === 'spoiler') {
      body.appendChild(makeSpoiler(images));
    }
  }
  function autoSpoiler() {
    document.querySelectorAll('.b-comment').forEach(autoSpoilerComment);
  }

  //* %=================== remove Blur ====================%
  function processRemoveBlur(img) {
    const cfg = config.removeBlur.settings;

    if (cfg.hoverOnly?.value) {
      img.addEventListener("mouseenter", () => {
        img.classList.remove("is-moderation_censored");
      });

      img.addEventListener("mouseleave", () => {
        img.classList.add("is-moderation_censored");
      });
    } else {
      img.classList.remove("is-moderation_censored");
    }
  }

  function removeBlur() {
    document.querySelectorAll('img.is-moderation_censored')
      .forEach(processRemoveBlur);
  }

  //* %=================== NoAge Limits ====================%
  function NoAgeLimits() {
    const birthSelect = document.querySelector(".c-column.block_m .block select#user_birth_on_1i");
    if (!birthSelect) return;
    const selectedYear = birthSelect.value;
    let maxYear = 0;
    let minYear = Infinity;
    birthSelect.querySelectorAll("option").forEach((option) => {
      const year = parseInt(option.value, 10);
      if (!isNaN(year)) {
        if (year > maxYear) maxYear = year;
        if (year < minYear) minYear = year;
      }
    });

    birthSelect.innerHTML = "";

    for (let year = maxYear; year >= 1; year--) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      if (year == selectedYear) {
        option.selected = true;
      }
      birthSelect.appendChild(option);
    }
  }

  //* %=================== Сomments Loader ====================%
  function commentsLoader() {
    const loaders = document.querySelectorAll(".comments-loader");
    const cfg = config.commentsLoader.settings;
    if (!loaders.length) return;

    const storageKey = "comments-loader-count";
    const savedValue = parseInt(localStorage.getItem(storageKey)) || 20;

    loaders.forEach((loader) => {
      if (loader.dataset.inputDisabled === "true") return;
      if (loader.querySelector("input.comments-loader-input")) return;

      const text = loader.textContent.trim();
      const ruMatch = text.match(/Загрузить ещё\s+(\d+)\s+из\s+(\d+)/);
      const enMatch = text.match(/Load next\s+(\d+)\s+of\s+(\d+)/);
      const match = ruMatch || enMatch;
      if (!match) return;

      const totalCount = match[2];

      const input = document.createElement("input");
      input.type = "number";
      input.min = 1;
      input.value = savedValue;
      input.style.cssText = cfg.inputStyles?.value;
      input.classList.add("comments-loader-input");

      loader.textContent = "";
      const beforeText = document.createElement("span");
      const afterText = document.createElement("span");
      if (IS_RU) {
        beforeText.textContent = "Загрузить ещё ";
        afterText.textContent = ` из ${totalCount} комментариев`;
      } else {
        beforeText.textContent = "Load next ";
        afterText.textContent = ` of ${totalCount} comments`;
      }

      loader.appendChild(beforeText);
      loader.appendChild(input);
      loader.appendChild(afterText);

      input.addEventListener("click", (e) => e.stopPropagation());
      input.addEventListener("keydown", (e) => e.stopPropagation());

      const updateUrl = (value) => {
        const url = loader.getAttribute("data-clickloaded-url-template"); //?
        if (!url) return;
        const newUrl = url.replace(/SKIP\/\d+/, `SKIP/${value}`);
        loader.setAttribute("data-clickloaded-url-template", newUrl);
        loader.setAttribute("data-limit", value);
      };

      updateUrl(savedValue);

      input.addEventListener("change", () => {
        const val = parseInt(input.value);
        if (isNaN(val) || val <= 0) return;
        localStorage.setItem(storageKey, val);
        updateUrl(val);
      });

      loader.addEventListener("click", () => {
        if (input.parentNode) input.remove();
        loader.dataset.inputDisabled = "true";
      });
    });
  }

  //* %=================== PGPModule ====================%
  function PGPModule() {
    const cfg = config.PGPModule.settings;

    async function readKey(armored, type = "public") {
      if (!armored?.trim()) throw new Error(`Empty ${type} key`);
      return type === "public" ? await openpgp.readKey({ armoredKey: armored }) : await openpgp.readPrivateKey({ armoredKey: armored });
    }

    async function encryptMessage(plaintext, keysArmoredArray) {
      if (!plaintext) throw new Error("Empty plaintext");
      if (!keysArmoredArray?.length) throw new Error("No keys provided");

      const pubKeys = await Promise.all(keysArmoredArray.map(k => readKey(k, "public")));
      const message = await openpgp.createMessage({ text: plaintext });
      return await openpgp.encrypt({ message, encryptionKeys: pubKeys, format: "armored" });
    }

    async function decryptMessage(armoredMessage, armoredPriv, passphrase) {
      if (!armoredMessage.includes("-----BEGIN PGP MESSAGE-----")) { throw new Error("No PGP block"); }

      let privKey = await readKey(armoredPriv, "private");
      if (!privKey.isDecrypted() && passphrase) {
        privKey = await openpgp.decryptKey({ privateKey: privKey, passphrase });
      }

      const message = await openpgp.readMessage({ armoredMessage });
      const { data } = await openpgp.decrypt({ message, decryptionKeys: privKey });
      return data;
    }

    function getEncryptionKeys() {
      if (cfg.SharedMode?.value) return [SHARED_KEYS.pub];
      const recipients = cfg.PubKeyRecipient?.value || [];
      let keys = recipients.map(r => r.key);
      if (cfg.EncryptForMyself?.value && cfg.PubKeySelf?.value?.trim()) {
        keys.push(cfg.PubKeySelf.value.trim());
      }
      return keys;
    }

    function submitInterceptor() {
      const btn = document.querySelector('input[type="submit"].btn-submit, button.btn-submit');
      if (!btn || btn.dataset.pgpIntercept) return;
      btn.dataset.pgpIntercept = "true";

      let processing = false;
      let skipNext = false;

      btn.addEventListener("click", async (e) => {
        try {
          if (skipNext) { skipNext = false; return; }
          if (processing) { e.preventDefault(); e.stopImmediatePropagation(); return; }
          if (!cfg.AutoEncryptOnType?.value) return;

          const plain = Editor.getText();
          if (!plain) return;

          const keys = getEncryptionKeys();
          if (!keys.length) return;

          e.preventDefault();
          e.stopImmediatePropagation();
          processing = true;

          let armored;
          try { armored = await encryptMessage(plain, keys); }
          catch (err) { console.error(err); alert("Ошибка шифрования"); processing = false; return; }

          const hidden = document.querySelector('input[name="comment[body]"], input[name="message[body]"]');
          if (!hidden) return;
          hidden.value = armored;
          Editor.insert(armored, Editor.getState())

          skipNext = true;
          setTimeout(() => {
            try { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); }
            catch { btn.click(); }
            finally { setTimeout(() => { processing = false; }, 1000); }
          }, 8);

        } catch (err) {
          console.error(err);
          processing = false;
          skipNext = false;
        }
      }, true);
    }

    function addEncryptButton() {
      if (cfg.AutoEncryptOnType?.value) return;

      const createButton = () => {
        const btn = document.createElement("button");
        btn.id = "encrypt-btn";
        btn.type = "button";
        btn.classList.add("icon", "icon-pgp-encrypt");
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" style="fill:currentColor;">
        <path d="M12 1C9.24 1 7 3.24 7 6V10H6C4.9 10 4 10.9 4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12C20 10.9 19.1 10 18 10H17V6C17 3.24 14.76 1 12 1M12 3C13.66 3 15 4.34 15 6V10H9V6C9 4.34 10.34 3 12 3Z"/>
      </svg>`;

        btn.style.cssText = cfg.encryptBtnStyles?.value;
        btn.style.color = "var(--link-color)";
        btn.style.transition = "color .15s ease";

        btn.addEventListener("mouseenter", () => btn.style.color = 'var(--link-hover-color)');
        btn.addEventListener("mouseleave", () => btn.style.color = 'var(--link-color)');

        btn.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();

          const state = Editor.getState();
          const hasSelection = state.type === "textarea" ? state.el.selectionStart !== state.el.selectionEnd : window.getSelection()?.toString().trim().length > 0;

          if (!state.text.trim()) return;

          let textToEncrypt = "";
          if (state.type === "textarea") {
            const ta = state.el;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            textToEncrypt = start !== end ? ta.value.slice(start, end) : ta.value;
          } else if (state.type === "prosemirror") {
            const sel = window.getSelection();
            textToEncrypt = sel && sel.toString().trim() ? sel.toString() : state.text;
          }

          if (!textToEncrypt.trim()) return;

          const keys = getEncryptionKeys();
          if (!keys.length) { alert("нет получателей для шифрования"); return; }

          let armored;
          try { armored = await encryptMessage(textToEncrypt, keys); }
          catch (err) { console.error(err); alert("ошибка шифрования"); return; }
          if (!hasSelection) Editor.clear(state);
          Editor.insert(armored, state)
        });

        return btn;
      };

      const tryAddButton = () => {
        const menu = document.querySelector(".menu_group-block");
        if (menu && !menu.querySelector("#encrypt-btn")) { menu.appendChild(createButton()); return true; }
        return false;
      };

      if (tryAddButton()) return;

      const observer = new MutationObserver((mut, obs) => { if (tryAddButton()) obs.disconnect(); });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    async function decryptAllComments() {
      const priv = cfg.SharedMode?.value ? SHARED_KEYS.priv : cfg.PrivKeySelf?.value?.trim();
      if (!priv) return;
      const pass = cfg.KeyPassphrase?.value;

      const bodies = Array.from(document.querySelectorAll('.b-comment .body, .body[itemprop="text"], .b-message .body'));

      for (const body of bodies) {
        if (body.dataset.pgpAttempted) continue;
        body.dataset.pgpAttempted = "1";

        let decryptedAny = false;

        async function processNode(node) {
          if (!node) return;

          if (node.nodeType === Node.TEXT_NODE) {
            return;
          }

          const children = Array.from(node.childNodes);
          let buffer = [];
          let insidePGP = false;

          for (const child of children) {
            const text = child.textContent || "";

            if (text.includes("-----BEGIN PGP MESSAGE-----")) insidePGP = true;

            if (insidePGP) buffer.push(child);

            if (text.includes("-----END PGP MESSAGE-----")) {
              const pgpText = buffer.map(n => {
                if (n.nodeName === "BR") return "\n";
                return n.textContent;
              }).join("");

              try {
                const plain = await decryptMessage(pgpText, priv, pass);
                const parent = buffer[0].parentNode;
                const firstNode = buffer[0];

                const wrapper = document.createElement("span");
                wrapper.innerHTML = linkify(plain.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                parent.insertBefore(wrapper, firstNode);
                for (const n of buffer) parent.removeChild(n);

                decryptedAny = true;
              } catch {
                node.dataset.pgpDecryptFailed = "1";
              }

              buffer = [];
              insidePGP = false;
            }

            if (child.nodeType === Node.ELEMENT_NODE) {
              await processNode(child);
            }
          }
        }

        await processNode(body);

        if (decryptedAny) {
          const mark = document.createElement("div");
          Object.assign(mark.style, { fontSize: "12px", opacity: "0.65", marginBottom: "4px" }); //todo v cfg
          mark.textContent = "[PGP: расшифровано]";
          body.prepend(mark);
        }
      }
    }



    function observeComments() {//обсервер даувай галубцы даувай
      const observer = new MutationObserver(() => decryptAllComments());
      observer.observe(document.body, { childList: true, subtree: true });
    }

    submitInterceptor();
    decryptAllComments();
    observeComments();
    addEncryptButton();
  }

  //* %=================== pollsHelper ====================%
  function pollsHelper() {
    try {
      const script = document.querySelector('#js_export');
      if (!script) return;

      const txt = script.textContent
        .replace(/^window\.JS_EXPORTS\s*=\s*/, '')
        .trim()
        .replace(/;$/, '');

      const data = new Function(`"use strict"; return (${txt})`)();
      if (!data?.polls) return;

      const polls = data.polls;

      document.querySelectorAll('.b-poll.is-limited').forEach(pollBlock => {
        const nameEl = pollBlock.querySelector('.poll .name');
        if (!nameEl) return;

        const baseName = nameEl.textContent.replace(/\(ID:.*?\)/, '').trim();
        const poll = polls.find(p => p.name.trim() === baseName);
        if (!poll) return;

        if (!nameEl.dataset.idAdded) {
          nameEl.dataset.idAdded = "true";
          nameEl.textContent = `${baseName} (ID: ${poll.id})`;
        }

        pollBlock.querySelectorAll('.poll-variant .radio-label').forEach(labelEl => {
          if (labelEl.dataset.votesAdded) return;

          const text = labelEl.textContent.trim();
          const variant = poll.variants.find(v => v.label.trim() === text);
          if (!variant) return;

          labelEl.dataset.votesAdded = "true";
          labelEl.textContent = `${text} (${variant.votes_total})`;
        });
      });

    } catch (err) {
      console.error("[ShikiUtils-pollsHelper]", err);

    }
  }

  //* %=================== showTopicId ====================%
  function showTopicId() {
    document.querySelectorAll('[data-faye]').forEach(topicEl => {
      const faye = topicEl.getAttribute('data-faye');
      const match = faye && faye.match(/topic-(\d+)/);
      if (!match) return;

      const topicId = match[1];
      const container = topicEl.closest('.l-content') || topicEl.closest('article.b-topic')
      if (!container) return;

      container.querySelectorAll('.subheadline').forEach(subheadline => {
        if (subheadline.dataset.shikiTopicId === "true") return;
        const commentsWord = IS_RU ? "Комментарии" : "Comments";
        const link = subheadline.querySelector('a');
        if (link) {
          const textNode = [...link.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
          if (!textNode) return;

          const text = textNode.textContent.trim();
          if (!text.includes(commentsWord)) return;

          textNode.textContent = `${text} (topic:${topicId}) `;
          subheadline.dataset.shikiTopicId = "true";
          return;
        }
        const text = subheadline.textContent.trim();
        if (!text.includes(commentsWord)) return;

        subheadline.textContent = `${text} (topic:${topicId})`;
        subheadline.dataset.shikiTopicId = "true";
      });
    });
  }

  //* %=================== DUBlinks ====================%
  async function DUBlinks() {
    const cfg = config.DUBlinks;
    const linksUrl = cfg.settings.linksUrl?.value;
    const DUB_LINKS_CACHE_KEY = "DubLinksCache";
    const DUB_LINKS_CACHE_TIME_KEY = "DubLinksCacheTime";
    const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 часа

    let DUB_LINKS = {};

    async function loadDubLinks() {
      try {
        const now = Date.now();
        const lastUpdate = parseInt(localStorage.getItem(DUB_LINKS_CACHE_TIME_KEY) || "0", 10);
        const cached = localStorage.getItem(DUB_LINKS_CACHE_KEY);

        if (cached && now - lastUpdate < UPDATE_INTERVAL) {
          DUB_LINKS = JSON.parse(cached);
          return;
        }

        const resp = await fetch(linksUrl, { cache: "no-store" });
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const data = await resp.json();
        if (data && typeof data === "object") {
          DUB_LINKS = data;
          localStorage.setItem(DUB_LINKS_CACHE_KEY, JSON.stringify(DUB_LINKS));
          localStorage.setItem(DUB_LINKS_CACHE_TIME_KEY, now.toString());
        }
      } catch (err) {
        console.error("[DUBlinks] loadDubLinks:", err);
      }
    }

    function insertLinks() {
      const aside = document.querySelector('aside.l-menu');
      if (!aside) return;
      if (aside.dataset.dublinksProcessed) return;
      aside.dataset.dublinksProcessed = "true";
      const blocks = aside.querySelectorAll('.block');

      blocks.forEach(block => {
        const title = block.querySelector('.subheadline');
        if (!title) return;

        const dubbingWord = IS_RU ? "Озвучка" : "Dubbing";
        const subsWord = IS_RU ? "Субтитры" : "Subtitles";

        const type = title.textContent.trim();
        if (type !== dubbingWord && type !== subsWord) return;

        const items = block.querySelectorAll('.b-menu-line');

        items.forEach(item => {
          const names = item.textContent.split('&').map(n => n.trim());
          item.textContent = '';

          names.forEach((name, index) => {
            const url = DUB_LINKS[name];
            if (!url) {
              const span = document.createElement('span');
              span.textContent = name;
              item.appendChild(span);
            } else {
              const link = document.createElement('a');
              link.href = url;
              link.textContent = name;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              link.style.color = 'var(--link-color)';
              link.style.cursor = 'pointer';

              link.addEventListener('mouseenter', () => {
                link.style.color = 'var(--link-hover-color)';
              });
              link.addEventListener('mouseleave', () => {
                link.style.color = 'var(--link-color)';
              });

              item.appendChild(link);
            }

            if (index < names.length - 1) {
              item.appendChild(document.createTextNode(' & '));
            }
          });
        });
      });
    }
    await loadDubLinks();
    insertLinks();
  }

  //! %=================== GUI ===================%
  function createGUI() {
    const settingsBlock = document.querySelector(".block.edit-page.misc");
    if (!settingsBlock || settingsBlock.querySelector(".ShikiUtils-settings")) {
      return;
    }

    const gui = document.createElement("div");
    gui.className = "ShikiUtils-settings";
    gui.innerHTML = `<h3 class="ShikiUtils-title">ShikiUtils CFG</h3>`;

    const searchOverlay = document.createElement("div");
    searchOverlay.className = "shikiutils-search-overlay";
    searchOverlay.style.display = "none";
    document.body.appendChild(searchOverlay);

    let searchQuery = "";
    let searchHighlightTimeout = null;
    let searchClearTimeout = null;

    function runSearch() {
      gui.querySelectorAll(".func-block.search-highlight").forEach(el => {
        el.classList.remove("search-highlight");
      });
      clearTimeout(searchHighlightTimeout);
      clearTimeout(searchClearTimeout);

      searchOverlay.textContent = searchQuery ? searchQuery : "";

      if (!searchQuery) {
        searchOverlay.style.display = "none";
        return;
      }

      searchOverlay.style.display = "block";

      const q = searchQuery.toLowerCase();
      const matched = [];
      gui.querySelectorAll(".func-block").forEach(block => {
        const name = block.querySelector(".func-name")?.textContent.toLowerCase() || "";
        const desc = block.querySelector(".func-description")?.textContent.toLowerCase() || "";
        if (name.includes(q) || desc.includes(q)) matched.push(block);
      });

      if (matched.length) {
        matched.forEach(el => el.classList.add("search-highlight"));
        matched[0].scrollIntoView({ behavior: "smooth", block: "center" });
        searchHighlightTimeout = setTimeout(() => {
          matched.forEach(el => el.classList.remove("search-highlight"));
        }, 2000);
      }

      searchClearTimeout = setTimeout(() => {
        searchQuery = "";
        searchOverlay.style.display = "none";
      }, 3000);
    }

    document.addEventListener("keydown", (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!document.body.contains(gui)) return;

      if (e.key === "Escape") {
        searchQuery = "";
        runSearch();
        e.stopPropagation();
        return;
      }
      if (e.key === "Backspace") {
        if (!searchQuery) return;
        searchQuery = searchQuery.slice(0, -1);
        runSearch();
        e.stopPropagation();
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        searchQuery += e.key;
        runSearch();
        e.stopPropagation();
      }
    });

    gui.addEventListener("input", (e) => {
      if (e.target.classList.contains("css-textarea")) {
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
      }
    });
    const guiFrag = document.createDocumentFragment();

    Object.keys(defaultConfig).forEach((key) => {
      const defFunc = defaultConfig[key];
      const funcConfig = config[key] || {};

      if (defFunc.type === "category") {
        const catLabel = document.createElement("div");
        catLabel.className = "category-label category-collapsible";
        catLabel.dataset.collapsed = "false";
        catLabel.innerHTML = defFunc.name;
        catLabel.style.cursor = "pointer";
        catLabel.addEventListener("click", () => {
          const collapsed = catLabel.dataset.collapsed === "true";
          catLabel.dataset.collapsed = collapsed ? "false" : "true";
          let next = catLabel.nextElementSibling;
          while (next && !next.classList.contains("category-label")) {
            if (next.classList.contains("func-block")) {
              next.style.display = collapsed ? "" : "none";
            }
            next = next.nextElementSibling;
          }
        });
        guiFrag.appendChild(catLabel);
        return;
      }

      const hasSettings = funcConfig.settings && Object.keys(funcConfig.settings).length > 0;
      const wrapper = document.createElement("div");

      wrapper.className = "func-block";
      wrapper.innerHTML = `
      <div class="func-header" data-func="${key}">
        <div class="func-header-left">
          ${hasSettings ? `<span class="arrow" data-func="${key}"></span>` :
          `<span class="no-arrow"></span>`}
          <div>
            <span class="func-name">${defFunc.title || key}</span>
            <div class="func-description">${defFunc.description || ""}</div>
          </div>
        </div>
        <div class="func-controls">
          <button class="reset-btn" data-func="${key}" title="Сбросить настройки">↺</button>
          <label class="switch">
            <input type="checkbox" ${funcConfig.enabled ? "checked" : ""} data-func="${key}">
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div class="settings-content" data-func="${key}"></div>
     `;
      guiFrag.appendChild(wrapper);

      const settingsContainer = wrapper.querySelector(".settings-content");
      if (!hasSettings) {
        settingsContainer.remove();
        return;
      }

      const settingCategories = {};
      Object.entries(defFunc.settings || {}).forEach(([sKey, sData]) => {
        const cat = sData.category || "General";
        if (!settingCategories[cat]) settingCategories[cat] = [];
        settingCategories[cat].push([sKey, sData]);
      });

      Object.entries(settingCategories).forEach(([catName, settingsList]) => {

        const catFrag = document.createDocumentFragment();
        const settingsWrapper = document.createElement("div");
        settingsWrapper.className = "sub-category-content";

        const subCat = document.createElement("div");
        subCat.className = "sub-category-label sub-category-collapsible";
        subCat.dataset.collapsed = "false";
        subCat.innerHTML = `<span class="cat-arrow"></span>${catName}`;
        subCat.style.cursor = "pointer";
        subCat.addEventListener("click", () => {
          const collapsed = subCat.dataset.collapsed === "true";
          subCat.dataset.collapsed = collapsed ? "false" : "true";
          settingsWrapper.style.display = collapsed ? "" : "none";
        });
        catFrag.appendChild(subCat);
        catFrag.appendChild(settingsWrapper);

        let prevInlineRow = null;

        settingsList.forEach(([sKey, sData]) => {
          const savedData = funcConfig.settings?.[sKey] || sData;
          const type = sData.type || "text";

          const label = document.createElement("label");
          label.textContent = sData.title || sKey;
          if (sData.description) label.title = sData.description;

          let input;

          switch (type) {
            case "button":
              input = document.createElement("button");
              input.textContent = savedData.value || "Нажать";
              input.className = "gui-btn";

              if (key === "PGPModule" && sKey === "GenerateKeysBtn") {
                const cfg = config.PGPModule.settings;
                input.addEventListener("click", async () => {
                  try {
                    const name = prompt("Имя для ключа:", "ShikiUtils") || "ShikiUtils";
                    const email = prompt("Email:", "Shiki@Utils") || "Shiki@Utils";
                    const pass = prompt("Passphrase (необязательно):", "") || "";

                    input.textContent = "Генерация...";

                    const { publicKey, privateKey } = await generateKeys(name, email, pass);

                    cfg.PubKeySelf.value = publicKey;
                    cfg.PrivKeySelf.value = privateKey;
                    cfg.KeyPassphrase.value = pass;

                    saveConfig();
                    updateDependsVisibility();
                    alert("Ключи сгенерированы.");
                    location.reload();
                  } catch (e) {
                    alert("Ошибка");
                    console.error(e);

                  } finally {
                    input.textContent = savedData.value;
                  }
                });
              }
              break;

            case "color":
              input = document.createElement("input");
              input.type = "text";
              input.value = savedData.value || "#ffffff";
              input.className = "color-square coloris";
              input.dataset.coloris = "";
              input.addEventListener("input", () => {
                if (!config[key].settings) config[key].settings = {};
                if (!config[key].settings[sKey]) config[key].settings[sKey] = {};
                config[key].settings[sKey].value = input.value;
                saveConfig();
                updateDependsVisibility();
              });
              break;

            case "number":
              input = document.createElement("input");
              input.type = "number";
              input.value = savedData.value;
              break;

            case "range":
              input = document.createElement("input");
              input.type = "range";
              input.min = savedData.min ?? 0;
              input.max = savedData.max ?? 2;
              input.step = savedData.step ?? 0.1;
              input.value = savedData.value;
              input.className = "range-slider";
              {
                const valLabel = document.createElement("span");
                valLabel.className = "range-value";
                valLabel.textContent = input.value + "s";
                input.addEventListener("input", () => {
                  valLabel.textContent = input.value + "s";
                  if (!config[key].settings) config[key].settings = {};
                  if (!config[key].settings[sKey]) config[key].settings[sKey] = {};
                  config[key].settings[sKey].value = parseFloat(input.value);
                  saveConfig();
                  updateDependsVisibility();
                });
                const row = document.createElement("div");
                row.className = "setting-row";
                row.appendChild(label);
                row.appendChild(input);
                row.appendChild(valLabel);
                settingsWrapper.appendChild(row);
              }
              return;

            case "css":
              input = document.createElement("textarea");
              input.className = "css-textarea";
              input.value = savedData.value;
              break;

            case "tags":
            case "ids":
              input = document.createElement("div");
              input.className = "tags-container";
              {
                let values = savedData.value ? savedData.value.split(",").map((v) => v.trim()).filter(Boolean) : [];

                const renderTags = () => {
                  input.innerHTML = "";
                  values.forEach((val, idx) => {
                    const tag = document.createElement("span");
                    tag.className = "tag-item";
                    tag.textContent = val;
                    const removeBtn = document.createElement("span");
                    removeBtn.className = "tag-remove";
                    removeBtn.textContent = "×";
                    removeBtn.addEventListener("click", () => {
                      values.splice(idx, 1);
                      updateConfig();
                    });
                    tag.appendChild(removeBtn);
                    input.appendChild(tag);
                  });
                  const newInput = document.createElement("input");
                  newInput.type = "text";
                  newInput.className = "tag-new-input";
                  newInput.placeholder = "Добавить...";
                  newInput.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" && newInput.value.trim()) {
                      values.push(newInput.value.trim());
                      newInput.value = "";
                      updateConfig();
                    }
                  });
                  input.appendChild(newInput);
                };

                const updateConfig = () => {
                  if (!config[key].settings) config[key].settings = {};
                  config[key].settings[sKey] = {
                    ...savedData,
                    value: values.join(","),
                  };
                  saveConfig();
                  updateDependsVisibility();
                  renderTags();
                };

                renderTags();
              }
              break;

            case "mode":
              input = document.createElement("select");
              input.className = "mode-select";
              {
                const options = sData.options || [];
                options.forEach((opt) => {
                  const option = document.createElement("option");
                  option.value = opt;
                  option.textContent = opt;
                  if (savedData.value === opt) option.selected = true;
                  input.appendChild(option);
                });
                input.addEventListener("change", () => {
                  if (!config[key].settings) config[key].settings = {};
                  if (!config[key].settings[sKey]) config[key].settings[sKey] = {};
                  config[key].settings[sKey].value = input.value;
                  saveConfig();
                  updateDependsVisibility();
                });
              }
              break;

            case "boolean":
              input = document.createElement("label");
              input.className = "switch";
              {
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = !!savedData.value;
                const slider = document.createElement("span");
                slider.className = "slider";
                input.appendChild(checkbox);
                input.appendChild(slider);
                checkbox.addEventListener("change", () => {
                  if (!config[key].settings) config[key].settings = {};
                  if (!config[key].settings[sKey]) config[key].settings[sKey] = {};
                  config[key].settings[sKey].value = checkbox.checked;
                  saveConfig();
                  updateDependsVisibility();
                });
              }
              break;
            case "pairs":
              input = document.createElement("div");
              input.className = "pairs-container";

              const pairs = Array.isArray(savedData.value) ? savedData.value : [];
              const savePairs = () => {
                if (!config[key].settings) config[key].settings = {};
                config[key].settings[sKey] = { ...savedData, value: pairs };
                saveConfig();
                updateDependsVisibility();
              };
              const renderPairs = () => {
                input.innerHTML = "";
                pairs.forEach((p, idx) => {
                  const block = document.createElement("div");
                  block.className = "pair-item";

                  const nameInput = document.createElement("input");
                  nameInput.type = "text";
                  nameInput.placeholder = "Имя";
                  nameInput.value = p.user || "";
                  nameInput.addEventListener("input", () => {
                    pairs[idx].user = nameInput.value;
                    savePairs();
                  });

                  const keyInput = document.createElement("textarea");
                  keyInput.placeholder = "Публичный ключ собеседника";
                  keyInput.value = p.key || "";
                  keyInput.className = "pair-key";
                  keyInput.addEventListener("input", () => {
                    pairs[idx].key = keyInput.value;
                    savePairs();
                  });

                  const removeBtn = document.createElement("button");
                  removeBtn.textContent = "X";
                  removeBtn.className = "pair-remove";
                  removeBtn.addEventListener("click", () => {
                    pairs.splice(idx, 1);
                    savePairs();
                    renderPairs();
                  });

                  block.appendChild(nameInput);
                  block.appendChild(keyInput);
                  block.appendChild(removeBtn);
                  input.appendChild(block);
                });

                const addBtn = document.createElement("button");
                addBtn.textContent = "+ Добавить";
                addBtn.className = "pair-add-btn";
                addBtn.addEventListener("click", () => {
                  pairs.push({ user: "", key: "" });
                  savePairs();
                  renderPairs();
                });

                input.appendChild(addBtn);
              };


              renderPairs();
              break;
            default:
              input = document.createElement("input");
              input.type = "text";
              input.value = savedData.value;
          }

          if (input && (input.tagName === "INPUT" || input.tagName === "TEXTAREA")) {
            input.addEventListener("input", () => {
              if (!config[key].settings) config[key].settings = {};
              if (!config[key].settings[sKey]) config[key].settings[sKey] = {};
              if (input.type === "number") {
                const parsed = parseFloat(input.value);
                config[key].settings[sKey].value = isNaN(parsed)
                  ? (defaultConfig[key]?.settings?.[sKey]?.value ?? 0)
                  : parsed;
              } else {
                config[key].settings[sKey].value = input.value;
              }
              saveConfig();
            });
          }

          const blockTypes = ["ids", "tags", "css", "range", "text", "default"];
          const layout = sData.layout || (blockTypes.includes(type) ? "block" : "inline");
          const isInline = sData.inline === true;
          const inlineItem = document.createElement("div");
          inlineItem.className = "inline-item";
          if (layout === "block") {
            inlineItem.appendChild(label);
            inlineItem.appendChild(input);
            inlineItem.classList.add("block-layout");
          } else {
            inlineItem.appendChild(label);
            inlineItem.appendChild(input);
          }
          if (isInline && prevInlineRow) {
            const inlineGroup = prevInlineRow.querySelector(".inline-group");
            inlineGroup.appendChild(inlineItem);
          } else {
            const row = document.createElement("div");
            row.className = "setting-row";
            if (sData.dependsOn) {
              row.dataset.depends = JSON.stringify({
                func: sData.dependsOn.func || key,
                key: sData.dependsOn.key,
                value: sData.dependsOn.value
              });
              row.classList.add("depends-hidden-check");
            }
            const inlineGroup = document.createElement("div");
            inlineGroup.className = "inline-group";
            inlineGroup.appendChild(inlineItem);
            row.appendChild(inlineGroup);
            settingsWrapper.appendChild(row);
            prevInlineRow = isInline ? row : null;
          }
        });
        settingsContainer.appendChild(catFrag);
      });
    });
    gui.appendChild(guiFrag);
    const globalReset = document.createElement("button");
    globalReset.className = "global-reset-btn";
    globalReset.textContent = "Сбросить всё";
    globalReset.addEventListener("click", () => {
      if (!confirm("Вы уверены, что хотите сбросить все настройки?")) return;
      config = structuredClone(defaultConfig);
      saveConfig();
      alert("Все настройки сброшены");
      location.reload();
    });
    const exportBtn = document.createElement("button");
    exportBtn.className = "exportcfg-btn";
    exportBtn.textContent = "Экспорт конфига";
    exportBtn.addEventListener("click", async () => {
      try {
        const raw = localStorage.getItem(CONFIG_KEY) || "{}";
        await navigator.clipboard.writeText(raw);
        const orig = exportBtn.textContent;
        exportBtn.textContent = "Скопировано!";
        setTimeout(() => { exportBtn.textContent = orig; }, 1500);
      } catch (err) {
        console.error("[ShikiUtils] export:", err);
        alert("Не удалось скопировать см. консоль");
      }
    });

    const importBtn = document.createElement("button");
    importBtn.className = "importcfg-btn";
    importBtn.textContent = "Импорт конфига";
    importBtn.addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text?.trim()) return;
        let parsed;
        try {
          parsed = JSON.parse(text);
          if (typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
        } catch {
          alert("Невалидный json");
          return;
        }
        const knownKeys = Object.keys(defaultConfig).filter(k => !isCategoryEntry(defaultConfig[k]));
        const importedKeys = Object.keys(parsed);
        const validKeys = importedKeys.filter(k => knownKeys.includes(k));
        if (validKeys.length === 0) {
          alert("В конфиге ошибка");
          return;
        }
        if (!confirm("Заменить текущий конфиг? текущие настройки будут потеряны")) return;
        localStorage.setItem(CONFIG_KEY, text);
        location.reload();
      } catch (err) {
        console.error("[ShikiUtils] import:", err);
        alert("Не удалось прочитать буфер см. консоль");
      }
    });

    const btnContainer = document.createElement("div");
    btnContainer.className = "ShikiUtils-buttons";
    btnContainer.appendChild(globalReset);
    btnContainer.appendChild(exportBtn);
    btnContainer.appendChild(importBtn);
    gui.appendChild(btnContainer);

    settingsBlock.appendChild(gui);

    if (typeof Coloris !== "undefined") {
      Coloris({
        el: ".coloris",
        theme: "default",
        swatches: ["#ff0000", "#00ff00", "#0000ff"],
      });
    }

    gui.querySelectorAll('.func-header input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const func = e.target.dataset.func;
        config[func].enabled = e.target.checked;
        saveConfig();
        updateDependsVisibility();
      });
    });

    gui.querySelectorAll(".reset-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const func = e.target.dataset.func;
        const funcTitle = defaultConfig[func]?.title || func;
        if (!confirm(`Сбросить настройки для "${funcTitle}"?`)) return;
        if (defaultConfig[func]) {
          config[func] = structuredClone(defaultConfig[func]);
          saveConfig();
          alert(`Настройки "${funcTitle}" сброшены`);
          location.reload();
        }
      });
    });

    gui.querySelectorAll(".func-header").forEach((header) => {
      header.addEventListener("click", (e) => {
        if (
          e.target.tagName === "INPUT" ||
          e.target.classList.contains("slider") ||
          e.target.classList.contains("reset-btn")
        ) {
          return;
        }
        const func = header.dataset.func;
        const content = gui.querySelector(`.settings-content[data-func="${func}"]`);
        const arrow = gui.querySelector(`.arrow[data-func="${func}"]`);
        if (!content) return;
        const isVisible = content.style.display === "block";
        content.style.display = isVisible ? "none" : "block";
        if (!isVisible) {
          content.querySelectorAll(".css-textarea").forEach(ta => {
            ta.style.height = "auto";
            ta.style.height = ta.scrollHeight + "px";
          });
        }
        arrow?.classList.toggle("open", !isVisible);
      });
    });

    function updateDependsVisibility() {
      const items = Array.from(gui.querySelectorAll(".depends-hidden-check")).map(el => ({
        el,
        data: JSON.parse(el.dataset.depends),
      }));
      for (const { el, data } of items) {
        const actual = data.key === "Enabled"
          ? config[data.func]?.enabled
          : config[data.func]?.settings?.[data.key]?.value;
        el.style.display = actual === data.value ? "" : "none";
      }
    }

    updateDependsVisibility();
    const style = document.createElement("style");
    style.textContent = `
:root {
  --bg: rgb(245, 245, 245);
  --panel-bg: rgb(255, 255, 255);
  --accent: rgb(76, 175, 80);
  --button: #eee;
  --accent-hover: rgb(56, 155, 60);
  --text: rgba(0, 0, 0, 0.9);
  --text-muted: rgba(61, 61, 61, 0.7);
  --border: rgb(221, 221, 221);
  --danger: rgb(244, 68, 68);
  --danger-hover: rgb(210, 34, 34);
  --warning: rgb(255, 193, 7);
  --info: rgb(33, 150, 243);
  --info-hover: rgb(26, 134, 212);

  --shadow-light: 0 2px 6px rgba(0, 0, 0, 0.08);
  --shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-heavy: 0 8px 20px rgba(0, 0, 0, 0.15);

  --font-main: "Segoe UI", sans-serif;
  --font-mono: monospace;
  --font-size-base: 14px;
  --font-size-small: 12px;
  --font-size-large: 16px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-full: 50%;

  --transition-fast: 0.15s ease;
  --transition-medium: 0.3s ease;
  --transition-slow: 0.5s ease;

  --gradient-primary: linear-gradient(
    90deg,
    var(--accent),
    var(--accent-hover)
  );
  --gradient-rainbow: linear-gradient(
    90deg,
    red,
    orange,
    yellow,
    green,
    blue,
    indigo,
    violet
  );

  --rainbow-animation: rainbow 5s linear infinite;
}
.ShikiUtils-settings .arrow::after {
  font-family: shikimori;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: "liga";
  text-transform: none;
  letter-spacing: normal;
  content: "";
  font-size: 16px;
  line-height: 20px;
  display: inline-block;
  vertical-align: middle;
  transition: transform 0.2s ease-in-out;
  margin-top: -9px;
}
.ShikiUtils-settings {
  background: var(--bg);
  padding: 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: var(--font-main);
}
.ShikiUtils-settings .arrow.open::after {
  transform: rotate(90deg);
}
@keyframes rainbow {
  0% {
    color: red;
  }
  16% {
    color: orange;
  }
  32% {
    color: yellow;
  }
  48% {
    color: green;
  }
  64% {
    color: blue;
  }
  80% {
    color: indigo;
  }
  100% {
    color: violet;
  }
}

.ShikiUtils-title {
  margin: 0 auto;
  font-size: var(--font-size-large);
  font-weight: 700;
  text-align: center;
  letter-spacing: 1px;
  animation: var(--rainbow-animation);
}

.func-block {
  position: relative;
  border-radius: var(--radius-lg);
  background: var(--panel-bg);
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-light);
  transition:
    transform var(--transition-medium),
    box-shadow var(--transition-medium);
}

.func-header {
  position: relative;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 8px 12px;
  cursor: pointer;
  transition: background var(--transition-medium);
}

.func-header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 180, 255, 0.2);
  opacity: 0;
  transition: opacity var(--transition-medium);
  border-radius: inherit;
  pointer-events: none;
}

.func-header:hover::before {
  opacity: 1;
}

.func-block:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.func-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
}

.func-header-left {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.func-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.reset-btn {
  background: rgb(238, 238, 238);
  border: 1px solid rgb(204, 204, 204);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  width: 26px;
  height: 26px;
  line-height: 18px;
  text-align: center;
  transition: all var(--transition-fast);
}

.reset-btn:hover {
  background: rgb(221, 221, 221);
  transform: scale(1.05);
  box-shadow: var(--shadow-medium);
}

.func-name {
  font-weight: 600;
  color: var(--text);
}
.func-description {
  font-size: var(--font-size-small);
  color: var(--text-muted);
}

.settings-content {
  display: none;
  padding: 8px 12px 12px 24px;
  background: rgb(250, 250, 250);
  border-top: 1px solid rgb(238, 238, 238);
}

.setting-row {
  margin-bottom: 10px;
}

.setting-row label {
  font-size: var(--font-size-small);
  display: block;
  margin-bottom: 4px;
  color: var(--text);
  cursor: help;
}

.setting-row input[type="text"],
.setting-row input[type="number"],
.setting-row input[type="color"],
.setting-row textarea {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid rgb(204, 204, 204);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.css-textarea {
  min-height: 70px;
  resize: vertical;
  white-space: pre;
  overflow: hidden;
}

.setting-row input:focus,
.setting-row textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.3);
  outline: none;
}

.arrow {
  font-size: var(--font-size-small);
  color: var(--text-muted);
  margin-top: 3px;
  transition:
    transform var(--transition-fast),
    color var(--transition-fast);
}
.arrow:hover {
  color: var(--accent);
}

.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 18px;
}
.switch input {
  display: none;
}
.slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgb(187, 187, 187);
  transition: background-color var(--transition-medium);
  border-radius: 18px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: transform var(--transition-medium);
  border-radius: var(--radius-full);
}
input:checked + .slider {
  background-color: var(--accent);
}
input:checked + .slider:before {
  transform: translateX(18px);
}

.global-reset-btn,
.importcfg-btn,
.exportcfg-btn {
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.global-reset-btn {
  background: var(--danger);
}
.global-reset-btn:hover {
  background: var(--danger-hover);
}

.importcfg-btn,
.exportcfg-btn {
  background: var(--info);
}
.importcfg-btn:hover,
.exportcfg-btn:hover {
  background: var(--info-hover);
}

.global-reset-btn:hover,
.importcfg-btn:hover,
.exportcfg-btn:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-medium);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.tag-item {
  background: rgb(238, 238, 238);
  padding: 3px 7px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-small);
  display: flex;
  align-items: center;
  gap: 4px;
}
.tag-remove {
  color: rgb(136, 136, 136);
  font-weight: bold;
  transition: color var(--transition-fast);
}
.tag-remove:hover {
  color: var(--danger);
}
.tag-new-input {
  border: 1px solid rgb(204, 204, 204);
  border-radius: var(--radius-sm);
  padding: 3px 7px;
  font-size: var(--font-size-small);
  min-width: 60px;
}

.color-square {
  width: 32px !important;
  height: 32px !important;
  padding: 0;
  border: 1px solid rgb(170, 170, 170);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.range-slider {
  width: 70%;
  vertical-align: middle;
}
.range-value {
  display: inline-block;
  min-width: 40px;
  text-align: right;
  font-family: var(--font-mono);
  color: rgb(85, 85, 85);
  margin-left: 6px;
}

.category-label {
  text-align: center;
  font-weight: bold;
  color: var(--text-muted);
  margin-top: 12px;
  font-size: var(--font-size-small);
  border-bottom: 1px solid rgb(204, 204, 204);
}
.sub-category-label .cat-arrow::before {
  font-family: shikimori;
  -webkit-font-smoothing: antialiased;
  content: "";
  font-size: 14px;
  line-height: 20px;
  display: inline-block;
  vertical-align: middle;
  transition: transform 0.2s ease-in-out;
}
.sub-category-collapsible[data-collapsed="true"] .cat-arrow::before {
  transform: rotate(-90deg);
}
.gui-btn {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: var(--radius-sm);
  background: var(--button);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.gui-btn:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-medium);
}

.ShikiUtils-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}
.inline-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.inline-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.inline-item input,
.inline-item label {
  margin: 0;
  font-size: var(--font-size-small);
}
.block-layout {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
}

.block-layout input,
.block-layout textarea,
.block-layout select,
.block-layout .tags-container,
.block-layout .range-container {
  width: 100%;
}

.block-layout label {
  font-weight: 500;
}
.sub-category-label {
  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: bold;
  color: var(--text-muted);
  font-size: var(--font-size-small);

  gap: 8px;
}

.sub-category-label::before,
.sub-category-label::after {
  content: "";
  flex: 1;
  height: 1px;
  background: rgb(204, 204, 204);
}
.pairs-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  margin-top: 10px;
}

.pair-item {
  display: grid;
  grid-template-columns: 1fr 42px;
  gap: 10px;

  padding: 12px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
}

.pair-item input[type="text"] {
  font-size: 14px;
}

.pair-item textarea.pair-key {
  grid-row: 2;
  min-height: 100px;
}

.pair-remove {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 20px;
  cursor: pointer;
  background: #e74c3c;
  color: white;

  transition:
    0.25s background,
    0.15s transform;
}

.pair-remove:hover {
  background: #c0392b;
  transform: scale(1.1);
}

.pair-add-btn {
  padding: 8px 14px;
  border-radius: 6px;
  background: #2ecc71;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: 0.2s background;
}

.pair-add-btn:hover {
  background: #27ae60;
}
.category-collapsible::before {
  font-family: shikimori;
  content: "";
  font-size: 16px;
  line-height: 20px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 6px;
  transition: transform 0.2s ease-in-out;
}
.category-collapsible[data-collapsed="true"]::before {
  transform: rotate(-90deg);
}

.func-block.search-highlight {
  outline: 2px solid var(--accent);
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
  transition: outline 0.2s ease, box-shadow 0.2s ease;
}
.shikiutils-search-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 16px 32px;
  border-radius: var(--radius-md);
  font-size: 28px;
  font-weight: 600;
  font-family: var(--font-main);
  letter-spacing: 2px;
  z-index: 999999;
  pointer-events: none;
  backdrop-filter: blur(4px);
}
  `;

    document.head.appendChild(style);
  }

  //! %=================== RUN ===================%
  let fuckturbolinks = false;
  function fuckturboliks() {
    const settingsBlock = document.querySelector(".block.edit-page.misc");

    if (settingsBlock) {
      if (!fuckturbolinks) {
        fuckturbolinks = true;

        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "9999";

        const text = document.createElement("div");
        text.innerText = "Reloading";
        text.style.color = "#fff";
        text.style.fontSize = "2rem";
        text.style.fontWeight = "bold";

        overlay.appendChild(text);
        document.body.appendChild(overlay);

        console.log("[ShikiUtils] reloading for fix...");
        location.reload();
      }
    } else {
      fuckturbolinks = false;
    }
  }

  //! %=================== Module Registry ===================%
  const moduleRegistry = [];

  function registerModule(mod) {
    moduleRegistry.push(mod);
  }

  //! %=================== runFunctions ===================%
  function runFunctions() {
    for (const mod of moduleRegistry) {
      if (!config[mod.key]?.enabled) continue;

      if (mod.watchPaths) {
        const pathMatches = mod.watchPaths.some(p => new RegExp(p).test(location.pathname));
        if (!pathMatches) continue;
      }

      try {
        mod.init();
      } catch (err) {
        console.error(`[ShikiUtils] ${mod.key}:`, err);
      }
    }

    domObserver();
  }

  //! %=================== domObserver ===================%
  function domObserver() {
    if (document.body.dataset.shikiutilsObserver) return;
    document.body.dataset.shikiutilsObserver = "true";
    const watchedMods = moduleRegistry.filter(
      mod => mod.watchSelectors?.length && mod.onNodes
    );

    if (!watchedMods.length) return;

    const observer = new MutationObserver((mutations) => {
      const addedElements = [];
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) addedElements.push(node);
        }
      }
      if (!addedElements.length) return;

      for (const mod of watchedMods) {
        if (!config[mod.key]?.enabled) continue;

        if (mod.watchPaths) {
          const pathMatches = mod.watchPaths.some(p => new RegExp(p).test(location.pathname));
          if (!pathMatches) continue;
        }

        const matched = [];
        for (const el of addedElements) {
          for (const sel of mod.watchSelectors) {
            if (el.matches(sel)) {
              matched.push(el);
              break;
            }
            el.querySelectorAll(sel).forEach(child => matched.push(child));
          }
        }

        if (matched.length > 0) {
          try {
            mod.onNodes(matched);
          } catch (err) {
            console.error(`[ShikiUtils] ${mod.key} onNodes error:`, err);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  //! %=================== Module register ===================%
  registerModule({
    key: 'CommCopyBtn',
    init: CommCopyBtn,
    watchSelectors: ['.b-comment'],
    onNodes: (nodes) => nodes.forEach(node => {
      processCommCopyBtn(node);
    }),
  });

  registerModule({
    key: 'CommTreeBtn',
    init: CommTreeBtn,
    watchSelectors: ['.b-comment'],
    onNodes: (nodes) => nodes.forEach(processCommTreeBtn),
  });

  registerModule({
    key: 'ImageIdCopyBtn',
    init: ImageIdCopyBtn,
    watchSelectors: ['.b-image'],
    onNodes: (nodes) => nodes.forEach(processImageIdCopyBtn),
  });

  registerModule({
    key: 'CopyCodeBtn',
    init: CopyCodeBtn,
    watchSelectors: ['pre.b-code-v2'],
    onNodes: (nodes) => nodes.forEach(processCopyCodeBtn),
  });

  registerModule({
    key: 'UserCssCopyBtn',
    init: UserCssCopyBtn,
    watchSelectors: ['.c-brief .avatar'],
    onNodes: (nodes) => nodes.forEach(processUserCssCopyBtn),
  });

  registerModule({
    key: 'UserIdCopyBtn',
    init: UserIdCopyBtn,
    watchSelectors: ['.c-brief .avatar'],
    onNodes: (nodes) => nodes.forEach(processUserIdCopyBtn),
  });

  registerModule({
    key: 'ForumCharacterFilter',
    init: ForumCharacterFilter,
    watchSelectors: ['article'],
    onNodes: (nodes) => {
      const active = localStorage.getItem("ForumCharacterFilterActive") === "true";
      nodes.forEach(node => {
        // console.log('[ForumCharacterFilter] onNodes:', nodes);
        const meta = node.querySelector('meta[itemprop="name"]');
        if (meta && meta.content === (IS_RU ? "Обсуждение персонажа" : "Character thread")) {
          node.style.display = active ? "none" : "";
        }
      });
    },
  });

  registerModule({
    key: 'removeBlur',
    init: removeBlur,
    watchSelectors: ['img.is-moderation_censored'],
    onNodes: (nodes) => nodes.forEach(processRemoveBlur),
  });

  registerModule({
    key: 'autoSpoiler',
    init: autoSpoiler,
    watchSelectors: ['.b-comment'],
    onNodes: (nodes) => nodes.forEach(node => {
      if (node.classList.contains('b-comment')) autoSpoilerComment(node);
    }),
  });

  registerModule({
    key: 'hideNews',
    init: hideNews,
    watchSelectors: ['article.b-news_wall-topic'],
    onNodes: () => hideNews(),
  });

  registerModule({
    key: 'commentsLoader',
    init: commentsLoader,
    watchSelectors: ['.comments-loader'],
    onNodes: () => commentsLoader(),
  });

  registerModule({
    key: 'pollsHelper',
    init: pollsHelper,
    watchSelectors: ['.b-poll'],
    onNodes: () => pollsHelper(),
  });

  registerModule({
    key: 'showTopicId',
    init: showTopicId,
    watchSelectors: ['[data-faye]'],
    onNodes: () => showTopicId(),
  });
  registerModule({
    key: 'ChineseFilter',
    init: ChineseFilter,
    watchSelectors: ['article.c-anime'],
    onNodes: () => chineseFilterApply?.(),
  });

  registerModule({ key: 'workTypeFilter', init: workTypeFilter, watchPaths: ['/people/\\d+-.*\\/works'] });
  registerModule({ key: 'ClubCssCopyBtn', init: ClubCssCopyBtn });
  registerModule({ key: 'switchBtn', init: switchBtn });
  registerModule({ key: 'NoAgeLimits', init: NoAgeLimits });
  registerModule({ key: 'ShikiRating', init: ShikiRating });
  registerModule({ key: 'NotificationHelperConfig', init: NotificationHelper });
  registerModule({ key: 'HistoryHelperConfig', init: HistoryHelper });
  registerModule({ key: 'FavoriteHelperConfig', init: FavoriteHelper, watchPaths: ['/favorites'] });
  registerModule({ key: 'ShikiScore', init: ShikiScore });
  registerModule({ key: 'MoreStatistic', init: MoreStatistic });
  registerModule({ key: 'PGPModule', init: PGPModule });
  registerModule({ key: 'FriendsHistory', init: FriendsHistory, watchPaths: ['/friends'] });
  registerModule({ key: 'DUBlinks', init: DUBlinks });
  registerModule({ key: 'StudioFilter', init: StudioFilter, watchPaths: ['/animes'] });

  ready(() => {
    IS_RU = getSiteLocale() === "ru";
    createGUI();
    runFunctions();
    updateUserData();

  });

  document.addEventListener("turbolinks:load", () => {
    fuckturboliks();
  });
})();
