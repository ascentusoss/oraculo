import fs from 'node:fs';
import path from 'node:path';
export function gerarRelatorioJson(dados, options = {}) {
    const opts = {
        escapeAscii: options.escapeAscii ?? true,
        includeDetails: options.includeDetails ?? true,
        includeContext: options.includeContext ?? false,
        compact: options.compact ?? false,
        maxOcorrencias: options.maxOcorrencias,
    };
    let ocorrencias = dados.ocorrencias || [];
    if (opts.maxOcorrencias && ocorrencias.length > opts.maxOcorrencias) {
        ocorrencias = ocorrencias.slice(0, opts.maxOcorrencias);
    }
    const relatorio = {
        metadata: dados.metadata || {
            timestamp: new Date().toISOString(),
            schemaVersion: '1.0.0',
            modo: 'full',
            flags: [],
            oraculoVersion: (() => {
                try {
                    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
                    return pkg.version || 'unknown';
                }
                catch {
                    return 'unknown';
                }
            })(),
            projectName: (() => {
                try {
                    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
                    return pkg.name || 'unknown';
                }
                catch {
                    return 'unknown';
                }
            })(),
        },
        stats: dados.stats || {
            arquivosAnalisados: 0,
            arquivosComProblemas: 0,
            totalOcorrencias: 0,
            porNivel: { erro: 0, aviso: 0, info: 0 },
            porCategoria: {},
        },
        ocorrencias: opts.includeDetails ? ocorrencias : [],
        ...(dados.guardian && { guardian: dados.guardian }),
        ...(dados.arquetipos && { arquetipos: dados.arquetipos }),
        ...(dados.autoFix && { autoFix: dados.autoFix }),
        ...(dados.linguagens && { linguagens: dados.linguagens }),
        ...(dados.sugestoes && { sugestoes: dados.sugestoes }),
    };
    const indent = opts.compact ? 0 : 2;
    let json = JSON.stringify(relatorio, null, indent);
    if (opts.escapeAscii) {
        json = escapeNonAscii(json);
    }
    return json;
}
function escapeNonAscii(str) {
    let resultado = '';
    let i = 0;
    while (i < str.length) {
        const code = str.charCodeAt(i);
        if (code < 128) {
            resultado += str[i];
            i++;
            continue;
        }
        if (code >= 0xd800 && code <= 0xdbff) {
            if (i + 1 < str.length) {
                const nextCode = str.charCodeAt(i + 1);
                if (nextCode >= 0xdc00 && nextCode <= 0xdfff) {
                    resultado += `\\u${code.toString(16).padStart(4, '0')}`;
                    resultado += `\\u${nextCode.toString(16).padStart(4, '0')}`;
                    i += 2;
                    continue;
                }
            }
        }
        resultado += `\\u${code.toString(16).padStart(4, '0')}`;
        i++;
    }
    return resultado;
}
export function validarJson(json) {
    try {
        JSON.parse(json);
        return { valido: true };
    }
    catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        return { valido: false, erro: mensagem };
    }
}
export function criarMetadata(modo, flags, filtros) {
    return {
        timestamp: new Date().toISOString(),
        schemaVersion: '1.0.0',
        modo,
        flags,
        ...(filtros && { filtros }),
    };
}
export function criarStats(ocorrencias) {
    const porNivel = { erro: 0, aviso: 0, info: 0 };
    const porCategoria = {};
    const porRegra = {};
    const arquivosSet = new Set();
    for (const ocorrencia of ocorrencias) {
        const nivel = ocorrencia.nivel || 'info';
        if (nivel === 'erro' || nivel === 'aviso' || nivel === 'info') {
            porNivel[nivel] = porNivel[nivel] + 1;
        }
        const tipo = ocorrencia.tipo || 'outros';
        porCategoria[tipo] = (porCategoria[tipo] || 0) + 1;
        porRegra[tipo] = (porRegra[tipo] || 0) + 1;
        if (ocorrencia.relPath) {
            arquivosSet.add(ocorrencia.relPath);
        }
    }
    const arquivosComProblemas = arquivosSet.size;
    return {
        arquivosAnalisados: arquivosSet.size,
        arquivosComProblemas,
        totalOcorrencias: ocorrencias.length,
        porNivel,
        porCategoria,
        byRule: porRegra,
    };
}
export function criarLinguagens(extensoes) {
    const total = Object.values(extensoes).reduce((sum, count) => sum + count, 0);
    return {
        total,
        extensoes,
    };
}
//# sourceMappingURL=json-exporter.js.map