import { ScriptExecutor } from './base';
import { containsAnyKeyword } from '@/utils/helpers';
import {
  getToViewList,
  getFavoriteResourceList,
  addToToView,
  clearToViewList,
  addOrDeleteToFavorite,
  moveToFavorite,
  getDynamicList,
  deleteDynamic,
  getLotteryInfo,
  getVideoInfo,
  getFavoriteInfo,
  deleteFromFavorite
} from '@/api/bili';
import { av2bv, bv2av, isValidAid } from '@/utils/bvConverter';
import { VideoInfo } from '@/types';

/**
 * BV/AV号转换执行器
 */
export class BvAvConverterExecutor extends ScriptExecutor {
  public async execute(parameters: Record<string, any>): Promise<any> {
    const { videoId } = parameters;

    if (!videoId) {
      throw new Error('请输入视频ID');
    }

    this.log('info', `开始转换视频ID: ${videoId}`);
    this.log('debug', `输入参数: ${JSON.stringify(parameters)}`);
    this.updateProgress(10);

    try {
      let result: { input: string; output: string; type: string };

      if (videoId.startsWith('BV')) {
        this.log('debug', `检测到BV号格式，准备转换为AV号`);
        const aid = bv2av(videoId);
        this.log('debug', `转换结果: BV号 ${videoId} → AV号 ${aid}`);
        this.updateProgress(50);
        result = {
          input: videoId,
          output: `av${aid}`,
          type: 'BV → AV'
        };
        this.log('success', `转换成功: ${videoId} → av${aid}`);
      } else if (videoId.startsWith('av')) {
        const aid = parseInt(videoId.slice(2));
        if (!isValidAid(aid)) {
          throw new Error('无效的AV号格式');
        }
        const bvid = av2bv(aid);
        result = {
          input: videoId,
          output: bvid,
          type: 'AV → BV'
        };
        this.log('success', `转换成功: ${videoId} → ${bvid}`);
      } else {
        // 尝试从数字解析为AV号
        const aid = parseInt(videoId);
        if (isValidAid(aid)) {
          const bvid = av2bv(aid);
          result = {
            input: `av${aid}`,
            output: bvid,
            type: 'AV → BV'
          };
          this.log('success', `转换成功: av${aid} → ${bvid}`);
        } else {
          throw new Error('无法识别的视频ID格式，请输入BV号或AV号');
        }
      }

      this.updateProgress(100);
      return result;
    } catch (error) {
      this.log('error', `转换失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

/**
 * 视频信息获取执行器
 */
export class VideoInfoExecutor extends ScriptExecutor {
  public async execute(parameters: Record<string, any>): Promise<any> {
    const { videoIds } = parameters;

    if (!videoIds) {
      throw new Error('请输入视频ID列表');
    }

    const idList = videoIds.split('\n').filter((id: string) => id.trim()).map((id: string) => id.trim());
    if (idList.length === 0) {
      throw new Error('请输入至少一个视频ID');
    }

    this.log('info', `开始获取 ${idList.length} 个视频的信息`);
    this.setTotalSteps(idList.length);

    const results: any[] = [];
    const total = idList.length;

    for (let i = 0; i < total; i++) {
      this.checkShouldStop();

      const videoId = idList[i];
      this.log('info', `正在处理: ${videoId} (${i + 1}/${total})`);

      try {
        const info = await getVideoInfo(videoId);

        results.push({
          id: videoId,
          title: info.title,
          duration: info.duration || 0,
          bvid: info.bvid,
          aid: info.aid,
          type: info.type
        });

        this.log('success', `获取成功: ${videoId} - ${info.title}`);
      } catch (error) {
        this.log('error', `获取失败: ${videoId} - ${error instanceof Error ? error.message : String(error)}`);
        results.push({
          id: videoId,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      this.updateProgress(i + 1, total);
    }

    const successCount = results.filter(r => !r.error).length;
    const failCount = results.filter(r => r.error).length;

    this.log('success', `视频信息获取任务完成！成功获取 ${successCount} 个视频信息，失败 ${failCount} 个`);
    if (successCount > 0) {
      this.log('info', `成功获取的视频：${results.filter(r => !r.error).map(r => r.title).join(', ')}`);
    }

    return { results, total: results.length, successCount, failCount };
  }
}

/**
 * 移动收藏夹视频到稍后再看执行器
 */
export class MoveFavoriteToToviewExecutor extends ScriptExecutor {

  /**
   * 计算基于位置的线性递减权重
   * @param totalCount 视频总数
   * @param position 视频在排序后列表中的位置（从0开始）
   * @returns 权重值
   */
  private calculatePositionWeight(totalCount: number, position: number): number {
    return Math.max(1, totalCount - position);
  }

  /**
   * 使用轮盘赌算法进行加权随机选择
   * @param videos 已排序的视频列表
   * @param targetCount 目标选择数量
   * @returns 加权随机选择后的视频列表
   */
  private performWeightedRandomSelection(videos: any[], targetCount: number): any[] {
    if (videos.length === 0 || targetCount <= 0) {
      return [];
    }

    const totalCount = videos.length;
    const actualTargetCount = Math.min(targetCount, totalCount);
    const selected: any[] = [];
    const availableVideos = [...videos]; // 创建副本避免修改原数组

    this.log('debug', `开始有偏向随机选择，目标数量: ${actualTargetCount}`);

    // 计算初始权重分布统计
    const weights = availableVideos.map((_, index) => this.calculatePositionWeight(totalCount, index));
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length;

    this.log('debug', `权重分布: 最高${maxWeight}, 最低${minWeight}, 平均${avgWeight.toFixed(1)}`);

    // 执行加权随机选择
    for (let i = 0; i < actualTargetCount && availableVideos.length > 0; i++) {
      // 重新计算当前可用视频的权重
      const currentWeights = availableVideos.map((_, index) =>
        this.calculatePositionWeight(availableVideos.length, index)
      );

      // 轮盘赌选择
      const selectedIndex = this.rouletteWheelSelection(currentWeights);
      selected.push(availableVideos[selectedIndex]);

      // 从可用列表中移除已选择的视频
      availableVideos.splice(selectedIndex, 1);
    }

    // 统计选择结果分布
    this.logSelectionDistribution(videos, selected, totalCount);

    return selected;
  }

  /**
   * 轮盘赌选择算法
   * @param weights 权重数组
   * @returns 选中的索引
   */
  private rouletteWheelSelection(weights: number[]): number {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const randomValue = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (randomValue <= cumulativeWeight) {
        return i;
      }
    }

    // 兜底返回最后一个索引（理论上不应该到达这里）
    return weights.length - 1;
  }

  /**
   * 记录选择结果的分布统计
   * @param originalVideos 原始排序后的视频列表
   * @param selectedVideos 选择后的视频列表
   * @param totalCount 原始视频总数
   */
  private logSelectionDistribution(originalVideos: any[], selectedVideos: any[], totalCount: number): void {
    // 计算选择的视频在原始列表中的位置分布
    const positions = selectedVideos.map(selected =>
      originalVideos.findIndex(original => original.id === selected.id)
    );

    // 分层统计：前20%、中间60%、后20%
    const topTier = Math.ceil(totalCount * 0.2);
    const middleTier = Math.ceil(totalCount * 0.8);

    const topTierCount = positions.filter(pos => pos < topTier).length;
    const middleTierCount = positions.filter(pos => pos >= topTier && pos < middleTier).length;
    const bottomTierCount = positions.filter(pos => pos >= middleTier).length;

    this.log('debug', `有偏向随机选择完成，实际选择分布:`);
    this.log('debug', `前20%区间选中: ${topTierCount}个 (${(topTierCount/selectedVideos.length*100).toFixed(1)}%)`);
    this.log('debug', `中间60%区间选中: ${middleTierCount}个 (${(middleTierCount/selectedVideos.length*100).toFixed(1)}%)`);
    this.log('debug', `后20%区间选中: ${bottomTierCount}个 (${(bottomTierCount/selectedVideos.length*100).toFixed(1)}%)`);

    // 显示前几个被选中视频的原始位置
    const topSelectedPositions = positions.slice(0, Math.min(5, positions.length)).sort((a, b) => a - b);
    this.log('debug', `前5个选中视频的原始排序位置: [${topSelectedPositions.map(p => p + 1).join(', ')}]`);
  }

  public async execute(parameters: Record<string, any>): Promise<any> {
    const { favoriteId, sortOrder, shuffleVideos, upTo, durationThreshold, ignoreFrontPage, ignoreTitleKeywords } = parameters;

    if (!favoriteId) {
      throw new Error('请输入收藏夹ID');
    }

    this.log('info', `开始从收藏夹 ${favoriteId} 移动视频到稍后再看`);
    this.updateProgress(10);

    // 考虑以后能够使用更多的过滤参数，这里逐页获取视频列表
    const ignoreTitleKeywordList: string[] = ignoreTitleKeywords ? ignoreTitleKeywords.split(',').map((k: string) => k.trim()) : [];
    const maxCount = upTo || 1000;
    let needCount = maxCount;
    const maxDuration = durationThreshold || 0;
    const ignorePageCount = ignoreFrontPage ?? 0;

    let originVideoInfos: VideoInfo[] = [];
    let willMoveVideoInfos: VideoInfo[] = [];

    // 获取稍后再看当前数量
    try {
      this.log('info', `正在获取稍后再看当前数量...`);
      this.checkShouldStop();
      const toviewList = await getToViewList();
      const currentCount = toviewList.count;
      needCount = maxCount - currentCount;
      let log = `稍后再看当前视频数量: ${currentCount}/1000`
      log += `\n还需要添加: ${needCount}`;
      if (needCount <= 0) {
        log += `\n稍后再看已达到目标数量，无需添加更多视频`;
        this.log('info', log);
        return { added: 0, currentCount, needCount };
      }
      this.log('info', log);
      this.updateProgress(40);
    } catch (error) {
      this.log('error', `获取稍后再看数量失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }

    // 获取源收藏夹所有视频
    try {
      this.log('info', `正在获取源收藏夹所有视频...`);
      let pageIndex = 1;
      const pageSize = 20;
      while (true) {
        this.checkShouldStop();
        if (pageIndex <= ignorePageCount) {
          this.log('debug', `忽略第 ${pageIndex} 页视频...`);
          pageIndex++;
          continue;
        }
        const pageInfo = await getFavoriteResourceList(favoriteId, pageIndex, pageSize);
        originVideoInfos.push(...pageInfo.medias);
        // 使用更合理的进度计算：20% + 当前页数的进度
        const pageProgress = Math.min(70, (pageIndex - 1) * 5); // 每页增加5%，最多70%
        this.updateProgress(20 + pageProgress);
        this.log('debug', `已获取 ${originVideoInfos.length} 个视频`);
        if (!pageInfo.has_more) break;
        pageIndex++;
      }
    } catch (error) {
      this.log('error', `获取源收藏夹视频失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }

    // 根据排序规则对视频进行排序
    const sortOrderValue = sortOrder || 'original';
    const shuffleEnabled = shuffleVideos === true;

    this.log('debug', `正在按 ${sortOrderValue} 规则排序视频`);
    switch (sortOrderValue) {
      case 'shortest':
        originVideoInfos = originVideoInfos.sort((a, b) => a.duration - b.duration);
        let log = `已按时长从短到长排序`;
        if (originVideoInfos.length > 0) {
          log += `最短视频: ${originVideoInfos[0].title} (${originVideoInfos[0].duration}秒)`;
          log += `\n最长视频: ${originVideoInfos[originVideoInfos.length - 1].title} (${originVideoInfos[originVideoInfos.length - 1].duration}秒)`;
        }
        this.log('debug', log);
        break;
      case 'longest':
        originVideoInfos = originVideoInfos.sort((a, b) => b.duration - a.duration);
        log = `已按时长从长到短排序`;
        if (originVideoInfos.length > 0) {
          log += `\n最长视频: ${originVideoInfos[0].title} (${originVideoInfos[0].duration}秒)`;
          log += `\n最短视频: ${originVideoInfos[originVideoInfos.length - 1].title} (${originVideoInfos[originVideoInfos.length - 1].duration}秒)`;
        }
        this.log('debug', log);
        break;
      case 'play_asc':
        originVideoInfos = originVideoInfos.sort((a, b) => (a.cnt_info?.play || 0) - (b.cnt_info?.play || 0));
        log = `已按播放数从少到多排序`;
        if (originVideoInfos.length > 0) {
          log += `\n播放数最少视频: ${originVideoInfos[0].title} (${originVideoInfos[0].cnt_info?.play || 0}次播放)`;
          log += `\n播放数最多视频: ${originVideoInfos[originVideoInfos.length - 1].title} (${originVideoInfos[originVideoInfos.length - 1].cnt_info?.play || 0}次播放)`;
        }
        this.log('debug', log);
        break;
      case 'play_desc':
        originVideoInfos = originVideoInfos.sort((a, b) => (b.cnt_info?.play || 0) - (a.cnt_info?.play || 0));
        log = `已按播放数从多到少排序`;
        if (originVideoInfos.length > 0) {
          log += `\n播放数最多视频: ${originVideoInfos[0].title} (${originVideoInfos[0].cnt_info?.play || 0}次播放)`;
          log += `\n播放数最少视频: ${originVideoInfos[originVideoInfos.length - 1].title} (${originVideoInfos[originVideoInfos.length - 1].cnt_info?.play || 0}次播放)`;
        }
        this.log('debug', log);
        break;
      case 'original':
      default:
        // 保持收藏夹原始顺序，实际上是要倒序。最后添加到收藏夹的视频应该最后添加到稍后再看。
        originVideoInfos = originVideoInfos.reverse();
        break;
    }

    // 先进行过滤，获取符合条件的视频
    const filteredVideoInfos: any[] = [];
    for (const video of originVideoInfos) {
      // 检查标题是否包含忽略关键词
      if (ignoreTitleKeywordList.length > 0 && containsAnyKeyword(video.title, ignoreTitleKeywordList)) {
        continue;
      }
      // 检查时长是否超过阈值
      if (maxDuration > 0 && video.duration > maxDuration) {
        continue;
      }
      filteredVideoInfos.push(video);
    }
    this.log('debug', `视频过滤完成，共 ${filteredVideoInfos.length} 个视频符合条件`);

    // 根据是否启用有偏向随机选择来决定最终的视频列表
    if (shuffleEnabled && filteredVideoInfos.length > 0) {
      this.log('info', '已启用有偏向随机选择，将基于排序结果进行加权随机选择');
      willMoveVideoInfos = this.performWeightedRandomSelection(filteredVideoInfos, needCount);
    } else {
      // 传统模式：按排序顺序选择
      willMoveVideoInfos = filteredVideoInfos.slice(0, needCount);
    }
    let log = `排序、过滤和选择完成，共 ${willMoveVideoInfos.length} 个视频将被添加`;
    log += `\n排序规则: ${sortOrderValue}`;
    log += `\n有偏向随机选择: ${shuffleEnabled ? '已启用' : '未启用'}`;
    if (shuffleEnabled) {
      log += `\n选择方式: 基于排序位置的加权随机选择`;
    } else {
      log += `\n选择方式: 按排序顺序依次选择`;
    }
    log += `\n将要移动的视频列表: ${willMoveVideoInfos.map(v => v.title).join(', ')}`;
    this.log('debug', log);
    this.updateProgress(30);

    // 添加视频到稍后再看
    this.log('info', `正在添加视频到稍后再看...`);
    for (let i = 0; i < willMoveVideoInfos.length; i++) {
      this.checkShouldStop();
      const video = willMoveVideoInfos[i];
      this.log('debug', `正在添加: ${video.title} (${i + 1}/${willMoveVideoInfos.length})`);
      try {
        await addToToView(video.id);
        this.log('success', `添加成功: ${video.title}`);
      } catch (error) {
        this.log('error', `添加失败: ${video.title} - ${error instanceof Error ? error.message : String(error)}`);
      }
      // 30% + 60% * 当前进度
      this.updateProgress(30 + Math.floor((i + 1) / willMoveVideoInfos.length * 60));
    }
    this.log('success', `共添加 ${willMoveVideoInfos.length} 个视频到稍后再看`);

    // 从收藏夹中删除
    this.log('info', `正在从收藏夹中删除已移动的视频...`);
    try {
      await deleteFromFavorite(favoriteId, willMoveVideoInfos.map(v => ({ id: v.id, type: v.type }))
      );
      this.log('success', `删除成功`);
      this.updateProgress(100);
    } catch (error) {
      this.log('error', `删除失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
    this.log('success', `共删除 ${willMoveVideoInfos.length} 个视频从收藏夹`);
  }
}

/**
 * 稍后再看添加到收藏夹执行器
 */
export class AddToviewToFavoriteExecutor extends ScriptExecutor {
  public async execute(parameters: Record<string, any>): Promise<any> {
    const { favoriteId, maxCount, disableSpaceCheck } = parameters;

    if (!favoriteId) {
      throw new Error('请输入收藏夹ID');
    }

    this.log('info', `开始将稍后再看的视频添加到收藏夹 ${favoriteId}`);
    this.updateProgress(5);

    try {
      // 获取稍后再看列表
      const toviewList = await getToViewList();
      if (!toviewList.list || toviewList.list.length === 0) {
        this.log('info', '稍后再看列表为空');
        return { added: 0, total: 0 };
      }

      const maxAdd = maxCount || toviewList.list.length;
      const videosToAdd = toviewList.list.slice(0, maxAdd).reverse(); // 稍后再看最新的视频添加到收藏夹最新的位置

      this.log('info', `准备添加 ${videosToAdd.length} 个视频到收藏夹`);
      this.updateProgress(10);

      // 根据参数决定是否进行容量检查
      if (disableSpaceCheck) {
        this.log('info', '已关闭空间检查，将跳过容量验证');
      } else {
        // 获取收藏夹当前信息，检查容量
        this.log('debug', '正在检查收藏夹容量...');
        const favoriteInfo = await getFavoriteInfo(favoriteId);
        const currentCount = favoriteInfo.media_count;
        const toAddCount = videosToAdd.length;
        const remainingSpace = 1000 - currentCount;

        let log = `收藏夹当前视频数量: ${currentCount}/1000`
        log += `\n待添加视频数量: ${toAddCount}`;
        log += `\n剩余空间: ${remainingSpace}`;
        this.log('debug', log);

        if (currentCount + toAddCount > 1000) {
          this.log('error', `收藏夹空间不足，无法添加所有视频。当前: ${currentCount}，待添加: ${toAddCount}，剩余空间: ${remainingSpace}`);
          throw new Error('收藏夹空间不足，无法添加所有视频');
        }
      }

      this.updateProgress(20);

      // 逐个添加视频到收藏夹（API不支持多个视频批量添加到一个收藏夹）
      let addedCount = 0;
      const total = videosToAdd.length;

      this.log('debug', `开始逐个添加 ${total} 个视频到收藏夹`);
      // 设置基于步骤的进度管理，从20%开始，到90%结束
      this.setTotalSteps(total);

      for (let i = 0; i < total; i++) {
        this.checkShouldStop();

        const video = videosToAdd[i];
        let log = `正在添加: ${video.title} (${i + 1}/${total})`
        this.log('debug', log);

        try {
          // 使用正确的API：一个视频添加到一个收藏夹
          await addOrDeleteToFavorite(video.aid, 2, [favoriteId], []);
          addedCount++;
          log += `\n添加成功: ${video.title}`;
          this.log('success', log);
        } catch (error) {
          log += `\n添加失败: ${error instanceof Error ? error.message : String(error)}`;
          this.log('error', log);
          throw error;
        }

        // 使用基于步骤的进度：20% + 70% * 当前进度
        this.updateProgress(20 + Math.floor((i + 1) / total * 70));
      }

      this.log('success', `操作完成，成功添加 ${addedCount}/${total} 个视频到收藏夹`);
      if (addedCount > 0) {
        this.log('info', `成功添加的视频：${videosToAdd.slice(0, addedCount).map(v => v.title).join(', ')}`);
      }

      return {
        added: addedCount,
        total,
        videos: videosToAdd.slice(0, addedCount).map(v => ({ id: v.id, title: v.title }))
      };

    } catch (error) {
      this.log('error', `操作失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

/**
 * 移动收藏夹视频执行器
 */
export class MoveFavoriteExecutor extends ScriptExecutor {
  public async execute(parameters: Record<string, any>): Promise<any> {
    const { fromFavorite, toFavorite, upTo, onlyWithKeywords } = parameters;

    if (!fromFavorite || !toFavorite) {
      throw new Error('请输入源收藏夹ID和目标收藏夹ID');
    }

    this.log('info', `开始从收藏夹 ${fromFavorite} 移动视频到收藏夹 ${toFavorite}`);
    this.updateProgress(10);

    // 考虑以后能够使用更多的过滤参数，这里逐页获取视频列表
    const keywords: string[] = onlyWithKeywords ? onlyWithKeywords.split(',').map((k: string) => k.trim()) : [];
    const maxCount = upTo || 1000;

    const originVideoInfos: VideoInfo[] = [];
    const willMoveVideoInfos: VideoInfo[] = [];

    // 获取源收藏夹所有视频
    try {
      this.log('info', `正在获取源收藏夹所有视频...`);
      let pageIndex = 1;
      const pageSize = 20;
      while (true) {
        this.checkShouldStop();
        const pageInfo = await getFavoriteResourceList(fromFavorite, pageIndex, pageSize);
        originVideoInfos.push(...pageInfo.medias);
        // 修复分页进度计算：每页增加3%，最多到50%
        const pageProgress = Math.min(30, (pageIndex - 1) * 3);
        this.updateProgress(20 + pageProgress);
        this.log('debug', `已获取 ${originVideoInfos.length} 个视频`);
        if (!pageInfo.has_more) break;
        pageIndex++;
      }
    } catch (error) {
      this.log('error', `获取源收藏夹视频失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }

    // 过滤视频
    this.log('debug', `正在过滤视频...`);
    for (const video of originVideoInfos) {
      if (keywords.length > 0 && !containsAnyKeyword(video.title, keywords)) {
        continue;
      }
      willMoveVideoInfos.push(video);
      if (willMoveVideoInfos.length >= maxCount) break;
    }
    let log = `过滤完成，共 ${willMoveVideoInfos.length} 个视频符合条件`;
    log += `\n将要移动的视频列表: ${willMoveVideoInfos.map(v => v.title).join(', ')}`;
    this.log('debug', log);
    this.updateProgress(30);

    // 获取目标收藏夹信息
    try {
      this.log('info', `正在获取目标收藏夹信息...`);
      this.checkShouldStop();
      const targetFavoriteInfo = await getFavoriteInfo(toFavorite);
      const currentCount = targetFavoriteInfo.media_count;
      const remainingSpace = 1000 - currentCount;
      log = `目标收藏夹当前视频数量: ${currentCount}/1000`
      log += `\n剩余空间: ${remainingSpace}`;
      this.log('info', log);
      // 判断是否有足够的空间
      if (willMoveVideoInfos.length > remainingSpace) {
        this.log('error', `目标收藏夹空间不足，无法移动所有视频。当前: ${currentCount}，待添加: ${willMoveVideoInfos.length}，剩余空间: ${remainingSpace}`);
        throw new Error('目标收藏夹空间不足，无法移动所有视频');
      }
    } catch (error) {
      this.log('error', `获取目标收藏夹信息失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
    this.updateProgress(40);

    // 移动视频
    this.log('info', `正在移动视频...`);
    try {
      this.checkShouldStop();
      await moveToFavorite(
        fromFavorite,
        toFavorite,
        willMoveVideoInfos.map(v => ({ id: v.id, type: v.type }))
      );
    } catch (error) {
      this.log('error', `视频移动失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }

    this.log('success', `操作完成，共移动 ${willMoveVideoInfos.length} 个视频`);
    return { moved: willMoveVideoInfos.length, maxCount };
  }
}

/**
 * 删除过期抽奖动态执行器
 */
export class DeleteTimeoutLotteryExecutor extends ScriptExecutor {
  public async execute(parameters: Record<string, any>): Promise<any> {
    const { detectOnly, notDeleteWinning, userId } = parameters;

    this.log('info', `开始${detectOnly ? '检测' : '删除'}过期抽奖动态`);

    let log = `执行参数: ${JSON.stringify(parameters)}。`
    log += `\n仅检测模式: ${detectOnly ? '是' : '否'}。`
    log += `\n保护中奖动态: ${notDeleteWinning ? '是' : '否'}。`
    log += `\n目标用户: ${userId || '当前登录用户'}。`
    log += '\n========== 开始执行过期抽奖动态处理 ==========';
    this.log('debug', log);
    this.updateProgress(10);

    try {
      let deletedCount = 0;
      let detectedCount = 0;
      let listOffset: string = '';

      while (true) {
        this.checkShouldStop();

        this.log('info', '正在获取动态列表...');
        this.log('debug', `请求参数: userId=${userId || '当前用户'}, offset=${listOffset || '初始页面'}`);
        const dynamicData = await getDynamicList(userId, listOffset);
        const hasMore: boolean = dynamicData.has_more;
        listOffset = dynamicData.offset;

        for (let i = 0; i < dynamicData.items.length; i++) {
          const item = dynamicData.items[i];
          this.checkShouldStop();

          this.log('debug', `---------- 处理动态 ${i + 1}/${dynamicData.items.length} ----------`);
          // 更合理的进度计算：每页动态处理进度
          const pageProgress = Math.floor((i / dynamicData.items.length) * 15); // 每页最多15%
          this.updateProgress(10 + pageProgress);

          // 动态基本信息
          const dynamicId: string = item.id_str
          const publisherInfo = item.modules.module_author
          const publisherId: number = publisherInfo.mid
          const publishTimestamp: number = publisherInfo.pub_ts
          const dynamicText: string | undefined = item.modules.module_dynamic.desc?.text.replace("\n", '');
          const dynamicType = item.type;
          log = `动态ID: ${item.id_str}`
          log += `\n发布时间：${new Date(publishTimestamp * 1000).toLocaleString('zh-CN')}`;
          log += `\n动态类型: ${dynamicType}`;
          log += `\n动态内容: ${dynamicText}`;

          // 跳过非转发动态
          if (dynamicType !== 'DYNAMIC_TYPE_FORWARD') {
            log += `\n非转发动态，跳过`;
            this.log('info', log);
            continue;
          }

          // 被转发动态基本信息
          const originDynamic = item.orig;
          const originDynamicId: string = originDynamic.id_str;
          const originDynamicPublisherInfo = originDynamic.modules.module_author;
          const originDynamicPublisherId: number = originDynamicPublisherInfo.mid;
          const originDynamicPublisherName: string = originDynamicPublisherInfo.name;
          const originDynamicPublishTimestamp: number = originDynamicPublisherInfo.pub_ts;
          const originDynamicType = originDynamic.type;
          log += `\n被转发动态ID: ${originDynamicId}`;
          log += `\n被转发动态发布者: ${originDynamicPublisherName}(${originDynamicPublisherId})`;
          log += `\n被转发动态发布时间: ${new Date(originDynamicPublishTimestamp * 1000).toLocaleString('zh-CN')}`;
          log += `\n被转发动态类型: ${originDynamicType}`;

          // 跳过非文本动态
          if (['DYNAMIC_TYPE_DRAW', 'DYNAMIC_TYPE_WORD'].indexOf(originDynamicType) === -1) {
            log += `\n被转发动态非文本动态类型，跳过`;
            this.log('info', log);
            continue;
          }

          // 判断是否为抽奖动态
          const hasLotteryNode = originDynamic.modules.module_dynamic.desc.rich_text_nodes.some(
            (node: any) => node.type === 'RICH_TEXT_NODE_TYPE_LOTTERY'
          );
          if (!hasLotteryNode) {
            log += `\n被转发动态非抽奖动态，跳过`;
            this.log('info', log);
            continue;
          }

          const originDynamicText: string | undefined = originDynamic.modules.module_dynamic.desc?.text.replace('\n', '');
          log += `\n被转发动态内容: ${originDynamicText}`;
          this.log('info', log);

          // 获取抽奖信息
          this.log('debug', '正在获取抽奖信息...');
          const lotteryInfo = await getLotteryInfo(originDynamicId);
          this.log('debug', `抽奖信息: ${JSON.stringify(lotteryInfo)}`);
          const lotteryStatus = lotteryInfo.status; // 0 等待开奖 2 已结束
          const lotteryTimestamp = lotteryInfo.lottery_time; // 开奖时间
          const lotteryParticipated = lotteryInfo.participated; // 是否参与(猜)
          const lotteryFollowed = lotteryInfo.followed; // 是否关注
          const lotteryReposted = lotteryInfo.reposted; // 是否转发
          log = `抽奖状态: ${lotteryStatus}`;
          log += `\n开奖时间: ${new Date(lotteryTimestamp * 1000).toLocaleString('zh-CN')}`;
          log += `\n是否参与: ${lotteryParticipated}`;
          log += `\n是否关注了发布者: ${lotteryFollowed}`;
          log += `\n是否转发了本动态: ${lotteryReposted}`;

          // 检查是否开奖
          const lotteryResult = lotteryInfo.lottery_result;
          if (!lotteryResult) {
            log += `\n未找到开奖结果，跳过`;
            this.log('info', log);
            continue;
          }

          // 检查是否中奖
          const win = Object.values(lotteryResult).some((userList: unknown) => {
            if (!Array.isArray(userList)) return false; // 确保 userList 是数组类型
            return userList.some((user: any) => user.uid === publisherId);
          });
          log += `\n是否中奖: ${win}`;

          // 仅检测
          detectedCount++;
          if (detectOnly) {
            log += `\n仅检测模式，跳过删除`;
            this.log('info', log);
            continue;
          }

          // 删除抽奖动态
          if (win && notDeleteWinning) {
            log += `\n不删除中奖动态，跳过`;
            this.log('info', log);
            continue;
          }

          // 删除动态
          this.log('debug', '正在删除动态...');
          await deleteDynamic(dynamicId);
          deletedCount++;
          this.log('debug', '动态删除成功');
        }

        this.log('debug', '========== 当前页面处理完成 ==========');
        if (!hasMore) {
          this.log('debug', '已到达最后一页，结束处理');
          break;
        }

        // 基于检测到的数量更新进度，但不超过85%
        const detectionProgress = Math.min(75, detectedCount * 3);
        this.updateProgress(10 + detectionProgress);
        this.log('debug', `当前进度: 已检测到 ${detectedCount} 个过期抽奖动态，已删除 ${deletedCount} 个`);
      }

      const message = detectOnly
        ? `检测完成，发现 ${detectedCount} 个过期抽奖动态`
        : `删除完成，共删除 ${deletedCount}/${detectedCount} 个过期抽奖动态`;

      this.log('success', message);
      return { detected: detectedCount, deleted: deletedCount, detectOnly };
    } catch (error) {
      this.log('error', `操作失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

/**
 * 清空稍后再看执行器
 */
export class ClearToviewExecutor extends ScriptExecutor {
  public async execute(parameters: Record<string, any>): Promise<any> {
    const { confirm } = parameters;

    if (!confirm) {
      throw new Error('请确认要清空稍后再看列表');
    }

    this.log('info', '开始清空稍后再看列表');
    this.updateProgress(20);

    try {
      // 获取当前稍后再看数量
      const toviewList = await getToViewList();
      const totalCount = toviewList.count;

      if (totalCount === 0) {
        this.log('info', '稍后再看列表已为空');
        return { cleared: 0, total: 0 };
      }

      this.log('info', `准备清空 ${totalCount} 个视频`);
      this.updateProgress(50);

      await clearToViewList();

      this.updateProgress(100);
      this.log('success', `成功清空稍后再看列表，共清除 ${totalCount} 个视频`);

      return { cleared: totalCount, total: totalCount };

    } catch (error) {
      this.log('error', `清空失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
