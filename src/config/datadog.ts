/**
 * Configuração do Datadog Real User Monitoring (RUM)
 * Site: US5 (us5.datadoghq.com)
 */

import { datadogRum } from '@datadog/browser-rum'

/**
 * Inicializa o Datadog RUM
 * Será inicializado apenas se as variáveis de ambiente estiverem configuradas
 */
export function initDatadogRUM() {
  const applicationId = import.meta.env.VITE_DATADOG_APPLICATION_ID
  const clientToken = import.meta.env.VITE_DATADOG_CLIENT_TOKEN
  const environment = import.meta.env.VITE_ENVIRONMENT || 'production'
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0'

  // Não inicializar se as variáveis não estiverem configuradas
  if (!applicationId || !clientToken) {
    console.warn(
      '[Datadog] RUM não inicializado: applicationId ou clientToken não configurados'
    )
    return
  }

  // Não inicializar em desenvolvimento local (opcional)
  if (import.meta.env.DEV && import.meta.env.MODE === 'development') {
    console.info('[Datadog] RUM desabilitado em modo de desenvolvimento')
    return
  }

  try {
    datadogRum.init({
      applicationId,
      clientToken,
      // Site para região US5
      site: 'us5.datadoghq.com',
      // Nome do serviço (aparece no Datadog)
      service: 'weather-forecast-app',
      // Ambiente (production, staging, etc)
      env: environment,
      // Versão da aplicação (útil para tracking de deploys)
      version,
      // Porcentagem de sessões a monitorar (100 = todas)
      sessionSampleRate: 100,
      // Porcentagem de sessões para replay (20%)
      sessionReplaySampleRate: 20,
      // Rastrear interações do usuário (cliques, inputs, etc)
      trackUserInteractions: true,
      // Rastrear recursos carregados (scripts, images, etc)
      trackResources: true,
      // Rastrear tarefas longas (performance)
      trackLongTasks: true,
      // Nível de privacidade para session replay
      defaultPrivacyLevel: 'mask-user-input',
      // Permitir fallback para cookies se localStorage não disponível
      useSecureSessionCookie: true,
      // Cookies de sessão cross-site
      useCrossSiteSessionCookie: true,
    })

    // Iniciar session replay
    datadogRum.startSessionReplayRecording()

    console.info('[Datadog] RUM inicializado com sucesso', {
      environment,
      version,
      site: 'us5.datadoghq.com',
    })
  } catch (error) {
    console.error('[Datadog] Erro ao inicializar RUM:', error)
  }
}

/**
 * Adiciona informações de usuário customizadas (opcional)
 * Chamar após login do usuário
 */
export function setDatadogUser(userId: string, userInfo?: Record<string, unknown>) {
  if (datadogRum.getInitConfiguration()) {
    datadogRum.setUser({
      id: userId,
      ...userInfo,
    })
  }
}

/**
 * Remove informações de usuário (opcional)
 * Chamar após logout do usuário
 */
export function clearDatadogUser() {
  if (datadogRum.getInitConfiguration()) {
    datadogRum.clearUser()
  }
}

/**
 * Adiciona contexto customizado para tracking
 */
export function addDatadogContext(key: string, value: unknown) {
  if (datadogRum.getInitConfiguration()) {
    datadogRum.setGlobalContextProperty(key, value)
  }
}

/**
 * Rastreia um erro customizado
 */
export function trackDatadogError(error: Error, context?: Record<string, unknown>) {
  if (datadogRum.getInitConfiguration()) {
    datadogRum.addError(error, context)
  }
}

/**
 * Rastreia uma ação customizada
 */
export function trackDatadogAction(name: string, context?: Record<string, unknown>) {
  if (datadogRum.getInitConfiguration()) {
    datadogRum.addAction(name, context)
  }
}
