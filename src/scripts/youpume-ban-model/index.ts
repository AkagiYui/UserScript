"use strict"

import { useLogger } from "@/utils/logger"

const { log } = useLogger("youpume-ban-model")

// 保存原始的setTimeout函数
const originalSetTimeout = window.setTimeout

// 重新定义setTimeout函数
window.setTimeout = function (callback, delay) {
  log("setTimeout被调用", delay)

  if (delay === 60 * 1000 || delay === 15 * 1000) {
    log("hook阻止定时弹窗函数", callback, delay)
    return
  }

  return originalSetTimeout(callback, delay)
}

log("setTimeout已成功被hook")
