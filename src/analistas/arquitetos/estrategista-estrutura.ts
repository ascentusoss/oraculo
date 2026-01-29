// SPDX-License-Identifier: MIT
import { statSync } from 'node:fs';
import path from 'node:path';

import { getTypesDirectoryRelPosix } from '/config/conventions.js';
import type { OpcoesEstrategista } from '/helpers/estrutura.js';
import {
  carregarConfigEstrategia,
  destinoPara,
  deveIgnorar,
  normalizarRel,
} from '/helpers/estrutura.js';

import type {
  ContextoExecucao,
  PlanoMoverItem,
  PlanoSugestaoEstrutura,
} from '@';

/**
 * Estrategista/Planejador de Estrutura
 *
 * Responsável por: dado o conjunto de arquivos e um catálogo de arquétipos,
 * sugerir um plano de reorganização (mover arquivos) com base em regras de nomeação
 * e diretórios-alvo padronizados. Não aplica mudanças no disco (apenas sugere).
 *
 * Domínio ideal: arquitetos (diagnóstico/planejamento). A execução fica com zeladores.
 */

export async function gerarPlanoEstrategico(
  contexto: Pick<ContextoExecucao, 'arquivos' | 'baseDir'>,
  opcoes: OpcoesEstrategista = {},
  sinaisAvancados?: import('@').SinaisProjetoAvancados,
): Promise<PlanoSugestaoEstrutura> {
  const typesDir = getTypesDirectoryRelPosix();
  const cfg = await carregarConfigEstrategia(contexto.baseDir, {
    ...opcoes,
    ignorarPastas: Array.from(
      new Set([...(opcoes.ignorarPastas || []), typesDir]),
    ).filter(Boolean),
  });
  const mover: PlanoMoverItem[] = [];
  const conflitos: { alvo: string; motivo: string }[] = [];

  // Estratégia atual: heurística de nomeação + config/preset (sem consultar arquétipos aqui para evitar ciclos)

  const rels = contexto.arquivos.map((f) => normalizarRel(f.relPath));

  const isTestLike = (p: string): boolean =>
    /__(tests|mocks)__/.test(p) ||
    /\.(test|spec)\.[jt]sx?$/.test(p) ||
    /fixtures\//.test(p);

  for (const rel of rels) {
    if (deveIgnorar(rel, cfg.ignorarPastas)) continue;
    if (isTestLike(rel)) continue; // não mover testes/fixtures
    // Evitar mexer em arquivos fora do escopo de código (por agora)
    if (!rel.endsWith('.ts') && !rel.endsWith('.js')) continue;

    // Respeita convenções de ferramentas no root: não mover configs globais
    const base = path.posix.basename(rel);
    if (/^(eslint|vitest)\.config\.[jt]s$/i.test(base)) continue;

    const res = destinoPara(
      rel,
      cfg.raizCodigo,
      cfg.criarSubpastasPorEntidade,
      cfg.apenasCategoriasConfiguradas,
      cfg.categoriasMapa,
    );
    if (!res.destinoDir) continue;

    const currentDir = path.posix.dirname(rel);
    const alreadyInTarget =
      currentDir === res.destinoDir ||
      currentDir.startsWith(`${res.destinoDir}/`);
    if (alreadyInTarget) continue;

    // 🚀 INTELIGÊNCIA CONTEXTUAL: Ajustar destino baseado em sinais avançados
    let destinoDirAjustado = res.destinoDir;
    const motivoAjustado = res.motivo || 'Reorganização padrão';

    if (sinaisAvancados) {
      destinoDirAjustado = ajustarDestinoPorSinais(
        rel,
        res.destinoDir,
        sinaisAvancados,
        motivoAjustado,
      );
    }

    // Mantém o mesmo nome do arquivo; apenas move para pasta de destino
    const destino = path.posix.join(
      destinoDirAjustado,
      path.posix.basename(rel),
    );
    // Conflito se já existe arquivo listado ou presente no filesystem
    let destinoExiste = rels.includes(destino);
    if (!destinoExiste) {
      try {
        const abs = path.join(contexto.baseDir, destino.replace(/\\/g, '/'));
        // fs.statSync usado de forma segura; se falhar, considera inexistente
        statSync(abs);
        destinoExiste = true;
      } catch {
        destinoExiste = false;
      }
    }
    if (destinoExiste) {
      conflitos.push({ alvo: destino, motivo: 'destino já existe' });
      continue;
    }
    mover.push({ de: rel, para: destino, motivo: motivoAjustado });
  }

  // Deduplicação simples
  const seen = new Set<string>();
  const moverFiltrado = mover.filter((migracao) => {
    const migrationKey = `${migracao.de}→${migracao.para}`;
    if (seen.has(migrationKey)) return false;
    seen.add(migrationKey);
    return true;
  });

  return {
    mover: moverFiltrado,
    conflitos,
    resumo: {
      total: moverFiltrado.length + conflitos.length,
      zonaVerde: moverFiltrado.length,
      bloqueados: conflitos.length,
    },
  };
}

