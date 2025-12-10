import { biliApiClient } from './client';
import { VideoInfo, FavoriteInfo, ToViewInfo, FavoriteList } from '../types';

/**
 * 获取CSRF Token（从cookie中获取bili_jct）
 */
function getCsrfToken(): string {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'bili_jct') {
      return value;
    }
  }
  throw new Error('CSRF token not found. Please make sure you are logged in.');
}

/**
 * 获取用户ID（从cookie中获取DedeUserID）
 */
function getUserId(): string {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'DedeUserID') {
      return value;
    }
  }
  throw new Error('User ID not found. Please make sure you are logged in.');
}

/**
 * 获取稍后再看列表
 */
export async function getToViewList(): Promise<ToViewInfo> {
  const response = await biliApiClient.get<ToViewInfo>('https://api.bilibili.com/x/v2/history/toview');
  if (response.code !== 0) {
    throw new Error(`Failed to get toview list: ${response.message}`);
  }
  return response.data;
}

/**
 * 获取收藏夹信息
 */
export async function getFavoriteInfo(favoriteId: number): Promise<FavoriteInfo> {
  const response = await biliApiClient.get<FavoriteInfo>(
    'https://api.bilibili.com/x/v3/fav/folder/info',
    { media_id: favoriteId }
  );
  if (response.code !== 0) {
    throw new Error(`Failed to get favorite info: ${response.message}`);
  }
  return response.data;
}

/**
 * 获取收藏夹资源列表
 */
export async function getFavoriteResourceList(
  favoriteId: number,
  pageIndex: number = 1,
  pageSize: number = 20
): Promise<{ info: FavoriteInfo; medias: VideoInfo[]; has_more: boolean }> {
  const response = await biliApiClient.get(
    'https://api.bilibili.com/x/v3/fav/resource/list',
    {
      media_id: favoriteId,
      pn: pageIndex,
      ps: pageSize,
      keyword: '',
      order: 'mtime',
      type: 0,
      tid: 0,
      platform: 'web',
    }
  );
  if (response.code !== 0) {
    throw new Error(`Failed to get favorite resource list: ${response.message}`);
  }
  return response.data;
}

/**
 * 添加视频到稍后再看
 */
export async function addToToView(videoId: number): Promise<void> {
  const response = await biliApiClient.post(
    'https://api.bilibili.com/x/v2/history/toview/add',
    { aid: videoId, csrf: getCsrfToken() }
  );
  if (response.code !== 0) {
    throw new Error(`Failed to add to toview: ${response.message}`);
  }
}

/**
 * 从稍后再看删除视频
 */
export async function deleteFromToView(videoIds: number[]): Promise<void> {
  const response = await biliApiClient.post(
    'https://api.bilibili.com/x/v2/history/toview/del',
    {
      viewed: 'false',
      aid: videoIds.join(','),
      csrf: getCsrfToken()
    }
  );
  if (response.code !== 0) {
    throw new Error(`Failed to delete from toview: ${response.message}`);
  }
}

/**
 * 清空稍后再看
 */
export async function clearToViewList(): Promise<void> {
  const response = await biliApiClient.post(
    'https://api.bilibili.com/x/v2/history/toview/clear',
    { csrf: getCsrfToken() }
  );
  if (response.code !== 0) {
    throw new Error(`Failed to clear toview list: ${response.message}`);
  }
}

/**
 * 从收藏夹删除视频
 */
export async function deleteFromFavorite(
  favoriteId: number,
  resourceIds: { id: number; type: number }[]
): Promise<void> {
  const resources = resourceIds.map(r => `${r.id}:${r.type}`).join(',');
  const response = await biliApiClient.post(
    'https://api.bilibili.com/x/v3/fav/resource/batch-del',
    {
      media_id: favoriteId,
      resources,
      csrf: getCsrfToken()
    }
  );
  if (response.code !== 0) {
    throw new Error(`Failed to delete from favorite: ${response.message}`);
  }
}

/**
 * 视频添加/删除到收藏夹
 */
