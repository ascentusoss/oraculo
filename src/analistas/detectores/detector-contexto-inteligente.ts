// SPDX-License-Identifier: MIT
/**
 * Sistema Inteligente de Detecção de Arquétipos por Contexto
 *
 * Combina múltiplas evidências para inferir corretamente o tipo de projeto:
 * - Análise de dependências (package.json)
 * - Padrões de código (imports, exports, funcionalidades)
 * - Estrutura de arquivos e nomenclatura
 * - Configurações específicas de tecnologia
 * - Contexto de execução e entry points
 */

import type { NodePath } from '/traverse';
import type {
  ExportDeclaration,
  ImportDeclaration,
  Program,
} from '/types';
import { config } from '/config/config.js';
import { traverse } from '/config/traverse.js';

import type {
  EvidenciaContexto,
  FileEntryWithAst,
  PackageJson,
  ResultadoDeteccaoContextual,
} from '@';

// Re-exporta os tipos para compatibilidade
export type { EvidenciaContexto, ResultadoDeteccaoContextual };

/**
 * Padrões específicos de detecção por tecnologia
 */
const PADROES_TECNOLOGIA = {
  'discord-bot': {
    dependencias: ['discord.js', '/builders', '/rest'],
    imports: ['discord.js', 'discord-api-types'],
    exports: [],
    estrutura: ['commands', 'events', 'handlers'],
    configs: ['bot.js', 'bot.ts', 'config/bot'],
    scripts: ['start:bot', 'dev:bot'],
    codigoPatterns: [
      /Client\(\s*\{[\s\S]*intents/i,
      /\.login\s*\(\s*process\.env/i,
      /interaction\.reply/i,
      /message\.reply/i,
    ],
    // Sinais que indicam que NÃO é um bot Discord (é uma CLI)
    antiPatterns: [
      /new\s+Command\(/i, // Commander.js
      /program\.parse/i, // CLI parsing
      /\.option\s*\(/i, // CLI options
      /bin\/index\.(js|ts)/i, // Binary entry point
    ],
  },
  'telegram-bot': {
    dependencias: ['telegraf', 'grammy', 'node-telegram-bot-api'],
    imports: ['telegraf', 'grammy'],
    exports: [],
    estrutura: ['scenes', 'handlers', 'middleware'],
    configs: ['bot.js', 'bot.ts'],
    scripts: ['start:bot'],
    codigoPatterns: [
      /new\s+Telegraf/i,
      /bot\.command/i,
      /ctx\.reply/i,
      /\.telegram\.sendMessage/i,
    ],
    // Sinais que indicam que NÃO é um bot Telegram
    antiPatterns: [
      /new\s+Command\(/i,
      /program\.parse/i,
      /\.option\s*\(/i,
      /bin\/index\.(js|ts)/i,
    ],
  },
  'express-api': {
    dependencias: [
      'express',
      'cors',
      'helmet',
      'joi',
      'swagger',
      'express-validator',
      'multer',
      'compression',
    ],
    imports: ['express', 'cors', 'helmet', 'body-parser', 'cookie-parser'],
    exports: ['app', 'server', 'router'],
    estrutura: [
      'routes',
      'controllers',
      'middleware',
      'models',
      'services',
      'utils',
      'config',
    ],
    configs: ['server.js', 'app.js', 'index.js', 'src/server.js', 'src/app.js'],
    scripts: ['start', 'dev', 'serve', 'test'],
    codigoPatterns: [
      /express\(\)/i,
      /app\.use\(/i,
      /app\.(get|post|put|delete|patch)\(/i,
      /res\.(json|send|status|sendStatus)/i,
      /req\.(body|params|query|headers)/i,
      /router\.(get|post|put|delete)/i,
      /middleware/i,
      /cors\(/i,
      /helmet\(/i,
    ],
    antiPatterns: [],
  },
  'fastify-api': {
    dependencias: [
      'fastify',
      '/cors',
      '/helmet',
      '/jwt',
      '/rate-limit',
      '/swagger',
    ],
    imports: ['fastify', '/cors', '/helmet'],
    exports: ['app', 'server', 'fastify'],
    estrutura: [
      'routes',
      'plugins',
      'handlers',
      'schemas',
      'services',
      'utils',
    ],
    configs: ['server.js', 'app.js', 'index.js', 'src/server.js', 'src/app.js'],
    scripts: ['start', 'dev', 'serve', 'test'],
    codigoPatterns: [
      /fastify\(\)/i,
      /\.register\(/i,
      /reply\.(send|code)/i,
      /\.listen\(\s*\d+/i,
      /fastify\.(get|post|put|delete|patch)/i,
      /request\.(body|params|query|headers)/i,
      /addHook/i,
      /setValidatorCompiler/i,
      /setSerializerCompiler/i,
    ],
    antiPatterns: [],
  },
  'cli-modular': {
    dependencias: ['commander', 'yargs', 'inquirer', 'chalk', 'ora', 'prompts'],
    imports: ['commander', 'yargs', 'inquirer'],
    exports: [],
    estrutura: ['cli', 'cli/commands', 'bin', 'commands'],
    configs: ['cli.js', 'cli.ts', 'bin/', 'bin/index.js', 'bin/index.ts'],
    scripts: ['build', 'start', 'dev'],
    codigoPatterns: [
      /new\s+Command\(/i,
      /\.command\s*\(/i,
      /\.option\s*\(/i,
      /process\.argv/i,
      /\.parse\s*\(/i,
      /\.action\s*\(/i,
      /\.version\s*\(/i,
      /\.description\s*\(/i,
    ],
    // Sinais que indicam que NÃO é um bot
    antiPatterns: [
      /Client\(\s*\{[\s\S]*intents/i, // Discord client
      /new\s+Telegraf/i, // Telegram bot
      /bot\.command/i, // Bot commands
      /interaction\.reply/i, // Discord interactions
      /ctx\.reply/i, // Telegram context
    ],
  },
  'electron-app': {
    dependencias: ['electron', 'electron-builder', 'electron-updater'],
    imports: ['electron'],
    exports: [],
    estrutura: ['src/main', 'src/renderer', 'src/preload'],
    configs: ['main.js', 'main.ts', 'electron.js'],
    scripts: ['electron', 'build:electron', 'pack'],
    codigoPatterns: [
      /new\s+BrowserWindow/i,
      /app\.whenReady/i,
      /ipcMain\.handle/i,
      /contextBridge\.exposeInMainWorld/i,
    ],
    antiPatterns: [],
  },
  'next-fullstack': {
    dependencias: [
      'next',
      'react',
      'react-dom',
      '/react',
      '/node',
      'typescript',
    ],
    imports: ['next', 'react', 'next/router', 'next/link', 'next/head'],
    exports: [],
    estrutura: [
      'pages',
      'app',
      'api',
      'components',
      'lib',
      'utils',
      'styles',
      'public',
      'prisma',
    ],
    configs: [
      'next.config.js',
      'next.config.ts',
      'next.config.mjs',
      'next-env.d.ts',
      'tailwind.config.js',
    ],
    scripts: ['dev', 'build', 'start', 'lint', 'type-check'],
    codigoPatterns: [
      /export\s+default\s+function.*Page/i,
      /getServerSideProps/i,
      /getStaticProps/i,
      /getStaticPaths/i,
      /NextApiRequest/i,
      /NextApiResponse/i,
      /useRouter/i,
      /next\/head/i,
      /next\/link/i,
      /export\s+default\s+function\s+Page/i, // App Router
      /export\s+default\s+function\s+Layout/i, // App Router Layout
      /export\s+default\s+function\s+Loading/i, // App Router Loading
      /export\s+default\s+function\s+Error/i, // App Router Error
      /export\s+default\s+function\s+NotFound/i, // App Router Not Found
      /metadata\s*=/i, // App Router metadata
      /generateStaticParams/i, // App Router static generation
      /generateMetadata/i, // App Router metadata generation
    ],
    antiPatterns: [],
  },
  'react-spa': {
    dependencias: ['react', 'react-dom', 'react-router', 'vite'],
    imports: ['react', 'react-dom'],
    exports: [],
    estrutura: ['src/components', 'src/pages', 'src/hooks'],
    configs: ['vite.config.js', 'webpack.config.js'],
    scripts: ['dev', 'build', 'preview'],
    codigoPatterns: [
      /ReactDOM\.render/i,
      /createRoot/i,
      /useState/i,
      /useEffect/i,
    ],
    antiPatterns: [],
  },
  'nest-api': {
    dependencias: [
      '/core',
      '/common',
      '/platform-express',
    ],
    imports: ['/core', '/common'],
    exports: [],
    estrutura: ['src/modules', 'src/controllers', 'src/services'],
    configs: ['main.ts', 'app.module.ts'],
    scripts: ['start', 'start:dev', 'build'],
    codigoPatterns: [
      /\(/i,
      /\(/i,
      /\(/i,
      /NestFactory\.create/i,
    ],
    antiPatterns: [],
  },
  'koa-api': {
    dependencias: [
      'koa',
      'koa-router',
      'koa-cors',
      'koa-helmet',
      'koa-bodyparser',
    ],
    imports: ['koa', 'koa-router', 'koa-cors', 'koa-helmet'],
    exports: ['app', 'server'],
    estrutura: ['routes', 'controllers', 'middleware', 'models', 'services'],
    configs: ['server.js', 'app.js', 'index.js'],
    scripts: ['start', 'dev', 'serve'],
    codigoPatterns: [
      /new\s+Koa\(\)/i,
      /app\.use\(/i,
      /router\.(get|post|put|delete)/i,
      /ctx\.(body|status|set)/i,
      /next\(\)/i,
      /middleware/i,
    ],
    antiPatterns: [],
  },
  'hapi-api': {
    dependencias: ['/hapi', 'joi', 'boom'],
    imports: ['/hapi', 'joi', 'boom'],
    exports: ['server', 'routes'],
    estrutura: ['routes', 'controllers', 'plugins', 'models'],
    configs: ['server.js', 'index.js'],
    scripts: ['start', 'dev', 'serve'],
    codigoPatterns: [
      /Hapi\.server/i,
      /server\.route/i,
      /handler:\s*async/i,
      /request\.(payload|params|query)/i,
      /h\.response/i,
      /Joi\.object/i,
    ],
    antiPatterns: [],
  },
  'serverless-api': {
    dependencias: [
      'serverless',
      'serverless-offline',
      '/aws-lambda',
      'aws-sdk',
    ],
    imports: ['aws-lambda', 'aws-sdk'],
    exports: ['handler'],
    estrutura: ['src/handlers', 'src/functions', 'src/lib'],
    configs: ['serverless.yml', 'serverless.ts'],
    scripts: ['deploy', 'offline', 'invoke'],
    codigoPatterns: [
      /exports\.handler/i,
      /APIGatewayProxyEvent/i,
      /APIGatewayProxyResult/i,
      /Context/i,
      /Callback/i,
      /async\s+\(event/i,
    ],
    antiPatterns: [],
  },
  'vue-spa': {
    dependencias: ['vue', '/cli-service', 'vue-router', 'vuex', 'pinia'],
    imports: ['vue', 'vue-router', 'vuex', 'pinia'],
    exports: [],
    estrutura: [
      'src/components',
      'src/views',
      'src/router',
      'src/store',
      'src/composables',
      'public',
    ],
    configs: ['vue.config.js', 'vue.config.ts'],
    scripts: ['serve', 'build', 'lint'],
    codigoPatterns: [
      /createApp\(/i,
      /<template>/i,
      /<script>/i,
      /<style/i,
      /defineComponent/i,
      /setup\(\)/i,
      /ref\(/i,
      /reactive\(/i,
      /computed\(/i,
      /watch\(/i,
      /onMounted/i,
      /onUnmounted/i,
    ],
    antiPatterns: [],
  },
  'nuxt-app': {
    dependencias: ['nuxt', 'nuxt3', '/devtools', '/tailwindcss'],
    imports: ['nuxt', '/kit'],
    exports: [],
    estrutura: [
      'pages',
      'components',
      'layouts',
      'plugins',
      'middleware',
      'composables',
      'server/api',
    ],
    configs: ['nuxt.config.js', 'nuxt.config.ts'],
    scripts: ['dev', 'build', 'generate', 'preview'],
    codigoPatterns: [
      /defineNuxtConfig/i,
      /useHead/i,
      /useState/i,
      /useFetch/i,
      /useAsyncData/i,
      /navigateTo/i,
      /<NuxtPage/i,
      /<NuxtLink/i,
      /definePageMeta/i,
      /server\/api/i,
    ],
    antiPatterns: [],
  },
  'vite-vue': {
    dependencias: ['vue', 'vite', '/plugin-vue', 'vue-router', 'pinia'],
    imports: ['vue', 'vite', '/plugin-vue'],
    exports: [],
    estrutura: [
      'src/components',
      'src/views',
      'src/router',
      'src/stores',
      'src/composables',
      'src/assets',
    ],
    configs: ['vite.config.js', 'vite.config.ts', 'index.html'],
    scripts: ['dev', 'build', 'preview'],
    codigoPatterns: [
      /createApp\(/i,
      /<template>/i,
      /<script setup/i,
      /<style scoped/i,
      /defineComponent/i,
      /setup\(\)/i,
      /ref\(/i,
      /reactive\(/i,
      /computed\(/i,
    ],
    antiPatterns: [],
  },
};

function analisarDependencias(packageJson?: PackageJson): EvidenciaContexto[] {
  const evidencias: EvidenciaContexto[] = [];

  if (!packageJson) return evidencias;

  const deps = {
    ...((packageJson.dependencies as Record<string, string>) || {}),
    ...((packageJson.devDependencies as Record<string, string>) || {}),
  };

  if (config.VERBOSE) {
    console.log('🔍 Analisando dependências:', Object.keys(deps));
  }

  for (const [tecnologia, padroes] of Object.entries(PADROES_TECNOLOGIA)) {
    for (const dep of padroes.dependencias) {
      if (deps[dep]) {
        evidencias.push({
          tipo: 'dependencia',
          valor: dep,
          confianca: 0.8,
          tecnologia,
          localizacao: 'package.json',
        });
      }
    }
  }

  return evidencias;
}

function analisarScripts(packageJson?: PackageJson): EvidenciaContexto[] {
  const evidencias: EvidenciaContexto[] = [];

  if (!packageJson) return evidencias;

  const scripts = (packageJson.scripts as Record<string, string>) || {};

  for (const [tecnologia, padroes] of Object.entries(PADROES_TECNOLOGIA)) {
    for (const script of padroes.scripts) {
      if (
        Object.keys(scripts).some(
          (key) => key.includes(script) || scripts[key]?.includes(script),
        )
      ) {
        evidencias.push({
          tipo: 'script',
          valor: script,
          confianca: 0.6,
          tecnologia,
          localizacao: 'package.json',
        });
      }
    }
  }

  return evidencias;
}

function analisarEstrutura(estruturaDetectada: string[]): EvidenciaContexto[] {
  const evidencias: EvidenciaContexto[] = [];

  for (const [tecnologia, padroes] of Object.entries(PADROES_TECNOLOGIA)) {
    for (const estrutura of padroes.estrutura) {
      // Verificação mais rigorosa para evitar falsos positivos
      const matchExato = estruturaDetectada.find((dir) => {
        // Match exato do caminho
        if (dir === estrutura) return true;

        // Match no final do caminho (ex: src/cli/commands matcheia 'commands')
        if (dir.endsWith(`/${estrutura}`)) return true;

        // Match no início seguido de / (ex: commands/subdir matcheia 'commands')
        if (dir.startsWith(`${estrutura}/`)) return true;

        // Para padrões que incluem /, verificar match rigoroso de subcaminho
        if (estrutura.includes('/')) {
          // Normalizar separadores para comparação
          const estruturaNorm = estrutura.replace(/\\/g, '/');
          const dirNorm = dir.replace(/\\/g, '/');

          // Verificar se é subcaminho exato
          if (dirNorm === estruturaNorm) return true;
          if (dirNorm.endsWith(`/${estruturaNorm}`)) return true;
          if (dirNorm.startsWith(`${estruturaNorm}/`)) return true;
        }

        return false;
      });

      if (matchExato) {
        evidencias.push({
          tipo: 'estrutura',
          valor: estrutura,
          confianca: 0.7,
          tecnologia,
          localizacao: matchExato,
        });
      }
    }
  }

  return evidencias;
}

function analisarImportsExports(
  arquivos: FileEntryWithAst[],
): EvidenciaContexto[] {
  const evidencias: EvidenciaContexto[] = [];

  for (const arquivo of arquivos) {
    if (
      !arquivo.ast ||
      !('node' in arquivo.ast) ||
      !arquivo.ast.node ||
      arquivo.ast.node.type !== 'Program'
    )
      continue;

    const programa = arquivo.ast.node as Program;
    const imports: string[] = [];
    const exports: string[] = [];

    traverse(programa, {
      ImportDeclaration(path: NodePath<ImportDeclaration>) {
        const node = path.node;
        if (typeof node.source.value === 'string') {
          imports.push(node.source.value);
        }
      },
      ExportDeclaration(path: NodePath<ExportDeclaration>) {
        const node = path.node as ExportDeclaration;
        // Analisa exports nomeados e padrão
        if ('declaration' in node && node.declaration) {
          if (
            'id' in node.declaration &&
            node.declaration.id &&
            'name' in node.declaration.id
          ) {
            exports.push(node.declaration.id.name as string);
          }
        }
      },
    });

    // Verifica evidências nos imports
    for (const [tecnologia, padroes] of Object.entries(PADROES_TECNOLOGIA)) {
      for (const importEsperado of padroes.imports) {
        if (imports.some((imp) => imp.includes(importEsperado))) {
          evidencias.push({
            tipo: 'import',
            valor: importEsperado,
            confianca: 0.9,
            tecnologia,
            localizacao: arquivo.relPath,
          });
        }
      }

      for (const exportEsperado of padroes.exports) {
        if (exports.some((exp) => exp.includes(exportEsperado))) {
          evidencias.push({
            tipo: 'export',
            valor: exportEsperado,
            confianca: 0.8,
            tecnologia,
            localizacao: arquivo.relPath,
          });
        }
      }
    }
  }

  return evidencias;
}

function analisarPadroesCodigo(
  arquivos: FileEntryWithAst[],
): EvidenciaContexto[] {
  const evidencias: EvidenciaContexto[] = [];

  for (const arquivo of arquivos) {
    if (!arquivo.content) continue;

    for (const [tecnologia, padroes] of Object.entries(PADROES_TECNOLOGIA)) {
      for (const pattern of padroes.codigoPatterns) {
        if (pattern.test(arquivo.content)) {
          evidencias.push({
            tipo: 'codigo',
            valor: pattern.source,
            confianca: 0.85,
            tecnologia,
            localizacao: arquivo.relPath,
          });
        }
      }
    }
  }

  return evidencias;
}

/**
 * Verifica se anti-patterns estão presentes no código
 * Anti-patterns indicam que a tecnologia detectada está INCORRETA
 */
function verificarAntiPatterns(
  arquivos: FileEntryWithAst[],
  tecnologia: string,
): boolean {
  const padraoTecnologia =
    PADROES_TECNOLOGIA[tecnologia as keyof typeof PADROES_TECNOLOGIA];
  if (!padraoTecnologia || !padraoTecnologia.antiPatterns) {
    return false; // Sem anti-patterns definidos
  }

  for (const arquivo of arquivos) {
    if (!arquivo.content) continue;

    // Se encontrar qualquer anti-pattern, retorna true (detecção incorreta)
    for (const antiPattern of padraoTecnologia.antiPatterns) {
      if (antiPattern.test(arquivo.content)) {
        return true; // Anti-pattern encontrado!
      }
    }
  }

  return false; // Nenhum anti-pattern encontrado
}

function gerarSugestoesMelhoria(
  tecnologia: string,
  evidencias: EvidenciaContexto[],
): string[] {
  const sugestoes: string[] = [];
  const _arquivosEncontrados = evidencias
    .map((e) => e.localizacao)
    .filter(Boolean);

  switch (tecnologia) {
    case 'discord-bot':
      if (!evidencias.some((e) => e.valor.includes('intents'))) {
        sugestoes.push(
          '🔧 Configurar intents específicos no Discord Client para melhor performance',
        );
      }
      if (!evidencias.some((e) => e.valor.includes('command'))) {
        sugestoes.push(
          '📁 Estruturar commands em pasta dedicada para organização',
        );
      }
      if (!evidencias.some((e) => e.valor.includes('rate'))) {
        sugestoes.push(
          '⚡ Implementar rate limiting para evitar banimento por spam',
        );
      }
      break;

    case 'express-api':
      if (!evidencias.some((e) => e.valor.includes('helmet'))) {
        sugestoes.push('🛡️ Adicionar helmet para headers de segurança');
      }
      if (!evidencias.some((e) => e.valor.includes('cors'))) {
        sugestoes.push('🌐 Configurar CORS adequadamente para APIs');
      }
      if (
        !evidencias.some(
          (e) => e.valor.includes('joi') && e.valor.includes('swagger'),
        )
      ) {
        sugestoes.push(
          '📋 Implementar validação com Joi e documentação Swagger',
        );
      }
      break;

    case 'cli-modular':
      if (!evidencias.some((e) => e.valor.includes('help'))) {
        sugestoes.push('❓ Implementar comando --help abrangente');
      }
      if (!evidencias.some((e) => e.valor.includes('version'))) {
        sugestoes.push('📦 Adicionar comando --version');
      }
      if (!evidencias.some((e) => e.valor.includes('config'))) {
        sugestoes.push('⚙️ Considerar arquivo de configuração para usuários');
      }
      break;

    case 'electron-app':
      if (!evidencias.some((e) => e.valor.includes('preload'))) {
        sugestoes.push('🔒 Implementar preload script para comunicação segura');
      }
      if (!evidencias.some((e) => e.valor.includes('contextIsolation'))) {
        sugestoes.push('🛡️ Habilitar context isolation para segurança');
      }
      if (!evidencias.some((e) => e.valor.includes('updater'))) {
        sugestoes.push(
          '🔄 Implementar auto-updater para atualizações automáticas',
        );
      }
      break;
  }

  return sugestoes;
}

function detectarProblemas(
  tecnologia: string,
  evidencias: EvidenciaContexto[],
  arquivos: FileEntryWithAst[],
): string[] {
  const problemas: string[] = [];

  switch (tecnologia) {
    case 'discord-bot':
      // Verifica se token está hardcoded
      for (const arquivo of arquivos) {
        if (
          arquivo.content?.includes('token') &&
          !arquivo.content.includes('process.env')
        ) {
          problemas.push(`🚨 Possível token hardcoded em ${arquivo.relPath}`);
        }
      }
      break;

    case 'express-api':
      // Verifica middleware de segurança
      const temHelmet = evidencias.some((e) => e.valor.includes('helmet'));
      const temCors = evidencias.some((e) => e.valor.includes('cors'));
      if (!temHelmet) {
        problemas.push('⚠️ API sem helmet - vulnerável a ataques de header');
      }
      if (!temCors) {
        problemas.push(
          '⚠️ API sem CORS configurado - possíveis problemas de origem',
        );
      }
      break;

    case 'electron-app':
      // Verifica configurações de segurança
      for (const arquivo of arquivos) {
        if (arquivo.content?.includes('nodeIntegration: true')) {
          problemas.push(
            `🚨 nodeIntegration habilitado em ${arquivo.relPath} - risco de segurança`,
          );
        }
        if (arquivo.content?.includes('contextIsolation: false')) {
          problemas.push(
            `🚨 contextIsolation desabilitado em ${arquivo.relPath} - vulnerabilidade`,
          );
        }
      }
      break;
  }

  return problemas;
}

function calcularConfiancaTotal(evidencias: EvidenciaContexto[]): number {
  if (evidencias.length === 0) return 0;

  const pesosPorTipo = {
    dependencia: 1.0,
    import: 0.9,
    codigo: 0.85,
    export: 0.8,
    estrutura: 0.7,
    script: 0.6,
    config: 0.5,
  };

  let somaConfianca = 0;
  let somaPesos = 0;

  for (const evidencia of evidencias) {
    const peso =
      pesosPorTipo[evidencia.tipo as keyof typeof pesosPorTipo] || 0.5;
    somaConfianca += evidencia.confianca * peso;
    somaPesos += peso;
  }

  return somaPesos > 0 ? somaConfianca / somaPesos : 0;
}

export function detectarContextoInteligente(
  estruturaDetectada: string[],
  arquivos: FileEntryWithAst[],
  packageJson?: PackageJson,
  options?: { quiet?: boolean },
): ResultadoDeteccaoContextual[] {
  // DEBUG: Log simples para verificar se está sendo chamado
  if (!options?.quiet && config.VERBOSE) {
    console.log(
      '🔍 Package.json completo:',
      JSON.stringify(packageJson, null, 2),
    );
    if (packageJson?.dependencies?.vue) {
      console.log('🔍 Package.json tem Vue:', packageJson.dependencies.vue);
    }
  }
  const todasEvidencias: EvidenciaContexto[] = [
    ...analisarDependencias(packageJson),
    ...analisarScripts(packageJson),
    ...analisarEstrutura(estruturaDetectada),
    ...analisarImportsExports(arquivos),
    ...analisarPadroesCodigo(arquivos),
  ];

  // Agrupa evidências por tecnologia
  const evidenciasPorTecnologia = new Map<string, EvidenciaContexto[]>();

  for (const evidencia of todasEvidencias) {
    const tec = evidencia.tecnologia || 'desconhecido';
    if (!evidenciasPorTecnologia.has(tec)) {
      evidenciasPorTecnologia.set(tec, []);
    }
    const tecEvidencias = evidenciasPorTecnologia.get(tec);
    if (tecEvidencias) {
      tecEvidencias.push(evidencia);
    }
  }

  // Calcula resultados por tecnologia
  const resultados: ResultadoDeteccaoContextual[] = [];

  for (const [tecnologia, evidencias] of evidenciasPorTecnologia) {
    let confiancaTotal = calcularConfiancaTotal(evidencias);

    // Verificação de dependências obrigatórias para evitar falsos positivos
    const padraoTecnologia =
      PADROES_TECNOLOGIA[tecnologia as keyof typeof PADROES_TECNOLOGIA];
    if (padraoTecnologia && padraoTecnologia.dependencias.length > 0) {
      const temDependenciaObrigatoria = evidencias.some(
        (e) =>
          e.tipo === 'dependencia' &&
          padraoTecnologia.dependencias.includes(e.valor),
      );

      // Se não tem nenhuma dependência obrigatória, penalizar severamente
      if (!temDependenciaObrigatoria) {
        confiancaTotal *= 0.1; // Reduz confiança para 10%
      }
    }

    // 🚨 VERIFICAÇÃO DE ANTI-PATTERNS: Se anti-patterns estão presentes, ELIMINAR detecção
    const temAntiPattern = verificarAntiPatterns(arquivos, tecnologia);
    if (temAntiPattern) {
      // Anti-pattern detectado = detecção FALSA, eliminar confiança
      confiancaTotal = 0;
      // Opcional: Adicionar evidência negativa
      evidencias.push({
        tipo: 'codigo',
        valor: 'anti-pattern-detectado',
        confianca: -1.0, // Negativa
        tecnologia,
        localizacao: 'código',
      });
    }

    if (confiancaTotal > 0.3) {
      // Threshold mínimo para considerar
      resultados.push({
        tecnologia,
        confiancaTotal,
        evidencias,
        sugestoesMelhoria: gerarSugestoesMelhoria(tecnologia, evidencias),
        problemasDetectados: detectarProblemas(
          tecnologia,
          evidencias,
          arquivos,
        ),
      });
    }
  }

  // Ordena por confiança decrescente
  return resultados.sort((a, b) => b.confiancaTotal - a.confiancaTotal);
}

export function inferirArquetipoInteligente(
  estruturaDetectada: string[],
  arquivos: FileEntryWithAst[],
  packageJson?: PackageJson,
  options?: { quiet?: boolean },
): string {
  const resultados = detectarContextoInteligente(
    estruturaDetectada,
    arquivos,
    packageJson,
    options,
  );

  if (resultados.length === 0) return 'generico';

  const melhorResultado = resultados[0];

  // Mapeia tecnologias para arquétipos oficiais
  const mapeamentoArquetipos: Record<string, string> = {
    'discord-bot': 'bot',
    'telegram-bot': 'bot',
    'express-api': 'api-rest-express',
    'fastify-api': 'api-rest-express',
    'nest-api': 'api-rest-express',
    'koa-api': 'api-rest-express',
    'hapi-api': 'api-rest-express',
    'serverless-api': 'api-rest-express',
    'cli-modular': 'cli-modular',
    'electron-app': 'electron',
    'next-fullstack': 'fullstack',
    'react-spa': 'landing-page',
    'vue-spa': 'vue-spa',
    'nuxt-app': 'vue-spa',
    'vite-vue': 'vue-spa',
  };

  return (
    mapeamentoArquetipos[melhorResultado.tecnologia || 'generico'] || 'generico'
  );
}
