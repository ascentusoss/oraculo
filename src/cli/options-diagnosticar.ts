// SPDX-License-Identifier: MIT
// Opções do comando diagnosticar centralizadas para facilitar manutenção e testes
// Siga o padrão do projeto para adicionar novas opções

type OptionBase = {
  flags: string;
  desc: string;
};

type OptionWithParser = OptionBase & {
  parser: (val: string, prev: string[]) => string[];
  defaultValue: string[];
};

type OptionWithDefault = OptionBase & {
  defaultValue: boolean | string;
};

type OptionSimple = OptionBase;

type DiagnosticarOption = OptionWithParser | OptionWithDefault | OptionSimple;

export const optionsDiagnosticar: DiagnosticarOption[] = [
  {
    flags: '--listar-analistas',
    desc: 'lista técnicas/analistas ativos antes da análise',
    defaultValue: false,
  },
  {
    flags: '-g, --guardian-check',
    desc: 'Executa verificação de integridade (guardian) no diagnóstico',
    defaultValue: false,
  },
  {
    flags: '--json',
    desc: 'Saída JSON estruturada (para CI/integracoes)',
    defaultValue: false,
  },
  {
    flags: '--json-ascii',
    desc: 'Força saída JSON com escape ASCII (\\uXXXX) para compatibilidade legada',
    defaultValue: false,
  },
  {
    flags: '--fast',
    desc: 'Modo rápido: análise superficial paralelizada (menos checks, mais desempenho)',
    defaultValue: false,
  },
  {
    flags: '--trust-compiler',
    desc: 'Reduz falsos positivos confiando em TS/ESLint quando não há erros',
    defaultValue: false,
  },
  {
    flags: '--verify-cycles',
    desc: 'Verifica ciclos de dependência com checagem adicional e rebaixa alertas não confirmados',
    defaultValue: false,
  },
  {
    flags: '--criar-arquetipo',
    desc: 'Cria um arquétipo personalizado baseado na estrutura atual do projeto',
    defaultValue: false,
  },
  {
    flags: '--salvar-arquetipo',
    desc: 'Salva o arquétipo personalizado gerado automaticamente (use com --criar-arquetipo)',
    defaultValue: false,
  },
  {
    flags: '--include <padrao>',
    desc: 'Glob pattern a INCLUIR (pode repetir a flag ou usar vírgulas / espaços para múltiplos)',
    parser: (val: string, prev: string[]): string[] => {
      prev.push(val);
      return prev;
    },
    defaultValue: [] as string[],
  },
  {
    flags: '--exclude <padrao>',
    desc: 'Glob pattern a EXCLUIR (pode repetir a flag ou usar vírgulas / espaços para múltiplos)',
    parser: (val: string, prev: string[]): string[] => {
      prev.push(val);
      return prev;
    },
    defaultValue: [] as string[],
  },
  {
    flags: '--exclude-tests',
    desc: 'Ignora arquivos de teste na análise (equivalente a excluir **/*.test.*, **/*.spec.*, tests/**, __tests__/**)',
    defaultValue: false,
  },
  {
    flags: '--full',
    desc: 'Gera relatório detalhado com todas as informações (ao invés do resumido padrão)',
    defaultValue: false,
  },
  {
    flags: '--compact',
    desc: 'Modo compacto: consolida logs de progresso e mostra apenas o essencial (padrão quando não usa --full)',
    defaultValue: false,
  },
  {
    flags: '--log-level <nivel>',
    desc: 'Controla verbosidade dos logs: erro, aviso, info, debug (padrão: info)',
    defaultValue: 'info',
  },
  {
    flags: '--executive',
    desc: 'Modo executivo: mostra apenas problemas críticos e de alta prioridade (ideal para tomada de decisão)',
    defaultValue: false,
  },
  {
    flags: '--auto-fix',
    desc: 'Aplica correções automáticas (quick fixes) detectadas.',
    defaultValue: false,
  },
  {
    flags: '--auto-fix-mode <modo>',
    desc: 'Modo de correção automática: conservative (mais seguro), balanced (padrão), aggressive (mais correções)',
    defaultValue: 'balanced',
  },
  {
    flags: '--auto-fix-conservative',
    desc: 'Atalho para --auto-fix --auto-fix-mode conservative (aplica apenas correções com alta confiança)',
    defaultValue: false,
  },
  // 🚀 NOVAS FLAGS INTUITIVAS
  {
    flags: '--fix',
    desc: 'Alias intuitivo para --auto-fix (aplica correções automáticas detectadas)',
    defaultValue: false,
  },
  {
    flags: '--fix-safe',
    desc: 'Alias intuitivo para --auto-fix-conservative (apenas correções de alta confiança)',
    defaultValue: false,
  },
  {
    flags: '--show-fixes',
    desc: 'Mostra detalhes das correções disponíveis sem aplicar',
    defaultValue: false,
  },
  {
    flags: '--export',
    desc: 'Exporta relatórios para disco (JSON/Markdown)',
    defaultValue: false,
  },
  {
    flags: '--export-full',
    desc: 'Exporta relatório completo (pode ser fragmentado)',
    defaultValue: false,
  },
  {
    flags: '--export-to <dir>',
    desc: 'Diretório para export de relatórios',
    defaultValue: 'relatorios',
  },
  // Adicione outras opções futuras aqui, seguindo o mesmo padrão.
];
