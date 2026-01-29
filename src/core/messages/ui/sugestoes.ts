// SPDX-License-Identifier: MIT
//  tipo-literal-inline-complexo
// Justificativa: tipos inline para sistema de sugestões
/**
 * Sistema Centralizado de Sugestões e Dicas
 *
 * Centraliza TODAS as sugestões contextuais do Oráculo:
 * - Dicas de uso de comandos
 * - Sugestões baseadas em contexto
 * - Mensagens de ajuda rápida
 * - Call-to-action para diferentes cenários
 */

import { ICONES } from './icons.js';

/**
 * Sugestões gerais de comandos
 */
export const SUGESTOES_COMANDOS = {
  usarFull: `${ICONES.feedback.dica} Use --full para relatório detalhado com todas as informações`,
  usarJson: `${ICONES.feedback.dica} Use --json para saída estruturada em JSON`,
  combinarJsonExport: `${ICONES.feedback.dica} Combine --json com --export para salvar o relatório`,
  usarExport: `${ICONES.feedback.dica} Use --export <caminho> para salvar relatório em arquivo`,
  usarInclude: `${ICONES.feedback.dica} Use --include <pattern> para focar em arquivos específicos`,
  usarExclude: `${ICONES.feedback.dica} Use --exclude <pattern> para ignorar arquivos`,
  usarDryRun: `${ICONES.feedback.dica} Use --dry-run para simular sem modificar arquivos`,
  removerDryRun: `${ICONES.feedback.dica} Remova --dry-run para aplicar correções`,
  usarInterativo: `${ICONES.feedback.dica} Use --interactive para confirmar cada correção`,
  usarGuardian: `${ICONES.feedback.dica} Use --guardian para verificar integridade`,
  usarBaseline: `${ICONES.feedback.dica} Use --baseline para gerar baseline de referência`,
  usarAutoFix: `${ICONES.feedback.dica} Use --auto-fix para aplicar correções automáticas`,
} as const;

/**
 * Sugestões de diagnóstico
 */
export const SUGESTOES_DIAGNOSTICO = {
  modoExecutivo: `${ICONES.diagnostico.executive} Modo executivo: mostrando apenas problemas críticos`,
  primeiraVez: [
    `${ICONES.feedback.dica} Primeira vez? Comece com: oraculo diagnosticar --full`,
    `${ICONES.feedback.dica} Use --help para ver todas as opções disponíveis`,
  ],
  projetoGrande: [
    `${ICONES.feedback.dica} Projeto grande detectado - use --include para análise incremental`,
    `${ICONES.feedback.dica} Use --quick para análise rápida inicial`,
  ],
  poucoProblemas: `${ICONES.nivel.sucesso} Projeto em bom estado! Apenas {count} problemas menores encontrados.`,
  muitosProblemas: [
    `${ICONES.feedback.atencao} Muitos problemas encontrados - priorize os críticos primeiro`,
    `${ICONES.feedback.dica} Use --executive para focar apenas no essencial`,
  ],
  usarFiltros: `${ICONES.feedback.dica} Use filtros --include/--exclude para análise focada`,
} as const;

/**
 * Sugestões de auto-fix
 */
export const SUGESTOES_AUTOFIX = {
  autoFixDisponivel: `${ICONES.feedback.dica} Correções automáticas disponíveis - use --auto-fix`,
  autoFixAtivo: `${ICONES.feedback.atencao} Auto-fix ativo! Use --dry-run para simular sem modificar arquivos`,
  dryRunRecomendado: `${ICONES.feedback.dica} Recomendado: teste primeiro com --dry-run`,
  semMutateFS: `${ICONES.feedback.atencao} Auto-fix indisponível no momento`,
  validarDepois: [
    `${ICONES.feedback.dica} Execute npm run lint para verificar as correções`,
    `${ICONES.feedback.dica} Execute npm run build para verificar se o código compila`,
    `${ICONES.feedback.dica} Execute npm test para validar funcionalidades`,
  ],
} as const;

/**
 * Sugestões de Guardian
 */
export const SUGESTOES_GUARDIAN = {
  guardianDesabilitado: `${ICONES.comando.guardian} Guardian desativado. Use --guardian para verificar integridade`,
  primeiroBaseline: [
    `${ICONES.feedback.dica} Primeira execução: gere um baseline com --baseline`,
    `${ICONES.feedback.dica} O baseline serve como referência para mudanças futuras`,
  ],
  driftDetectado: [
    `${ICONES.feedback.atencao} Mudanças detectadas em relação ao baseline`,
    `${ICONES.feedback.dica} Revise as alterações antes de atualizar o baseline`,
    `${ICONES.feedback.dica} Use --baseline para atualizar referência`,
  ],
  integridadeOK: `${ICONES.nivel.sucesso} Integridade verificada - nenhuma mudança não autorizada`,
} as const;

