export interface BabelNode {
    type: string;
    [key: string]: unknown;
}
export declare function isBabelNode(obj: unknown): obj is BabelNode;
export type Contador = Record<string, number>;
export interface Estatisticas {
    requires: Contador;
    consts: Contador;
    exports: Contador;
    vars: Contador;
    lets: Contador;
    evals: Contador;
    withs: Contador;
}
export type ComandoOraculo = 'diagnosticar' | 'guardian' | 'podar' | 'reestruturar' | 'atualizar';
//# sourceMappingURL=utils.d.ts.map