# 【哔哩哔哩】任务管理器 - 油猴脚本

！纯vibe

这是一个基于 Preact 构建的油猴脚本项目，将原有的 Python 脚本转换为浏览器环境下的自动化工具集合。

## ✨ 功能特性

- 🎯 **悬浮按钮**: 页面右下角的圆形悬浮按钮，不影响原页面布局
- 🎨 **全屏任务面板**: 点击悬浮按钮后显示的全屏任务管理界面
- 🔧 **工具脚本**: BV/AV号转换、视频信息获取等实用工具
- ⚙️ **操作脚本**: 收藏夹管理、稍后再看操作、动态清理等自动化任务
- 📊 **实时日志**: 右侧面板显示脚本执行状态和详细日志
- 🎭 **平滑动画**: 模态框支持向下滑动隐藏的动画效果
- 📱 **响应式设计**: 适配桌面和移动设备
- 🛡️ **样式隔离**: 避免与宿主页面样式冲突
- 🔄 **状态管理**: 支持多脚本并发执行和状态监控
- 💾 **数据持久化**: 使用油猴存储保存日志和参数配置
- 🎨 **优化界面**: 高对比度颜色方案，优化的布局比例
- ⚡ **真实API**: 移除Mock模式，实现真实的B站API调用

## 🛠️ 技术栈

- **框架**: Preact 10.26.9
- **构建工具**: Vite 6.3.5 + vite-plugin-monkey 5.0.9
- **语言**: TypeScript 5.8.3
- **包管理器**: pnpm
- **目标环境**: 哔哩哔哩收藏夹页面
- **API封装**: 基于油猴GM_xmlhttpRequest的HTTP客户端
- **限流算法**: 令牌桶算法防止API频率限制
- **状态管理**: 基于Preact Hooks的响应式状态管理

## 🚀 快速开始

### 开发环境设置

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd bili-tasks
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **启动开发服务器**
   ```bash
   pnpm dev
   ```

4. **构建生产版本**
   ```bash
   pnpm build
   ```

### 安装和使用

1. **安装油猴脚本管理器**
   - 推荐使用 [Tampermonkey](https://www.tampermonkey.net/)

2. **安装脚本**
   - 构建项目后，在 `dist/bili-tasks.user.js` 找到生成的脚本
   - 在 Tampermonkey 中创建新脚本，复制粘贴内容
   - 或者直接导入 `.user.js` 文件

3. **使用脚本**
   - 访问哔哩哔哩收藏夹页面 (`https://space.bilibili.com/*/favlist*`)
   - 在页面右下角会出现悬浮按钮
   - 点击按钮打开任务管理面板
   - 左侧选择要执行的脚本，配置参数后点击"开始执行"
   - 右侧查看实时执行日志和进度
   - 点击面板右上角的向下箭头关闭面板

## 📋 脚本功能说明

### 🔧 工具脚本

1. **BV/AV号转换**
   - 将B站的BV号转换为AV号，或反之
   - 支持批量转换和URL提取

2. **获取视频信息**
   - 批量获取B站视频的详细信息
   - 支持BV号和AV号输入

### ⚙️ 操作脚本

1. **移动最短视频到稍后再看**
   - 从收藏夹随机页中选择时长最短的视频添加到稍后再看
   - 支持时长阈值和关键词过滤

2. **稍后再看添加到收藏夹**
   - 把稍后再看的视频批量添加到指定收藏夹
   - 支持数量限制

3. **移动收藏夹视频**
   - 将一个收藏夹的视频移动到另一个收藏夹
   - 支持关键词过滤和数量限制

4. **移动单个视频**
   - 将指定视频从一个收藏夹移动到另一个收藏夹
   - 精确控制单个视频的移动

5. **删除过期抽奖动态**
   - 自动检测并删除已过期的抽奖动态
   - 支持保留中奖动态选项

6. **清空稍后再看**
   - 一键清空稍后再看列表
   - 包含确认机制防止误操作

## 📁 项目结构

```
bili-tasks/
├── src/
│   ├── api/                # API模块
│   │   ├── bili.ts              # B站API封装
│   │   └── client.ts            # HTTP客户端
│   ├── components/         # 组件目录
│   │   ├── FloatingButton.tsx   # 悬浮按钮组件
│   │   ├── FloatingButton.css
│   │   ├── Modal.tsx           # 模态框组件
│   │   ├── Modal.css
│   │   ├── TaskPanel.tsx       # 任务面板组件
│   │   ├── TaskPanel.css
│   │   ├── ScriptManager.tsx   # 脚本管理器
│   │   ├── ScriptManager.css
│   │   ├── ScriptCard.tsx      # 脚本卡片组件
│   │   ├── ScriptCard.css
│   │   ├── LogPanel.tsx        # 日志面板组件
│   │   └── LogPanel.css
│   ├── scripts/            # 脚本配置和执行器
│   │   ├── config.ts           # 脚本配置定义
│   │   └── executor.ts         # 脚本执行器
│   ├── utils/              # 工具函数
│   │   ├── tokenBucket.ts      # 令牌桶限流算法
│   │   ├── bvConverter.ts      # BV/AV号转换工具
│   │   └── helpers.ts          # 通用工具函数
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts
│   ├── app.tsx             # 主应用组件
│   └── main.tsx            # 入口文件
├── origin/                 # 原始Python脚本（参考）
├── dist/                   # 构建输出目录
│   └── bili-tasks.user.js  # 生成的油猴脚本
├── test-page.html          # 测试页面
├── vite.config.ts          # Vite 配置
├── package.json
└── README.md
```

## 🎨 组件说明

### FloatingButton 悬浮按钮
- 固定定位在页面右下角
- 圆形设计，带有渐变背景和阴影效果
- 悬停时有缩放和位移动画
- 高 z-index 确保在最上层显示

### Modal 模态框
- 全屏覆盖，半透明背景遮罩
- 支持向下滑动隐藏动画
- 右上角带有向下箭头的关闭按钮
- 点击背景区域也可关闭

### TaskPanel 任务面板
- 当前包含一个示例计数器
- 未来可扩展更多功能
- 响应式设计，适配不同屏幕尺寸

## 🔧 开发指南

### 添加新功能

1. 在 `src/components/` 目录下创建新组件
2. 在 `src/types/index.ts` 中添加相应的类型定义
3. 在 `TaskPanel.tsx` 中集成新功能
4. 更新样式文件

### 构建配置

项目使用 `vite-plugin-monkey` 插件来构建油猴脚本：

- 入口文件: `src/main.tsx`
- 匹配页面: `https://space.bilibili.com/*/favlist*`
- 外部依赖: Preact 通过 CDN 加载

### 样式隔离

为了避免与宿主页面样式冲突：

- 所有组件都使用独立的 CSS 文件
- 重要样式使用高特异性选择器
- 关键元素设置了高 z-index 值
- 使用 `box-sizing: border-box` 确保布局一致性

## 🧪 测试

项目包含一个测试页面 `test-page.html`，可以在本地测试脚本功能：

1. 构建项目: `pnpm build`
2. 安装生成的脚本到油猴管理器
3. 打开 `test-page.html` 测试功能

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请访问 [GitHub Issues](https://github.com/AkagiYui/UserScript/issues)