/**
 * Sugestões de tipos (fix-types)
 */
export const SUGESTOES_TIPOS = {
  ajustarConfianca: (atual: number) =>
    `${ICONES.feedback.dica} Use --confidence <num> para ajustar o limiar (atual: ${atual}%)`,
  revisar: (categoria: string) =>
    `${ICONES.feedback.dica} Revise os casos ${categoria} manualmente`,
  anyEncontrado: [
    `${ICONES.feedback.atencao} Tipos 'any' detectados - reduzem segurança do código`,
    `${ICONES.feedback.dica} Priorize substituir 'as any' e casts explícitos`,
  ],
  unknownLegitimo: `${ICONES.nivel.sucesso} Usos legítimos de 'unknown' identificados`,
  melhoravelDisponivel: `${ICONES.feedback.dica} Casos melhoráveis encontrados - revisar em refatoração futura`,
} as const;

/**
 * Sugestões de arquetipos
 */
export const SUGESTOES_ARQUETIPOS = {
  monorepo: [
    `${ICONES.feedback.dica} Monorepo detectado: considere usar filtros por workspace`,
    `${ICONES.feedback.dica} Use --include packages/* para analisar workspaces específicos`,
  ],
  biblioteca: [
    `${ICONES.feedback.dica} Biblioteca detectada: foque em exports públicos e documentação`,
    `${ICONES.feedback.dica} Use --guardian para verificar API pública`,
  ],
  cli: [
    `${ICONES.feedback.dica} CLI detectado: priorize testes de comandos e flags`,
    `${ICONES.feedback.dica} Valide tratamento de erros em comandos`,
  ],
  api: [
    `${ICONES.feedback.dica} API detectada: foque em endpoints e contratos`,
    `${ICONES.feedback.dica} Considere testes de integração para rotas`,
    `${ICONES.feedback.dica} Valide documentação de API (OpenAPI/Swagger)`,
  ],
  frontend: [
    `${ICONES.feedback.dica} Frontend detectado: priorize componentes e state management`,
    `${ICONES.feedback.dica} Valide acessibilidade e performance`,
  ],
  confiancaBaixa: [
    `${ICONES.feedback.atencao} Confiança baixa na detecção: estrutura pode ser híbrida`,
    `${ICONES.feedback.dica} Use --criar-arquetipo --salvar-arquetipo para personalizar`,
  ],
} as const;

/**
 * Sugestões de reestruturação
 */
export const SUGESTOES_REESTRUTURAR = {
  backupRecomendado: [
    `${ICONES.feedback.importante} IMPORTANTE: Faça backup antes de reestruturar!`,
    `${ICONES.feedback.dica} Use git para versionar antes de mudanças estruturais`,
  ],
  validarDepois: [
    `${ICONES.feedback.dica} Execute testes após reestruturação`,
    `${ICONES.feedback.dica} Valide imports e referências`,
  ],
  usarDryRun: `${ICONES.feedback.dica} Primeira vez? Use --dry-run para ver mudanças propostas`,
} as const;

/**
 * Sugestões de poda
 */
export const SUGESTOES_PODAR = {
  cuidado: [
    `${ICONES.feedback.atencao} Poda remove arquivos permanentemente!`,
    `${ICONES.feedback.importante} Certifique-se de ter backup ou controle de versão`,
  ],
  revisar: `${ICONES.feedback.dica} Revise a lista de arquivos antes de confirmar`,
  usarDryRun: `${ICONES.feedback.dica} Use --dry-run para simular poda sem deletar`,
} as const;

/**
 * Sugestões de métricas
 */
export const SUGESTOES_METRICAS = {
  baseline: [
    `${ICONES.feedback.dica} Gere baseline para comparações futuras`,
    `${ICONES.feedback.dica} Use --json para integração com CI/CD`,
  ],
  tendencias: `${ICONES.feedback.dica} Execute regularmente para acompanhar tendências`,
  comparacao: `${ICONES.feedback.dica} Compare com execuções anteriores`,
} as const;

/**
 * Sugestões de zeladores
 */
