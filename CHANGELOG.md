> **Proveniência e Autoria**: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Changelog

Todas as mudanças notáveis deste repositório serão documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [0.3.6] - 2026-01-23

### Adicionado

- **Extração Avançada de Sinais**: Sistema inteligente de análise de sinais do projeto para reestruturação mais precisa
  - Detecção de padrões arquiteturais e tecnologias dominantes
  - Análise de complexidade estrutural para decisões estratégicas
  - Ajuste contextual de destinos baseado em sinais detectados
  - Integração com `OperarioEstrutura` para planejamento estratégico aprimorado

- **Validações Aprimoradas**: Melhorias em plugins de análise para CSS, HTML e XML
  - Validações de qualidade de código e acessibilidade
  - Verificações de segurança aprimoradas
  - Mensagens de validação expandidas

- **Sistema de Pontuação Contextual**: Mecanismo de pontuação que considera sinais avançados
  - Ajustes contextuais baseados na análise de projeto
  - Pontuação mais precisa para diferentes tipos de projeto

### Alterado

- **Configuração Lint-Staged**: Otimização da configuração para melhor legibilidade e performance
- **Mapeamento de Reversão**: Melhorias na organização de importações e consistência

### Corrigido

- **Segurança HTML**: Correção de expressão regular vulnerável na filtragem HTML (Code Scanning Alert #47)
- **Validações de Segurança**: Reforço das verificações de segurança em análise de HTML

### Interno

- **Tipos Expandidos**: Novos campos em `SinaisProjetoAvancados` para detecção de padrões e tecnologias
- **Mensagens de Plugin**: Expansão das mensagens de validação para melhor feedback

## [0.3.5] - 2026-01-23

## [0.3.4] - 2026-01-23

### Adicionado

- **Manutenção**: Documentação e CHANGELOG atualizados para refletir o estado real do projeto.
- **Refatoração**: Pequenas melhorias e correções de bugs.

## [0.3.3] - 2026-01-21

### Adicionado

- Melhoria na estabilidade da saída JSON do comando `diagnosticar` para integração em CI.
- Testes adicionais e validações em analistas que processam arquivos Markdown.

### Alterado

- Redução de falsos positivos em deteções de async não tratado em fluxos assíncronos.

### Corrigido

- Tratamento de erros assíncronos em `mapa-reversao` e correções menores em logs e mensagens.

## [0.3.2] - 2026-01-19

### Adicionado

- Script `md:add-disclaimer` para inserir aviso de proveniência em arquivos Markdown.
- Utilitários de manutenção para geração e verificação de relatórios.

### Alterado

- Melhorias na geração de relatórios e pequenas otimizações de performance.

### Corrigido

- Ajustes em documentação e comentários internos; correções de pequenos bugs em scripts.

## [0.3.1] - 2026-01-17

### Adicionado

- Baseline de testes e ajustes iniciais na configuração do CI para validação de analistas.

### Corrigido

- Correções em flags do CLI (`--export`, `--json`) e comportamento de exportação de relatórios.

## [0.3.0] - 2026-01-15

### Adicionado

- **Novos Comandos CLI**:
  - `formatar` — Aplica formatação estilo Oráculo (whitespace, seções, finais de linha) com suporte a Prettier
  - `otimizar-svg` — Otimiza SVGs do projeto usando otimizador interno (svgo-like)
  - `atualizar` — Atualiza o Oráculo verificando integridade via Guardian antes
  - `reverter` — Gerencia mapa de reversão para moves aplicados (listar, arquivo, move, limpar)

- **Novos Analistas e Detectores**:
  - `detector-arquitetura` — Análise de padrões arquiteturais
  - `detector-codigo-fragil` — Identifica código frágil e propenso a bugs
  - `detector-construcoes-sintaticas` — Detecta construções sintáticas problemáticas
  - `detector-duplicacoes` — Identifica código duplicado
  - `detector-interfaces-inline` — Detecta interfaces inline que deveriam ser extraídas
  - `detector-contexto-inteligente` — Análise contextual avançada
  - `detector-fantasmas` — Detecta arquivos órfãos e não utilizados
  - `detector-performance` — Identifica problemas de performance

- **Plugins Multi-linguagem**:
  - `analista-react` e `analista-react-hooks` — Análise específica para React
  - `analista-tailwind` — Análise de classes Tailwind
  - `analista-css` e `analista-css-in-js` — Análise de estilos
  - `analista-html` e `analista-xml` — Análise de markup
  - `analista-svg` — Análise e otimização de SVGs
  - `analista-python` — Suporte heurístico para Python
  - `detector-markdown` — Validação de arquivos Markdown
  - `detector-documentacao` — Análise de qualidade de documentação

- **Sistema de Supressão Inline**: `@oraculo-disable-next-line <regra>` funciona para todos os analistas

- **Modos de Execução Expandidos**:
  - `--executive` — Modo executivo (apenas problemas críticos/alta prioridade)
  - `--compact` — Modo compacto (consolida progresso e mostra o essencial)
  - `--trust-compiler` — Confia no compilador para reduzir falsos positivos

- **Suporte a Mais Linguagens**: PHP, Python (heurístico)

### Alterado

- **Node.js 24+**: Agora requer Node.js >= 24.0.4
- **Refatoração do Sistema de Mensagens**: Mensagens centralizadas por domínio
- **Melhoria no Sistema de Pontuação**: Ajustes contextuais mais precisos
- **Guardian**: Integração mais profunda com comandos de atualização

### Corrigido

- Normalização de line endings para compatibilidade Windows/Linux
- Falsos positivos em detecção de segredos em arquivos de documentação
- Tratamento de placeholders em strings de configuração

### Removido

- Dependência circular interna em `oraculo: file:oraculo-0.3.0.tgz` (problema de empacotamento)

---

## [0.2.0] - 2025-08-28

### Adicionado

- **Pool de Workers**: Sistema completo de paralelização por arquivo para melhorar performance em projetos grandes
  - Classe WorkerPool com gerenciamento de workers paralelos
  - Sistema de lotes configurável (batchSize padrão: 10 arquivos por worker)
  - Timeout individual por analista (30s padrão) com cancelamento automático
  - Fallback automático para processamento sequencial quando workers desabilitados
  - Worker executor em JavaScript puro para threads separadas
  - Configuração centralizada via variáveis de ambiente
  - Função de conveniência `processarComWorkers()` para fácil integração
  - Estatísticas detalhadas do pool (workers ativos, erros, duração)
  - Testes completos com 9 cenários cobrindo configuração e processamento

- **Sistema de Schema Versioning**: Versionamento completo dos relatórios JSON
  - Metadados de versão (`_schema`) em todos os relatórios JSON
  - Validação automática de schema com compatibilidade backward
  - Migração automática de relatórios legados
  - Utilitários para leitura de relatórios versionados
  - Integração com `gerador-relatorio.ts` e `relatorio-arquetipos.ts`
  - Testes completos (27 testes passando)

- **Sistema de Pontuação Adaptativa**: Pontuação inteligente baseada no tamanho do projeto
  - Constantes adaptativas baseadas em número de arquivos e diretórios
  - Sistema de fatores escaláveis (1x a 5x) para diferentes tamanhos de projeto
  - Configuração centralizada em `configuracao-pontuacao.ts` com 3 modos
  - Pesos de arquétipo recalibrados para maior realismo
  - Sistema de confiança inteligente com ajustes contextuais

- **Correção Crítica**: Exclusão padrão de `node_modules` no comando `diagnosticar`
  - Aplicação automática de padrões de exclusão padrão quando nenhum filtro é especificado
  - Redução de ~70% nos arquivos escaneados (2111 → 633 arquivos)
  - Manutenção da compatibilidade com filtros explícitos
  - Validação através de testes específicos

### Alterado

- **Correção de Exclusão Padrão**: Comando `diagnosticar` agora aplica corretamente padrões de exclusão padrão (`node_modules/**`, `dist/**`, `coverage/**`, etc.) quando nenhum filtro explícito é fornecido
- **Timeout por Analista**: Implementado timeout individual de 30 segundos por analista com cancelamento automático

### Corrigido

- **Problema de Exclusão**: Correção crítica onde `node_modules` era escaneado mesmo sem filtros explícitos devido a configuração vazia de `CLI_EXCLUDE_PATTERNS`

## [Unreleased]

### Melhorado

- Filtros dinâmicos `--include`/`--exclude` com suporte a flags repetidas, vírgulas e espaços.
- Harmonização: inclusão explícita de `node_modules` (ex.: `--include node_modules/**`) agora funciona inclusive em `--scan-only`.
- Saída `--json` com logs intermediários silenciados e escape Unicode \uXXXX para estabilidade em Windows/CI.

### Refatorado

- Analistas deixam de impor limitação rígida a `src/`; escopo agora é totalmente controlado pelo scanner/CLI via `--include`/`--exclude`.
- `ritual-comando`: reduz ruído — só reporta "padrao-ausente" em arquivos com face de comandos (cli/commands/comandos/bot).
- `todo-comments`: passa a respeitar o escopo do scanner; mantém filtros de testes/specs e extensões.

### Corrigido

- Normalização de caminhos no Windows (POSIX interno) em scanner e matching de padrões.
- Supressão de falsos positivos de parsing em `node_modules` quando não aplicável; políticas alinhadas para evitar inundação de `PARSE_ERRO`.

### Removido

- Hardcodes de escopo (ex.: checks fixos por `src/` e block amplo de `node_modules`) dentro de analistas.

### Interno/Infra

- Documentação atualizada (README principal, docs de decisões, docs/README, src/analistas/README).
- CHECKLIST atualizado com data 2025-08-22 e itens concluídos da harmonização.
- Build/tsc estabilizado; smoke tests leves para `diagnosticar --json` e `--scan-only`.

---

## [0.1.0] - 2025-08-18

### Adicionado

- CLI inicial com comandos: `diagnosticar`, `guardian`, `podar`, `analistas`, `perf`.
- Biblioteca inicial de analistas (padrões de uso, funções longas, TODOs, estrutura, dependências).
- Guardian com baseline e diffs; saída `--json`.

### Infra

- CI: lint, typecheck, testes, cobertura e gates.
- Licenças e avisos de terceiros; scripts utilitários.

---