import { TokenBucket } from '../utils/tokenBucket';
import { BiliApiResponse } from '../types';
import { GM_xmlhttpRequest } from '$';

/**
 * 带令牌桶限流的HTTP客户端
 * 用于控制API请求频率，避免触发B站的反爬机制
 */
export class BiliApiClient {
  private tokenBucket: TokenBucket;
  private baseHeaders: Record<string, string>;

  constructor(capacity: number = 10, rate: number = 0.7) {
    this.tokenBucket = new TokenBucket(capacity, rate);
    this.baseHeaders = {
      'Referer': 'https://www.bilibili.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    };
  }

  /**
   * 发送GET请求
   */
  async get<T = any>(url: string, params?: Record<string, any>): Promise<BiliApiResponse<T>> {
    await this.tokenBucket.waitForTokens();
    
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;
    
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: fullUrl,
        headers: this.baseHeaders,
        onload: (response) => {
          try {
            const data = JSON.parse(response.responseText);
            resolve(data);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error}`));
          }
        },
        onerror: (error) => {
          reject(new Error(`Request failed: ${error}`));
        },
        ontimeout: () => {
          reject(new Error('Request timeout'));
        },
        timeout: 10000,
      });
    });
  }

  /**
   * 发送POST请求
   */
  async post<T = any>(
    url: string, 
    data?: Record<string, any>, 
    params?: Record<string, any>
  ): Promise<BiliApiResponse<T>> {
    await this.tokenBucket.waitForTokens();
    
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url;
    
    const formData = new URLSearchParams();
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
    }
    
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'POST',
        url: fullUrl,
        headers: {
          ...this.baseHeaders,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: formData.toString(),
        onload: (response) => {
          try {
            const responseData = JSON.parse(response.responseText);
            resolve(responseData);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error}`));
          }
        },
        onerror: (error) => {
          reject(new Error(`Request failed: ${error}`));
        },
        ontimeout: () => {
          reject(new Error('Request timeout'));
        },
        timeout: 10000,
      });
    });
  }

  /**
   * 获取当前令牌数量（用于调试）
   */
  getTokenCount(): number {
    return this.tokenBucket.getTokens();
  }
}

// 创建全局客户端实例
export const biliApiClient = new BiliApiClient();
