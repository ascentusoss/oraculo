import type { FormatOptions, StyleFn } from '../../../types/index.js';
export { config } from '../../config/config.js';
export declare const LOG_SIMBOLOS: {
    info: string;
    sucesso: string;
    erro: string;
    aviso: string;
    debug: string;
    fase: string;
    passo: string;
    scan: string;
    guardian: string;
    pasta: string;
};
export declare function formatarLinha({ nivel, mensagem, sanitize, }: FormatOptions): string;
export declare function formatarBloco(titulo: string, linhas: string[], corTitulo?: StyleFn, larguraMax?: number): string;
export declare function fase(titulo: string): void;
export declare function passo(descricao: string): void;
export declare const log: {
    info(msg: string): void;
    infoSemSanitizar(msg: string): void;
    infoDestaque(msg: string): void;
    sucesso(msg: string): void;
    erro(msg: string): void;
    aviso(msg: string): void;
    debug(msg: string): void;
    fase: typeof fase;
    passo: typeof passo;
    bloco: typeof formatarBloco;
    calcularLargura(titulo: string, linhas: string[], larguraMax?: number): number;
    imprimirBloco(titulo: string, linhas: string[], corTitulo?: StyleFn, larguraMax?: number): void;
};
//# sourceMappingURL=log.d.ts.map