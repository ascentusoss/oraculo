// SPDX-License-Identifier: MIT
// Nota: manter ARQUETIPOS importado visível como lembrete para integração futura
import path from 'node:path';

import { extrairSinaisAvancados } from '@analistas/arquitetos/sinais-projeto-avancados.js';
import { ARQUETIPOS } from '@analistas/estrategistas/arquetipos-defs.js';
import { OperarioEstrutura } from '@analistas/estrategistas/operario-estrutura.js';
import {
  carregarArquetipoPersonalizado,
  integrarArquetipos,
  obterArquetipoOficial,
} from '@analistas/js-ts/arquetipos-personalizados.js';
import { scoreArquetipoAvancado } from '@analistas/pontuadores/pontuador.js';
import { config } from '@core/config/config.js';
import { lerEstado, salvarEstado } from '@shared/persistence/persistencia.js';

import type {
  ArquetipoDrift,
  ArquetipoEstruturaDef,
  ArquetipoPersonalizado,
  ContextoExecucao,
  PackageJson,
  ResultadoContexto,
  ResultadoDeteccaoArquetipo,
  SinaisProjetoAvancados,
  SnapshotEstruturaBaseline,
} from '@';

function scoreArquetipo(
  def: ArquetipoEstruturaDef,
  arquivos: string[],
  _sinaisAvancados: SinaisProjetoAvancados,
): ResultadoDeteccaoArquetipo {
  // Implementação simplificada temporária.
  // Mantemos a assinatura e a forma do retorno para compatibilidade.
  const matchedRequired: string[] = (def.requiredDirs || []).filter((d) =>
    arquivos.some((f) => f.startsWith(`${d}/`) || f === d),
  );
  const missingRequired: string[] = (def.requiredDirs || []).filter(
    (d) => !matchedRequired.includes(d),
  );
  return {
    nome: def.nome,
    score: def.pesoBase ? def.pesoBase * 10 : 10,
    confidence: 50,
    matchedRequired,
    missingRequired,
    matchedOptional: [],
    dependencyMatches: [],
    filePatternMatches: [],
    forbiddenPresent: [],
    anomalias: [],
    sugestaoPadronizacao: '',
    explicacaoSimilaridade: '',
    descricao: def.descricao || '',
    candidatoExtra: undefined,
  };
}

// Exposição somente para testes (não altera API pública)
// Evita exportar diretamente para não vazar em produção
if (process.env.VITEST) {
  type TestExports = Record<string, unknown> & {
    scoreArquetipo: typeof scoreArquetipo;
  };
  const g = globalThis as unknown as { __ORACULO_TESTS__?: TestExports };
  const prev = g.__ORACULO_TESTS__ ?? ({} as TestExports);
  g.__ORACULO_TESTS__ = { ...prev, scoreArquetipo };
}

