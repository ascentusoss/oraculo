import { criarOcorrencia } from '../../types/index.js';
type Msg = ReturnType<typeof criarOcorrencia>;
export declare const analistaCss: {
    nome: string;
    categoria: string;
    descricao: string;
    global: false;
    test: (relPath: string) => boolean;
    aplicar: (src: string, relPath: string) => Promise<Msg[] | null>;
};
export default analistaCss;
//# sourceMappingURL=analista-css.d.ts.map