"use strict"

import { useLogger } from "@/utils"

const log = useLogger("bilibili-show-videos-in-collection")

const pageWindow = unsafeWindow as OriginWindow
const originalDefineProperty = pageWindow.Object.defineProperty
pageWindow.Object.defineProperty = function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  if (propertyKey === "visibleVideoList") {
    log("定义 应显示视频列表", target, descriptor, descriptor.get, descriptor.set)
    const originGetter = descriptor.get.bind(target)
    return originalDefineProperty(target, propertyKey, {
      configurable: true,
      enumerable: true,
      get: function () {
        log("获取 应显示视频列表", this)
        // favListDetails: 收藏夹视频列表
        // submitVideos: 投稿视频列表
        return this.favListDetails?.medias ?? this.submitVideos?.vlist ?? originGetter()
      },
      set: () => {},
    })
    // 为确保在转到其他路由再次加载时仍然有效，此处不可恢复defineProperty。
  }
  return originalDefineProperty(target, propertyKey, descriptor)
}
