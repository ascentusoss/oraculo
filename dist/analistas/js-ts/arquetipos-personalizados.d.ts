import type { ArquetipoEstruturaDef, ArquetipoPersonalizado } from '../../types/index.js';
export declare function carregarArquetipoPersonalizado(baseDir?: string): Promise<ArquetipoPersonalizado | null>;
export declare function salvarArquetipoPersonalizado(arquetipo: Omit<ArquetipoPersonalizado, 'metadata'>, _baseDir?: string): Promise<void>;
export declare function existeArquetipoPersonalizado(baseDir?: string): Promise<boolean>;
export declare function obterArquetipoOficial(arquetipoPersonalizado: ArquetipoPersonalizado): ArquetipoEstruturaDef | null;
export declare function gerarSugestaoArquetipoPersonalizado(projetoDesconhecido: {
    nome: string;
    estruturaDetectada: string[];
    arquivosRaiz: string[];
}): string;
export declare function criarTemplateArquetipoPersonalizado(nomeProjeto: string, estruturaDetectada: string[], arquivosRaiz: string[], arquetipoSugerido?: string): Omit<ArquetipoPersonalizado, 'metadata'>;
export declare function validarArquetipoPersonalizado(arquetipo: ArquetipoPersonalizado): {
    valido: boolean;
    erros: string[];
};
export declare function listarArquetiposOficiais(): ArquetipoEstruturaDef[];
export declare function integrarArquetipos(personalizado: ArquetipoPersonalizado, oficial: ArquetipoEstruturaDef): ArquetipoEstruturaDef;
//# sourceMappingURL=arquetipos-personalizados.d.ts.map