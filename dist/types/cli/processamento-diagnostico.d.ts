import type { detectarArquetipos } from '../../analistas/detectores/detector-arquetipos.js';
import type { FileEntryWithAst, ResultadoExecucao, ResultadoGuardian } from '../index.js';
export interface OpcoesProcessamentoDiagnostico {
    guardianCheck?: boolean;
    full?: boolean;
    logLevel?: string;
    include?: string[];
    exclude?: string[];
    listarAnalistas?: boolean;
    json?: boolean;
    jsonAscii?: boolean;
    executive?: boolean;
    criarArquetipo?: boolean;
    salvarArquetipo?: boolean;
    detalhado?: boolean;
    autoFix?: boolean;
    autoFixMode?: string;
    autoFixConservative?: boolean;
    fast?: boolean;
    fix?: boolean;
    fixSafe?: boolean;
    showFixes?: boolean;
}
export interface ResultadoProcessamentoDiagnostico {
    totalOcorrencias: number;
    temErro: boolean;
    guardianResultado?: ResultadoGuardian;
    arquetiposResultado?: Awaited<ReturnType<typeof detectarArquetipos>>;
    fileEntriesComAst: FileEntryWithAst[];
    resultadoFinal: ResultadoExecucao;
}
//# sourceMappingURL=processamento-diagnostico.d.ts.map