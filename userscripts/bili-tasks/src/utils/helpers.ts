/**
 * 工具函数集合
 */

/**
 * 秒数转时间字符串
 * @param seconds 秒数
 * @returns 格式化的时间字符串 (HH:MM:SS)
 */
export function secondsToTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * 时间戳转日期时间字符串
 * @param timestamp 时间戳（秒）
 * @returns 格式化的日期时间字符串
 */
export function timestampToDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('zh-CN');
}

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成随机整数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机整数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 打乱数组顺序
 * @param array 原数组
 * @returns 打乱后的新数组
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * 检查字符串是否包含任意关键词
 * @param text 待检查的文本
 * @param keywords 关键词数组
 * @param caseSensitive 是否区分大小写
 * @returns 是否包含关键词
 */
export function containsAnyKeyword(
  text: string, 
  keywords: string[], 
  caseSensitive: boolean = false
): boolean {
  if (keywords.length === 0) return false;
  
  const searchText = caseSensitive ? text : text.toLowerCase();
  return keywords.some(keyword => {
    const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
    return searchText.includes(searchKeyword);
  });
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 深拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param delay 节流延迟（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 防抖延迟（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
}

/**
 * 重试函数
 * @param func 要重试的异步函数
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试延迟（毫秒）
 * @returns Promise
 */
export async function retry<T>(
  func: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await func();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await delay(retryDelay);
      }
    }
  }
  
  throw lastError!;
}
