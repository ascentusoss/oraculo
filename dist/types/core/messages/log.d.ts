export type Nivel = 'info' | 'sucesso' | 'erro' | 'aviso' | 'debug';
export interface FormatOptions {
    nivel: Nivel;
    mensagem: string;
    sanitize?: boolean;
}
export type LogLevel = 'debug' | 'sucesso' | 'info' | 'aviso' | 'erro';
export type LogContext = 'simples' | 'medio' | 'complexo' | 'ci';
export type LogTemplate = string;
export type LogData = Record<string, string | number | boolean>;
export interface ProjetoMetricas {
    totalArquivos: number;
    linguagens: string[];
    estruturaComplexidade: 'simples' | 'media' | 'complexa';
    temCI: boolean;
    temTestes: boolean;
    temDependencias: boolean;
}
export { LogContextConfig } from '../../../core/messages/log/log-messages.js';
export interface LoggerBase {
    info: (mensagem: string) => void;
    aviso?: (mensagem: string) => void;
    erro: (mensagem: string) => void;
    sucesso?: (mensagem: string) => void;
    debug?: (mensagem: string) => void;
}
export interface LogComBloco extends LoggerBase {
    imprimirBloco: (titulo: string, linhas: string[], cor?: Function, largura?: number) => void;
    calcularLargura?: (titulo: string, linhas: string[], larguraMin?: number) => number;
}
export interface LogComSanitizar extends LoggerBase {
    infoSemSanitizar?: (mensagem: string) => void;
}
export interface LogCompleto extends LogComBloco, LogComSanitizar {
}
export declare function temCapacidadeBloco(log: unknown): log is LogComBloco;
export declare function temCapacidadeSanitizar(log: unknown): log is LogComSanitizar;
//# sourceMappingURL=log.d.ts.map