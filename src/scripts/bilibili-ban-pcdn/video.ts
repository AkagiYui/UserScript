export default (useLogger: (name) => ConsoleLogger, getConfig: (key: string) => boolean) => {
  const { log, debug } = useLogger("video")

  const pageWindow = unsafeWindow as BilibiliVideoPageWindow

  // 挑出有用的链接
  const removeSomeUrls = (allUrls: string[]) => {
    const whichToRemove = [/mcdn.bilivideo.(com|cn)/]
    if (getConfig("blockBCacheCDN")) {
      whichToRemove.push(/(cn-.*\.bilivideo\.(com|cn))/)
    }
    const urls = allUrls.filter((url) => {
      const needRemove = whichToRemove.some((re) => re.test(url))
      debug("链接", url, needRemove)
      return !needRemove
    })
    const baseUrl = urls[0]
    const backupUrls = urls.slice(1)
    return { baseUrl, backupUrls }
  }

  // 处理资源数据
  const cleanPlayInfo = <T extends PlayInfo>(playInfo: T): void => {
    log("处理前", JSON.parse(JSON.stringify(playInfo)))
    if (playInfo.data) {
      log("非番剧视频")
      cleanNonBangumiVideo(playInfo.data)
    } else if (playInfo.result) {
      log("番剧视频")
      cleanBangumiVideo(playInfo.result)
    }
    log("处理后", JSON.parse(JSON.stringify(playInfo)))
  }

  const cleanNonBangumiVideo = (data: PlayInfo["data"]): void => {
    if (data.dash) {
      cleanDash(data.dash)
    }
    if (data.durl) {
      log("试看视频")
      cleanDurl(data.durl)
    }
  }
  const cleanBangumiVideo = (result: PlayInfo["result"]): void => {
    if (!result.video_info) {
      log("番剧播放列表不存在，可能是没有大会员或未承包")
      return
    }

    const videoInfo = result.video_info
    if (videoInfo.dash) {
      cleanDash(videoInfo.dash)
    } else if (videoInfo.durl || videoInfo.durls) {
      log("试看番剧")
      if (videoInfo.durl) {
        cleanDurl(videoInfo.durl)
      }
      if (videoInfo.durls) {
        videoInfo.durls.forEach((durlGroup) => cleanDurl(durlGroup.durl))
      }
    } else {
      log("番剧播放列表不存在，可能是没有大会员或未承包")
    }
  }

  const cleanDash = (dash: Dash): void => {
    const cleanMedia = (media: ResourceUrl): void => {
      const { baseUrl, backupUrls } = removeSomeUrls([media.baseUrl, ...media.backupUrl])
      media.baseUrl = media.base_url = baseUrl
      media.backupUrl = media.backup_url = backupUrls
    }
    dash.video.forEach(cleanMedia)
    dash.audio?.forEach(cleanMedia) // 部分视频没有音频流
    dash.flac?.audio && cleanMedia(dash.flac.audio) // Hi-Res
  }
  const cleanDurl = (durls: Durl[]): void => {
    durls.forEach((durl) => {
      const { baseUrl, backupUrls } = removeSomeUrls([durl.url, ...durl.backup_url])
      durl.url = baseUrl
      durl.backup_url = backupUrls
    })
  }
  // 播放器初始化参数
  let __playinfo__ = pageWindow.__playinfo__
  Object.defineProperty(pageWindow, "__playinfo__", {
    get: () => __playinfo__,
    set: (value: PlayInfo) => {
      log("初始化参数", value)
      cleanPlayInfo(value)
      __playinfo__ = value
    },
  })
  // 播放列表请求处理
  const originalXHR = pageWindow.XMLHttpRequest
  const xhrOpen = originalXHR.prototype.open
  originalXHR.prototype.open = function (_: any, url: string) {
    if (url.includes("api.bilibili.com/x/player/wbi/playurl")) {
      // 包括单个视频的多个(画质数量*编码数量)的url
      const avid = url.match(/avid=(\d+)/)?.[1] // 提取出url中的avid参数
      log("请求视频列表", `av${avid}`)
      const getter = Object.getOwnPropertyDescriptor(originalXHR.prototype, "responseText").get
      Object.defineProperty(this, "responseText", {
        get: () => {
          const response = getter.call(this)
          const responseJson: VideoPlayList = JSON.parse(response)
          cleanPlayInfo(responseJson)
          return JSON.stringify(responseJson)
        },
      })
    }
    if (url.includes("api.bilibili.com/pgc/player/web/v2/playurl")) {
      const season_id = url.match(/season_id=(\d+)/)?.[1] // 提取出url中的season_id参数
      const ep_id = url.match(/ep_id=(\d+)/) // 提取出url中的ep_id参数
      log("请求番剧列表", `ss${season_id}`, ep_id ? `ep${ep_id[1]}` : "ep_id not found")
      const getter = Object.getOwnPropertyDescriptor(originalXHR.prototype, "responseText").get
      Object.defineProperty(this, "responseText", {
        get: () => {
          const response = getter.call(this)
          const responseJson: BangumiPlayList = JSON.parse(response)
          cleanPlayInfo(responseJson as PlayInfo)
          return JSON.stringify(responseJson)
        },
      })
    }
    return xhrOpen.apply(this, arguments)
  }
}