export const SUGESTOES_ZELADOR = {
  imports: [
    `${ICONES.feedback.dica} Zelador de imports corrige caminhos automaticamente`,
    `${ICONES.feedback.dica} Use --dry-run para ver correções propostas`,
  ],
  estrutura: [
    `${ICONES.feedback.dica} Zelador de estrutura organiza arquivos por padrão`,
    `${ICONES.feedback.dica} Configure padrões em oraculo.config.json`,
  ],
} as const;

/**
 * Sugestões contextuais - função helper
 */
export function gerarSugestoesContextuais(contexto: {
  comando: string;
  temProblemas: boolean;
  countProblemas?: number;
  autoFixDisponivel?: boolean;
  guardianAtivo?: boolean;
  arquetipo?: string;
  flags?: string[];
}): string[] {
  const sugestoes: string[] = [];

  // Sugestões por comando
  switch (contexto.comando) {
    case 'diagnosticar':
      if (!contexto.temProblemas) {
        if (contexto.countProblemas !== undefined) {
          sugestoes.push(
            SUGESTOES_DIAGNOSTICO.poucoProblemas.replace(
              '{count}',
              String(contexto.countProblemas),
            ),
          );
        }
      } else if (contexto.countProblemas && contexto.countProblemas > 50) {
        sugestoes.push(...SUGESTOES_DIAGNOSTICO.muitosProblemas);
      }

      if (
        contexto.autoFixDisponivel &&
        !contexto.flags?.includes('--auto-fix')
      ) {
        sugestoes.push(SUGESTOES_AUTOFIX.autoFixDisponivel);
      }

      if (!contexto.guardianAtivo && !contexto.flags?.includes('--guardian')) {
        sugestoes.push(SUGESTOES_GUARDIAN.guardianDesabilitado);
      }

      if (!contexto.flags?.includes('--full') && contexto.temProblemas) {
        sugestoes.push(SUGESTOES_COMANDOS.usarFull);
      }
      break;

    case 'fix-types':
      if (contexto.autoFixDisponivel) {
        sugestoes.push(...SUGESTOES_AUTOFIX.validarDepois);
      }
      break;

    case 'reestruturar':
      sugestoes.push(...SUGESTOES_REESTRUTURAR.backupRecomendado);
      if (!contexto.flags?.includes('--dry-run')) {
        sugestoes.push(SUGESTOES_REESTRUTURAR.usarDryRun);
      }
      break;

    case 'podar':
      sugestoes.push(...SUGESTOES_PODAR.cuidado);
      break;
  }

  // Sugestões por arquétipo
  if (contexto.arquetipo) {
    switch (contexto.arquetipo) {
      case 'monorepo':
        sugestoes.push(...SUGESTOES_ARQUETIPOS.monorepo);
        break;
      case 'biblioteca':
        sugestoes.push(...SUGESTOES_ARQUETIPOS.biblioteca);
        break;
      case 'cli':
        sugestoes.push(...SUGESTOES_ARQUETIPOS.cli);
        break;
      case 'api':
        sugestoes.push(...SUGESTOES_ARQUETIPOS.api);
        break;
      case 'frontend':
        sugestoes.push(...SUGESTOES_ARQUETIPOS.frontend);
        break;
    }
  }

  return sugestoes;
}

/**
 * Formata sugestões para exibição
 */
export function formatarSugestoes(
  sugestoes: string[],
  titulo = 'Sugestões',
): string[] {
  if (sugestoes.length === 0) return [];

  const linhas: string[] = ['', `┌── ${titulo} ${'─'.repeat(50)}`.slice(0, 70)];

  for (const sugestao of sugestoes) {
    linhas.push(`  ${sugestao}`);
  }

  linhas.push(`└${'─'.repeat(68)}`);
  linhas.push('');

  return linhas;
}

/**
 * Export consolidado
 */
export const SUGESTOES = {
  comandos: SUGESTOES_COMANDOS,
  diagnostico: SUGESTOES_DIAGNOSTICO,
  autofix: SUGESTOES_AUTOFIX,
  guardian: SUGESTOES_GUARDIAN,
  tipos: SUGESTOES_TIPOS,
  arquetipos: SUGESTOES_ARQUETIPOS,
  reestruturar: SUGESTOES_REESTRUTURAR,
  podar: SUGESTOES_PODAR,
  metricas: SUGESTOES_METRICAS,
  zelador: SUGESTOES_ZELADOR,
} as const;

export default SUGESTOES;
