// SPDX-License-Identifier: MIT
/**
 * Analista de Sugestões Contextuais Inteligentes
 *
 * Utiliza o sistema de detecção contextual para gerar sugestões específicas
 * baseadas no tipo real de projeto detectado, considerando:
 * - Dependências e configurações
 * - Padrões de código específicos
 * - Estrutura e nomenclatura
 * - Melhores práticas por tecnologia
 */

import { detectarContextoInteligente } from '@analistas/detectores/detector-contexto-inteligente.js';
import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import { log } from '@core/messages/index.js';
import { SugestoesContextuaisMessages } from '@core/messages/ui/sugestoes-contextuais-messages.js';

import type { Analista, ContextoExecucao, Ocorrencia, PackageJson } from '@';

export const analistaSugestoesContextuais: Analista = {
  nome: 'sugestoes-contextuais',
  categoria: 'estrategia',
  descricao:
    'Gera sugestões específicas baseadas no contexto real do projeto detectado',
  global: true, // Analisa contexto global do projeto

  async aplicar(
    _src: string,
    _relPath: string,
    _ast: NodePath<Node> | null, // AST node path
    _fullPath?: string,
    contexto?: ContextoExecucao,
  ): Promise<Ocorrencia[]> {
    const ocorrencias: Ocorrencia[] = [];

    if (!contexto) {
      return ocorrencias;
    }

    try {
      // Obter package.json se disponível
      let packageJson: PackageJson | undefined;
      try {
        const pkgFile = contexto.arquivos.find(
          (f) => f.relPath === 'package.json',
        );
        if (pkgFile?.content) {
          packageJson = JSON.parse(pkgFile.content);
        }
      } catch {
        // Ignorar erros de parsing do package.json
      }

      // Extrair estrutura de diretórios dos arquivos
      const estruturaDetectada = Array.from(
        new Set(
          contexto.arquivos
            .map((f) =>
              f.relPath.includes('/') ? f.relPath.split('/')[0] : '',
            )
            .filter((dir) => dir && dir !== '.'),
        ),
      );

      // Executar detecção contextual inteligente
      const resultados = detectarContextoInteligente(
        estruturaDetectada,
        contexto.arquivos,
        packageJson,
      );

      if (resultados.length === 0) {
        ocorrencias.push({
          tipo: 'sugestoes_arquitetura',
          nivel: 'info',
          mensagem: SugestoesContextuaisMessages.arquetipoNaoIdentificado,
          relPath: '',
          linha: 0,
        });
        return ocorrencias;
      }

      const melhorResultado = resultados[0];
      const confiancaPercent = Math.round(melhorResultado.confiancaTotal * 100);

      // Gerar ocorrência principal com identificação
      ocorrencias.push({
        tipo: 'identificacao_projeto',
        nivel: 'info',
        mensagem: SugestoesContextuaisMessages.projetoIdentificado(
          melhorResultado.tecnologia,
          confiancaPercent,
        ),
        relPath: '',
        linha: 0,
        detalhes: {
          tecnologia: melhorResultado.tecnologia,
          confianca: melhorResultado.confiancaTotal,
          evidencias: melhorResultado.evidencias.length,
        },
      });

      // Gerar sugestões de melhorias
      for (const sugestao of melhorResultado.sugestoesMelhoria || []) {
        ocorrencias.push({
          tipo: 'sugestao_melhoria',
          nivel: 'info',
          mensagem: sugestao,
          relPath: '',
          linha: 0,
          detalhes: {
            tecnologia: melhorResultado.tecnologia,
            categoria: 'melhoria',
          },
        });
      }

      // Gerar alertas de problemas
      for (const problema of melhorResultado.problemasDetectados || []) {
        ocorrencias.push({
          tipo: 'problema_seguranca',
          nivel: 'aviso',
          mensagem: problema,
          relPath: '',
          linha: 0,
          detalhes: {
            tecnologia: melhorResultado.tecnologia,
            categoria: 'problema',
          },
        });
      }

      // Gerar ocorrências para evidências mais relevantes
      const evidenciasTop = melhorResultado.evidencias
        .filter((e) => e.confianca > 0.8)
        .slice(0, 5); // Top 5 evidências

      for (const evidencia of evidenciasTop) {
        let mensagem = '';
        const nivel: 'info' | 'aviso' | 'erro' = 'info';

        switch (evidencia.tipo) {
          case 'dependencia':
            mensagem = SugestoesContextuaisMessages.evidenciaDependencia(
              evidencia.valor,
              melhorResultado.tecnologia,
            );
            break;
          case 'import':
            mensagem = SugestoesContextuaisMessages.evidenciaImport(
              evidencia.valor,
              evidencia.localizacao,
            );
            break;
          case 'codigo':
            mensagem = SugestoesContextuaisMessages.evidenciaCodigo(
              evidencia.localizacao,
            );
            break;
          case 'estrutura':
            mensagem = SugestoesContextuaisMessages.evidenciaEstrutura(
              evidencia.valor,
              melhorResultado.tecnologia,
            );
            break;
          default:
            continue; // Pular outros tipos menos relevantes
        }

        ocorrencias.push({
          tipo: 'evidencia_contextual',
          nivel,
          mensagem,
          relPath: evidencia.localizacao || '',
          linha: 0,
          detalhes: {
            tecnologia: melhorResultado.tecnologia,
            tipoEvidencia: evidencia.tipo,
            confianca: evidencia.confianca,
          },
        });
      }

      // Se houver múltiplas tecnologias detectadas, mostrar alternativas
      if (resultados.length > 1) {
        const alternativas = resultados
          .slice(1, 3)
          .map(
            (r) => `${r.tecnologia} (${Math.round(r.confiancaTotal * 100)}%)`,
          )
          .join(', ');

        ocorrencias.push({
          tipo: 'tecnologias_alternativas',
          nivel: 'info',
          mensagem:
            SugestoesContextuaisMessages.tecnologiasAlternativas(alternativas),
          relPath: '',
          linha: 0,
          detalhes: {
            alternativas: resultados.slice(1, 3),
          },
        });
      }
    } catch (error) {
      log.aviso(
        SugestoesContextuaisMessages.erroAnaliseContextual(
          error instanceof Error ? error.message : String(error),
        ),
      );

      ocorrencias.push({
        tipo: 'erro_analise',
        nivel: 'aviso',
        mensagem: SugestoesContextuaisMessages.erroDuranteAnalise,
        relPath: '',
        linha: 0,
      });
    }

    return ocorrencias;
  },
};
