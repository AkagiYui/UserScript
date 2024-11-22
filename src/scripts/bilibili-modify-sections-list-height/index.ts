"use strict"

let maxHeight = GM_getValue("maxHeight", "340px")

GM_registerMenuCommand("修改高度值", function () {
  const userValue = prompt("请输入高度值:", maxHeight)
  if (userValue !== null) {
    maxHeight = userValue
    GM_setValue("maxHeight", maxHeight)
    updateStyles()
  }
})

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
  `)
}

updateStyles()
