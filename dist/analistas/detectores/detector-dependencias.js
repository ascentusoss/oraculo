import path from 'node:path';
import { config } from '../../core/config/config.js';
import { traverse } from '../../core/config/traverse.js';
import { DetectorDependenciasMessages } from '../../core/messages/analistas/detector-dependencias-messages.js';
export const grafoDependencias = new Map();
export const importsUsadosDinamicamente = new Map();
function normalizarPosix(p) {
    return path.posix.normalize((p || '').replace(/\\/g, '/'));
}
function ehImportSomenteTipo(node) {
    const kind = node.importKind;
    if (kind === 'type')
        return true;
    const specifiers = node.specifiers || [];
    if (specifiers.length === 0)
        return false;
    return specifiers.every((s) => {
        const sk = s.importKind;
        return sk === 'type';
    });
}
function resolverArquivoExistente(caminho, arquivosExistentes) {
    const alvo = normalizarPosix(caminho);
    if (arquivosExistentes.has(alvo))
        return alvo;
    const ext = path.posix.extname(alvo);
    const base = ext ? alvo.slice(0, -ext.length) : alvo;
    if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
        const candidates = [
            `${base}.ts`,
            `${base}.tsx`,
            `${base}.js`,
            `${base}.mjs`,
            `${base}.cjs`,
        ];
        for (const c of candidates) {
            const n = normalizarPosix(c);
            if (arquivosExistentes.has(n))
                return n;
        }
    }
    if (ext === '.jsx') {
        const candidates = [`${base}.tsx`, `${base}.ts`, `${base}.jsx`];
        for (const c of candidates) {
            const n = normalizarPosix(c);
            if (arquivosExistentes.has(n))
                return n;
        }
    }
    if (!ext) {
        const candidates = [
            `${alvo}.ts`,
            `${alvo}.tsx`,
            `${alvo}.js`,
            `${alvo}.jsx`,
            `${alvo}.mjs`,
            `${alvo}.cjs`,
            `${alvo}.d.ts`,
            `${alvo}/index.ts`,
            `${alvo}/index.tsx`,
            `${alvo}/index.js`,
            `${alvo}/index.mjs`,
            `${alvo}/index.cjs`,
        ];
        for (const c of candidates) {
            const n = normalizarPosix(c);
            if (arquivosExistentes.has(n))
                return n;
        }
    }
    return alvo;
}
function resolverModulo(mod, relPath, arquivosExistentes) {
    if (!mod.startsWith('.') && !mod.startsWith('/')) {
        return { key: mod, existe: true };
    }
    if (mod.startsWith('/')) {
        const absNorm = normalizarPosix(mod);
        if (!arquivosExistentes)
            return { key: absNorm, existe: true };
        const resolved = resolverArquivoExistente(absNorm, arquivosExistentes);
        return { key: resolved, existe: arquivosExistentes.has(resolved) };
    }
    const fromDir = normalizarPosix(path.posix.dirname(normalizarPosix(relPath)));
    const joined = normalizarPosix(path.posix.join(fromDir, mod));
    if (!arquivosExistentes)
        return { key: joined, existe: true };
    const resolved = resolverArquivoExistente(joined, arquivosExistentes);
    return { key: resolved, existe: arquivosExistentes.has(resolved) };
}
function verificarCicloConfirmado(ciclo, grafo, arquivosExistentes) {
    if (ciclo.length < 2)
        return false;
    if (!arquivosExistentes)
        return true;
    for (const no of ciclo) {
        const n = normalizarPosix(no);
        if (!arquivosExistentes.has(n))
            return false;
    }
    for (let i = 0; i < ciclo.length - 1; i++) {
        const de = normalizarPosix(ciclo[i]);
        const para = normalizarPosix(ciclo[i + 1]);
        const deps = grafo.get(de);
        if (!deps)
            return false;
        const depsNorm = new Set(Array.from(deps).map((d) => normalizarPosix(d)));
        if (!depsNorm.has(para))
            return false;
    }
    return true;
}
function detectarCicloComplexo(inicio, grafo, maxProfundidade = 5) {
    const visitados = new Set();
    const pilha = new Set();
    const caminho = [];
    const inicioNormalizado = path.normalize(inicio).replace(/\\/g, '/');
    function resolverCaminho(from, to) {
        if (to.startsWith('.')) {
            const fromDir = path.dirname(from);
            const resolved = path.join(fromDir, to);
            return path.normalize(resolved).replace(/\\/g, '/');
        }
        return path.normalize(to).replace(/\\/g, '/');
    }
    function buscarDependencias(arquivo) {
        const normalizado = path.normalize(arquivo).replace(/\\/g, '/');
        if (grafo.has(arquivo))
            return grafo.get(arquivo);
        if (grafo.has(normalizado))
            return grafo.get(normalizado);
        for (const [chave, deps] of grafo.entries()) {
            if (path.normalize(chave).replace(/\\/g, '/') === normalizado) {
                return deps;
            }
        }
        return undefined;
    }
    function dfs(atual, profundidade) {
        if (profundidade > maxProfundidade)
            return false;
        const atualNormalizado = path.normalize(atual).replace(/\\/g, '/');
        if (pilha.has(atualNormalizado)) {
            const indiceCiclo = caminho.findIndex((p) => path.normalize(p).replace(/\\/g, '/') === atualNormalizado);
            if (indiceCiclo >= 0) {
                caminho.push(atualNormalizado);
                return true;
            }
            return false;
        }
        if (visitados.has(atualNormalizado))
            return false;
        visitados.add(atualNormalizado);
        pilha.add(atualNormalizado);
        caminho.push(atualNormalizado);
        const dependencias = buscarDependencias(atual);
        if (dependencias) {
            for (const dep of dependencias) {
                if (!dep.startsWith('.') &&
                    !dep.startsWith('/') &&
                    !dep.startsWith('src'))
                    continue;
                const depResolvida = resolverCaminho(atualNormalizado, dep);
                if (dfs(depResolvida, profundidade + 1)) {
                    return true;
                }
            }
        }
        pilha.delete(atualNormalizado);
        caminho.pop();
        return false;
    }
    if (dfs(inicioNormalizado, 0)) {
        const ultimoNo = caminho[caminho.length - 1];
        const indiceCiclo = caminho.findIndex((p) => path.normalize(p).replace(/\\/g, '/') === ultimoNo);
        if (indiceCiclo >= 0) {
            const cicloCompleto = caminho.slice(indiceCiclo);
            const cicloValido = cicloCompleto.every((no) => {
                const normalizado = path.normalize(no).replace(/\\/g, '/');
                return (grafo.has(no) ||
                    grafo.has(normalizado) ||
                    Array.from(grafo.keys()).some((k) => path.normalize(k).replace(/\\/g, '/') === normalizado));
            });
            return cicloValido ? cicloCompleto : [];
        }
    }
    return [];
}
export function isUsadoEmRegistroDinamico(src, importName) {
    const padroesRegistro = [
        `register\\(\\s*${importName}`,
        `\\.register\\(\\s*${importName}`,
        `use\\(\\s*${importName}`,
        `\\.use\\(\\s*${importName}`,
        `registerPlugin\\(\\s*${importName}`,
        `addPlugin\\(\\s*${importName}`,
        `apply\\(\\s*${importName}`,
        `\\.apply\\(\\s*${importName}`,
        `load\\(\\s*${importName}`,
        `\\.load\\(\\s*${importName}`,
        `\\.on\\(\\s*[^,]+,\\s*${importName}\\s*\\)`,
        `\\.once\\(\\s*[^,]+,\\s*${importName}\\s*\\)`,
        `\\.(?:get|post|put|delete|patch|options|head)\\(\\s*[^,]+,\\s*${importName}\\s*\\)`,
        `\\[\\s*[^\\]]*${importName}[^\\]]*\\]`,
        `\\.push\\(\\s*${importName}\\s*\\)`,
        `providers\\s*:\\s*\\[[^\\]]*${importName}[^\\]]*\\]`,
        `controllers\\s*:\\s*\\[[^\\]]*${importName}[^\\]]*\\]`,
        `imports\\s*:\\s*\\[[^\\]]*${importName}[^\\]]*\\]`,
        `exports\\s*:\\s*\\[[^\\]]*${importName}[^\\]]*\\]`,
        `components\\s*:\\s*\\{[^}]*${importName}[^}]*\\}`,
        `combineReducers\\s*\\(\\s*\\{[^}]*${importName}[^}]*\\}`,
        `:\\s*${importName}\\s*[,}]`,
    ];
    return padroesRegistro.some((padrao) => new RegExp(padrao).test(src));
}
export const detectorDependencias = {
    nome: 'detector-dependencias',
    test(relPath) {
        return relPath.endsWith('.ts') || relPath.endsWith('.js');
    },
    aplicar(src, relPath, ast, _fullPath, contexto) {
        if (!ast)
            return [];
        const ocorrencias = [];
        const tiposImport = new Set();
        const arquivosExistentes = contexto
            ? new Set(contexto.arquivos.map((f) => f.relPath))
            : undefined;
        let depsSet = grafoDependencias.get(relPath);
        const importsDeclarados = new Set();
        traverse(ast.node, {
            ImportDeclaration(p) {
                const somenteTipo = ehImportSomenteTipo(p.node);
                if (!somenteTipo)
                    tiposImport.add('import');
                const val = p.node.source.value;
                if (somenteTipo) {
                    const specifiers = p.node.specifiers || [];
                    for (const s of specifiers) {
                        if (s.type === 'ImportDefaultSpecifier' ||
                            s.type === 'ImportSpecifier') {
                            importsDeclarados.add(s.local.name);
                        }
                        else if (s.type === 'ImportNamespaceSpecifier') {
                            importsDeclarados.add(s.local.name);
                        }
                    }
                    return;
                }
                const resolved = resolverModulo(val, relPath, arquivosExistentes);
                if (!depsSet) {
                    depsSet = new Set();
                    grafoDependencias.set(relPath, depsSet);
                }
                depsSet.add(resolved.key);
                if (!val.startsWith('.') && !val.startsWith('/')) {
                    ocorrencias.push({
                        tipo: 'info',
                        mensagem: DetectorDependenciasMessages.importDependenciaExterna(val),
                        relPath,
                        linha: p.node.loc?.start.line,
                        coluna: p.node.loc?.start.column,
                    });
                }
                if (val.startsWith('.') && val.split('../').length > 3) {
                    ocorrencias.push({
                        tipo: 'aviso',
                        mensagem: DetectorDependenciasMessages.importRelativoLongo(val),
                        relPath,
                        linha: p.node.loc?.start.line,
                        coluna: p.node.loc?.start.column,
                    });
                }
                if (relPath.endsWith('.ts') &&
                    val.endsWith('.js') &&
                    !resolved.key.endsWith('.ts')) {
                    ocorrencias.push({
                        tipo: 'aviso',
                        mensagem: DetectorDependenciasMessages.importJsEmTs(val),
                        relPath,
                        linha: p.node.loc?.start.line,
                        coluna: p.node.loc?.start.column,
                    });
                }
                if (val.startsWith('.')) {
                    if (arquivosExistentes && !resolved.existe) {
                        ocorrencias.push({
                            tipo: 'erro',
                            mensagem: DetectorDependenciasMessages.importArquivoInexistente(val),
                            relPath,
                            linha: p.node.loc?.start.line,
                            coluna: p.node.loc?.start.column,
                        });
                    }
                }
                const specifiers = p.node.specifiers || [];
                for (const s of specifiers) {
                    if (s.type === 'ImportDefaultSpecifier' ||
                        s.type === 'ImportSpecifier') {
                        importsDeclarados.add(s.local.name);
                    }
                    else if (s.type === 'ImportNamespaceSpecifier') {
                        importsDeclarados.add(s.local.name);
                    }
                }
            },
            CallExpression(p) {
                const { callee, arguments: args } = p.node;
                if (callee.type === 'Identifier' &&
                    callee.name === 'require' &&
                    args[0]?.type === 'StringLiteral') {
                    tiposImport.add('require');
                    const val = args[0].value;
                    const resolved = resolverModulo(val, relPath, arquivosExistentes);
                    if (!depsSet) {
                        depsSet = new Set();
                        grafoDependencias.set(relPath, depsSet);
                    }
                    depsSet.add(resolved.key);
                    if (!val.startsWith('.') && !val.startsWith('/')) {
                        ocorrencias.push({
                            tipo: 'info',
                            mensagem: DetectorDependenciasMessages.requireDependenciaExterna(val),
                            relPath,
                            linha: p.node.loc?.start.line,
                            coluna: p.node.loc?.start.column,
                        });
                    }
                    if (val.startsWith('.') && val.split('../').length > 3) {
                        ocorrencias.push({
                            tipo: 'aviso',
                            mensagem: DetectorDependenciasMessages.requireRelativoLongo(val),
                            relPath,
                            linha: p.node.loc?.start.line,
                            coluna: p.node.loc?.start.column,
                        });
                    }
                    if (relPath.endsWith('.ts') &&
                        val.endsWith('.js') &&
                        !resolved.key.endsWith('.ts')) {
                        ocorrencias.push({
                            tipo: 'aviso',
                            mensagem: DetectorDependenciasMessages.requireJsEmTs(val),
                            relPath,
                            linha: p.node.loc?.start.line,
                            coluna: p.node.loc?.start.column,
                        });
                    }
                    if (val.startsWith('.')) {
                        if (arquivosExistentes && !resolved.existe) {
                            ocorrencias.push({
                                tipo: 'erro',
                                mensagem: DetectorDependenciasMessages.requireArquivoInexistente(val),
                                relPath,
                                linha: p.node.loc?.start.line,
                                coluna: p.node.loc?.start.column,
                            });
                        }
                    }
                }
            },
        });
        if (importsDeclarados.size > 0) {
            let usadosDinamicos = importsUsadosDinamicamente.get(relPath);
            for (const nome of Array.from(importsDeclarados)) {
                const usado = isUsadoEmRegistroDinamico(src, nome);
                if (usado) {
                    if (!usadosDinamicos) {
                        usadosDinamicos = new Set();
                        importsUsadosDinamicamente.set(relPath, usadosDinamicos);
                    }
                    usadosDinamicos.add(nome);
                    if (config.VERBOSE) {
                        ocorrencias.push({
                            tipo: 'info',
                            mensagem: DetectorDependenciasMessages.importUsadoRegistroDinamico(nome),
                            relPath,
                        });
                    }
                }
            }
        }
        if (tiposImport.size > 1) {
            ocorrencias.push({
                tipo: 'aviso',
                mensagem: DetectorDependenciasMessages.usoMistoRequireImport,
                relPath,
            });
        }
        if (grafoDependencias.get(relPath)?.has(relPath)) {
            ocorrencias.push({
                tipo: 'alerta',
                mensagem: DetectorDependenciasMessages.importCircularSelf,
                relPath,
            });
        }
        const maxDepth = typeof config
            .DEPENDENCIAS_MAX_PROFUNDIDADE === 'number'
            ? config
                .DEPENDENCIAS_MAX_PROFUNDIDADE
            : 5;
        const ciclo = detectarCicloComplexo(relPath, grafoDependencias, maxDepth);
        if (ciclo.length > 1) {
            const verifyCycles = Boolean(config['SPECIAL_VERIFY_CYCLES']);
            if (verifyCycles &&
                !verificarCicloConfirmado(ciclo, grafoDependencias, arquivosExistentes)) {
                return Array.isArray(ocorrencias) ? ocorrencias : [];
            }
            const caminhoLimpo = ciclo.map((p) => {
                const relativo = path.relative(process.cwd(), p) || p;
                return relativo.replace(/\\/g, '/');
            });
            const caminhoCompleto = caminhoLimpo.join(' → ');
            ocorrencias.push({
                tipo: 'alerta',
                mensagem: DetectorDependenciasMessages.dependenciaCircular(ciclo.length, caminhoCompleto),
                relPath,
                contexto: `Ciclo completo: ${caminhoCompleto}`,
            });
        }
        return Array.isArray(ocorrencias) ? ocorrencias : [];
    },
};
//# sourceMappingURL=detector-dependencias.js.map