import { JSX } from 'preact';

// 基础组件Props类型
export interface BaseComponentProps {
  children?: JSX.Element | JSX.Element[] | string;
  className?: string;
}

// 悬浮按钮组件Props
export interface FloatingButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
}

// 模态框组件Props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

// 任务面板组件Props
export interface TaskPanelProps extends BaseComponentProps {
  // 未来可能添加的props
  initialCount?: number;
  onCountChange?: (count: number) => void;
}

// 动画状态类型
export type AnimationState = 'idle' | 'opening' | 'closing';

// 模态框状态类型
export interface ModalState {
  isOpen: boolean;
  isClosing: boolean;
  animationState: AnimationState;
}

// 计数器状态类型
export interface CounterState {
  count: number;
  isLoading?: boolean;
  error?: string | null;
}

// 事件处理器类型
export type ClickHandler = (event: MouseEvent) => void;
export type KeyboardHandler = (event: KeyboardEvent) => void;

// 油猴脚本相关类型
export interface UserScriptInfo {
  name: string;
  version: string;
  namespace: string;
  match: string[];
}

// 应用配置类型
export interface AppConfig {
  theme: 'light' | 'dark' | 'auto';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoStart: boolean;
  enableAnimations: boolean;
}

// B站API相关类型
export interface BiliApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface VideoInfo {
  id: number;
  type: number;
  title: string;
  duration: number;
  bvid?: string;
  aid: number;
  pic?: string;
  upper?: {
    mid: number;
    name: string;
  };
  cnt_info: {
    collect: number; // 收藏数
    danmaku: number; // 弹幕数
    play: number; // 播放数
  }
}

export interface FavoriteInfo {
  id: number;
  title: string;
  media_count: number;
  upper: {
    mid: number;
    name: string;
  };
}

export interface ToViewInfo {
  count: number;
  list: VideoInfo[];
}

export interface FavoriteList {
  count: number;
  list: {
    attr: number;
    fav_state: number;
    fid: number;
    id: number;
    media_count: number;
    mid: number;
    title: string;
  }[];
}

// 脚本相关类型
export interface ScriptConfig {
  id: string;
  disabled?: boolean;
  name: string;
  description: string;
  category: 'tool' | 'operation';
  parameters: ScriptParameter[];
  isRunning: boolean;
  lastRun?: Date;
}

export interface ScriptParameter {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  defaultValue: any;
  required?: boolean;
  options?: { label: string; value: any }[];
  placeholder?: string;
  description?: string;
}

export interface ScriptExecution {
  id: string;
  scriptId: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  startTime: Date;
  endTime?: Date;
  progress: number;
  logs: LogEntry[];
  result?: any;
  error?: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  message: string;
  scriptId?: string;
}

// 应用状态类型
export interface AppState {
  scripts: ScriptConfig[];
  executions: ScriptExecution[];
  logs: LogEntry[];
  selectedScript: string | null;
  isModalOpen: boolean;
  favoriteList: FavoriteList | null;
  favoriteListLoading: boolean;
  favoriteListError: string | null;
}

// 导出所有类型
export type {
  JSX
} from 'preact';
