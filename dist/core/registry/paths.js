import path from 'node:path';
export const PROJECT_ROOT = process.cwd();
export const ORACULO_DIRS = {
    STATE: path.join(PROJECT_ROOT, '.oraculo'),
    METRICS_HISTORY: path.join(PROJECT_ROOT, '.oraculo', 'historico-metricas'),
    REPORTS: path.join(PROJECT_ROOT, 'relatorios'),
    PERF: path.join(PROJECT_ROOT, 'docs', 'perf'),
};
export const ORACULO_FILES = {
    CONFIG: path.join(PROJECT_ROOT, 'oraculo.config.json'),
    CONFIG_SAFE: path.join(PROJECT_ROOT, 'oraculo.config.safe.json'),
    GUARDIAN_BASELINE: path.join(ORACULO_DIRS.STATE, 'guardian.baseline.json'),
    ESTRUTURA_BASELINE: path.join(ORACULO_DIRS.STATE, 'estrutura.baseline.json'),
    ESTRUTURA_ARQUETIPO: path.join(ORACULO_DIRS.STATE, 'estrutura.arquetipo.json'),
    MAPA_REVERSAO: path.join(ORACULO_DIRS.STATE, 'mapa-reversao.json'),
    REGISTRO_VIGIA: path.join(ORACULO_DIRS.STATE, 'integridade.json'),
    METRICAS_HISTORICO: path.join(ORACULO_DIRS.METRICS_HISTORY, 'metricas-historico.json'),
    GUARDIAN_BASELINE_LEGACY: path.join(ORACULO_DIRS.STATE, 'baseline.json'),
    ESTRUTURA_BASELINE_LEGACY: path.join(ORACULO_DIRS.STATE, 'baseline-estrutura.json'),
    ESTRUTURA_ARQUETIPO_LEGACY_ROOT: path.join(PROJECT_ROOT, 'oraculo.repo.arquetipo.json'),
};
export const REPORT_PATTERNS = {
    DIAGNOSTICO: (timestamp) => path.join(ORACULO_DIRS.REPORTS, `oraculo-diagnostico-${timestamp}.md`),
    SUMMARY_JSON: (timestamp) => path.join(ORACULO_DIRS.REPORTS, `oraculo-relatorio-summary-${timestamp}.json`),
    ASYNC_ANALYSIS: path.join(ORACULO_DIRS.REPORTS, 'async-analysis-report.json'),
    PERF_BASELINE: (timestamp) => path.join(ORACULO_DIRS.PERF, `baseline-${timestamp}.json`),
    PERF_DIFF: path.join(ORACULO_DIRS.PERF, 'ultimo-diff.json'),
};
export const MIGRATION_MAP = {
    [ORACULO_FILES.GUARDIAN_BASELINE_LEGACY]: ORACULO_FILES.GUARDIAN_BASELINE,
    [ORACULO_FILES.ESTRUTURA_BASELINE_LEGACY]: ORACULO_FILES.ESTRUTURA_BASELINE,
    [ORACULO_FILES.ESTRUTURA_ARQUETIPO_LEGACY_ROOT]: ORACULO_FILES.ESTRUTURA_ARQUETIPO,
};
export function resolveFilePath(newPath) {
    const legacyPath = Object.entries(MIGRATION_MAP).find(([_, target]) => target === newPath)?.[0];
    return legacyPath || newPath;
}
//# sourceMappingURL=paths.js.map