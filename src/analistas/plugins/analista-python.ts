// SPDX-License-Identifier: MIT
import {
  AnalystOrigins,
  AnalystTypes,
  PythonMessages,
  SeverityLevels,
} from '@core/messages/core/plugin-messages.js';
import { createLineLookup } from '@shared/helpers/line-lookup.js';
import {
  maskPythonComments,
  maskPythonStringsAndComments,
} from '@shared/helpers/masking.js';

import { criarAnalista, criarOcorrencia } from '@';

const disableEnv = process.env.ORACULO_DISABLE_PLUGIN_PYTHON === '1';

type Msg = ReturnType<typeof criarOcorrencia>;

function isPythonFile(relPath: string): boolean {
  return /\.(py|pyx|pyi)$/i.test(relPath);
}

function warn(
  message: string,
  relPath: string,
  line?: number,
  nivel: (typeof SeverityLevels)[keyof typeof SeverityLevels] = SeverityLevels.warning,
): Msg {
  return criarOcorrencia({
    relPath,
    mensagem: message,
    linha: line,
    nivel,
    origem: AnalystOrigins.python,
    tipo: AnalystTypes.python,
  });
}

function collectPythonIssues(src: string, relPath: string): Msg[] {
  const ocorrencias: Msg[] = [];

  const lineOf = createLineLookup(src).lineAt;

  // Reduz falsos positivos: evite detectar padrões dentro de strings/comentários.
  const scan = maskPythonStringsAndComments(src);
  // Algumas regras precisam enxergar literais (ex.: URLs/SQL em strings), mas ainda
  // devem ignorar comentários.
  const scanNoComments = maskPythonComments(src);

  /* -------------------------- Type Hints & Code Quality -------------------------- */

  // Funções sem type hints (heurística: def seguido de parênteses)
  // Ignora __init__, main, properties, etc.
  for (const match of scan.matchAll(
    /^\s*(?:async\s+)?def\s+([a-z_][a-z0-9_]*)\s*\((.*?)\)(?!\s*->)/gm,
  )) {
    const funcName = match[1] || '';
    const line = lineOf(match.index);

    // Ignora dunder methods, main, e métodos comuns sem tipo
    if (/^__|main|__init__|setUp|tearDown|get_|set_/.test(funcName)) continue;

    ocorrencias.push(warn(PythonMessages.missingTypeHints, relPath, line));
  }

  /* -------------------------- Security Issues -------------------------- */

  // print() instead of logging
  for (const match of scan.matchAll(/^\s*print\s*\(/gm)) {
    const line = lineOf(match.index);
    ocorrencias.push(warn(PythonMessages.printInsteadOfLog, relPath, line));
  }

  // eval() usage
  for (const match of scan.matchAll(/\beval\s*\(/gi)) {
    const line = lineOf(match.index);
    ocorrencias.push(
      warn(PythonMessages.evalUsage, relPath, line, SeverityLevels.error),
    );
  }

  // exec() usage
  for (const match of scan.matchAll(/\bexec\s*\(/gi)) {
    const line = lineOf(match.index);
    ocorrencias.push(
      warn(PythonMessages.execUsage, relPath, line, SeverityLevels.error),
    );
  }

  // subprocess(..., shell=True)
  for (const match of scan.matchAll(
    /\bsubprocess\.(?:run|Popen|call|check_call|check_output)\s*\([\s\S]*?\)/g,
  )) {
    if (!/\bshell\s*=\s*True\b/.test(match[0])) continue;
    const line = lineOf(match.index);
    ocorrencias.push(
      warn(
        PythonMessages.subprocessShellTrue,
        relPath,
        line,
        SeverityLevels.error,
      ),
    );
  }

  // pickle loads (RCE)
  for (const match of scan.matchAll(/\bpickle\.(?:load|loads)\s*\(/gi)) {
    const line = lineOf(match.index);
    ocorrencias.push(
      warn(PythonMessages.pickleUsage, relPath, line, SeverityLevels.error),
    );
  }

  // yaml.load sem Loader seguro
  for (const match of scan.matchAll(/\byaml\.load\s*\([\s\S]*?\)/gi)) {
    const text = match[0] ?? '';
    const hasSafeLoader =
      /\bLoader\s*=\s*yaml\.(?:SafeLoader|CSafeLoader)\b/.test(text);
    const hasFullLoader =
      /\bLoader\s*=\s*yaml\.(?:FullLoader|CFullLoader)\b/.test(text);
    const hasExplicitLoader = /\bLoader\s*=/.test(text);
    if (hasSafeLoader) continue;
    // FullLoader é melhor que default em versões antigas, mas ainda é discutível; marcamos aviso.
    const line = lineOf(match.index);
    ocorrencias.push(
      warn(
        PythonMessages.yamlUnsafeLoad,
        relPath,
        line,
        hasFullLoader || hasExplicitLoader
          ? SeverityLevels.warning
          : SeverityLevels.error,
      ),
    );
  }

  // requests/urllib sem verify (HTTP inseguro)
  for (const match of scanNoComments.matchAll(
    /(?:requests|urllib)\.(?:get|post|request)\s*\([^)]*\)/g,
  )) {
    const hasVerify = /verify\s*=/i.test(match[0]);
    if (!hasVerify && /http:\/\//i.test(match[0])) {
      const line = lineOf(match.index);
      ocorrencias.push(warn(PythonMessages.httpWithoutVerify, relPath, line));
    }
  }

  // SQL injection patterns (simples)
  // - execute(f"SELECT ... {var} ...")
  // - execute(f'SELECT ... {var} ...')
  for (const match of scanNoComments.matchAll(
    /\b(?:execute|executemany|executescript)\s*\(\s*f(['"])(?:SELECT|INSERT|UPDATE|DELETE)[\s\S]*?\1/gi,
  )) {
    const text = match[0] ?? '';
    // Heurística: f-string com interpolação sugere concatenação de SQL.
    if (!/\{[^}]+\}/.test(text)) continue;
    const line = lineOf(match.index);
    ocorrencias.push(
      warn(PythonMessages.sqlInjection, relPath, line, SeverityLevels.error),
    );
  }

  /* -------------------------- Exception Handling -------------------------- */

  // Bare except
  for (const match of scan.matchAll(/^\s*except\s*:\s*$/gm)) {
    const line = lineOf(match.index);
    ocorrencias.push(warn(PythonMessages.broadExcept, relPath, line));
  }

  // except ... pass (bad practice)
  for (const match of scan.matchAll(
    /except\s+\w+\s*(?:as\s+\w+)?\s*:\s*pass/g,
  )) {
    const line = lineOf(match.index);
    ocorrencias.push(warn(PythonMessages.passInExcept, relPath, line));
  }

  // bare raise (contextless)
  for (const match of scan.matchAll(
    /except\s+\w+\s*(?:as\s+\w+)?\s*:\s*\n\s*raise\s*\n/gm,
  )) {
    const line = lineOf(match.index);
    ocorrencias.push(warn(PythonMessages.bareRaise, relPath, line));
  }

  /* -------------------------- Code Quality & Best Practices -------------------------- */

  // global keyword (code smell)
  for (const match of scan.matchAll(/^\s*global\s+\w+/gm)) {
    const line = lineOf(match.index);
    ocorrencias.push(warn(PythonMessages.globalKeyword, relPath, line));
  }

  // Mutable default arguments
  for (const match of scan.matchAll(
    /def\s+\w+\s*\([^)]*=\s*(?:\[|\{)[^\]}]*(?:\]|\})/g,
  )) {
    const line = lineOf(match.index);
    ocorrencias.push(warn(PythonMessages.mutableDefault, relPath, line));
  }

  /* -------------------------- Performance Hints -------------------------- */

  // Loop that could be list comprehension (simple heuristic)
  for (const match of scan.matchAll(
    /for\s+\w+\s+in\s+\w+:\s*\n\s*(\w+)\.append\s*\(/g,
  )) {
    const line = lineOf(match.index);
    // Apenas sugerir se parece simples (sem múltiplas linhas complexas)
    ocorrencias.push(
      warn(
        PythonMessages.listComprehensionOpportunity,
        relPath,
        line,
        SeverityLevels.suggestion,
      ),
    );
  }

  // Iterating over dict without .items()
  for (const match of scan.matchAll(
    /for\s+\w+\s+in\s+(\w+):\s*\n\s*(?:value|val)\s*=\s*\1\[/gm,
  )) {
    const line = lineOf(match.index);
    ocorrencias.push(
      warn(
        PythonMessages.loopingOverDict,
        relPath,
        line,
        SeverityLevels.suggestion,
      ),
    );
  }

  return ocorrencias;
}

export const analistaPython = criarAnalista({
  nome: 'analista-python',
  categoria: 'framework',
  descricao: 'Heurísticas leves para Python (boas práticas e segurança).',
  global: false,
  test: (relPath: string): boolean => isPythonFile(relPath),
  aplicar: async (src, relPath): Promise<Msg[] | null> => {
    if (disableEnv) return null;
    if (relPath.includes('src/analistas/plugins/analista-python.ts'))
      return null;
    const msgs = collectPythonIssues(src, relPath);
    return msgs.length ? msgs : null;
  },
});

export default analistaPython;
