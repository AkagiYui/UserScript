/**
 * 面板调整器工具函数
 */

export interface ResizeConfig {
  minLeftWidth: number;
  minRightWidth: number;
  containerWidth: number;
}

export interface ResizeState {
  isDragging: boolean;
  startX: number;
  startLeftWidth: number;
  startRightWidth: number;
}

/**
 * 计算新的面板宽度
 */
export function calculateNewWidths(
  currentX: number,
  state: ResizeState,
  config: ResizeConfig
): { leftWidth: number; rightWidth: number } {
  const deltaX = currentX - state.startX;
  let newLeftWidth = state.startLeftWidth + deltaX;
  let newRightWidth = state.startRightWidth - deltaX;

  // 应用最小宽度限制
  if (newLeftWidth < config.minLeftWidth) {
    newLeftWidth = config.minLeftWidth;
    newRightWidth = config.containerWidth - newLeftWidth;
  }

  if (newRightWidth < config.minRightWidth) {
    newRightWidth = config.minRightWidth;
    newLeftWidth = config.containerWidth - newRightWidth;
  }

  // 确保总宽度不超过容器宽度
  const totalWidth = newLeftWidth + newRightWidth;
  if (totalWidth > config.containerWidth) {
    const ratio = config.containerWidth / totalWidth;
    newLeftWidth *= ratio;
    newRightWidth *= ratio;
  }

  return { leftWidth: newLeftWidth, rightWidth: newRightWidth };
}

/**
 * 计算宽度比例
 */
export function calculateRatio(leftWidth: number, rightWidth: number): number {
  const totalWidth = leftWidth + rightWidth;
  return totalWidth > 0 ? leftWidth / totalWidth : 0.4; // 默认40%
}

/**
 * 根据比例计算宽度
 */
export function calculateWidthsFromRatio(
  ratio: number,
  containerWidth: number,
  config: ResizeConfig
): { leftWidth: number; rightWidth: number } {
  let leftWidth = containerWidth * ratio;
  let rightWidth = containerWidth * (1 - ratio);

  // 应用最小宽度限制
  if (leftWidth < config.minLeftWidth) {
    leftWidth = config.minLeftWidth;
    rightWidth = containerWidth - leftWidth;
  }

  if (rightWidth < config.minRightWidth) {
    rightWidth = config.minRightWidth;
    leftWidth = containerWidth - rightWidth;
  }

  return { leftWidth, rightWidth };
}

/**
 * 检查是否为移动设备或小屏幕
 */
export function isMobileOrSmallScreen(): boolean {
  return window.innerWidth <= 1024;
}

/**
 * 获取容器宽度
 */
export function getContainerWidth(containerElement: HTMLElement | null): number {
  if (!containerElement) return 1200; // 默认宽度
  return containerElement.clientWidth;
}

/**
 * 防抖函数，用于优化resize事件
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
}
