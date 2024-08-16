"use strict"
import { useBooleanMenu } from "@/utils/menu"
import { useLogger } from "@/utils/logger"
import handleVideo from "./video"
import handleLive from "./live"

const { debug, useLogger: subLogger } = useLogger("bilibili-ban-pcdn")
const { getConfig } = useBooleanMenu({
  blockPlayError: {
    title: "屏蔽“播放遇到问题？”提示",
    defaultValue: false,
  },
  blockBCacheCDN: {
    title: "屏蔽视频地区CDN",
    defaultValue: false,
  },
  blockLivePCDN: {
    title: "屏蔽直播PCDN",
    defaultValue: false,
  },
})
const matchUrls = {
  live: ["https://www.bilibili.com/blackboard/live/live-activity-player.html", "https://live.bilibili.com/"],
  video: ["https://www.bilibili.com/video/", "https://www.bilibili.com/list/"],
  bangumi: ["https://www.bilibili.com/bangumi/play/"],
}
const getUrlType = (url: string): string | null => {
  for (const [type, patterns] of Object.entries(matchUrls)) {
    for (const pattern of patterns) {
      if (url.includes(pattern)) {
        return type
      }
    }
  }
  return null
}

const pageWindow = unsafeWindow as OriginWindow

// 屏蔽“播放遇到问题？”提示
if (getConfig("blockPlayError")) {
  const originalDefineProperty = pageWindow.Object.defineProperty
  pageWindow.Object.defineProperty = function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (propertyKey === "videoHasBuffered") {
      originalDefineProperty(target, "showLoadTimeoutFeedback", {
        get: () => () => {
          debug("屏蔽“播放遇到问题？”提示")
        },
        set: () => {
          pageWindow.Object.defineProperty = originalDefineProperty
        },
      })
    }
    return originalDefineProperty(target, propertyKey, descriptor)
  }
}

if (getUrlType(location.href) === "video" || getUrlType(location.href) === "bangumi") {
  handleVideo(subLogger, getConfig)
} else if (getUrlType(location.href) === "live") {
  handleLive(subLogger, getConfig)
}
