// SPDX-License-Identifier: MIT
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { ExcecoesMessages } from '/messages/core/excecoes-messages.js';
import { log, logAuto } from '/messages/index.js';
import { ORACULO_FILES } from '/registry/paths.js';
import { lerEstado, salvarEstado } from '/persistence/persistencia.js';

import type { MapaReversao, MoveReversao } from '@';

export class GerenciadorMapaReversao {
  private readonly mapaPath: string;
  private mapa: MapaReversao;

  constructor(opts?: { mapaPath?: string }) {
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

  /**
   * Carrega o mapa de reversão do disco
   */
  async carregar(): Promise<void> {
    try {
      this.mapa = (await lerEstado<MapaReversao | null>(
        this.mapaPath,
        null,
      )) ?? {
        versao: '1.0.0',
        moves: [],
        metadata: { totalMoves: 0, ultimoMove: '', podeReverter: true },
      };

      // Validação básica
      if (!this.mapa.moves || !Array.isArray(this.mapa.moves)) {
        throw new Error(ExcecoesMessages.mapaReversaoCorrompido);
      }

      logAuto.mapaReversaoCarregado(this.mapa.moves.length);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Não persistimos automaticamente um mapa vazio ao carregar: evitar efeitos colaterais
        // (ex.: chamada a fs.mkdir) durante operações que apenas consultam o mapa.
        logAuto.mapaReversaoNenhumEncontrado();
      } else {
        logAuto.mapaReversaoErroCarregar((error as Error).message);
        // Reinicia com mapa vazio em caso de erro
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

  /**
   * Salva o mapa de reversão no disco
   */
  async salvar(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.mapaPath), { recursive: true });
      await salvarEstado(this.mapaPath, this.mapa);
      log.info(`💾 Mapa de reversão salvo: ${this.mapa.moves.length} moves`);
    } catch (error) {
      logAuto.mapaReversaoErroSalvar((error as Error).message);
    }
  }

