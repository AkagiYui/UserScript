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

function updateStyles() {
  GM_addStyle(`
    .video-sections-content-list {
        height: auto !important;
    }
    .base-video-sections-v1 .video-sections-content-list {
        max-height: ${maxHeight} !important;
    }
    .multi-page-v1 .cur-list {
        max-height: ${maxHeight} !important;
    }
  `)
}

updateStyles()
