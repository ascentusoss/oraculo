import type { OpcoesEstrategista } from '../../shared/helpers/estrutura.js';
import type { ContextoExecucao, PlanoSugestaoEstrutura } from '../../types/index.js';
export declare function gerarPlanoEstrategico(contexto: Pick<ContextoExecucao, 'arquivos' | 'baseDir'>, opcoes?: OpcoesEstrategista, sinaisAvancados?: import('../../types/index.js').SinaisProjetoAvancados): Promise<PlanoSugestaoEstrutura>;
export declare const EstrategistaEstrutura: {
    nome: string;
    gerarPlano: typeof gerarPlanoEstrategico;
};
//# sourceMappingURL=estrategista-estrutura.d.ts.map