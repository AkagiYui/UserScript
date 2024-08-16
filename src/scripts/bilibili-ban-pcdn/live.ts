export default (useLogger: (name) => ConsoleLogger, getConfig: (key: string) => boolean) => {
  const { log, debug } = useLogger("live")
  const pageWindow = unsafeWindow as OriginWindow

  // 屏蔽直播P2P视频流信息
  if (getConfig("blockLivePCDN")) {
    function processPlayurlInfo(playurlInfo: RoomPlayInfo["playurl_info"]["playurl"]): void {
      playurlInfo.p2p_data.m_p2p = false
      playurlInfo.p2p_data.m_servers = null
      playurlInfo.stream.forEach((stream) => {
        stream.format.forEach((format) => {
          format.codec.forEach((codec) => {
            codec.url_info = codec.url_info.filter((urlInfo) => {
              const needRemove = urlInfo.host.includes("mcdn.bilivideo")
              debug("处理中", urlInfo.host, needRemove)
              return !needRemove
            })
          })
        })
      })
    }

    // 替换SSR属性__NEPTUNE_IS_MY_WAIFU__
    let __NEPTUNE_IS_MY_WAIFU__ = (pageWindow as unknown as BilibiliLiveRoomWindow).__NEPTUNE_IS_MY_WAIFU__
    Object.defineProperty(pageWindow, "__NEPTUNE_IS_MY_WAIFU__", {
      get: () => __NEPTUNE_IS_MY_WAIFU__,
      set: (value: any) => {
        if (value.roomInitRes) {
          log("直播房间信息", "fetch", "处理前", JSON.parse(JSON.stringify(value.roomInitRes)))
          processPlayurlInfo(value.roomInitRes.data.playurl_info.playurl)
          log("直播房间信息", "fetch", "处理后", JSON.parse(JSON.stringify(value.roomInitRes)))
        }
        __NEPTUNE_IS_MY_WAIFU__ = value
      },
    })

    let oldFetch = pageWindow.fetch
    function hookFetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
      if (typeof url === "string") {
        if (url.includes("api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo")) {
          log("请求直播列表")
          return new Promise((resolve, reject) => {
            oldFetch.apply(this, arguments).then((response) => {
              const oldJson = response.json
              response.json = function () {
                return new Promise((resolve, reject) => {
                  oldJson.apply(this, arguments).then((result: BilibiliDataResponse<RoomPlayInfo>) => {
                    log("直播列表", "处理前", JSON.parse(JSON.stringify(result)))
                    processPlayurlInfo(result.data.playurl_info.playurl)
                    log("直播列表", "处理后", JSON.parse(JSON.stringify(result)))
                    resolve(result)
                  })
                })
              }
              resolve(response)
            })
          })
        }
      }
      return oldFetch.apply(this, arguments)
    }
    // 对window.fetch挂载成我们的劫持函数hookFetch
    pageWindow.fetch = hookFetch as typeof fetch

    const originalXHR = pageWindow.XMLHttpRequest
    const xhrOpen = originalXHR.prototype.open
    originalXHR.prototype.open = function (_: any, url: string) {
      if (url.includes("api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo")) {
        log("请求直播列表")
        const getter = Object.getOwnPropertyDescriptor(originalXHR.prototype, "responseText").get
        Object.defineProperty(this, "responseText", {
          get: () => {
            const response = getter.call(this)
            const responseJson: BilibiliDataResponse<RoomPlayInfo> = JSON.parse(response)
            log("直播列表", "xhr", "处理前", JSON.parse(JSON.stringify(responseJson)))
            processPlayurlInfo(responseJson.data.playurl_info.playurl)
            log("直播列表", "xhr", "处理后", JSON.parse(JSON.stringify(responseJson)))
            return JSON.stringify(responseJson)
          },
        })
      }
      return xhrOpen.apply(this, arguments)
    }
  }
  // 未来可能考虑屏蔽出方向的P2P
}
