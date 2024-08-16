interface ConsoleLogger {
  log: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  info: (...args: any[]) => void
  debug: (...args: any[]) => void
}

type LoggerFunction = (...args: any[]) => void

const createLoggerFunction =
  (consoleMethod: LoggerFunction, prefix: string, name?: string): LoggerFunction =>
  (...args: any[]) =>
    consoleMethod(prefix, name ? `[${name}]` : "", ...args)

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
  }
}
