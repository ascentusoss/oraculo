// SPDX-License-Identifier: MIT
/**
 * Engine de logs adaptativos que se ajusta ao contexto do projeto
 * Detecta automaticamente complexidade e adapta verbosidade
 */

import { config } from '@core/config/config.js';
import {
  LogContextConfig,
  LogMessages,
} from '@core/messages/log/log-messages.js';
import { ICONES_FEEDBACK } from '@core/messages/ui/icons.js';
import { isJsonMode } from '@shared/helpers/json-mode.js';

import type {
  FileMap,
  LogContext,
  LogData,
  LogLevel,
  LogTemplate,
  ProjetoMetricas,
} from '@';

class LogEngineAdaptativo {
  private static instance: LogEngineAdaptativo;
  private contextoAtual: LogContext = 'medio';
  private metricas: ProjetoMetricas | null = null;
  private isCI: boolean = false;

  static getInstance(): LogEngineAdaptativo {
    if (!LogEngineAdaptativo.instance) {
      LogEngineAdaptativo.instance = new LogEngineAdaptativo();
    }
    return LogEngineAdaptativo.instance;
  }

  /**
   * Detecta automaticamente o contexto do projeto baseado nos arquivos
   */
  detectarContexto(fileMap: FileMap): LogContext {
    this.metricas = this.analisarProjeto(fileMap);
    this.isCI = this.detectarCI();

    // Prioridade: CI > Complexidade > Padrão
    if (this.isCI) {
      this.contextoAtual = 'ci';
      this.log('debug', LogMessages.contexto.ci_cd, {});
      return 'ci';
    }

    const complexidade = this.metricas.estruturaComplexidade;
    const totalArquivos = this.metricas.totalArquivos;
    const linguagens = this.metricas.linguagens.length;

    if (totalArquivos < 20 && linguagens <= 2 && !this.metricas.temTestes) {
      this.contextoAtual = 'simples';
      this.log('info', LogMessages.contexto.desenvolvedor_novo, {});
    } else if (
      totalArquivos > 100 ||
      linguagens > 3 ||
      complexidade === 'complexa'
    ) {
      this.contextoAtual = 'complexo';
      this.log('info', LogMessages.contexto.equipe_experiente, {});
    } else {
      this.contextoAtual = 'medio';
    }

    // Log de detecção do projeto
    this.log('info', LogMessages.projeto.detectado, {
      tipo: this.contextoAtual,
      confianca: this.calcularConfianca(),
    });

    this.log('debug', LogMessages.projeto.estrutura, {
      arquivos: totalArquivos,
      linguagens,
    });

    return this.contextoAtual;
  }

  /**
   * Analisa métricas do projeto para determinar complexidade
   */
  private analisarProjeto(fileMap: FileMap): ProjetoMetricas {
    const arquivos = Object.values(fileMap);
    const totalArquivos = arquivos.length;

    // Detecta linguagens pelos extensions
    const extensoes = new Set(
      arquivos
        .map((f) => f.relPath.split('.').pop()?.toLowerCase())
        .filter((ext): ext is string => Boolean(ext)),
    );

    const linguagens = Array.from(extensoes).filter((ext) =>
      ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'php', 'py', 'xml'].includes(
        ext,
      ),
    );

    // Detecta estrutura complexa
    const temSrcFolder = arquivos.some((f) => f.relPath.startsWith('src/'));
    const temMultiplosDiretorios =
      new Set(arquivos.map((f) => f.relPath.split('/')[0])).size > 5;
    const temConfigFiles = arquivos.some((f) =>
      [
        'package.json',
        'tsconfig.json',
        'webpack.config.js',
        'vite.config.ts',
      ].includes(f.relPath.split('/').pop() || ''),
    );

    let estruturaComplexidade: 'simples' | 'media' | 'complexa' = 'simples';
    if (totalArquivos > 100 || temMultiplosDiretorios) {
      estruturaComplexidade = 'complexa';
    } else if (totalArquivos > 20 || temSrcFolder || temConfigFiles) {
      estruturaComplexidade = 'media';
    }

