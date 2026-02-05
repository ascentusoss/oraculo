// SPDX-License-Identifier: MIT

/**
 * Utilitário para detectar contexto inteligente de projetos
 * Evita falsos positivos em analistas ao identificar o tipo de projeto e framework
 */

import type { ContextoProjeto, DetectarContextoOpcoes } from '@';

// Re-exporta os tipos para compatibilidade
export type { ContextoProjeto, DetectarContextoOpcoes };

/**
 * Detecta o contexto de um arquivo/projeto para análise inteligente
 */

export function detectarContextoProjeto(
  opcoes: DetectarContextoOpcoes,
): ContextoProjeto {
  const { arquivo, conteudo, relPath, packageJson } = opcoes;
  const p = arquivo.replace(/\\/g, '/').toLowerCase();
  const rel = (relPath || arquivo).replace(/\\/g, '/').toLowerCase();

  const contexto: ContextoProjeto = {
    isBot: false,
    isCLI: false,
    isWebApp: false,
    isLibrary: false,
    isTest: false,
    isConfig: false,
    isInfrastructure: false,
    frameworks: [],
    linguagens: [],
  };

  // Detecta linguagens
  if (/\.(ts|tsx)$/.test(p)) contexto.linguagens.push('typescript');
  if (/\.(js|jsx)$/.test(p)) contexto.linguagens.push('javascript');
  if (/\.(py)$/.test(p)) contexto.linguagens.push('python');
  if (/\.(php)$/.test(p)) contexto.linguagens.push('php');
  if (/\.(html|htm)$/.test(p)) contexto.linguagens.push('html');
  if (/\.(css)$/.test(p)) contexto.linguagens.push('css');

  // Detecta se é arquivo de teste (PRIORIDADE ALTA - deve ser verificado primeiro)
  contexto.isTest =
    /(^|\/)tests?(\/|\.)/i.test(rel) ||
    /\.(test|spec)\.(ts|js|tsx|jsx)$/i.test(p) ||
    /__tests__/.test(rel) ||
    /describe\s*\(|it\s*\(|test\s*\(|expect\s*\(/.test(conteudo);

  // Se é arquivo de teste, não deve ser classificado como outros tipos
  if (contexto.isTest) {
    return {
      ...contexto,
      isBot: false,
      isCLI: false,
      isWebApp: false,
      isLibrary: false,
    };
  }

  // Detecta se é arquivo de configuração
  contexto.isConfig =
    /config|\.config\.|\.rc\.|\.json$|\.yaml$|\.yml$|\.env/.test(p) ||
    /(^|\/)(\.|config|configs?)(\/|\.)/i.test(rel) ||
    /package\.json|tsconfig|eslint|prettier|vitest|jest|babel/.test(p) ||
    /stub|mock|fixture|example/i.test(p); // Inclui stubs e mocks

  // Detecta se é arquivo de infraestrutura (setup, main, index)
  contexto.isInfrastructure =
    /index\.|main\.|app\.|server\.|setup\.|bootstrap/.test(p) ||
    /(client\.login|client\.connect|createApp|express\(\)|listen\(|server\.start)/.test(
      conteudo,
    ) ||
    /export\s+default|module\.exports\s*=/.test(conteudo) ||
    /(guardian|sentinela|verificador|hash|diff|baseline)/i.test(p) || // Guardian e verificação
    /(monitor|watch|observer|scanner)/i.test(p); // Monitoring

  // Detecta frameworks por imports/requires
  const importMatches =
    conteudo.match(
      /import.*from.*['"`]([^'"`]+)['"`]|require\(['"`]([^'"`]+)['"`]\)/g,
    ) || [];
  const allImports = importMatches.join(' ').toLowerCase();

  // Frameworks de bot
  if (/discord\.js|@discordjs|eris/.test(allImports)) {
    contexto.frameworks.push('discord.js');
    contexto.isBot = true;
  }
  if (/telegraf|grammy|node-telegram-bot/.test(allImports)) {
    contexto.frameworks.push('telegraf');
    contexto.isBot = true;
  }

  // Frameworks CLI
  if (/commander|yargs|inquirer|chalk|ora/.test(allImports)) {
    contexto.frameworks.push('cli');
    contexto.isCLI = true;
  }
  if (/oclif/.test(allImports)) {
    contexto.frameworks.push('oclif');
    contexto.isCLI = true;
  }

  // Frameworks web
  if (/express|fastify|koa|hapi/.test(allImports)) {
    contexto.frameworks.push('backend');
    contexto.isWebApp = true;
  }
  if (/react|vue|angular|svelte/.test(allImports)) {
    contexto.frameworks.push('frontend');
    contexto.isWebApp = true;
  }
  if (/next|nuxt|gatsby|remix/.test(allImports)) {
    contexto.frameworks.push('fullstack');
    contexto.isWebApp = true;
  }

  // Detecta por conteúdo específico se imports não cobrirem
  if (
    !contexto.isBot &&
    /slash.*command|interaction\.|commandName|client\.on.*message/i.test(
      conteudo,
    )
  ) {
    contexto.isBot = true;
  }

  if (
    !contexto.isCLI &&
    /process\.argv|command.*line|\.option\(|\.command\(/i.test(conteudo)
  ) {
    contexto.isCLI = true;
  }

  // Detecta se é arquivo de infraestrutura por conteúdo (NÃO é comando)
  if (
    /export\s+(interface|type|class.*\{)/i.test(conteudo) ||
    /import.*types?.*from|export.*types?/i.test(conteudo) ||
    /function\s+format|function\s+display|function\s+render/i.test(conteudo) ||
    /console\.log|logger\.|\.write\(|\.render\(/i.test(conteudo)
  ) {
    contexto.isInfrastructure = true;
  }

  // Detecta se é biblioteca por estrutura de exports
  if (
    /export\s+(class|function|const|interface|type)|module\.exports/.test(
      conteudo,
    ) &&
    !contexto.isWebApp &&
    !contexto.isBot &&
    !contexto.isCLI
  ) {
    contexto.isLibrary = true;
  }

  // Detecta por path patterns (mais específico)
  if (/(^|\/)bot(\/|\.|-)|discord|telegram/.test(rel)) {
    contexto.isBot = true;
  }

  // CLI paths - mais específico para evitar falsos positivos
  if (/(^|\/)(cli|commands?|comandos?)(\/|\.|-)|bin\//.test(rel)) {
    // Mas não se for apenas processamento, display, options, ou utilitários
    if (
      !/\/(processing|display|options|utils|helpers|types|interfaces)\//.test(
        rel,
      ) &&
      !/\/(options|display|processing|filter|helper|util|type)\./.test(rel) &&
      !/(options|processing|display|filter|helper|util|types?)[-.]/.test(p)
    ) {
      contexto.isCLI = true;
    }
  }

  if (/(^|\/)src\/(pages|app|routes|components|views)/.test(rel)) {
    contexto.isWebApp = true;
  }

  // Detecta por package.json se disponível
  if (packageJson) {
    const deps = {
      ...((packageJson.dependencies as Record<string, string>) || {}),
      ...((packageJson.devDependencies as Record<string, string>) || {}),
    };

    Object.keys(deps).forEach((dep) => {
      if (/discord\.js|eris|@discordjs/.test(dep)) {
        contexto.isBot = true;
        contexto.frameworks.push('discord.js');
      }
      if (/telegraf|grammy/.test(dep)) {
        contexto.isBot = true;
        contexto.frameworks.push('telegraf');
      }
      if (/commander|yargs|oclif/.test(dep)) {
        contexto.isCLI = true;
        contexto.frameworks.push('cli');
      }
      if (/express|fastify|react|vue|next/.test(dep)) {
        contexto.isWebApp = true;
      }
    });
  }

  // Remove duplicatas
  contexto.frameworks = [...new Set(contexto.frameworks)];
  contexto.linguagens = [...new Set(contexto.linguagens)];

  return contexto;
}

/**
 * Verifica se um arquivo é relevante para um tipo específico de análise
 */

export function isRelevanteParaAnalise(
  contexto: ContextoProjeto,
  tipoAnalise: 'comando' | 'web' | 'bot' | 'cli' | 'biblioteca',
): boolean {
  // Nunca analise arquivos de teste, config ou infraestrutura para padrões específicos
  if (contexto.isTest || contexto.isConfig || contexto.isInfrastructure)
    return false;

  switch (tipoAnalise) {
    case 'comando':
    case 'bot':
      // Para análise de comando, deve ser bot/CLI E não ser infraestrutura
      return (contexto.isBot || contexto.isCLI) && !contexto.isInfrastructure;
    case 'cli':
      return contexto.isCLI && !contexto.isInfrastructure;
    case 'web':
      return contexto.isWebApp;
    case 'biblioteca':
      return contexto.isLibrary;
    default:
      return true;
  }
}

/**
 * Sugere frameworks baseado no contexto detectado
 */

export function sugerirFrameworks(contexto: ContextoProjeto): string[] {
  const sugestoes: string[] = [];

  if (
    contexto.isBot &&
    !contexto.frameworks.some(
      (f: string) => f.includes('discord') || f.includes('telegraf'),
    )
  ) {
    sugestoes.push('Considere usar discord.js ou telegraf para bots');
  }

  if (
    contexto.isCLI &&
    !contexto.frameworks.some(
      (f: string) => f.includes('cli') || f.includes('commander'),
    )
  ) {
    sugestoes.push('Considere usar commander.js ou yargs para CLI');
  }

  return sugestoes;
}
