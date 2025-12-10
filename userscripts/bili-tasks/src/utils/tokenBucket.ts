/**
 * 令牌桶限流算法实现
 * 用于控制API请求频率，避免触发B站的反爬机制
 */
export class TokenBucket {
  private capacity: number;
  private tokens: number;
  private rate: number;
  private lastRefillTime: number;

  constructor(capacity: number, rate: number) {
    this.capacity = capacity; // 令牌桶容量
    this.tokens = capacity; // 当前令牌数
    this.rate = rate; // 令牌填充速率（每秒）
    this.lastRefillTime = Date.now();
  }

  /**
   * 填充令牌
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefillTime) / 1000;
    const newTokens = timePassed * this.rate;
    this.tokens = Math.min(this.capacity, this.tokens + newTokens);
    this.lastRefillTime = now;
  }

  /**
   * 消费令牌
   * @param tokens 需要消费的令牌数量
   * @returns 是否成功消费
   */
  consume(tokens: number = 1): boolean {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  /**
   * 等待直到可以消费指定数量的令牌
   * @param tokens 需要消费的令牌数量
   * @returns Promise，在可以消费时resolve
   */
  async waitForTokens(tokens: number = 1): Promise<void> {
    return new Promise((resolve) => {
      const checkTokens = () => {
        if (this.consume(tokens)) {
          resolve();
        } else {
          setTimeout(checkTokens, 100);
        }
      };
      checkTokens();
    });
  }

  /**
   * 获取当前令牌数量
   */
  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}
