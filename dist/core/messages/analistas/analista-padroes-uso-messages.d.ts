export declare const PadroesUsoMessages: {
    readonly varUsage: "Uso de 'var' detectado. Prefira 'let' ou 'const'.";
    readonly letUsage: "Uso de 'let'. Considere 'const' se não houver reatribuição.";
    readonly requireInTs: "Uso de 'require' em arquivo TypeScript. Prefira 'import'.";
    readonly evalUsage: "Uso de 'eval' detectado. Evite por questões de segurança e performance.";
    readonly moduleExportsInTs: "Uso de 'module.exports' ou 'exports' em arquivo TypeScript. Prefira 'export'.";
    readonly withUsage: "Uso de 'with' detectado. Evite por questões de legibilidade e escopo.";
    readonly anonymousFunction: "Função anônima detectada. Considere nomear funções para melhor rastreabilidade.";
    readonly arrowAsClassMethod: "Arrow function usada como método de classe. Prefira método tradicional para melhor herança.";
    readonly erroAnalise: (relPath: string, erro: string) => string;
};
//# sourceMappingURL=analista-padroes-uso-messages.d.ts.map