// 布尔配置项
type BooleanConfigs = {
  [key: string]: {
    title: string;
    defaultValue: boolean;
    callback?: (value: boolean) => boolean;
  };
};

type OriginWindow = Window & {
  Object: typeof Object;
}
// B站视频播放窗口
type BilibiliVideoPageWindow = Window & {
  XMLHttpRequest: typeof XMLHttpRequest;
  Object: typeof Object;
  connectPlayer: any;
  playurlSSRData?: BangumiPlayList;
  __playinfo__: PlayInfo;
};

// 视频资源链接
type ResourceUrl = {
  baseUrl: string;
  base_url: string;
  backupUrl: string[];
  backup_url: string[];
};
// 音视频信息
type Dash = {
  video: ResourceUrl[];
  audio: ResourceUrl[];
};
// 试看链接
type Durl = {
  url: string;
  backup_url: string[];
};
type PlayInfo = {
  result?: {
    video_info: {
      dash?: Dash;
      durl?: Durl[];
      durls?: {
        durl: Durl[];
      }[];
    };
  };
  data?: {
    dash?: Dash;
    durl?: Durl[];
  };
};
// 播放列表
type VideoPlayList = {
  data: {
    dash: Dash;
  };
};
// 番剧播放列表
type BangumiPlayList = {
  result: {
    play_check: {
      can_play: boolean;
    };
    video_info?: {
      dash?: Dash;
    };
  };
};