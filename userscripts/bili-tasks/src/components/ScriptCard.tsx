import { JSX } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { ScriptConfig, ScriptParameter, FavoriteList } from '@/types';
import { GM_setValue, GM_getValue } from '$';
import './ScriptCard.css';

interface ScriptCardProps {
  script: ScriptConfig;
  onExecute: (scriptId: string, parameters: Record<string, any>) => void;
  onStop: (scriptId: string) => void;
  isRunning: boolean;
  progress?: number;
  favoriteList?: FavoriteList | null;
  favoriteListLoading?: boolean;
  favoriteListError?: string | null;
  onRetryFavoriteList?: () => void;
}

export function ScriptCard({
  script,
  onExecute,
  onStop,
  isRunning,
  progress = 0,
  favoriteList,
  favoriteListLoading = false,
  favoriteListError,
  onRetryFavoriteList
}: ScriptCardProps): JSX.Element {
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [focusedFavoriteInputs, setFocusedFavoriteInputs] = useState<Set<string>>(new Set());

  // 从GM存储加载参数
  useEffect(() => {
    const storageKey = `bili_tasks_params_${script.id}`;
    const savedParams = GM_getValue(storageKey, '{}');

    try {
      const parsedParams = JSON.parse(savedParams);
      const initialParams: Record<string, any> = {};

      script.parameters.forEach(param => {
        // 优先使用保存的参数，否则使用默认值
        initialParams[param.key] = parsedParams[param.key] !== undefined
          ? parsedParams[param.key]
          : param.defaultValue;
      });

      setParameters(initialParams);
    } catch (error) {
      console.warn('Failed to load saved parameters:', error);
      // 如果解析失败，使用默认值
      const initialParams: Record<string, any> = {};
      script.parameters.forEach(param => {
        initialParams[param.key] = param.defaultValue;
      });
      setParameters(initialParams);
    }
  }, [script.id, script.parameters]);

  // 保存参数到GM存储
  useEffect(() => {
    if (Object.keys(parameters).length > 0) {
      const storageKey = `bili_tasks_params_${script.id}`;
      GM_setValue(storageKey, JSON.stringify(parameters));
    }
  }, [parameters, script.id]);

  const handleParameterChange = (key: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExecute = () => {
    // 验证必填参数
    const missingParams = script.parameters
      .filter(param => param.required && !parameters[param.key])
      .map(param => param.label);

    if (missingParams.length > 0) {
      alert(`请填写必填参数: ${missingParams.join(', ')}`);
      return;
    }

    onExecute(script.id, parameters);
  };

  const handleStop = () => {
    onStop(script.id);
  };

  // 判断参数是否为收藏夹ID
  const isFavoriteIdParameter = (param: ScriptParameter): boolean => {
    return param.type === 'number' &&
           (param.label.includes('收藏夹ID') ||
            param.key.toLowerCase().includes('favorite'));
  };

  // 获取排序后的收藏夹选项
  const getFavoriteOptions = () => {
    if (!favoriteList?.list) return [];

    return favoriteList.list
      .map(fav => ({
        value: `${fav.title}(${fav.id})`, // value设置为显示格式
        id: fav.id, // 保留原始ID用于提取
        title: fav.title
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  };

  // 根据ID查找收藏夹标题
  const getFavoriteTitleById = (id: number): string | null => {
    if (!favoriteList?.list) return null;
    const favorite = favoriteList.list.find(fav => fav.id === id);
    return favorite ? favorite.title : null;
  };

  // 格式化显示值（失去焦点时使用）
  const formatDisplayValue = (value: number): string => {
    if (!value) return '';
    const title = getFavoriteTitleById(value);
    return title ? `${title}(${value})` : value.toString();
  };

  // 从格式化字符串中提取ID
  const extractIdFromFormattedValue = (formattedValue: string): number | null => {
    // 尝试直接解析为数字
    const directNumber = parseInt(formattedValue);
    if (!isNaN(directNumber) && directNumber.toString() === formattedValue) {
      return directNumber;
    }

    // 尝试从 "标题(ID)" 格式中提取ID
    const match = formattedValue.match(/\((\d+)\)$/);
    if (match) {
      return parseInt(match[1]);
    }

    return null;
  };

  // 处理收藏夹输入框焦点事件
  const handleFavoriteInputFocus = (paramKey: string) => {
    setFocusedFavoriteInputs(prev => new Set(prev).add(paramKey));
  };

  const handleFavoriteInputBlur = (paramKey: string) => {
    setFocusedFavoriteInputs(prev => {
      const newSet = new Set(prev);
      newSet.delete(paramKey);
      return newSet;
    });
  };

  // 获取输入框显示值
  const getFavoriteInputDisplayValue = (paramKey: string, value: number): string => {
    const isFocused = focusedFavoriteInputs.has(paramKey);
    if (isFocused || value === undefined || value === null) {
      return value !== undefined && value !== null ? value.toString() : '';
    }
    return formatDisplayValue(value);
  };

  // 通用清空按钮组件
  const renderClearButton = (paramKey: string, hasValue: boolean, className: string = '') => {
    if (!hasValue || isRunning) return null;

    return (
      <button
        type="button"
        class={`clear-button ${className}`}
        onClick={() => handleParameterChange(paramKey, '')}
        title="清空内容"
        aria-label="清空内容"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    );
  };

  const renderParameterInput = (param: ScriptParameter) => {
    const value = parameters[param.key];

    switch (param.type) {
      case 'text':
        return (
          <div class="input-wrapper">
            <input
              type="text"
              value={value !== undefined && value !== null ? value.toString() : ''}
              onChange={(e) => handleParameterChange(param.key, (e.target as HTMLInputElement).value)}
              placeholder={param.placeholder}
              disabled={isRunning}
              class="script-input"
            />
            {renderClearButton(param.key, value !== undefined && value !== null && value !== '' && value.toString().trim() !== '')}
          </div>
        );

      case 'number':
        // 如果是收藏夹ID参数，渲染为可编辑的下拉选择框
        if (isFavoriteIdParameter(param)) {
          const favoriteOptions = getFavoriteOptions();
          const displayValue = getFavoriteInputDisplayValue(param.key, value);

          return (
            <div class="favorite-selector">
              <div class="favorite-input-wrapper">
                <input
                  type="text"
                  value={displayValue}
                  onChange={(e) => {
                    const inputValue = (e.target as HTMLInputElement).value;
                    const extractedId = extractIdFromFormattedValue(inputValue);
                    if (extractedId !== null) {
                      handleParameterChange(param.key, extractedId);
                    }
                  }}
                  onFocus={() => handleFavoriteInputFocus(param.key)}
                  onBlur={() => handleFavoriteInputBlur(param.key)}
                  placeholder={param.placeholder || '输入收藏夹ID或从下拉列表选择'}
                  disabled={isRunning}
                  class="script-input favorite-input"
                  list={`favorites-${script.id}-${param.key}`}
                />
                {renderClearButton(param.key, value !== undefined && value !== null && value !== '', 'clear-button-favorite')}
              </div>
              <datalist id={`favorites-${script.id}-${param.key}`}>
                {favoriteOptions.map(option => (
                  <option key={option.id} value={option.value} />
                ))}
              </datalist>
              {favoriteListLoading && (
                <div class="favorite-loading">
                  <span>正在加载收藏夹列表...</span>
                </div>
              )}
              {favoriteListError && (
                <div class="favorite-error">
                  <span>加载失败: {favoriteListError}</span>
                  {onRetryFavoriteList && (
                    <button
                      type="button"
                      class="retry-button"
                      onClick={onRetryFavoriteList}
                      disabled={isRunning}
                    >
                      重试
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        }

        // 普通数字输入框
        return (
          <div class="input-wrapper">
            <input
              type="number"
              value={value !== undefined && value !== null ? value.toString() : ''}
              onChange={(e) => handleParameterChange(param.key, Number((e.target as HTMLInputElement).value))}
              placeholder={param.placeholder}
              disabled={isRunning}
              class="script-input"
            />
            {renderClearButton(param.key, value !== undefined && value !== null && value !== '')}
          </div>
        );

      case 'boolean':
        return (
          <label class="script-checkbox">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleParameterChange(param.key, (e.target as HTMLInputElement).checked)}
              disabled={isRunning}
            />
            <span class="checkmark"></span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleParameterChange(param.key, (e.target as HTMLSelectElement).value)}
            disabled={isRunning}
            class="script-select"
          >
            <option value="">请选择...</option>
            {param.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <div class="textarea-wrapper">
            <textarea
              value={value !== undefined && value !== null ? value.toString() : ''}
              onChange={(e) => handleParameterChange(param.key, (e.target as HTMLTextAreaElement).value)}
              placeholder={param.placeholder}
              disabled={isRunning}
              class="script-textarea"
              rows={4}
            />
            {renderClearButton(param.key, value !== undefined && value !== null && value !== '' && value.toString().trim() !== '', 'clear-button-textarea')}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div class={`script-card ${script.category} ${isRunning ? 'running' : ''}`}>
      <div class="script-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div class="script-info">
          <h3 class="script-name">{script.name}</h3>
          <p class="script-description">{script.description}</p>
          <span class={`script-category ${script.category}`}>
            {script.category === 'tool' ? '工具' : '操作'}
          </span>
        </div>
        <div class="script-controls">
          {isRunning && (
            <div class="progress-container">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span class="progress-text">{Math.round(progress)}%</span>
            </div>
          )}
          <button 
            class={`expand-button ${isExpanded ? 'expanded' : ''}`}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div class="script-body">
          {script.parameters.length > 0 && (
            <div class="script-parameters">
              {script.parameters.map(param => (
                <div key={param.key} class="parameter-group">
                  <label class="parameter-label">
                    {param.label}
                    {param.required && <span class="required">*</span>}
                  </label>
                  {renderParameterInput(param)}
                  {param.description && (
                    <p class="parameter-description">{param.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div class="script-actions">
            {isRunning ? (
              <button 
                class="stop-button"
                onClick={handleStop}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <rect x="4" y="4" width="8" height="8" fill="currentColor"/>
                </svg>
                停止执行
              </button>
            ) : (
              <button 
                class="execute-button"
                onClick={handleExecute}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d="M5 3l8 5-8 5V3z" fill="currentColor"/>
                </svg>
                开始执行
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
