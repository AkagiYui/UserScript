import { ScriptExecution, LogEntry } from '@/types';
import { generateId } from '@/utils/helpers';

/**
 * 脚本执行器基类
 */
export abstract class ScriptExecutor {
  protected execution: ScriptExecution;
  protected onLog: (log: LogEntry) => void;
  protected onProgress: (progress: number) => void;
  protected shouldStop: boolean = false;

  // 进度管理相关属性
  private currentStep: number = 0;
  private totalSteps: number = 0;
  private autoProgressEnabled: boolean = false;

  constructor(
    scriptId: string,
    onLog: (log: LogEntry) => void,
    onProgress: (progress: number) => void
  ) {
    this.execution = {
      id: generateId(),
      scriptId,
      status: 'running',
      startTime: new Date(),
      progress: 0,
      logs: [],
    };
    this.onLog = onLog;
    this.onProgress = onProgress;
  }

  /**
   * 记录日志
   */
  protected log(level: LogEntry['level'], message: string): void {
    const logEntry: LogEntry = {
      id: generateId(),
      timestamp: new Date(),
      level,
      message,
      scriptId: this.execution.scriptId,
    };
    
    this.execution.logs.push(logEntry);
    this.onLog(logEntry);
  }

  /**
   * 设置总步骤数，启用基于步骤的进度管理
   */
  protected setTotalSteps(total: number): void {
    this.totalSteps = total;
    this.currentStep = 0;
    this.autoProgressEnabled = true;
  }

  /**
   * 更新进度
   * @param progressOrCurrentStep 进度百分比(0-100) 或当前步骤数
   * @param totalSteps 总步骤数（可选，如果提供则使用基于步骤的进度计算）
   */
  protected updateProgress(progressOrCurrentStep?: number, totalSteps?: number): void {
    let progress: number;

    if (progressOrCurrentStep === undefined) {
      // 无参数调用：自动递增步骤
      if (this.autoProgressEnabled && this.totalSteps > 0) {
        this.currentStep = Math.min(this.currentStep + 1, this.totalSteps);
        progress = Math.floor((this.currentStep / this.totalSteps) * 100);
      } else {
        // 如果没有设置总步骤数，默认递增5%
        progress = Math.min(this.execution.progress + 5, 95);
      }
    } else if (totalSteps !== undefined) {
      // 两个参数：基于步骤的进度计算
      this.currentStep = progressOrCurrentStep;
      this.totalSteps = totalSteps;
      this.autoProgressEnabled = true;
      progress = Math.floor((this.currentStep / this.totalSteps) * 100);
    } else {
      // 单个参数：直接设置进度百分比
      progress = progressOrCurrentStep;
      // 如果设置了具体进度，禁用自动进度
      if (progress >= 0 && progress <= 100) {
        this.autoProgressEnabled = false;
      }
    }

    this.execution.progress = Math.max(0, Math.min(100, progress));
    this.onProgress(this.execution.progress);
  }

  /**
   * 检查是否应该停止执行
   */
  protected checkShouldStop(): void {
    if (this.shouldStop) {
      throw new Error('Script execution was stopped by user');
    }
  }

  /**
   * 停止脚本执行
   */
  public stop(): void {
    this.shouldStop = true;
    this.log('warn', '用户请求停止脚本执行');
  }

  /**
   * 执行脚本（抽象方法，由子类实现）
   */
  public abstract execute(parameters: Record<string, any>): Promise<any>;

  /**
   * 运行脚本的完整流程
   */
  public async run(parameters: Record<string, any>): Promise<ScriptExecution> {
    try {
      this.log('debug', '开始执行脚本');
      this.updateProgress(0);

      const result = await this.execute(parameters);

      this.execution.status = 'completed';
      this.execution.endTime = new Date();
      this.execution.result = result;

      // 只有在进度未达到100%时才设置为100%
      if (this.execution.progress < 100) {
        this.updateProgress(100);
      }
      this.log('debug', '脚本执行完成');

    } catch (error) {
      this.execution.status = this.shouldStop ? 'stopped' : 'failed';
      this.execution.endTime = new Date();
      this.execution.error = error instanceof Error ? error.message : String(error);
      
      if (this.shouldStop) {
        this.log('warn', '脚本执行已停止');
      } else {
        this.log('error', `脚本执行失败: ${this.execution.error}`);
      }
    }

    return this.execution;
  }

  /**
   * 获取执行状态
   */
  public getExecution(): ScriptExecution {
    return { ...this.execution };
  }
}
