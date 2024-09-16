interface ConsoleLogger {
  log: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  info: (...args: any[]) => void
  debug: (...args: any[]) => void
  useLogger: (name?: string) => ConsoleLogger
}

// 布尔配置项
type BooleanConfigs = {
  [key: string]: {
    title: string
    defaultValue: boolean
    callback?: (value: boolean) => boolean
  }
}

// ===========Window类型定义============

type OriginWindow = Window & {
  Object: typeof Object
  XMLHttpRequest: typeof XMLHttpRequest
  RTCPeerConnection: typeof RTCPeerConnection
  mozRTCPeerConnection?: typeof RTCPeerConnection
  webkitRTCPeerConnection?: typeof RTCPeerConnection
  RTCDataChannel?: typeof RTCDataChannel
  DataChannel?: typeof RTCDataChannel
}

// B站视频播放窗口
type BilibiliVideoPageWindow = OriginWindow & {
  connectPlayer: any
  playurlSSRData?: BangumiPlayList
  __playinfo__: PlayInfo
}

// B站直播间窗口
type BilibiliLiveRoomWindow = OriginWindow & {
  __NEPTUNE_IS_MY_WAIFU__: {
    roomInitRes: BilibiliDataResponse<RoomPlayInfo>
  }
}

// ===========API响应============

type BilibiliDataResponse<T> = {
  code: number
  message: string
  data: T
  ttl?: number
}

// ===========类型定义============

// 视频资源链接
type ResourceUrl = {
  baseUrl: string
  base_url: string
  backupUrl: string[]
  backup_url: string[]
}
// 音视频信息
type Dash = {
  video: ResourceUrl[]
  audio?: ResourceUrl[]
  dolby: {
    audio: ResourceUrl[] | null
  }
  flac: {
    audio: ResourceUrl | null
  }
}
// 试看链接
type Durl = {
  url: string
  backup_url: string[]
}
type PlayInfo = {
  result?: {
    video_info: {
      dash?: Dash
      durl?: Durl[]
      durls?: {
        durl: Durl[]
      }[]
    }
  }
  data?: {
    dash?: Dash
    durl?: Durl[]
  }
}
// 播放列表
type VideoPlayList = {
  data: {
    dash: Dash
  }
}
// 番剧播放列表
type BangumiPlayList = {
  result: {
    play_check: {
      can_play: boolean
    }
    video_info?: {
      dash?: Dash
    }
    view_info: {
      open_prompt_bar: {
        button: any[]
      }
    }
  }
}

// 直播间信息
type RoomPlayInfo = {
  playurl_info: {
    playurl: {
      p2p_data: {
        m_p2p: boolean
        m_servers: string[] | null
      }
      stream: {
        format: {
          codec: {
            url_info: {
              host: string
            }[]
          }[]
        }[]
      }[]
    }
  }
}
