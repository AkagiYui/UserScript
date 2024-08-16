type LoggerFunction = (...args: any[]) => void

const createLoggerFunction =
  (consoleMethod: LoggerFunction, prefix: string, name?: string): LoggerFunction =>
  consoleMethod.bind(console, prefix, name ? `[${name}]` : "")

/**
 * 生成 Logger
 * @param name 前缀
 * @returns console.log
 */
export const useLogger = (name?: string): ConsoleLogger => {
  const prefix = "AkagiYui"

  return {
    log: createLoggerFunction(console.log, prefix, name),
    warn: createLoggerFunction(console.warn, prefix, name),
    error: createLoggerFunction(console.error, prefix, name),
    info: createLoggerFunction(console.info, prefix, name),
    debug: createLoggerFunction(console.debug, prefix, name),
    useLogger: (subName?: string) => useLogger(`${name ? name + ":" : ""}${subName}`),
  }
}
