"use strict"

import { useLogger } from "@/utils/logger"

const { log } = useLogger("bilibili-show-add-p-button")

const pageWindow = unsafeWindow as OriginWindow
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

const originalXHR = pageWindow.XMLHttpRequest
const xhrOpen = originalXHR.prototype.open
originalXHR.prototype.open = function (_: any, url: string) {
  if (arguments[1].includes("/x/vu/web/add/v3")) {
    log("请求分P投稿", JSON.parse(JSON.stringify(arguments)))
    arguments[1] = arguments[1].replace("/x/vu/web/add/v3", "/x/vu/web/add")
  }
  return xhrOpen.apply(this, arguments)
}
