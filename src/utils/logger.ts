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
 * Cores ANSI para console (apenas em dev)
 */
const colors = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
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
 * Aplica cor ao texto (apenas em dev e se suportado)
 */
const colorize = (text: string, color: string, enableColors: boolean): string => {
  if (!isDevelopment || !enableColors) return text;
  return `${color}${text}${colors.reset}`;
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
    const timestamp = colorize(
      `[${getTimestamp()}]`,
      colors.gray,
      this.enableColors
    );
    const prefix = colorize(this.prefix, colors.bold, this.enableColors);
    
    let levelColor = colors.reset;
    switch (level) {
      case 'debug':
        levelColor = colors.gray;
        break;
      case 'info':
        levelColor = colors.cyan;
        break;
      case 'warn':
        levelColor = colors.yellow;
        break;
      case 'error':
        levelColor = colors.red;
        break;
    }
    
    const levelStr = colorize(
      `[${level.toUpperCase()}]`,
      levelColor,
      this.enableColors
    );

    return [timestamp, prefix, levelStr, ...args];
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