export async function detectarArquetipos(
  contexto: Pick<ContextoExecucao, 'arquivos' | 'baseDir'>,
  baseDir: string,
  options?: { quiet?: boolean },
): Promise<{
  candidatos: ResultadoDeteccaoArquetipo[];
  baseline?: SnapshotEstruturaBaseline;
  drift?: ArquetipoDrift;
  arquetipoPersonalizado?: ArquetipoPersonalizado | null; // Para compatibilidade futura
}> {
  if (!options?.quiet && config.VERBOSE) {
    console.log(
      '🔍 detectarArquetipos chamado com',
      contexto.arquivos.length,
      'arquivos',
    );
  }
  const arquivos = contexto.arquivos.map((f) => f.relPath);

  // Carregar arquétipo personalizado se existir
  const arquetipoPersonalizado = await carregarArquetipoPersonalizado(baseDir);
  let arquetiposParaAvaliar = ARQUETIPOS;

  // Se há arquétipo personalizado, integrá-lo com o oficial
  if (arquetipoPersonalizado) {
    const arquetipoOficial = obterArquetipoOficial(arquetipoPersonalizado);
    if (arquetipoOficial) {
      const arquetipoIntegrado = integrarArquetipos(
        arquetipoPersonalizado,
        arquetipoOficial,
      );
      // Substituir o oficial pelo personalizado na lista de avaliação
      arquetiposParaAvaliar = ARQUETIPOS.map((arq: ArquetipoEstruturaDef) =>
        arq.nome === arquetipoPersonalizado.arquetipoOficial
          ? arquetipoIntegrado
          : arq,
      );
    }
  }

  // Extrai sinais avançados do projeto
  let packageJsonParaSinais: PackageJson = {};
  try {
    packageJsonParaSinais = (await lerEstado(
      path.join(baseDir, 'package.json'),
    )) as PackageJson;
  } catch {
    // Package.json não encontrado - usar objeto vazio
    packageJsonParaSinais = {};
  }

  const sinaisAvancados = extrairSinaisAvancados(
    contexto.arquivos,
    packageJsonParaSinais,
    undefined,
    baseDir,
    arquivos,
  );

  // Pontua todos os arquétipos disponíveis usando sinais avançados
  let candidatos: ResultadoDeteccaoArquetipo[] = arquetiposParaAvaliar.map(
    (def: ArquetipoEstruturaDef) =>
      scoreArquetipoAvancado(def, arquivos, sinaisAvancados),
  );

  // 🚀 INTEGRAÇÃO SISTEMA INTELIGENTE: Aplicar boost contextual
  if (!options?.quiet && config.VERBOSE) {
    console.log('🔍 Tentando chamar detector contextual...');
  }
  try {
    const { detectarContextoInteligente } =
      await import('./detector-contexto-inteligente.js');
    const estruturaDetectada = arquivos; // Lista de caminhos
    // Carregar package.json com tratamento de erro adequado
    let packageJsonContent: PackageJson = {};
    try {
      packageJsonContent = (await lerEstado(
        path.join(baseDir, 'package.json'),
      )) as PackageJson;
    } catch {
      // Package.json não encontrado ou inválido - usar objeto vazio
      packageJsonContent = {};
    }

    const resultadosContextuais = detectarContextoInteligente(
      estruturaDetectada,
      contexto.arquivos,
      packageJsonContent,
      options,
    ) as ResultadoContexto[];

    // Pegar o resultado com maior confiança
    const melhorDeteccao = resultadosContextuais.reduce(
      (melhor: ResultadoContexto, atual: ResultadoContexto) =>
        atual.confiancaTotal > melhor.confiancaTotal ? atual : melhor,
      { confiancaTotal: 0 },
    );

    if (melhorDeteccao && melhorDeteccao.confiancaTotal > 0.6) {
      // Escala 0-1, não 0-100
      // Mapear tecnologias detectadas para arquétipos conhecidos
      const mapeamentoTecnologia: Record<string, string[]> = {
        'discord-bot': ['bot-discord', 'bot', 'discord-bot'],
        'telegram-bot': ['bot-telegram', 'bot', 'telegram-bot'],
        'express-api': ['api-rest-express', 'api-rest', 'express-api'],
        'fastify-api': ['api-rest-fastify', 'api-rest', 'fastify-api'],
        'nestjs-api': ['api-rest-nestjs', 'api-rest', 'nestjs-api'],
        'cli-modular': ['cli-modular', 'cli', 'cli-tool'],
        'electron-app': ['electron-app', 'electron', 'desktop-app'],
        'nextjs-app': ['nextjs-app', 'nextjs', 'fullstack'],
        'react-spa': ['react-spa', 'react', 'spa'],
      };

      const tecnologiaDetectada = melhorDeteccao.tecnologia ?? 'desconhecido';
      const arquetiposCandidatos: string[] =
        mapeamentoTecnologia[tecnologiaDetectada] || [];

      // Aplicar boost de confiança para arquétipos relacionados
      let boostAplicado = false;
      candidatos = candidatos.map((candidato: ResultadoDeteccaoArquetipo) => {
        if (
          arquetiposCandidatos.some(
            (arq: string) =>
              candidato.nome.includes(arq) || arq.includes(candidato.nome),
          )
        ) {
          const boostConfianca = Math.min(
            melhorDeteccao.confiancaTotal * 100 * 0.8,
            60,
          ); // Boost agressivo até 60%
          boostAplicado = true;
          return {
            ...candidato,
            confidence: Math.max(candidato.confidence + boostConfianca, 70), // Mínimo 70% se detectado
            explicacaoSimilaridade: `[Boost contextual: ${melhorDeteccao.tecnologia} detectado com ${(melhorDeteccao.confiancaTotal * 100).toFixed(0)}% confiança] ${candidato.explicacaoSimilaridade || ''}`,
          };
        }
        return candidato;
      });

      // Se não encontrou arquétipo compatível, criar um virtual baseado na detecção
      if (!boostAplicado) {
        const arquetipoVirtual: ResultadoDeteccaoArquetipo = {
          nome: tecnologiaDetectada,
          score: Math.round(melhorDeteccao.confiancaTotal * 100),
          confidence: Math.round(melhorDeteccao.confiancaTotal * 100),
          matchedRequired: [],
          missingRequired: [],
          matchedOptional: [],
          dependencyMatches: (melhorDeteccao.evidencias || [])
            .filter((e) => e.tipo === 'dependencia')
            .map((e) => e.valor),
          filePatternMatches: (melhorDeteccao.evidencias || [])
            .filter((e) => e.tipo === 'estrutura')
            .map((e) => e.valor),
          forbiddenPresent: [],
          anomalias: [],
          sugestaoPadronizacao: (melhorDeteccao.sugestoesMelhoria || []).join(
            '; ',
          ),
          explicacaoSimilaridade: `Detectado via sistema inteligente contextual com ${(melhorDeteccao.confiancaTotal * 100).toFixed(0)}% confiança`,
          descricao: `Projeto ${melhorDeteccao.tecnologia} identificado por análise contextual`,
        };
        candidatos.unshift(arquetipoVirtual); // Adiciona no início
      }
    }
  } catch (error) {
    // Falha silenciosa - sistema inteligente é opcional
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Sistema inteligente não disponível:', error);
    }
  }

  // Ordena por confiança/score decrescente
  candidatos.sort(
    (a: ResultadoDeteccaoArquetipo, b: ResultadoDeteccaoArquetipo) =>
      b.confidence - a.confidence || b.score - a.score,
  );

  // Decisão final: dominante, misto ou desconhecido
  // Agora considera fatores contextuais e thresholds adaptativos
  const scoresValidos = candidatos.filter((c) => c.confidence >= 30);

  if (!scoresValidos.length) {
    // Nenhum padrão relevante - verificar se é um projeto muito pequeno ou não estruturado
    const temAlgumaEstrutura = arquivos.some(
      (f) =>
        f.includes('src/') ||
        f.includes('lib/') ||
        f.includes('app/') ||
        f.includes('packages/'),
    );

    candidatos = [
      {
        nome: 'desconhecido',
        score: 0,
        confidence: temAlgumaEstrutura ? 10 : 0, // pequena confiança se há alguma estrutura
        matchedRequired: [],
        missingRequired: [],
        matchedOptional: [],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
        sugestaoPadronizacao: temAlgumaEstrutura
          ? 'Projeto tem alguma estrutura, mas não corresponde a arquétipos conhecidos. Considere organizar em src/, lib/ ou app/.'
          : 'Projeto sem estrutura clara detectada. Considere criar uma organização básica.',
        explicacaoSimilaridade: temAlgumaEstrutura
          ? 'Estrutura parcial detectada, mas não suficiente para classificação.'
          : 'Nenhum arquétipo identificado.',
        descricao: 'Nenhum arquétipo identificado.',
      },
    ];
  } else {
    // Análise mais sofisticada para decidir entre dominante e misto
    const top = scoresValidos[0];
    const proximos = scoresValidos.filter(
      (c) => c !== top && Math.abs(c.confidence - top.confidence) <= 15, // threshold aumentado
    );

    // Verificar se é realmente um caso híbrido ou apenas competição próxima
    const ehHibridoReal = proximos.some(
      (c) =>
        // Verificar se há sobreposição significativa de características
        c.matchedRequired.some((req) => top.matchedRequired.includes(req)) ||
        c.dependencyMatches.some((dep) => top.dependencyMatches.includes(dep)),
    );

    if (proximos.length > 0 && ehHibridoReal) {
      // Sistema de pontuação para casos híbridos
      const scoreHibrido =
        top.score * 0.7 +
        proximos.reduce(
          (acc: number, c: ResultadoDeteccaoArquetipo) =>
            acc + (c.score * 0.3) / proximos.length,
          0,
        );
      const confidenceHibrido = Math.max(top.confidence - 10, 40); // reduzir confiança mas manter mínimo

      candidatos = [
        {
          nome: 'misto',
          score: Math.round(scoreHibrido),
          confidence: confidenceHibrido,
          matchedRequired: [],
          missingRequired: [],
          matchedOptional: [],
          dependencyMatches: [],
          filePatternMatches: [],
          forbiddenPresent: [],
          anomalias: [],
          sugestaoPadronizacao: '',
          explicacaoSimilaridade: `Estrutura híbrida detectada: combina elementos de ${[top.nome, ...proximos.map((p) => p.nome)].join(', ')}. Recomenda-se avaliar se a separação em projetos distintos seria benéfica.`,
          descricao: 'Estrutura híbrida',
        },
      ];
    } else {
      // Dominante claro
      candidatos = [top];
    }
  }
  const baselinePath = path.join(
    baseDir,
    '.oraculo',
    'baseline-estrutura.json',
  );
  let baseline: SnapshotEstruturaBaseline | undefined;
  const existente = await lerEstado<SnapshotEstruturaBaseline | []>(
    baselinePath,
  );
  if (
    existente &&
    !Array.isArray(existente) &&
    typeof existente === 'object' &&
    'arquetipo' in existente
  ) {
    baseline = existente as SnapshotEstruturaBaseline;
  }
  if (!baseline && candidatos[0]) {
    baseline = {
      version: 1,
      timestamp: new Date().toISOString(),
      arquetipo: candidatos[0].nome,
      confidence: candidatos[0].confidence,
      arquivosRaiz: arquivos.filter((p) => !p.includes('/')).sort(),
    };
    await salvarEstado(baselinePath, baseline);
  }
  // Prioriza baseline apenas se o candidato principal for 'desconhecido' ou confiança baixa
  if (baseline && baseline.arquetipo !== 'desconhecido') {
    const arquivosRaizAtuais = arquivos.filter((p) => !p.includes('/'));
    const setBase = new Set(baseline.arquivosRaiz || []);
    const temIntersecao = arquivosRaizAtuais.some((f) => setBase.has(f));
    const candidatoTop = candidatos[0];
    if (
      temIntersecao &&
      (candidatoTop.nome === 'desconhecido' || candidatoTop.confidence < 50)
    ) {
      const melhorBaseline: ResultadoDeteccaoArquetipo = {
        nome: baseline.arquetipo,
        score: 999, // força topo da lista
        confidence: baseline.confidence,
        matchedRequired: [],
        missingRequired: [],
        matchedOptional: [],
        dependencyMatches: [],
        filePatternMatches: [],
        forbiddenPresent: [],
        anomalias: [],
        sugestaoPadronizacao: '',
        explicacaoSimilaridade:
          'Detectado via baseline existente (.oraculo/baseline-estrutura.json).',
        descricao: 'Arquétipo determinado pelo baseline',
      };
      candidatos = [
        melhorBaseline,
        ...candidatos.filter(
          (c: ResultadoDeteccaoArquetipo) => c.nome !== baseline.arquetipo,
        ),
      ];
    }
  }
  let drift: ArquetipoDrift | undefined;
  if (baseline && candidatos[0]) {
    const atual = candidatos[0];
    const arquivosRaizAtuais = arquivos.filter((p) => !p.includes('/')).sort();
    const setBase = new Set(baseline.arquivosRaiz);
    const setAtual = new Set(arquivosRaizAtuais);
    const novos: string[] = [];
    const removidos: string[] = [];
    for (const f of setAtual) if (!setBase.has(f)) novos.push(f as string);
    for (const f of setBase) if (!setAtual.has(f)) removidos.push(f as string);
    drift = {
      alterouArquetipo: baseline.arquetipo !== atual.nome,
      anterior: baseline.arquetipo,
      atual: atual.nome,
      deltaConfidence: atual.confidence - baseline.confidence,
      arquivosRaizNovos: novos,
      arquivosRaizRemovidos: removidos,
    };
  }
  // Sugestão de plano para o candidato top
  if (candidatos[0]) {
    try {
      // Usa plano de arquétipos se preset for diferente de 'oraculo' ou em ambiente de teste
      const preset = (contexto as { preset?: string }).preset ?? 'oraculo';
      const emTeste = !!process.env.VITEST;
      const preferEstrategista = preset === 'oraculo' && !emTeste;
      const { plano } = await OperarioEstrutura.planejar(
        baseDir,
        contexto.arquivos,
        {
          preferEstrategista,
          preset,
        },
      );
      if (plano) candidatos[0].planoSugestao = plano;
    } catch {
      // mantém default vazio se falhar
    }
  }
  return {
    candidatos,
    baseline,
    drift,
    arquetipoPersonalizado,
  };
}
