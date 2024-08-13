// ==UserScript==
// @name         【哔哩哔哩】屏蔽视频PCDN地址
// @version      0.2.2
// @description  从官方CDN加载视频
// @icon         https://static.hdslb.com/images/favicon.ico
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @match        https://www.bilibili.com/bangumi/play/*
// @grant        unsafeWindow
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @namespace    https://github.com/AkagiYui/UserScript
// @supportURL   https://github.com/AkagiYui/UserScript/issues
// @homepage     https://github.com/AkagiYui
// @author       AkagiYui
// @license      MIT
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 636:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useBooleanMenu = exports.useLogger = void 0;
/**
 * 生成 Logger
 * @param name 前缀
 * @returns console.log
 */
const useLogger = (name) => {
    if (name) {
        return console.log.bind(console, "AkagiYui", `[${name}]`);
    }
    return console.log.bind(console, "AkagiYui");
};
exports.useLogger = useLogger;
/**
 * 布尔菜单配置
 * @param configs 配置项
 * @returns 配置获取函数
 */
const useBooleanMenu = (configs) => {
    // 缓存
    const cache = {};
    // 获取配置
    const getConfig = (key) => {
        if (cache[key] !== undefined) {
            return cache[key];
        }
        let value = GM_getValue(key, configs[key].defaultValue);
        cache[key] = value;
        return value;
    };
    // 配置注册
    let menuIds = [];
    const registerMenuCommand = () => {
        menuIds.forEach((id) => {
            GM_unregisterMenuCommand(id);
        });
        menuIds = [];
        Object.entries(configs).forEach(([key, config]) => {
            let commandName = getConfig(key) ? "✅" : "❌";
            commandName += ` ${config.title}`;
            let id = GM_registerMenuCommand(commandName, () => {
                let newValue = !getConfig(key);
                let valueToSet = config.callback ? config.callback(newValue) : newValue;
                GM_setValue(key, valueToSet);
                cache[key] = valueToSet;
                registerMenuCommand();
            });
            menuIds.push(id);
        });
    };
    registerMenuCommand();
    return { getConfig };
};
exports.useBooleanMenu = useBooleanMenu;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const utils_1 = __webpack_require__(636);
const log = (0, utils_1.useLogger)("bilibili-ban-pcdn");
const { getConfig } = (0, utils_1.useBooleanMenu)({
    blockPlayError: {
        title: "屏蔽“播放遇到问题？”提示",
        defaultValue: false,
    },
    blockBCacheCDN: {
        title: "屏蔽地区CDN",
        defaultValue: false,
    },
});
// 真实页面
const pageWindow = unsafeWindow;
// 挑出有用的链接
const removeSomeUrls = (allUrls) => {
    const whichToRemove = [/mcdn.bilivideo.(com|cn)/];
    if (getConfig("blockBCacheCDN")) {
        whichToRemove.push(/(cn-.*\.bilivideo\.(com|cn))/);
    }
    const urls = allUrls.filter((url) => !whichToRemove.some((re) => re.test(url)));
    const baseUrl = urls[0];
    const backupUrls = urls.slice(1);
    return { baseUrl, backupUrls };
};
// 处理资源数据
const cleanPlayInfo = (playInfo) => {
    log("处理前", JSON.parse(JSON.stringify(playInfo)));
    if (playInfo.data) {
        log("非番剧视频");
        cleanNonBangumiVideo(playInfo.data);
    }
    else if (playInfo.result) {
        log("番剧视频");
        cleanBangumiVideo(playInfo.result);
    }
    log("处理后", JSON.parse(JSON.stringify(playInfo)));
};
const cleanNonBangumiVideo = (data) => {
    if (data.dash) {
        cleanDash(data.dash);
    }
    if (data.durl) {
        log("试看视频");
        cleanDurl(data.durl);
    }
};
const cleanBangumiVideo = (result) => {
    if (!result.video_info) {
        log("番剧播放列表不存在，可能是没有大会员或未承包");
        return;
    }
    const videoInfo = result.video_info;
    if (videoInfo.dash) {
        cleanDash(videoInfo.dash);
    }
    else if (videoInfo.durl || videoInfo.durls) {
        log("试看番剧");
        if (videoInfo.durl) {
            cleanDurl(videoInfo.durl);
        }
        if (videoInfo.durls) {
            videoInfo.durls.forEach((durlGroup) => cleanDurl(durlGroup.durl));
        }
    }
    else {
        log("番剧播放列表不存在，可能是没有大会员或未承包");
    }
};
const cleanDash = (dash) => {
    const cleanMedia = (media) => {
        const { baseUrl, backupUrls } = removeSomeUrls([media.baseUrl, ...media.backupUrl]);
        media.baseUrl = media.base_url = baseUrl;
        media.backupUrl = media.backup_url = backupUrls;
    };
    dash.video.forEach(cleanMedia);
    dash.audio.forEach(cleanMedia);
};
const cleanDurl = (durls) => {
    durls.forEach((durl) => {
        const { baseUrl, backupUrls } = removeSomeUrls([durl.url, ...durl.backup_url]);
        durl.url = baseUrl;
        durl.backup_url = backupUrls;
    });
};
// 播放器初始化参数
let __playinfo__ = pageWindow.__playinfo__;
Object.defineProperty(pageWindow, "__playinfo__", {
    get: () => __playinfo__,
    set: (value) => {
        log("初始化参数", value);
        cleanPlayInfo(value);
        __playinfo__ = value;
    },
});
// 播放列表请求处理
const originalXHR = pageWindow.XMLHttpRequest;
const xhrOpen = originalXHR.prototype.open;
originalXHR.prototype.open = function (_, url) {
    if (url.includes("api.bilibili.com/x/player/wbi/playurl")) {
        // 包括单个视频的多个(画质数量*编码数量)的url
        const avid = url.match(/avid=(\d+)/)?.[1]; // 提取出url中的avid参数
        log("请求视频列表", `av${avid}`);
        const getter = Object.getOwnPropertyDescriptor(originalXHR.prototype, "responseText").get;
        Object.defineProperty(this, "responseText", {
            get: () => {
                const response = getter.call(this);
                const responseJson = JSON.parse(response);
                cleanPlayInfo(responseJson);
                return JSON.stringify(responseJson);
            },
        });
    }
    if (url.includes("api.bilibili.com/pgc/player/web/v2/playurl")) {
        const season_id = url.match(/season_id=(\d+)/)?.[1]; // 提取出url中的season_id参数
        const ep_id = url.match(/ep_id=(\d+)/); // 提取出url中的ep_id参数
        log("请求番剧列表", `ss${season_id}`, ep_id ? `ep${ep_id[1]}` : "ep_id not found");
        const getter = Object.getOwnPropertyDescriptor(originalXHR.prototype, "responseText").get;
        Object.defineProperty(this, "responseText", {
            get: () => {
                const response = getter.call(this);
                const responseJson = JSON.parse(response);
                cleanPlayInfo(responseJson);
                return JSON.stringify(responseJson);
            },
        });
    }
    return xhrOpen.apply(this, arguments);
};
// 屏蔽“播放遇到问题？”提示
if (getConfig("blockPlayError")) {
    const originalDefineProperty = pageWindow.Object.defineProperty;
    pageWindow.Object.defineProperty = function (target, propertyKey, descriptor) {
        if (propertyKey === "videoHasBuffered") {
            originalDefineProperty(target, "showLoadTimeoutFeedback", {
                get: () => () => { },
                set: () => {
                    pageWindow.Object.defineProperty = originalDefineProperty;
                },
            });
        }
        return originalDefineProperty(target, propertyKey, descriptor);
    };
}

})();

/******/ })()
;