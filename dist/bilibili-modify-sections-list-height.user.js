// ==UserScript==
// @name         【哔哩哔哩】修改选集列表框高度
// @version      0.2.2
// @description  默认的高度也太小了吧！
// @icon         https://static.hdslb.com/images/favicon.ico
// @match        https://www.bilibili.com/video/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
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
var __webpack_exports__ = {};

let maxHeight = GM_getValue("maxHeight", "340px");
GM_registerMenuCommand("修改高度值", function () {
    const userValue = prompt("请输入高度值:", maxHeight);
    if (userValue !== null) {
        maxHeight = userValue;
        GM_setValue("maxHeight", maxHeight);
        updateStyles();
    }
});
// base-video-sections-v1: 带封面的视频列表
// video-sections-v1: 普通视频列表
function updateStyles() {
    GM_addStyle(`
    .base-video-sections-v1, .video-sections-v1 {
      .video-sections-content-list {
        height: auto !important;
        max-height: ${maxHeight} !important;
      }
    }
    .multi-page-v1 .cur-list {
        max-height: ${maxHeight} !important;
    }
    .video-pod__body {
        max-height: ${maxHeight} !important;
    }
  `);
}
updateStyles();

/******/ })()
;