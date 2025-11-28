/**
 * Sistema de logging centralizado
 * - Em desenvolvimento: mostra todos os logs com cores
 * - Em produção: mostra apenas erros
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  prefix: string;
  enableColors?: boolean;
}

const isDevelopment = import.meta.env.DEV;

/**
 * Cores CSS para console.log do browser
 */
const cssColors = {
  gray: 'color: #888',
  blue: 'color: #3b82f6',
  cyan: 'color: #06b6d4',
  yellow: 'color: #f59e0b',
  red: 'color: #ef4444',
  bold: 'font-weight: bold',
};

/**
 * Formata timestamp para logs
 */
const getTimestamp = (): string => {
  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${time}.${ms}`;
};

/**
 * Classe Logger com prefixo e cores
 */
class Logger {
  private prefix: string;
  private enableColors: boolean;

  constructor(config: LoggerConfig) {
    this.prefix = config.prefix;
    this.enableColors = config.enableColors !== false;
  }

  /**
   * Formata mensagem com prefixo e timestamp
   */
  private formatMessage(level: LogLevel, ...args: any[]): any[] {
    if (!this.enableColors) {
      return [`[${getTimestamp()}]`, this.prefix, `[${level.toUpperCase()}]`, ...args];
    }

    const timestamp = `[${getTimestamp()}]`;
    const prefix = this.prefix;
    const levelStr = `[${level.toUpperCase()}]`;
    
    let cssColor = cssColors.gray;
    switch (level) {
      case 'info':
        cssColor = cssColors.cyan;
        break;
      case 'warn':
        cssColor = cssColors.yellow;
        break;
      case 'error':
        cssColor = cssColors.red;
        break;
    }

    // Usa %c para aplicar estilos CSS no console do browser
    return [
      `%c${timestamp} %c${prefix} %c${levelStr}`,
      cssColors.gray,
      cssColors.bold,
      cssColor,
      ...args
    ];
  }

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(...args: any[]): void {
    if (!isDevelopment) return;
    const formatted = this.formatMessage('debug', ...args);
    console.log(...formatted);
  }

  /**
   * Log informativo - apenas em desenvolvimento
   */
  info(...args: any[]): void {
    if (!isDevelopment) return;
    const formatted = this.formatMessage('info', ...args);
    console.log(...formatted);
  }

  /**
   * Log de warning - apenas em desenvolvimento
   */
  warn(...args: any[]): void {
    if (!isDevelopment) return;
    const formatted = this.formatMessage('warn', ...args);
    console.warn(...formatted);
  }

  /**
   * Log de erro - sempre visível (dev e produção)
   */
  error(...args: any[]): void {
    const formatted = this.formatMessage('error', ...args);
    console.error(...formatted);
  }

  /**
   * Wrapper para console.log - apenas em desenvolvimento
   * Mantido para compatibilidade, mas preferir debug/info
   */
  log(...args: any[]): void {
    this.info(...args);
  }
}

/**
 * Factory para criar loggers com prefixo específico
 */
export const createLogger = (config: LoggerConfig): Logger => {
  return new Logger(config);
};

/**
 * Logger genérico para uso geral
 */
export const logger = createLogger({ prefix: '[App]' });

/**
 * Loggers pré-configurados para services
 */
export const apiLogger = createLogger({ prefix: '[API]' });
export const cacheLogger = createLogger({ prefix: '[Cache]' });
export const ibgeLogger = createLogger({ prefix: '[IBGE]' });

/**
 * Logger para componentes Vue
 */
export const componentLogger = (componentName: string) =>
  createLogger({ prefix: `[${componentName}]` });