/**
 * Ajusta o destino de um arquivo baseado nos sinais avançados do projeto
 */
function ajustarDestinoPorSinais(
  relPath: string,
  destinoOriginal: string,
  sinais: import('@').SinaisProjetoAvancados,
  motivoOriginal: string,
): string {
  let destino = destinoOriginal;
  let _motivo = motivoOriginal;

  // Análise baseada no tipo dominante do projeto
  if (sinais.tipoDominante) {
    switch (sinais.tipoDominante) {
      case 'api-rest':
        // Para APIs REST, priorizar estrutura controllers/routes
        if (relPath.includes('controller') || relPath.includes('route')) {
          if (!destino.includes('controllers') && !destino.includes('routes')) {
            destino = 'src/controllers';
            _motivo += ' | Ajustado para estrutura API REST típica';
          }
        }
        break;

      case 'frontend-framework':
        // Para frontend, manter componentes organizados
        if (relPath.includes('component') && !destino.includes('components')) {
          destino = 'src/components';
          _motivo += ' | Ajustado para estrutura frontend típica';
        }
        break;

      case 'cli-tool':
        // Para CLI, manter binários e comandos organizados
        if (relPath.includes('cli') || relPath.includes('command')) {
          destino = 'src/cli';
          _motivo += ' | Ajustado para estrutura CLI típica';
        }
        break;

      case 'library':
        // Para bibliotecas, focar em exports e tipos
        if (relPath.includes('index') || relPath.includes('export')) {
          destino = 'src';
          _motivo += ' | Mantido na raiz src para biblioteca';
        }
        break;
    }
  }

  // Ajustes baseados em padrões arquiteturais detectados
  if (sinais.padroesArquiteturais.includes('repository-service')) {
    if (relPath.includes('repository') && !destino.includes('repositories')) {
      destino = 'src/repositories';
      _motivo += ' | Padrão Repository/Service detectado';
    }
    if (relPath.includes('service') && !destino.includes('services')) {
      destino = 'src/services';
      _motivo += ' | Padrão Repository/Service detectado';
    }
  }

  if (sinais.padroesArquiteturais.includes('cli-patterns')) {
    if (relPath.includes('command') && !destino.includes('commands')) {
      destino = 'src/commands';
      _motivo += ' | Padrão CLI detectado';
    }
  }

  // Ajustes baseados em tecnologias dominantes
  if (sinais.tecnologiasDominantes.includes('typescript-advanced')) {
    if (relPath.includes('type') || relPath.includes('interface')) {
      destino = 'src/types';
      _motivo += ' | TypeScript avançado detectado';
    }
  }

  // Ajustes baseados na complexidade estrutural
  if (sinais.complexidadeEstrutura === 'alta') {
    // Para projetos complexos, criar subpastas por domínio
    const nomeArquivo = path.posix.basename(
      relPath,
      path.posix.extname(relPath),
    );
    if (nomeArquivo.length > 3) {
      // Tentar inferir domínio do nome do arquivo
      const dominioInferido = inferirDominio(nomeArquivo);
      if (dominioInferido && !destino.includes(dominioInferido)) {
        destino = `src/${dominioInferido}`;
        _motivo += ` | Domínio '${dominioInferido}' inferido da complexidade`;
      }
    }
  }

  return destino;
}

/**
 * Tenta inferir um domínio de negócio baseado no nome do arquivo
 */
function inferirDominio(nomeArquivo: string): string | null {
  const padroesDominio: Record<string, string[]> = {
    auth: ['auth', 'login', 'user', 'session', 'security'],
    payment: ['payment', 'billing', 'invoice', 'transaction', 'checkout'],
    product: ['product', 'item', 'catalog', 'inventory', 'stock'],
    order: ['order', 'cart', 'purchase', 'sale'],
    notification: ['notification', 'email', 'message', 'alert'],
    report: ['report', 'analytics', 'metric', 'dashboard'],
    admin: ['admin', 'management', 'config', 'setting'],
  };

  const nomeLower = nomeArquivo.toLowerCase();
  for (const [dominio, palavras] of Object.entries(padroesDominio)) {
    if (palavras.some((palavra) => nomeLower.includes(palavra))) {
      return dominio;
    }
  }

  return null;
}

export const EstrategistaEstrutura = {
  nome: 'estrategista-estrutura',
  gerarPlano: gerarPlanoEstrategico,
};