    return {
      totalArquivos,
      linguagens,
      estruturaComplexidade,
      temCI: arquivos.some(
        (f) =>
          f.relPath.includes('.github/') || f.relPath.includes('.gitlab-ci'),
      ),
      temTestes: arquivos.some(
        (f) => f.relPath.includes('test') || f.relPath.includes('spec'),
      ),
      temDependencias: arquivos.some(
        (f) => f.relPath === 'package.json' || f.relPath === 'requirements.txt',
      ),
    };
  }

  /**
   * Detecta se está rodando em ambiente CI/CD
   */
  private detectarCI(): boolean {
    return !!(
      process.env.CI ||
      process.env.GITHUB_ACTIONS ||
      process.env.GITLAB_CI ||
      process.env.JENKINS_URL ||
      config.REPORT_SILENCE_LOGS
    );
  }

  /**
   * Calcula confiança da detecção de contexto
   */
  private calcularConfianca(): number {
    if (!this.metricas) return 50;

    let confianca = 60; // base

    // Fatores que aumentam confiança
    if (this.metricas.totalArquivos > 0) confianca += 10;
    if (this.metricas.linguagens.length > 0) confianca += 10;
    if (this.metricas.temTestes) confianca += 10;
    if (this.metricas.temDependencias) confianca += 10;

    return Math.min(confianca, 95);
  }

  /**
   * Log adaptativo baseado no contexto atual
   */
  log(level: LogLevel, template: LogTemplate, data: LogData = {}): void {
    // Quando --json está ativo, o stdout deve conter APENAS JSON.
    // Suprimimos logs visuais e mantemos apenas erros no stderr.
    if (isJsonMode()) {
      if (level !== 'erro') return;
      const formattedMessage = this.formatMessage(
        template,
        data,
        LogContextConfig[this.contextoAtual],
      );
      console.error(formattedMessage);
      return;
    }

    const contextoConfig = LogContextConfig[this.contextoAtual];

    // Em CI, usar formato estruturado
    if (this.isCI && this.contextoAtual === 'ci') {
      this.logEstruturado(level, template, data);
      return;
    }

    // Log normal com adaptações
    const formattedMessage = this.formatMessage(template, data, contextoConfig);
    const timestamp = this.formatTimestamp();

    const logMethod = this.getLogMethod(level);
    logMethod(`[${timestamp}] ${formattedMessage}`);
  }

  /**
   * Log estruturado para CI/CD
   */
  private logEstruturado(
    level: LogLevel,
    template: LogTemplate,
    data: LogData,
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.formatMessage(template, data),
      context: this.contextoAtual,
      ...data,
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Formata mensagem baseada no contexto
   */
  private formatMessage(
    template: LogTemplate,
    data: LogData,
    contextoConfig = LogContextConfig[this.contextoAtual],
  ): string {
    const processedData = { ...data };

    // Adapta formato de arquivo baseado no contexto
    if (processedData.arquivo && typeof processedData.arquivo === 'string') {
      processedData.arquivo = this.formatarNomeArquivo(
        processedData.arquivo,
        contextoConfig.formato_arquivo,
      );
    }

    // Aplica formatação de template
    return template.replace(/\{(\w+)\}/g, (match: string, key: string) => {
      const value = processedData[key];
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Formata nome do arquivo baseado no contexto
   */
  private formatarNomeArquivo(arquivo: string, formato: string): string {
    switch (formato) {
      case 'nome_apenas':
        return arquivo.split('/').pop() || arquivo;
      case 'relativo':
        return arquivo.length > 50 ? `...${arquivo.slice(-45)}` : arquivo;
      case 'completo':
        return arquivo;
      default:
        return arquivo;
    }
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.toTimeString().slice(0, 8); // HH:mm:ss
  }

  private getLogMethod(level: LogLevel) {
    switch (level) {
      case 'erro':
        return console.error;
      case 'aviso':
        return console.warn;
      default:
        return console.log;
    }
  }

  /**
   * Getters para uso externo
   */
  get contexto(): LogContext {
    return this.contextoAtual;
  }

  get metricas_projeto(): ProjetoMetricas | null {
    return this.metricas;
  }

  /**
   * Força um contexto específico (para testes ou override manual)
   */
  forcarContexto(contexto: LogContext): void {
    this.contextoAtual = contexto;
    this.log(
      'debug',
      `${ICONES_FEEDBACK.info} Contexto forçado para: ${contexto}`,
      {},
    );
  }
}

export const logEngine = LogEngineAdaptativo.getInstance();
export { LogEngineAdaptativo };
