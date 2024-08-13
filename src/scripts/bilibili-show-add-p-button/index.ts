"use strict"

import { useLogger } from "@/utils"

const log = useLogger("bilibili-show-add-p-button")

const pageWindow = unsafeWindow as BilibiliCreativeCenterWindow
const originalDefineProperty = pageWindow.Object.defineProperty
pageWindow.Object.defineProperty = function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  if (propertyKey === "showAddButton") {
    originalDefineProperty(target, "canMultiP", {
      configurable: true,
      enumerable: true,
      get: () => {
        log("显示添加分P按钮")
        return true
      },
      set: () => {},
    })
    // 为确保在转到其他路由再次加载时仍然有效，此处不可恢复defineProperty。
  }
  return originalDefineProperty(target, propertyKey, descriptor)
}
