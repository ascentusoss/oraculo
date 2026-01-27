import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ExcecoesMessages } from '../../core/messages/core/excecoes-messages.js';
import { log, logAuto } from '../../core/messages/index.js';
import { ORACULO_FILES } from '../../core/registry/paths.js';
import { lerEstado, salvarEstado } from '../../shared/persistence/persistencia.js';
export class GerenciadorMapaReversao {
    mapaPath;
    mapa;
    constructor(opts) {
        this.mapaPath = opts?.mapaPath ?? ORACULO_FILES.MAPA_REVERSAO;
        this.mapa = {
            versao: '1.0.0',
            moves: [],
            metadata: {
                totalMoves: 0,
                ultimoMove: '',
                podeReverter: true,
            },
        };
    }
    async carregar() {
        try {
            this.mapa = (await lerEstado(this.mapaPath, null)) ?? {
                versao: '1.0.0',
                moves: [],
                metadata: { totalMoves: 0, ultimoMove: '', podeReverter: true },
            };
            if (!this.mapa.moves || !Array.isArray(this.mapa.moves)) {
                throw new Error(ExcecoesMessages.mapaReversaoCorrompido);
            }
            logAuto.mapaReversaoCarregado(this.mapa.moves.length);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                logAuto.mapaReversaoNenhumEncontrado();
            }
            else {
                logAuto.mapaReversaoErroCarregar(error.message);
                this.mapa = {
                    versao: '1.0.0',
                    moves: [],
                    metadata: {
                        totalMoves: 0,
                        ultimoMove: '',
                        podeReverter: true,
                    },
                };
            }
        }
    }
    async salvar() {
        try {
            await fs.mkdir(path.dirname(this.mapaPath), { recursive: true });
            await salvarEstado(this.mapaPath, this.mapa);
            log.info(`💾 Mapa de reversão salvo: ${this.mapa.moves.length} moves`);
        }
        catch (error) {
            logAuto.mapaReversaoErroSalvar(error.message);
        }
    }
    async registrarMove(origem, destino, motivo, conteudoOriginal, conteudoFinal, skipSalvar) {
        try {
            const id = `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const move = {
                id,
                timestamp: new Date().toISOString(),
                origem,
                destino,
                motivo,
                importsReescritos: !!conteudoOriginal ||
                    (!!conteudoFinal && conteudoOriginal !== conteudoFinal),
                conteudoOriginal,
                conteudoFinal,
            };
            this.mapa.moves.push(move);
            this.mapa.metadata.totalMoves = this.mapa.moves.length;
            this.mapa.metadata.ultimoMove = move.timestamp;
            if (!skipSalvar) {
                await this.salvar();
            }
            log.info(`📝 Move registrado: ${origem} → ${destino} (${motivo})`);
            return id;
        }
        catch (err) {
            logAuto.mapaReversaoErroSalvar(err.message);
            throw err;
        }
    }
    async removerMove(id) {
        try {
            const indice = this.mapa.moves.findIndex((move) => move.id === id);
            if (indice === -1) {
                return false;
            }
            this.mapa.moves.splice(indice, 1);
            this.mapa.metadata.totalMoves = this.mapa.moves.length;
            await this.salvar();
            logAuto.moveRemovido(id);
            return true;
        }
        catch (err) {
            logAuto.mapaReversaoErroSalvar(err.message);
            return false;
        }
    }
    obterMoves() {
        return [...this.mapa.moves];
    }
    obterMovesPorArquivo(arquivo) {
        return this.mapa.moves.filter((move) => move.origem === arquivo || move.destino === arquivo);
    }
    podeReverterArquivo(arquivo) {
        const moves = this.obterMovesPorArquivo(arquivo);
        return moves.length > 0;
    }
    async reverterMove(id, baseDir = process.cwd()) {
        const move = this.mapa.moves.find((m) => m.id === id);
        if (!move) {
            logAuto.mapaReversaoMoveNaoEncontrado(id);
            return false;
        }
        try {
            const destinoPath = path.join(baseDir, move.destino);
            const origemPath = path.join(baseDir, move.origem);
            try {
                await fs.access(destinoPath);
            }
            catch (err) {
                if (err?.code &&
                    err.code !== 'ENOENT') {
                    logAuto.mapaReversaoErroReverter(err.message);
                    return false;
                }
                logAuto.mapaReversaoArquivoDestinoNaoEncontrado(move.destino);
                return false;
            }
            await fs.mkdir(path.dirname(origemPath), { recursive: true });
            try {
                await fs.access(origemPath);
                logAuto.mapaReversaoArquivoExisteOrigem(move.origem);
                return false;
            }
            catch (err) {
                if (err?.code &&
                    err.code !== 'ENOENT') {
                    logAuto.mapaReversaoErroReverter(err.message);
                    return false;
                }
            }
            if (move.importsReescritos && move.conteudoOriginal) {
                await fs.writeFile(origemPath, move.conteudoOriginal, 'utf-8');
                await fs.unlink(destinoPath);
                log.sucesso(`↩️ Arquivo revertido com conteúdo original: ${move.destino} → ${move.origem}`);
            }
            else {
                await fs.rename(destinoPath, origemPath);
                log.sucesso(`↩️ Arquivo revertido: ${move.destino} → ${move.origem}`);
            }
            await this.removerMove(id);
            return true;
        }
        catch (error) {
            logAuto.mapaReversaoErroReverter(error.message);
            return false;
        }
    }
    async reverterArquivo(arquivo, baseDir = process.cwd()) {
        const moves = this.obterMovesPorArquivo(arquivo);
        if (moves.length === 0) {
            logAuto.mapaReversaoNenhumMove(arquivo);
            return false;
        }
        const movesOrdenados = moves.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        let revertedCount = 0;
        try {
            for (const move of movesOrdenados) {
                const resultado = await this.reverterMove(move.id, baseDir);
                if (resultado)
                    revertedCount += 1;
            }
        }
        catch (error) {
            logAuto.mapaReversaoErroReverter(error.message);
            return false;
        }
        return revertedCount > 0;
    }
    listarMoves() {
        if (this.mapa.moves.length === 0) {
            return '📋 Nenhum move registrado no mapa de reversão.';
        }
        let resultado = `📋 Mapa de Reversão (${this.mapa.moves.length} moves):\n\n`;
        const movesOrdenados = [...this.mapa.moves].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        for (const move of movesOrdenados) {
            const dataFormatada = new Date(move.timestamp).toLocaleString('pt-BR');
            const reescritos = move.importsReescritos ? ' (imports reescritos)' : '';
            resultado += `${move.id}:\n`;
            resultado += `  📅 ${dataFormatada}\n`;
            resultado += `  📁 ${move.origem} → ${move.destino}\n`;
            resultado += `  💬 ${move.motivo}${reescritos}\n\n`;
        }
        return resultado;
    }
    async limpar() {
        try {
            this.mapa.moves = [];
            this.mapa.metadata.totalMoves = 0;
            this.mapa.metadata.ultimoMove = '';
            await this.salvar();
            log.info('🧹 Mapa de reversão limpo');
        }
        catch (err) {
            logAuto.mapaReversaoErroSalvar(err.message);
        }
    }
}
export const mapaReversao = new GerenciadorMapaReversao();
//# sourceMappingURL=mapa-reversao.js.map