export async function addOrDeleteToFavorite(
  resourceId: number,
  resourceType: number,
  addFavoriteIds: number[] = [],
  delFavoriteIds: number[] = []
): Promise<void> {
  // B站API一次只能添加/删除一个资源
  const response = await biliApiClient.post(
    'https://api.bilibili.com/x/v3/fav/resource/deal',
    {
      rid: resourceId,
      type: resourceType,
      add_media_ids: addFavoriteIds.join(','),
      del_media_ids: delFavoriteIds.join(','),
      csrf: getCsrfToken()
    }
  );
  if (response.code !== 0) {
    throw new Error(`Failed to add or delete to favorite: ${response.message}`);
  }
}

/**
 * 移动收藏夹中的视频到另一个收藏夹
 */
export async function moveToFavorite(
  fromFavoriteId: number,
  toFavoriteId: number,
  resourceIds: Array<{ id: number; type: number }>
): Promise<void> {
  const resources = resourceIds.map(r => `${r.id}:${r.type}`).join(',');
  const response = await biliApiClient.post(
    'https://api.bilibili.com/x/v3/fav/resource/move',
    {
      src_media_id: fromFavoriteId.toString(),
      tar_media_id: toFavoriteId.toString(),
      resources,
      csrf: getCsrfToken()
    }
  );
  if (response.code !== 0) {
    throw new Error(`Failed to move to favorite: ${response.message}`);
  }
}

/**
 * 获取收藏夹中的资源ID列表
 */
export async function getFavoriteResourceIds(favoriteId: number): Promise<number[]> {
  const response = await biliApiClient.get(
    'https://api.bilibili.com/x/v3/fav/resource/ids',
    { media_id: favoriteId }
  );
  if (response.code !== 0) {
    throw new Error(`Failed to get favorite resource ids: ${response.message}`);
  }
  return response.data;
}

/**
 * 获取用户动态列表
 */
export async function getDynamicList(uid?: number, offset: string = ''): Promise<any> {
  const response = await biliApiClient.get(
    'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space',
    {
      offset,
      host_mid: uid || getUserId(),
      timezone_offset: -480,
    }
  );
  if (response.code !== 0) {
    throw new Error(`Failed to get dynamic list: ${response.message}`);
  }
  return response.data;
}

/**
 * 删除动态
 */
export async function deleteDynamic(dynamicId: string): Promise<void> {
  const response = await biliApiClient.post(
    'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/rm_dynamic',
    { dynamic_id: dynamicId },
    undefined
  );
  if (response.code !== 0) {
    throw new Error(`Failed to delete dynamic: ${response.message}`);
  }
}

/**
 * 获取抽奖信息
 */
export async function getLotteryInfo(dynamicId: string): Promise<any> {
  const response = await biliApiClient.get(
    'https://api.vc.bilibili.com/lottery_svr/v1/lottery_svr/lottery_notice',
    {
      business_id: dynamicId,
      business_type: '1',
      csrf: getCsrfToken(),
      web_location: '333.1330'
    }
  );
  if (response.code !== 0) {
    throw new Error(`Failed to get lottery info: ${response.message}`);
  }
  return response.data;
}

/**
 * 获取视频信息
 * @param videoId 视频ID，可以是BV号或AV号
 */
export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  videoId = videoId.trim();
  const url = `https://api.bilibili.com/x/web-interface/view`
  const response = await biliApiClient.get(url, {
    bvid: videoId.toLocaleUpperCase().startsWith('BV') ? videoId : undefined,
    aid: videoId.toLocaleUpperCase().startsWith('AV') ? parseInt(videoId.slice(2)) : undefined,
  });
  if (response.code !== 0) {
    throw new Error(`Failed to get video info: ${response.message}`);
  }
  return response.data;
}


/*
 * 获取收藏夹列表
 */
export async function getFavoriteList(uid?: string): Promise<FavoriteList> {
  const response = await biliApiClient.get<FavoriteList>(
    'https://api.bilibili.com/x/v3/fav/folder/created/list-all',
    { up_mid: uid || getUserId() }
  );
  if (response.code !== 0) {
    throw new Error(`Failed to get favorite list: ${response.message}`);
  }
  return response.data;
}
