import type { Ocorrencia } from '../../types/index.js';
export declare const analistaCssInJs: {
    nome: string;
    categoria: string;
    descricao: string;
    global: false;
    test: (relPath: string) => boolean;
    aplicar: (src: string, relPath: string) => Promise<Ocorrencia[] | null>;
};
export default analistaCssInJs;
//# sourceMappingURL=analista-css-in-js.d.ts.map