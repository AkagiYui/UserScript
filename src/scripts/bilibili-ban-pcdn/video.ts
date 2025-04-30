const PCDN_REGEX_PATTERN = /mcdn.bilivideo.(com|cn)/
const BCACHE_REGEX_PATTERN = /(cn-.*\.bilivideo\.(com|cn))/

export default (useLogger: (name) => ConsoleLogger, getConfig: (key: string) => boolean) => {
  const { log, debug } = useLogger("video")

  const pageWindow = unsafeWindow as BilibiliVideoPageWindow

  // 挑出有用的链接
  const removeSomeUrls = (allUrls: string[]) => {
    const keepOneUrl = getConfig("keepOneUrl")
    const blockBCacheCDN = getConfig("blockBCacheCDN")
    
    const filterUrls = (urls: string[], pattern: RegExp): string[] => {
      return urls.filter((url) => {
        const keep = !pattern.test(url)
        debug("保留链接", keep, url)
        return keep
      })
    }
    const applyFilter = (urls: string[], pattern: RegExp, filterName: string): string[] => {
      debug(`过滤${filterName}链接`)
      const filteredUrls = filterUrls(urls, pattern)
      if (filteredUrls.length === 0) {
        debug(`仅包含${filterName}链接，${keepOneUrl ? "保留所有播放链接" : "无可用链接"}`)
        return keepOneUrl ? urls : []
      }
      return filteredUrls
    }

    let restUrls = applyFilter(allUrls, PCDN_REGEX_PATTERN, "PCDN")
    if (blockBCacheCDN) {
      restUrls = applyFilter(restUrls, BCACHE_REGEX_PATTERN, "自建地区CDN")
    }
    return { baseUrl: restUrls[0], backupUrls: restUrls.slice(1) }
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
    dash.dolby?.audio && dash.dolby.audio.forEach(cleanMedia) // 杜比
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
  let currentPlayinfoState = pageWindow.__playinfo__;

  Object.defineProperty(pageWindow, "__playinfo__", {
    get: () => {
      // Getter 现在可以直接返回当前状态，因为初始值已处理
      // 如果担心 B站 可能在不通过 setter 的情况下修改它，可以在这里再次调用 cleanPlayInfo，但这通常没必要
      // debug("Getter: 返回 currentPlayinfoState");
      return currentPlayinfoState;
    },
    set: (value) => {
      // Setter 处理后续的赋值（例如SPA切换视频）
      log("处理更新的 __playinfo__ (setter)", value);
      try {
        cleanPlayInfo(value); // 清理新赋的值
        currentPlayinfoState = value; // 更新闭包中的状态
      } catch (e) {
        log("处理 setter 中的 __playinfo__ 时出错:", e);
      }
    },
    configurable: true // 允许后续可能的操作，虽然通常不需要
  });
  // --- 修改 Object.defineProperty 逻辑结束 ---

  const observer = new MutationObserver((mutationsList, observer) => {
    if (typeof pageWindow.nano !== 'undefined') {
      log("Window.nano 已加载，开始 hook...");
      // 在这里执行你的 hook 代码 (例如上面的方法 1 或 2)
      const originalCreatePlayer = pageWindow.nano.createPlayer;
      // 定义我们自己的 nano.createPlayer 函数
      pageWindow.nano.createPlayer = function(config) {
        log("原始 primarySetting/config:", config);
        // 在这里修改 primarySetting 对象
        if(config.prefetch){
          cleanPlayInfo(config.prefetch.playUrl)
          log("修改后的 primarySetting/config:", config);
        }
        const theme = arguments[1]
        // 调用原始的 nano.createPlayer 函数，并将修改后的 primarySetting 传递给它
        return originalCreatePlayer.call(this, config, theme);
      };
      observer.disconnect(); // 停止监听
    }
  });
  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true
  });
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
          cleanPlayInfo(responseJson as unknown as PlayInfo)
          return JSON.stringify(responseJson)
        },
      })
    }
    return xhrOpen.apply(this, arguments)
  }
}
