import { config } from '../../config/config.js';
import { LogContextConfig, LogMessages, } from '../../messages/log/log-messages.js';
import { ICONES_FEEDBACK } from '../../messages/ui/icons.js';
import { isJsonMode } from '../../../shared/helpers/json-mode.js';
class LogEngineAdaptativo {
    static instance;
    contextoAtual = 'medio';
    metricas = null;
    isCI = false;
    static getInstance() {
        if (!LogEngineAdaptativo.instance) {
            LogEngineAdaptativo.instance = new LogEngineAdaptativo();
        }
        return LogEngineAdaptativo.instance;
    }
    detectarContexto(fileMap) {
        this.metricas = this.analisarProjeto(fileMap);
        this.isCI = this.detectarCI();
        if (this.isCI) {
            this.contextoAtual = 'ci';
            this.log('debug', LogMessages.contexto.ci_cd, {});
            return 'ci';
        }
        const complexidade = this.metricas.estruturaComplexidade;
        const totalArquivos = this.metricas.totalArquivos;
        const linguagens = this.metricas.linguagens.length;
        if (totalArquivos < 20 && linguagens <= 2 && !this.metricas.temTestes) {
            this.contextoAtual = 'simples';
            this.log('info', LogMessages.contexto.desenvolvedor_novo, {});
        }
        else if (totalArquivos > 100 ||
            linguagens > 3 ||
            complexidade === 'complexa') {
            this.contextoAtual = 'complexo';
            this.log('info', LogMessages.contexto.equipe_experiente, {});
        }
        else {
            this.contextoAtual = 'medio';
        }
        this.log('info', LogMessages.projeto.detectado, {
            tipo: this.contextoAtual,
            confianca: this.calcularConfianca(),
        });
        this.log('debug', LogMessages.projeto.estrutura, {
            arquivos: totalArquivos,
            linguagens,
        });
        return this.contextoAtual;
    }
    analisarProjeto(fileMap) {
        const arquivos = Object.values(fileMap);
        const totalArquivos = arquivos.length;
        const extensoes = new Set(arquivos
            .map((f) => f.relPath.split('.').pop()?.toLowerCase())
            .filter((ext) => Boolean(ext)));
        const linguagens = Array.from(extensoes).filter((ext) => ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'php', 'py', 'xml'].includes(ext));
        const temSrcFolder = arquivos.some((f) => f.relPath.startsWith('src/'));
        const temMultiplosDiretorios = new Set(arquivos.map((f) => f.relPath.split('/')[0])).size > 5;
        const temConfigFiles = arquivos.some((f) => [
            'package.json',
            'tsconfig.json',
            'webpack.config.js',
            'vite.config.ts',
        ].includes(f.relPath.split('/').pop() || ''));
        let estruturaComplexidade = 'simples';
        if (totalArquivos > 100 || temMultiplosDiretorios) {
            estruturaComplexidade = 'complexa';
        }
        else if (totalArquivos > 20 || temSrcFolder || temConfigFiles) {
            estruturaComplexidade = 'media';
        }
        return {
            totalArquivos,
            linguagens,
            estruturaComplexidade,
            temCI: arquivos.some((f) => f.relPath.includes('.github/') || f.relPath.includes('.gitlab-ci')),
            temTestes: arquivos.some((f) => f.relPath.includes('test') || f.relPath.includes('spec')),
            temDependencias: arquivos.some((f) => f.relPath === 'package.json' || f.relPath === 'requirements.txt'),
        };
    }
    detectarCI() {
        return !!(process.env.CI ||
            process.env.GITHUB_ACTIONS ||
            process.env.GITLAB_CI ||
            process.env.JENKINS_URL ||
            config.REPORT_SILENCE_LOGS);
    }
    calcularConfianca() {
        if (!this.metricas)
            return 50;
        let confianca = 60;
        if (this.metricas.totalArquivos > 0)
            confianca += 10;
        if (this.metricas.linguagens.length > 0)
            confianca += 10;
        if (this.metricas.temTestes)
            confianca += 10;
        if (this.metricas.temDependencias)
            confianca += 10;
        return Math.min(confianca, 95);
    }
    log(level, template, data = {}) {
        if (isJsonMode()) {
            if (level !== 'erro')
                return;
            const formattedMessage = this.formatMessage(template, data, LogContextConfig[this.contextoAtual]);
            console.error(formattedMessage);
            return;
        }
        const contextoConfig = LogContextConfig[this.contextoAtual];
        if (this.isCI && this.contextoAtual === 'ci') {
            this.logEstruturado(level, template, data);
            return;
        }
        const formattedMessage = this.formatMessage(template, data, contextoConfig);
        const timestamp = this.formatTimestamp();
        const logMethod = this.getLogMethod(level);
        logMethod(`[${timestamp}] ${formattedMessage}`);
    }
    logEstruturado(level, template, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message: this.formatMessage(template, data),
            context: this.contextoAtual,
            ...data,
        };
        console.log(JSON.stringify(logEntry));
    }
    formatMessage(template, data, contextoConfig = LogContextConfig[this.contextoAtual]) {
        const processedData = { ...data };
        if (processedData.arquivo && typeof processedData.arquivo === 'string') {
            processedData.arquivo = this.formatarNomeArquivo(processedData.arquivo, contextoConfig.formato_arquivo);
        }
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            const value = processedData[key];
            return value !== undefined ? String(value) : match;
        });
    }
    formatarNomeArquivo(arquivo, formato) {
        switch (formato) {
            case 'nome_apenas':
                return arquivo.split('/').pop() || arquivo;
            case 'relativo':
                return arquivo.length > 50 ? `...${arquivo.slice(-45)}` : arquivo;
            case 'completo':
                return arquivo;
            default:
                return arquivo;
        }
    }
    formatTimestamp() {
        const now = new Date();
        return now.toTimeString().slice(0, 8);
    }
    getLogMethod(level) {
        switch (level) {
            case 'erro':
                return console.error;
            case 'aviso':
                return console.warn;
            default:
                return console.log;
        }
    }
    get contexto() {
        return this.contextoAtual;
    }
    get metricas_projeto() {
        return this.metricas;
    }
    forcarContexto(contexto) {
        this.contextoAtual = contexto;
        this.log('debug', `${ICONES_FEEDBACK.info} Contexto forçado para: ${contexto}`, {});
    }
}
export const logEngine = LogEngineAdaptativo.getInstance();
export { LogEngineAdaptativo };
//# sourceMappingURL=log-engine.js.map