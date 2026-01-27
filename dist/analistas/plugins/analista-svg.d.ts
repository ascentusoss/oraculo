import type { Ocorrencia } from '../../types/index.js';
export declare const analistaSvg: {
    nome: string;
    categoria: string;
    descricao: string;
    global: false;
    test: (relPath: string) => boolean;
    aplicar: (src: string, relPath: string) => Promise<Ocorrencia[] | null>;
};
export default analistaSvg;
//# sourceMappingURL=analista-svg.d.ts.map