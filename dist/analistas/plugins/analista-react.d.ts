import { criarOcorrencia } from '../../types/index.js';
type Msg = ReturnType<typeof criarOcorrencia>;
export declare const analistaReact: {
    nome: string;
    categoria: string;
    descricao: string;
    global: false;
    test: (relPath: string) => boolean;
    aplicar: (src: string, relPath: string) => Promise<Msg[] | null>;
};
export default analistaReact;
//# sourceMappingURL=analista-react.d.ts.map