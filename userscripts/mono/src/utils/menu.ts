/**
 * 布尔菜单配置
 * @param configs 配置项
 * @returns 配置获取函数
 */
export const useBooleanMenu = (configs: BooleanConfigs) => { 
  // 缓存
  const cache: { [key: string]: boolean } = {};

  // 获取配置
  const getConfig = (key: string): boolean => { 
    if (cache[key] !== undefined) {
      return cache[key];
    }
    let value = GM_getValue(key, configs[key].defaultValue);
    cache[key] = value;
    return value;
  }

  // 配置注册
  let menuIds: number[] = [];
  const registerMenuCommand = () => {
    menuIds.forEach((id) => {
      GM_unregisterMenuCommand(id);
    });
    menuIds = [];
    Object.entries(configs).forEach(([key, config]) => {
      let commandName = getConfig(key) ? "✅" : "❌";
      commandName += ` ${config.title}`;
      let id = GM_registerMenuCommand(commandName, () => {
        let newValue = !getConfig(key);
        let valueToSet = config.callback ? config.callback(newValue) : newValue;
        GM_setValue(key, valueToSet);
        cache[key] = valueToSet;
        registerMenuCommand();
      });
      menuIds.push(id);
    });
  }
  registerMenuCommand();

  return { getConfig };
}
