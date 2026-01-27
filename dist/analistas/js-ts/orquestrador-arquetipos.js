import { ARQUETIPOS } from '../estrategistas/arquetipos-defs.js';
import { detectarArquetipoNode } from '../plugins/detector-node.js';
import { detectarArquetipoXML } from '../plugins/detector-xml.js';
import { pontuarTodos } from '../pontuadores/pontuador.js';
import { detectarContextoProjeto } from '../../shared/contexto-projeto.js';
void detectarContextoProjeto;
function criarResultadoDesconhecido(motivo) {
    const anomalias = motivo
        ? [
            {
                path: 'projeto',
                motivo,
                sugerido: 'Adicione mais arquivos ao projeto para melhor detecção',
            },
        ]
        : [];
    return {
        nome: 'desconhecido',
        score: 0,
        confidence: 0,
        matchedRequired: [],
        missingRequired: [],
        matchedOptional: [],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias,
        sugestaoPadronizacao: '',
        explicacaoSimilaridade: '',
        descricao: 'Arquétipo não identificado',
    };
}
export function detectarArquetipo(arquivos) {
    if (arquivos.length < 5) {
        return criarResultadoDesconhecido('Projeto muito pequeno para análise de arquétipo');
    }
    const candidatos = [];
    const hasJS = arquivos.some((f) => f.endsWith('.js') ||
        f.endsWith('.ts') ||
        f.endsWith('.jsx') ||
        f.endsWith('.tsx'));
    const _hasJava = arquivos.some((f) => f.endsWith('.java'));
    const _hasKotlin = arquivos.some((f) => f.endsWith('.kt') || f.endsWith('.kts'));
    const hasXML = arquivos.some((f) => f.endsWith('.xml'));
    const hasPackageJson = arquivos.some((f) => f.endsWith('package.json'));
    if (hasJS || hasPackageJson) {
        candidatos.push(...detectarArquetipoNode(arquivos));
    }
    if (hasXML) {
        candidatos.push(...detectarArquetipoXML(arquivos));
    }
    let lista = candidatos;
    if (!lista.length) {
        lista = pontuarTodos(arquivos);
    }
    if (!lista.length) {
        return {
            nome: 'desconhecido',
            score: 0,
            confidence: 0,
            matchedRequired: [],
            missingRequired: [],
            matchedOptional: [],
            dependencyMatches: [],
            filePatternMatches: [],
            forbiddenPresent: [],
            anomalias: [],
            sugestaoPadronizacao: '',
            explicacaoSimilaridade: '',
            descricao: 'Arquétipo não identificado',
        };
    }
    const apenasPenalidades = lista.filter((c) => {
        const pos = (c.matchedRequired?.length || 0) +
            (c.matchedOptional?.length || 0) +
            (c.dependencyMatches?.length || 0) +
            (c.filePatternMatches?.length || 0);
        const forb = c.forbiddenPresent?.length || 0;
        return forb > 0 && pos === 0;
    });
    if (apenasPenalidades.length > 0) {
        const filtrados = apenasPenalidades.filter((c) => {
            if (c.nome === 'monorepo-packages') {
                const forb = c.forbiddenPresent || [];
                if (forb.length === 1 && forb[0] === 'src')
                    return false;
            }
            return true;
        });
        if (filtrados.length === 0) {
        }
        else {
            filtrados.sort((a, b) => {
                const forbA = a.forbiddenPresent?.length || 0;
                const forbB = b.forbiddenPresent?.length || 0;
                const defA = ARQUETIPOS.find((d) => d.nome === a.nome);
                const defB = ARQUETIPOS.find((d) => d.nome === b.nome);
                const totA = defA?.forbiddenDirs?.length || 0;
                const totB = defB?.forbiddenDirs?.length || 0;
                const ratioA = totA > 0 ? forbA / totA : 0;
                const ratioB = totB > 0 ? forbB / totB : 0;
                if (ratioB !== ratioA)
                    return ratioB - ratioA;
                if (forbB !== forbA)
                    return forbB - forbA;
                const miss = (b.missingRequired?.length || 0) - (a.missingRequired?.length || 0);
                if (miss !== 0)
                    return miss;
                return a.nome.localeCompare(b.nome);
            });
            return filtrados[0];
        }
    }
    lista.sort((a, b) => {
        const mm = (a.missingRequired?.length || 0) - (b.missingRequired?.length || 0);
        if (mm !== 0)
            return mm;
        if (b.score !== a.score)
            return b.score - a.score;
        const mr = (b.matchedRequired?.length || 0) - (a.matchedRequired?.length || 0);
        if (mr !== 0)
            return mr;
        if (b.confidence !== a.confidence)
            return b.confidence - a.confidence;
        return a.nome.localeCompare(b.nome);
    });
    const best = lista[0];
    const hasSignals = (best.matchedRequired?.length || 0) > 0 ||
        (best.matchedOptional?.length || 0) > 0 ||
        (best.dependencyMatches?.length || 0) > 0 ||
        (best.filePatternMatches?.length || 0) > 0 ||
        (best.forbiddenPresent?.length || 0) > 0;
    if (!hasSignals) {
        return {
            nome: 'desconhecido',
            score: 0,
            confidence: 0,
            matchedRequired: [],
            missingRequired: [],
            matchedOptional: [],
            dependencyMatches: [],
            filePatternMatches: [],
            forbiddenPresent: [],
            anomalias: [],
            sugestaoPadronizacao: '',
            explicacaoSimilaridade: '',
            descricao: 'Arquétipo não identificado',
        };
    }
    return best;
}
//# sourceMappingURL=orquestrador-arquetipos.js.map