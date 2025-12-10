import { JSX } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { ScriptCard } from './ScriptCard';
import { LogPanel } from './LogPanel';
import { ResizeHandle } from './ResizeHandle';
import { LogEntry, AppState } from '@/types';
import { SCRIPT_CONFIGS } from '@/scripts/config';
import { ScriptExecutionManager } from '@/scripts/executor';
import { generateId } from '@/utils/helpers';
import {
  calculateNewWidths,
  calculateRatio,
  calculateWidthsFromRatio,
  isMobileOrSmallScreen,
  getContainerWidth,
  debounce,
  ResizeState,
  ResizeConfig
} from '@/utils/resizer';
import { getFavoriteList } from '@/api/bili';
import { GM_setValue, GM_getValue } from '$';
import './ScriptManager.css';

export function ScriptManager(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [appState, setAppState] = useState<AppState>(() => ({
    scripts: SCRIPT_CONFIGS.map(config => ({ ...config })),
    executions: [],
    logs: [],
    selectedScript: null,
    isModalOpen: true,
    favoriteList: null,
    favoriteListLoading: false,
    favoriteListError: null,
  }));

  // 拖拽调整相关状态
  const [panelRatio, setPanelRatio] = useState<number>(0.6); // 默认左侧60%
  const [resizeState, setResizeState] = useState<ResizeState>({
    isDragging: false,
    startX: 0,
    startLeftWidth: 0,
    startRightWidth: 0,
  });
  const [panelWidths, setPanelWidths] = useState({ leftWidth: 450, rightWidth: 600 });

  const [executionManager] = useState(() => new ScriptExecutionManager(
    (log: LogEntry) => {
      setAppState(prev => ({
        ...prev,
        logs: [...prev.logs, log]
      }));
    },
    (scriptId: string, progress: number) => {
      setAppState(prev => ({
        ...prev,
        scripts: prev.scripts.map(script => 
          script.id === scriptId 
            ? { ...script, progress }
            : script
        )
      }));
    }
  ));

  // 从GM存储加载日志和面板比例
  useEffect(() => {
    const savedLogs = GM_getValue('bili_tasks_logs', '[]');
    try {
      const logs = JSON.parse(savedLogs).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
      setAppState(prev => ({ ...prev, logs }));
    } catch (error) {
      console.warn('Failed to load saved logs:', error);
    }

    // 加载保存的面板比例
    const savedRatio = GM_getValue('bili_tasks_panel_ratio', '0.6');
    try {
      const ratio = parseFloat(savedRatio);
      if (ratio >= 0.2 && ratio <= 0.8) { // 合理范围检查
        setPanelRatio(ratio);
      }
    } catch (error) {
      console.warn('Failed to load saved panel ratio:', error);
    }

    // 获取收藏夹列表
    loadFavoriteList();
  }, []);

  // 获取收藏夹列表的函数
  const loadFavoriteList = async () => {
    setAppState(prev => ({
      ...prev,
      favoriteListLoading: true,
      favoriteListError: null
    }));

    try {
      const favoriteList = await getFavoriteList();
      setAppState(prev => ({
        ...prev,
        favoriteList,
        favoriteListLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取收藏夹列表失败';
      setAppState(prev => ({
        ...prev,
        favoriteListLoading: false,
        favoriteListError: errorMessage
      }));
      console.error('Failed to load favorite list:', error);
    }
  };

  // 保存日志到GM存储
  useEffect(() => {
    const logsToSave = appState.logs.slice(-100); // 只保存最近100条
    GM_setValue('bili_tasks_logs', JSON.stringify(logsToSave));
  }, [appState.logs]);

  // 保存面板比例到GM存储
  useEffect(() => {
    GM_setValue('bili_tasks_panel_ratio', panelRatio.toString());
  }, [panelRatio]);

  // 计算面板宽度
  useEffect(() => {
    const updatePanelWidths = () => {
      if (isMobileOrSmallScreen()) {
        // 移动设备使用默认宽度
        setPanelWidths({ leftWidth: 450, rightWidth: 600 });
        return;
      }

      const containerWidth = getContainerWidth(containerRef.current);
      const config: ResizeConfig = {
        minLeftWidth: 300,
        minRightWidth: 400,
        containerWidth: containerWidth - 48 - 24 - 8, // 减去左右padding(48px)、gap(24px)和分隔条宽度(8px)
      };

      const { leftWidth, rightWidth } = calculateWidthsFromRatio(panelRatio, config.containerWidth, config);
      setPanelWidths({ leftWidth, rightWidth });
    };

    updatePanelWidths();

    const debouncedResize = debounce(updatePanelWidths, 100);
    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, [panelRatio]);

  const handleExecuteScript = async (scriptId: string, parameters: Record<string, any>) => {
    // 更新脚本运行状态
    setAppState(prev => ({
      ...prev,
      scripts: prev.scripts.map(script => 
        script.id === scriptId 
          ? { ...script, isRunning: true, lastRun: new Date() }
          : script
      )
    }));

    try {
      await executionManager.executeScript(scriptId, parameters);
    } catch (error) {
      const errorLog: LogEntry = {
        id: generateId(),
        timestamp: new Date(),
        level: 'error',
        message: `脚本执行失败: ${error instanceof Error ? error.message : String(error)}`,
        scriptId,
      };
      
      setAppState(prev => ({
        ...prev,
        logs: [...prev.logs, errorLog]
      }));
    } finally {
      // 更新脚本运行状态
      setAppState(prev => ({
        ...prev,
        scripts: prev.scripts.map(script => 
          script.id === scriptId 
            ? { ...script, isRunning: false }
            : script
        )
      }));
    }
  };

  const handleStopScript = (scriptId: string) => {
    const success = executionManager.stopScript(scriptId);
    if (success) {
      const stopLog: LogEntry = {
        id: generateId(),
        timestamp: new Date(),
        level: 'warn',
        message: '用户请求停止脚本执行',
        scriptId,
      };
      
      setAppState(prev => ({
        ...prev,
        logs: [...prev.logs, stopLog],
        scripts: prev.scripts.map(script => 
          script.id === scriptId 
            ? { ...script, isRunning: false }
            : script
        )
      }));
    }
  };

  const handleClearLogs = () => {
    setAppState(prev => ({ ...prev, logs: [] }));
    GM_setValue('bili_tasks_logs', '[]');
  };

  // 拖拽处理函数
  const handleResizeStart = (e: MouseEvent) => {
    if (isMobileOrSmallScreen()) return;

    const containerWidth = getContainerWidth(containerRef.current);
    const config: ResizeConfig = {
      minLeftWidth: 300,
      minRightWidth: 400,
      containerWidth: containerWidth - 48 - 24 - 8, // 减去左右padding(48px)、gap(24px)和分隔条宽度(8px)
    };

    const { leftWidth, rightWidth } = calculateWidthsFromRatio(panelRatio, config.containerWidth, config);

    setResizeState({
      isDragging: true,
      startX: e.clientX,
      startLeftWidth: leftWidth,
      startRightWidth: rightWidth,
    });

    document.body.classList.add('resizing');
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizeState.isDragging || isMobileOrSmallScreen()) return;

    const containerWidth = getContainerWidth(containerRef.current);
    const config: ResizeConfig = {
      minLeftWidth: 300,
      minRightWidth: 400,
      containerWidth: containerWidth - 48 - 24 - 8, // 减去左右padding(48px)、gap(24px)和分隔条宽度(8px)
    };

    const { leftWidth, rightWidth } = calculateNewWidths(e.clientX, resizeState, config);
    const newRatio = calculateRatio(leftWidth, rightWidth);

    setPanelRatio(newRatio);
    setPanelWidths({ leftWidth, rightWidth });
  };

  const handleResizeEnd = () => {
    if (!resizeState.isDragging) return;

    setResizeState(prev => ({ ...prev, isDragging: false }));
    document.body.classList.remove('resizing');
  };

  // 全局鼠标事件监听
  useEffect(() => {
    if (resizeState.isDragging) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizeState.isDragging, resizeState]);

  const getScriptProgress = (scriptId: string): number => {
    const script = appState.scripts.find(s => s.id === scriptId);
    return (script as any)?.progress || 0;
  };

  const toolScripts = appState.scripts.filter(script => script.category === 'tool');
  const operationScripts = appState.scripts.filter(script => script.category === 'operation');

  return (
    <div class="script-manager" ref={containerRef}>

      <div class="script-manager-content">
        <div
          class="scripts-panel"
          style={{ width: isMobileOrSmallScreen() ? 'auto' : `${panelWidths.leftWidth}px` }}
        >
          <div class="scripts-section">
            <h2>🔧 工具脚本 (日志输出目标信息)</h2>
            <div class="scripts-list">
              {toolScripts.map(script => (
                <ScriptCard
                  key={script.id}
                  script={script}
                  onExecute={handleExecuteScript}
                  onStop={handleStopScript}
                  isRunning={script.isRunning}
                  progress={getScriptProgress(script.id)}
                  favoriteList={appState.favoriteList}
                  favoriteListLoading={appState.favoriteListLoading}
                  favoriteListError={appState.favoriteListError}
                  onRetryFavoriteList={loadFavoriteList}
                />
              ))}
            </div>
          </div>

          <div class="scripts-section">
            <h2>⚙️ 操作脚本 (不需要输出信息，正确执行完毕后即达成目标)</h2>
            <div class="scripts-list">
              {operationScripts.map(script => (
                <ScriptCard
                  key={script.id}
                  script={script}
                  onExecute={handleExecuteScript}
                  onStop={handleStopScript}
                  isRunning={script.isRunning}
                  progress={getScriptProgress(script.id)}
                  favoriteList={appState.favoriteList}
                  favoriteListLoading={appState.favoriteListLoading}
                  favoriteListError={appState.favoriteListError}
                  onRetryFavoriteList={loadFavoriteList}
                />
              ))}
            </div>
          </div>
        </div>

        {!isMobileOrSmallScreen() && (
          <ResizeHandle
            onMouseDown={handleResizeStart}
            isDragging={resizeState.isDragging}
          />
        )}

        <div
          class="logs-panel"
          style={{ width: isMobileOrSmallScreen() ? 'auto' : `${panelWidths.rightWidth}px` }}
        >
          <LogPanel
            logs={appState.logs}
            onClear={handleClearLogs}
          />
        </div>
      </div>
    </div>
  );
}
