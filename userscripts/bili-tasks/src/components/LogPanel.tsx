import { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { LogEntry } from '@/types';
import { GM_setValue, GM_getValue } from '$';
import './LogPanel.css';

interface LogPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function LogPanel({ logs, onClear }: LogPanelProps): JSX.Element {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 日志级别过滤状态 - 默认除了debug都开启
  const [logLevelFilters, setLogLevelFilters] = useState<Record<LogEntry['level'], boolean>>(() => {
    const saved = GM_getValue('logLevelFilters', null);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // 解析失败时使用默认值
      }
    }
    return {
      info: true,
      success: true,
      warn: true,
      error: true,
      debug: false
    };
  });

  // 过滤后的日志
  const filteredLogs = logs.filter(log => logLevelFilters[log.level]);

  // 切换日志级别过滤
  const toggleLogLevel = (level: LogEntry['level']) => {
    const newFilters = {
      ...logLevelFilters,
      [level]: !logLevelFilters[level]
    };
    setLogLevelFilters(newFilters);
    GM_setValue('logLevelFilters', JSON.stringify(newFilters));
  };

  // 自动滚动到底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getLogIcon = (level: LogEntry['level']): string => {
    switch (level) {
      case 'info':
        return 'ℹ️';
      case 'warn':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'debug':
        return '🔍';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div class="log-panel">
      <div class="log-header">
        <h3>执行日志</h3>
        <div class="log-controls">
          <span class="log-count">{filteredLogs.length}/{logs.length} 条日志</span>
          <button
            class="log-clear-button"
            onClick={onClear}
            title="清空日志"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path 
                d="M2 3h12M5.5 3V2a1 1 0 011-1h3a1 1 0 011 1v1M7 7v6M9 7v6M4 3v10a1 1 0 001 1h6a1 1 0 001-1V3" 
                stroke="currentColor" 
                stroke-width="1.5" 
                fill="none"
              />
            </svg>
            清空
          </button>
        </div>
      </div>

      <div class="log-container" ref={logContainerRef}>
        {filteredLogs.length === 0 ? (
          <div class="log-empty">
            <div class="empty-icon">📝</div>
            <p>{logs.length === 0 ? '暂无日志' : '无匹配的日志'}</p>
            <span>{logs.length === 0 ? '执行脚本后，日志将在这里显示' : '调整过滤条件以显示更多日志'}</span>
          </div>
        ) : (
          <div class="log-list">
            {filteredLogs.map((log) => (
              <div key={log.id} class={`log-entry ${log.level}`}>
                <div class="log-meta">
                  <span class="log-icon">{getLogIcon(log.level)}</span>
                  <span class="log-time">{formatTime(log.timestamp)}</span>
                  {log.scriptId && (
                    <span class="log-script">[{log.scriptId}]</span>
                  )}
                </div>
                <div class="log-message">{log.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div class="log-footer">
        <div class="log-filters">
          <div class="filter-buttons">
            <button
              class={`filter-button debug ${logLevelFilters.debug ? 'active' : ''}`}
              onClick={() => toggleLogLevel('debug')}
              title="切换调试日志显示"
            >
              <span class="filter-icon">🔍</span>
              <span>调试</span>
            </button>
            <button
              class={`filter-button info ${logLevelFilters.info ? 'active' : ''}`}
              onClick={() => toggleLogLevel('info')}
              title="切换信息日志显示"
            >
              <span class="filter-icon">ℹ️</span>
              <span>信息</span>
            </button>
            <button
              class={`filter-button success ${logLevelFilters.success ? 'active' : ''}`}
              onClick={() => toggleLogLevel('success')}
              title="切换成功日志显示"
            >
              <span class="filter-icon">✅</span>
              <span>成功</span>
            </button>
            <button
              class={`filter-button warn ${logLevelFilters.warn ? 'active' : ''}`}
              onClick={() => toggleLogLevel('warn')}
              title="切换警告日志显示"
            >
              <span class="filter-icon">⚠️</span>
              <span>警告</span>
            </button>
            <button
              class={`filter-button error ${logLevelFilters.error ? 'active' : ''}`}
              onClick={() => toggleLogLevel('error')}
              title="切换错误日志显示"
            >
              <span class="filter-icon">❌</span>
              <span>错误</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
