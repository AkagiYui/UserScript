type GetCollectionPageRequestParams = {
  ps: 20
  pn: number
  up_mid: number
  platform: "web"
}

type CollectionPage = {
  count: number
  has_more: boolean
  list: Collection[]
}

type Collection = {
  attr: 0 | 1 // 0: 公开，1: 私密
  attr_desc: string
  bvid: string
  cover: string
  cover_type: number
  ctime: number
  fav_state: number
  fid: number
  id: number
  intro: string
  is_top: boolean
  link: string
  media_count: number
  mid: number
  mtime: number
  play_switch: number
  recent_fav: null
  state: 0 | 1 // 0: 正常，1: 删除
  title: string
  type: number
  upper: {
    face: string
    mid: number
    name: string
  }
  view_count: number
  vt: number
}
