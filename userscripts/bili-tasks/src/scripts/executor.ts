import { LogEntry, ScriptExecution } from '@/types';
import { ScriptExecutor } from './base';
import {
  MoveFavoriteToToviewExecutor,
  AddToviewToFavoriteExecutor,
  MoveFavoriteExecutor,
  DeleteTimeoutLotteryExecutor,
  ClearToviewExecutor,
  BvAvConverterExecutor,
  VideoInfoExecutor
} from './executors';

/**
 * 真实脚本执行器工厂
 */
export function createScriptExecutor(
  scriptId: string,
  onLog: (log: LogEntry) => void,
  onProgress: (progress: number) => void
): ScriptExecutor {
  switch (scriptId) {
    case 'bv2av':
      return new BvAvConverterExecutor(scriptId, onLog, onProgress);
    case 'show_resource_info':
      return new VideoInfoExecutor(scriptId, onLog, onProgress);
    case 'move_favorite_to_toview':
      return new MoveFavoriteToToviewExecutor(scriptId, onLog, onProgress);
    case 'add_toview_to_favorite':
      return new AddToviewToFavoriteExecutor(scriptId, onLog, onProgress);
    case 'move_favorite_to_another':
      return new MoveFavoriteExecutor(scriptId, onLog, onProgress);
    case 'delete_timeout_lottery':
      return new DeleteTimeoutLotteryExecutor(scriptId, onLog, onProgress);
    case 'clear_toview':
      return new ClearToviewExecutor(scriptId, onLog, onProgress);
    default:
      throw new Error(`Unknown script type: ${scriptId}`);
  }
}

/**
 * 脚本执行管理器
 */
export class ScriptExecutionManager {
  private executors: Map<string, ScriptExecutor> = new Map();
  private onLog: (log: LogEntry) => void;
  private onProgress: (executionId: string, progress: number) => void;

  constructor(
    onLog: (log: LogEntry) => void,
    onProgress: (executionId: string, progress: number) => void
  ) {
    this.onLog = onLog;
    this.onProgress = onProgress;
  }

  /**
   * 执行脚本
   */
  public async executeScript(
    scriptId: string,
    parameters: Record<string, any>
  ): Promise<ScriptExecution> {
    // 检查是否已有同类型脚本在运行
    const existingExecutor = Array.from(this.executors.values())
      .find(executor => executor.getExecution().scriptId === scriptId &&
        executor.getExecution().status === 'running');

    if (existingExecutor) {
      throw new Error('该脚本已在运行中，请等待完成或停止后再试');
    }

    // 创建真实执行器
    const executor = createScriptExecutor(
      scriptId,
      this.onLog,
      (progress: number) => this.onProgress(scriptId, progress)
    );

    const executionId = executor.getExecution().id;
    this.executors.set(executionId, executor);

    try {
      const result = await executor.run(parameters);
      return result;
    } finally {
      // 清理执行器
      setTimeout(() => {
        this.executors.delete(executionId);
      }, 5000); // 5秒后清理
    }
  }

  /**
   * 停止脚本执行
   */
  public stopScript(scriptId: string): boolean {
    const executor = Array.from(this.executors.values())
      .find(executor => executor.getExecution().scriptId === scriptId &&
        executor.getExecution().status === 'running');

    if (executor) {
      executor.stop();
      return true;
    }

    return false;
  }

  /**
   * 获取正在运行的脚本列表
   */
  public getRunningScripts(): string[] {
    return Array.from(this.executors.values())
      .filter(executor => executor.getExecution().status === 'running')
      .map(executor => executor.getExecution().scriptId);
  }

  /**
   * 清理所有执行器
   */
  public cleanup(): void {
    this.executors.clear();
  }
}
