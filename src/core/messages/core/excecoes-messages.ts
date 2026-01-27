// SPDX-License-Identifier: MIT

export const ExcecoesMessages = {
  // CLI
  exit1: 'exit:1',
  requireMutateFsAutoFix: 'Auto-fix indisponível',
  autoFixTimeout: (timeoutMs: number) => `Auto-fix timeout após ${timeoutMs}ms`,

  // Plugins / import seguro
  pluginsDesabilitadosSafeMode:
    'Carregamento de plugins desabilitado em SAFE_MODE. Defina ORACULO_ALLOW_PLUGINS=1 para permitir.',
  pluginBloqueado: (erro: string) => `Plugin bloqueado: ${erro}`,
  caminhoPluginNaoResolvido: 'Caminho de plugin não resolvido',

  // Registry de plugins
  pluginRegistradoNaoPodeSerObtido: (name: string) =>
    `Plugin ${name} está registrado mas não pode ser obtido`,
  pluginCarregandoPromiseNaoPodeSerObtida: (name: string) =>
    `Plugin ${name} está sendo carregado mas promise não pode ser obtida`,
  naoFoiPossivelCarregarPlugin: (name: string, errMsg: string) =>
    `Não foi possível carregar o plugin '${name}': ${errMsg}`,
  pluginDeveTerNomeValido: 'Plugin deve ter um nome válido',
  pluginDeveTerVersaoValida: 'Plugin deve ter uma versão válida',
  pluginDeveDefinirPeloMenosUmaExtensao:
    'Plugin deve definir pelo menos uma extensão',
  pluginDeveImplementarMetodoParse: 'Plugin deve implementar método parse()',

  // Tipos/Analistas
  definicaoAnalistaInvalida: 'Definição de analista inválida',
  analistaSemFuncaoAplicar: (nome: string) =>
    `Analista ${nome} sem função aplicar`,

  // Validação / Segurança
  caminhoForaDaCwdNaoPermitido: (p: string) =>
    `Caminho fora da CWD não permitido: ${p}`,
  persistenciaNegadaForaRaizProjeto: (caminho: string) =>
    `Persistência negada: caminho fora da raiz do projeto: ${caminho}`,

  // Persistência (ambiente)
  fsWriteFileBinaryIndisponivel:
    'fs.writeFile (binary) indisponível no ambiente atual',
  fsReadFileIndisponivel: 'fs.readFile indisponível no ambiente atual',
  fsWriteFileIndisponivel: 'fs.writeFile indisponível no ambiente atual',
  fsRenameIndisponivel: 'fs.rename indisponível no ambiente atual',
  fsMkdirIndisponivel: 'fs.mkdir indisponível no ambiente atual',

  // Schema
  versaoSchemaDesconhecida: (versao: string) =>
    `Versão de schema desconhecida: ${versao}`,
  relatorioSchemaInvalido: (erros: string) =>
    `Relatório com schema inválido: ${erros}`,

  // File registry
  arquivoNaoEncontrado: (filePath: string) =>
    `Arquivo não encontrado: ${filePath}`,
  validacaoFalhouPara: (filePath: string) =>
    `Validação falhou para ${filePath}`,
  erroAoLer: (filePath: string, errMsg: string) =>
    `Erro ao ler ${filePath}: ${errMsg}`,
  erroAoEscrever: (filePath: string, errMsg: string) =>
    `Erro ao escrever ${filePath}: ${errMsg}`,
  erroAoDeletar: (filePath: string, errMsg: string) =>
    `Erro ao deletar ${filePath}: ${errMsg}`,

  // Scanner
  statIndefinidoPara: (fullPath: string) => `Stat indefinido para ${fullPath}`,

  // Reversão
  mapaReversaoCorrompido: 'Mapa de reversão corrompido',

  // Relatórios
  semPkg: 'sem pkg',
} as const;
