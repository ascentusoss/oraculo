import type { FileMap, LogContext, LogData, LogLevel, LogTemplate, ProjetoMetricas } from '../../../types/index.js';
declare class LogEngineAdaptativo {
    private static instance;
    private contextoAtual;
    private metricas;
    private isCI;
    static getInstance(): LogEngineAdaptativo;
    detectarContexto(fileMap: FileMap): LogContext;
    private analisarProjeto;
    private detectarCI;
    private calcularConfianca;
    log(level: LogLevel, template: LogTemplate, data?: LogData): void;
    private logEstruturado;
    private formatMessage;
    private formatarNomeArquivo;
    private formatTimestamp;
    private getLogMethod;
    get contexto(): LogContext;
    get metricas_projeto(): ProjetoMetricas | null;
    forcarContexto(contexto: LogContext): void;
}
export declare const logEngine: LogEngineAdaptativo;
export { LogEngineAdaptativo };
//# sourceMappingURL=log-engine.d.ts.map