  /**
   * Registra um novo move no mapa de reversão
   */
  async registrarMove(
    origem: string,
    destino: string,
    motivo: string,
    conteudoOriginal?: string,
    conteudoFinal?: string,
    // quando true, evita persistir o mapa no disco imediatamente (útil para chamadas em massa/tests)
    skipSalvar?: boolean,
  ): Promise<string> {
    try {
      const id = `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const move: MoveReversao = {
        id,
        timestamp: new Date().toISOString(),
        origem,
        destino,
        motivo,
        // Considera que imports foram reescritos se houver conteúdo original
        // fornecido (testes esperam que passar conteudoOriginal permita restauração)
        importsReescritos:
          !!conteudoOriginal ||
          (!!conteudoFinal && conteudoOriginal !== conteudoFinal),
        conteudoOriginal,
        conteudoFinal,
      };

      this.mapa.moves.push(move);
      this.mapa.metadata.totalMoves = this.mapa.moves.length;
      this.mapa.metadata.ultimoMove = move.timestamp;

      // Persiste no disco por padrão; caller pode optar por adiar a persistência
      if (!skipSalvar) {
        await this.salvar();
      }

      log.info(`📝 Move registrado: ${origem} → ${destino} (${motivo})`);
      return id;
    } catch (err) {
      logAuto.mapaReversaoErroSalvar((err as Error).message);
      throw err;
    }
  }

  /**
   * Remove um move do mapa de reversão
   */
  async removerMove(id: string): Promise<boolean> {
    try {
      const indice = this.mapa.moves.findIndex(
        (move: MoveReversao) => move.id === id,
      );
      if (indice === -1) {
        return false;
      }

      this.mapa.moves.splice(indice, 1);
      this.mapa.metadata.totalMoves = this.mapa.moves.length;
      await this.salvar();

      logAuto.moveRemovido(id);
      return true;
    } catch (err) {
      logAuto.mapaReversaoErroSalvar((err as Error).message);
      return false;
    }
  }

  /**
   * Obtém todos os moves registrados
   */
  obterMoves(): MoveReversao[] {
    return [...this.mapa.moves];
  }

  /**
   * Obtém moves por arquivo
   */
  obterMovesPorArquivo(arquivo: string): MoveReversao[] {
    return this.mapa.moves.filter(
      (move: MoveReversao) =>
        move.origem === arquivo || move.destino === arquivo,
    );
  }

  /**
   * Verifica se um arquivo pode ser revertido
   */
  podeReverterArquivo(arquivo: string): boolean {
    const moves = this.obterMovesPorArquivo(arquivo);
    return moves.length > 0;
  }

  /**
   * Reverte um move específico
   */
  async reverterMove(
    id: string,
    baseDir: string = process.cwd(),
  ): Promise<boolean> {
    const move = this.mapa.moves.find((m: MoveReversao) => m.id === id);
    if (!move) {
      logAuto.mapaReversaoMoveNaoEncontrado(id);
      return false;
    }

    try {
      // Verifica se o arquivo de destino ainda existe
      const destinoPath = path.join(baseDir, move.destino);
      const origemPath = path.join(baseDir, move.origem);

      try {
        await fs.access(destinoPath);
      } catch (err) {
        // ENOENT: destino não existe — reportamos e abortamos a reversão do move.
        if (
          (err as NodeJS.ErrnoException)?.code &&
          (err as NodeJS.ErrnoException).code !== 'ENOENT'
        ) {
          logAuto.mapaReversaoErroReverter((err as Error).message);
          return false;
        }
        logAuto.mapaReversaoArquivoDestinoNaoEncontrado(move.destino);
        return false;
      }

      // Verifica se o diretório de origem existe
      await fs.mkdir(path.dirname(origemPath), { recursive: true });

      // Verifica se já existe arquivo na origem
      try {
        await fs.access(origemPath);
        logAuto.mapaReversaoArquivoExisteOrigem(move.origem);
        return false;
      } catch (err) {
        // Se a falha não for ENOENT, trata como erro; caso contrário a origem está livre e seguimos.
        if (
          (err as NodeJS.ErrnoException)?.code &&
          (err as NodeJS.ErrnoException).code !== 'ENOENT'
        ) {
          logAuto.mapaReversaoErroReverter((err as Error).message);
          return false;
        }
        // OK, origem está livre
      }

      // Move o arquivo de volta
      if (move.importsReescritos && move.conteudoOriginal) {
        // Se os imports foram reescritos, usa o conteúdo original
        await fs.writeFile(origemPath, move.conteudoOriginal, 'utf-8');
        await fs.unlink(destinoPath);
        log.sucesso(
          `↩️ Arquivo revertido com conteúdo original: ${move.destino} → ${move.origem}`,
        );
      } else {
        // Move simples
        await fs.rename(destinoPath, origemPath);
        log.sucesso(`↩️ Arquivo revertido: ${move.destino} → ${move.origem}`);
      }

      // Remove o move do mapa
      await this.removerMove(id);

      return true;
    } catch (error) {
      logAuto.mapaReversaoErroReverter((error as Error).message);
      return false;
    }
  }

  /**
   * Reverte todos os moves de um arquivo
   */
  async reverterArquivo(
    arquivo: string,
    baseDir: string = process.cwd(),
  ): Promise<boolean> {
    const moves = this.obterMovesPorArquivo(arquivo);

    if (moves.length === 0) {
      logAuto.mapaReversaoNenhumMove(arquivo);
      return false;
    }

    // Reverte do mais recente para o mais antigo
    const movesOrdenados = moves.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Retorna true se pelo menos um move foi revertido com sucesso
    let revertedCount = 0;
    try {
      for (const move of movesOrdenados) {
        const resultado = await this.reverterMove(move.id, baseDir);
        if (resultado) revertedCount += 1;
      }
    } catch (error) {
      logAuto.mapaReversaoErroReverter((error as Error).message);
      return false;
    }

    return revertedCount > 0;
  }

  /**
   * Lista moves em formato legível
   */
  listarMoves(): string {
    if (this.mapa.moves.length === 0) {
      return '📋 Nenhum move registrado no mapa de reversão.';
    }

    let resultado = `📋 Mapa de Reversão (${this.mapa.moves.length} moves):\n\n`;

    // Ordena por timestamp (mais recente primeiro)
    const movesOrdenados = [...this.mapa.moves].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

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

  /**
   * Limpa o mapa de reversão
   */
  async limpar(): Promise<void> {
    try {
      this.mapa.moves = [];
      this.mapa.metadata.totalMoves = 0;
      this.mapa.metadata.ultimoMove = '';
      await this.salvar();
      log.info('🧹 Mapa de reversão limpo');
    } catch (err) {
      logAuto.mapaReversaoErroSalvar((err as Error).message);
    }
  }
}

// Instância global
export const mapaReversao = new GerenciadorMapaReversao();
