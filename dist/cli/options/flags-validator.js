const DEFAULTS = {
    mode: 'compact',
    output: {
        format: 'console',
        jsonAscii: false,
        export: false,
        exportFull: false,
        exportDir: 'relatorios',
    },
    filters: {
        include: [],
        exclude: [],
        includeTests: false,
        includeNodeModules: false,
    },
    performance: {
        fastMode: false,
    },
    autoFix: {
        enabled: false,
        mode: 'balanced',
        dryRun: false,
    },
    guardian: {
        enabled: false,
        fullScan: false,
        saveBaseline: false,
    },
    verbosity: {
        level: 'info',
        silent: false,
    },
    special: {
        listarAnalistas: false,
        criarArquetipo: false,
        salvarArquetipo: false,
    },
};
export function validateAndNormalizeFlags(opts) {
    const errors = [];
    const warnings = [];
    const normalized = JSON.parse(JSON.stringify(DEFAULTS));
    const modesAtivos = [
        opts.full && 'full',
        opts.executive && 'executive',
        opts.quick && 'quick',
    ].filter(Boolean);
    if (opts['trustCompiler']) {
        normalized['special'] = {
            ...(normalized.special || {}),
            trustCompiler: true,
        };
    }
    if (opts['verifyCycles']) {
        normalized['special'] = {
            ...(normalized.special || {}),
            verifyCycles: true,
        };
    }
    if (modesAtivos.length > 1) {
        errors.push(`Conflito: apenas um modo pode ser ativo (${modesAtivos.join(', ')})`);
    }
    else if (modesAtivos.length === 1) {
        normalized.mode = modesAtivos[0];
    }
    const formatosAtivos = [
        opts.json && 'json',
        opts.markdown && 'markdown',
    ].filter(Boolean);
    if (formatosAtivos.length > 1) {
        errors.push(`Conflito: apenas um formato pode ser ativo (${formatosAtivos.join(', ')})`);
    }
    else if (formatosAtivos.length === 1) {
        normalized.output.format = formatosAtivos[0];
    }
    if (opts.jsonAscii) {
        normalized.output.jsonAscii = true;
    }
    if (opts.export) {
        normalized.output.export = true;
    }
    if (opts.exportFull) {
        normalized.output.exportFull = true;
        normalized.output.export = true;
    }
    if (opts.exportTo) {
        normalized.output.exportDir = opts.exportTo;
    }
    if (opts.include && opts.include.length > 0) {
        normalized.filters.include = opts.include;
    }
    if (opts.exclude && opts.exclude.length > 0) {
        normalized.filters.exclude = opts.exclude;
    }
    if (opts['excludeTests']) {
        normalized.filters.exclude = [
            ...normalized.filters.exclude,
            '**/*.test.*',
            '**/*.spec.*',
            'tests/**',
            'test/**',
            '**/__tests__/**',
        ];
    }
    if (opts.withTests) {
        normalized.filters.includeTests = true;
    }
    if (opts.withNodeModules) {
        normalized.filters.includeNodeModules = true;
    }
    if (opts.onlySrc && normalized.filters.include.length > 0) {
        warnings.push('--only-src será ignorado porque --include foi especificado');
    }
    else if (opts.onlySrc) {
        normalized.filters.include = ['src/**'];
    }
    if (opts.fix || opts.autoFix) {
        normalized.autoFix.enabled = true;
    }
    let modoAutoFix;
    if (opts.autoFixMode) {
        modoAutoFix = opts.autoFixMode;
    }
    else if (opts.fixMode) {
        modoAutoFix = opts.fixMode;
    }
    else if (opts.autoFixConservative || opts.fixSafe) {
        modoAutoFix = 'conservative';
    }
    else if (opts.fixAggressive) {
        modoAutoFix = 'aggressive';
    }
    if (modoAutoFix) {
        const validModes = [
            'conservative',
            'balanced',
            'aggressive',
        ];
        if (validModes.includes(modoAutoFix)) {
            normalized.autoFix.mode = modoAutoFix;
        }
        else {
            warnings.push(`Modo de auto-fix inválido: ${modoAutoFix}. Usando 'balanced'.`);
        }
    }
    if (opts.dryRun) {
        normalized.autoFix.dryRun = true;
    }
    if (opts.guardian || opts.guardianCheck) {
        normalized.guardian.enabled = true;
    }
    if (opts.guardianFull) {
        normalized.guardian.fullScan = true;
        normalized.guardian.enabled = true;
    }
    if (opts.guardianBaseline) {
        normalized.guardian.saveBaseline = true;
        normalized.guardian.enabled = true;
    }
    if (opts['fast']) {
        normalized['performance'] = {
            fastMode: true,
        };
    }
    const verbosidadeAtiva = [
        opts.silent && 'silent',
        opts.quiet && 'quiet',
        opts.verbose && 'verbose',
    ].filter(Boolean);
    if (verbosidadeAtiva.length > 1) {
        warnings.push(`Conflito de verbosidade: ${verbosidadeAtiva.join(', ')}. Usando última.`);
    }
    if (opts.silent) {
        normalized.verbosity.silent = true;
        normalized.verbosity.level = 'error';
    }
    else if (opts.quiet) {
        normalized.verbosity.level = 'warn';
    }
    else if (opts.verbose || opts.debug) {
        normalized.verbosity.level = 'debug';
    }
    else if (opts.logLevel) {
        const validLevels = [
            'error',
            'warn',
            'info',
            'debug',
        ];
        const level = opts.logLevel;
        if (validLevels.includes(level)) {
            normalized.verbosity.level = level;
        }
        else {
            warnings.push(`Nível de log inválido: ${opts.logLevel}. Usando 'info'.`);
        }
    }
    if (opts.listarAnalistas) {
        normalized.special.listarAnalistas = true;
    }
    if (opts.criarArquetipo) {
        normalized.special.criarArquetipo = true;
    }
    if (opts.salvarArquetipo) {
        normalized.special.salvarArquetipo = true;
        normalized.special.criarArquetipo = true;
        warnings.push('--salvar-arquetipo implica --criar-arquetipo (será ativado)');
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        normalized,
    };
}
export function gerarSugestoes(flags) {
    const sugestoes = [];
    if (flags.mode === 'compact') {
        sugestoes.push('💡 Use --full para relatório detalhado com todas as informações');
    }
    else if (flags.mode === 'executive') {
        sugestoes.push('👔 Modo executivo: mostrando apenas problemas críticos');
    }
    if (!flags.output.export && flags.output.format === 'json') {
        sugestoes.push('💡 Combine --json com --export para salvar o relatório');
    }
    if (flags.autoFix.enabled && !flags.autoFix.dryRun) {
        sugestoes.push('⚠️  Auto-fix ativo! Use --dry-run para simular sem modificar arquivos');
    }
    if (!flags.guardian.enabled) {
        sugestoes.push('🛡️  Guardian desativado. Use --guardian para verificar integridade');
    }
    if (flags.filters.include.length === 0) {
        sugestoes.push('📂 Analisando todo o projeto. Use --include para focar em diretórios específicos');
    }
    return sugestoes;
}
//# sourceMappingURL=flags-validator.js.map