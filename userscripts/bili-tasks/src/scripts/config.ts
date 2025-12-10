import { ScriptConfig } from '../types';

/**
 * 所有脚本的配置定义
 */
const ALL_SCRIPT_CONFIGS: ScriptConfig[] = [
  // 工具脚本
  {
    id: 'bv2av',
    name: 'BV/AV号转换',
    description: '将B站的BV号转换为AV号，或反之',
    category: 'tool',
    isRunning: false,
    parameters: [
      {
        key: 'videoId',
        label: '视频ID',
        type: 'text',
        defaultValue: '',
        required: true,
        placeholder: '输入BV号或AV号，如：BV1L9Uoa9EUx 或 av111298867365120',
        description: '支持BV号和AV号格式'
      }
    ]
  },
  {
    id: 'show_resource_info',
    name: '获取视频信息',
    description: '获取B站视频的详细信息',
    category: 'tool',
    isRunning: false,
    parameters: [
      {
        key: 'videoIds',
        label: '视频ID列表',
        type: 'textarea',
        defaultValue: '',
        required: true,
        placeholder: '每行一个视频ID，支持BV号或AV号',
        description: '批量获取多个视频的信息'
      }
    ]
  },
  
  // 操作脚本
  {
    id: 'move_favorite_to_toview',
    name: '移动收藏夹视频到稍后再看',
    description: '从收藏夹中按指定规则选择视频添加到稍后再看',
    category: 'operation',
    isRunning: false,
    parameters: [
      {
        key: 'favoriteId',
        label: '收藏夹ID',
        type: 'number',
        defaultValue: '',
        required: true,
        description: '要操作的收藏夹ID'
      },
      {
        key: 'sortOrder',
        label: '排序规则',
        type: 'select',
        defaultValue: 'original',
        required: false,
        description: '选择视频的排序方式，影响添加到稍后再看的顺序，不影响视频在收藏夹中的顺序',
        options: [
          { value: 'original', label: '收藏夹原始顺序' },
          { value: 'shortest', label: '按时长从短到长排序' },
          { value: 'longest', label: '按时长从长到短排序' },
          { value: 'play_asc', label: '按播放数从少到多排序' },
          { value: 'play_desc', label: '按播放数从多到少排序' }
        ]
      },
      {
        key: 'shuffleVideos',
        label: '启用有偏向随机选择',
        type: 'boolean',
        defaultValue: false,
        required: false,
        description: '在排序基础上增加随机性，排序靠前的视频有更高被选中概率，兼顾排序偏好和观看多样性'
      },
      {
        key: 'upTo',
        label: '稍后再看目标数量',
        type: 'number',
        defaultValue: 100,
        required: true,
        description: '稍后再看补全到多少个资源(上限1000)'
      },
      {
        key: 'durationThreshold',
        label: '时长阈值(秒)',
        type: 'number',
        defaultValue: 1800,
        required: false,
        description: '超过这个时长的视频不添加，0表示不限制'
      },
      {
        key: 'ignoreFrontPage',
        label: '忽略前几页',
        type: 'number',
        defaultValue: 6,
        required: false,
        description: '忽略收藏夹前几页的内容'
      },
      {
        key: 'ignoreTitleKeywords',
        label: '忽略标题关键词',
        type: 'text',
        defaultValue: 'asmr,助眠,音声,触发音',
        required: false,
        description: '忽略标题中包含这些关键词的视频，用逗号分隔'
      }
    ]
  },
  {
    id: 'add_toview_to_favorite',
    name: '稍后再看添加到收藏夹',
    description: '把稍后再看的视频添加到指定收藏夹',
    category: 'operation',
    isRunning: false,
    parameters: [
      {
        key: 'favoriteId',
        label: '目标收藏夹ID',
        type: 'number',
        defaultValue: '',
        required: true,
        description: '要添加到的收藏夹ID'
      },
      {
        key: 'maxCount',
        label: '最大添加数量',
        type: 'number',
        defaultValue: 0,
        required: false,
        description: '最多添加多少个视频，0表示全部添加'
      },
      {
        key: 'disableSpaceCheck',
        label: '关闭收藏夹剩余空间检查',
        type: 'boolean',
        defaultValue: false,
        required: false,
        description: '启用后将跳过收藏夹容量检查，适用于添加重复视频的场景（重复视频不占用额外空间）'
      }
    ]
  },
  {
    id: 'move_favorite_to_another',
    name: '移动收藏夹视频',
    description: '将一个收藏夹的视频移动到另一个收藏夹',
    category: 'operation',
    isRunning: false,
    parameters: [
      {
        key: 'fromFavorite',
        label: '源收藏夹ID',
        type: 'number',
        defaultValue: '',
        required: true,
        description: '被移动的收藏夹ID'
      },
      {
        key: 'toFavorite',
        label: '目标收藏夹ID',
        type: 'number',
        defaultValue: '',
        required: true,
        description: '移动到的收藏夹ID'
      },
      {
        key: 'upTo',
        label: '目标收藏夹上限',
        type: 'number',
        defaultValue: 1000,
        required: true,
        description: '目标收藏夹的视频数上限'
      },
      {
        key: 'onlyWithKeywords',
        label: '仅移动包含关键词的视频',
        type: 'text',
        defaultValue: '',
        required: false,
        placeholder: '用逗号分隔多个关键词',
        description: '只移动标题中包含这些关键词的视频，空表示不过滤'
      }
    ]
  },
  {
    id: 'delete_timeout_lottery',
    name: '删除过期抽奖动态',
    description: '删除已过期的抽奖动态（仅限官方抽奖工具）',
    category: 'operation',
    isRunning: false,
    parameters: [
      {
        key: 'detectOnly',
        label: '仅检测不删除',
        type: 'boolean',
        defaultValue: false,
        required: false,
        description: '开启后只检测过期动态，不执行删除操作'
      },
      {
        key: 'notDeleteWinning',
        label: '不删除中奖动态',
        type: 'boolean',
        defaultValue: true,
        required: false,
        description: '不删除已中奖的抽奖动态'
      },
      {
        key: 'userId',
        label: '用户ID',
        type: 'number',
        defaultValue: '',
        required: false,
        description: '指定用户ID，不填则为当前登录用户。 填其他人可以扫描其他人的动态，但无法删除。'
      }
    ]
  },
  {
    id: 'clear_toview',
    name: '清空稍后再看',
    description: '由于新版「稍后再看」移除了清空按钮，特出该脚本以删除所有「稍后再看」的视频。',
    category: 'operation',
    isRunning: false,
    parameters: [
      {
        key: 'confirm',
        label: '确认清空',
        type: 'boolean',
        defaultValue: false,
        required: true,
        description: '确认要清空稍后再看列表（此操作不可恢复）'
      }
    ]
  }
];

/**
 * 导出的脚本配置列表（过滤掉禁用的脚本）
 */
export const SCRIPT_CONFIGS: ScriptConfig[] = ALL_SCRIPT_CONFIGS.filter(script => !script.disabled);
