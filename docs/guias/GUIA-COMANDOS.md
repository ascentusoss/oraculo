# 📚 Guia Completo de Comandos do Oráculo

> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Última atualização: 15 de janeiro de 2026

## 🎯 Visão Geral

O Oráculo oferece diversos comandos para análise, diagnóstico e manutenção de projetos. Este guia detalha cada comando, suas opções e casos de uso.

**Requisitos:** Node.js >=25.0.0

## 📋 Índice de Comandos

1. [diagnosticar](#diagnosticar) - Análise completa do projeto
2. [guardian](#guardian) - Verificação de integridade
3. [podar](#podar) - Remoção de arquivos órfãos
4. [reestruturar](#reestruturar) - Reorganização de estrutura
5. [formatar](#formatar) - Formatação de código
6. [fix-types](#fix-types) - Correção de tipos inseguros
7. [metricas](#metricas) - Visualização de métricas
8. [perf](#perf) - Análise de performance
9. [analistas](#analistas) - Catálogo de analistas
10. [otimizar-svg](#otimizar-svg) - Otimização de SVGs
11. [atualizar](#atualizar) - Atualização segura
12. [reverter](#reverter) - Reversão de mudanças

---

## diagnosticar

Comando principal para análise completa do projeto.

### Uso Básico

```bash
oraculo diagnosticar
```

Durante a execução, o Oráculo exibe um indicador visual “🔎 Diagnóstico em execução...” para sinalizar processamento.

### Opções Principais

#### Modos de Execução

```bash
# Modo detalhado (mais informações)
oraculo diagnosticar --full

# Modo compacto (padrão): consolida progresso e mostra o essencial
oraculo diagnosticar --compact

# Modo executivo: apenas problemas críticos/alta prioridade
oraculo diagnosticar --executive

# Apenas varredura (não prepara AST, sem análise completa)
oraculo diagnosticar --scan-only
```

#### Formatos de Saída

```bash
# Saída JSON para ferramentas/automação
oraculo diagnosticar --json

# Exportar resumo/manifest
oraculo diagnosticar --export

# Exportar dump completo (fragmentado em shards)
oraculo diagnosticar --export-full

# JSON ASCII (compat legada)
oraculo diagnosticar --json-ascii
```

#### Filtros

```bash
# Incluir padrões
oraculo diagnosticar --include "src/**" --include "scripts/**"

# Excluir padrões
oraculo diagnosticar --exclude "**/*.test.*" --exclude "**/__tests__/**"

# Excluir testes rapidamente
oraculo diagnosticar --exclude-tests
```

#### Auto-Fix

```bash
# Ativar auto-fix
oraculo diagnosticar --auto-fix

# Modo conservador / agressivo / equilibrado
oraculo diagnosticar --auto-fix-mode conservative
oraculo diagnosticar --auto-fix-mode aggressive
oraculo diagnosticar --auto-fix-mode balanced

# Atalhos
oraculo diagnosticar --fix            # alias de --auto-fix
oraculo diagnosticar --fix-safe       # alias de --auto-fix --auto-fix-mode conservative

# Dry-run (preview sem modificar)
ORACULO_ALLOW_MUTATE_FS=1 oraculo diagnosticar --auto-fix --dry-run
```

#### Timeout e Performance

```bash
# Modo rápido (menos checks)
oraculo diagnosticar --fast

# Confiar no compilador (reduz falsos positivos comuns)
oraculo diagnosticar --trust-compiler

# Verificar ciclos com heurística extra
oraculo diagnosticar --verify-cycles

# Ajustes de timeout via ambiente (por analista)
ORACULO_ANALISE_TIMEOUT_POR_ANALISTA_MS=60000 oraculo diagnosticar
```

### Exemplos de Uso

```bash
# Padrão compacto com resumo útil
oraculo diagnosticar --compact

# Detalhado (inclui amostra maior e blocos completos)
oraculo diagnosticar --full

# Para CI/CD estruturado
oraculo diagnosticar --json --export

# Correção automática segura
ORACULO_ALLOW_MUTATE_FS=1 oraculo diagnosticar --fix-safe --dry-run
```

---

## guardian

Verificação de integridade dos arquivos via hashes.

### Uso Básico

```bash
# Criar baseline inicial
oraculo guardian

# Verificar alterações
oraculo guardian --diff
```

### Opções

```bash
# Saída JSON
oraculo guardian --json

# Modo verbose
oraculo guardian --verbose

# Aceitar alterações como novo baseline
oraculo guardian --accept

# Forçar recriação do baseline
oraculo guardian --force
```

### Status de Retorno

- `ok` - Nenhuma alteração detectada
- `baseline-criado` - Baseline criado pela primeira vez
- `baseline-aceito` - Alterações aceitas como novo baseline
- `alteracoes-detectadas` - Arquivos modificados detectados
- `erro` - Erro durante verificação

### Exemplos

```bash
# Verificação rápida no CI
oraculo guardian --diff --json

# Criar baseline após mudanças válidas
oraculo guardian --accept

# Debug detalhado
oraculo guardian --diff --verbose
```

---

## podar

Remoção segura de arquivos órfãos (não referenciados).

### Uso Básico

```bash
# Dry-run (preview sem remover)
oraculo podar --dry-run

# Remoção efetiva
oraculo podar
```

### Opções

```bash
# Modo interativo (confirma cada arquivo)
oraculo podar --interactive

# Saída JSON
oraculo podar --json

# Verbose (mostrar análise detalhada)
oraculo podar --verbose
```

### Exemplos

```bash
# Análise de arquivos órfãos
oraculo podar --dry-run --verbose

# Limpeza automática
oraculo podar --json

# Limpeza com confirmação
oraculo podar --interactive
```

---

## metricas

Visualização de métricas e histórico agregado.

### Uso Básico

```bash
# Exibir métricas atuais
oraculo metricas

# Formato JSON
oraculo metricas --json
```

### Opções

```bash
# Exibir histórico
oraculo metricas --history

# Comparar com período anterior
oraculo metricas --compare

# Exportar para arquivo
oraculo metricas --export metricas.json
```

### Exemplos

```bash
# Dashboard de métricas
oraculo metricas --verbose

# Análise de tendências
oraculo metricas --history --json

# Comparação temporal
oraculo metricas --compare --full
```

---

## perf

Análise de performance e comparação de snapshots.

### Uso Básico

```bash
# Criar snapshot de performance
oraculo perf snapshot

# Comparar snapshots
oraculo perf compare
```

### Opções

```bash
# Comparar com baseline
oraculo perf compare --baseline

# Saída JSON
oraculo perf --json

# Limites personalizados
oraculo perf compare --threshold 10
```

### Exemplos

```bash
# Benchmark antes de mudanças
oraculo perf snapshot --name "antes-refactor"

# Benchmark depois e comparar
oraculo perf snapshot --name "depois-refactor"
oraculo perf compare antes-refactor depois-refactor

# Análise de regressão no CI
oraculo perf compare --baseline --json
```

---

## analistas

Listar e documentar analistas disponíveis.

### Uso Básico

```bash
# Listar todos os analistas
oraculo analistas

# Formato JSON
oraculo analistas --json
```

### Opções

```bash
# Gerar documentação
oraculo analistas --doc docs/ANALISTAS.md

# Mostrar apenas ativos
oraculo analistas --active-only

# Incluir metadados
oraculo analistas --full
```

### Exemplos

```bash
# Catálogo completo
oraculo analistas --full --json

# Documentação automática
oraculo analistas --doc docs/ANALISTAS-GERADO.md

# Debug de analistas
oraculo diagnosticar --listar-analistas
```

---

## fix-types

Correção interativa de tipos inseguros (any/unknown).

### Uso Básico

```bash
# Modo interativo
oraculo fix-types --interactive

# Auto-fix conservador
oraculo fix-types --auto-fix --auto-fix-mode conservative
```

### Opções

```bash
# Mostrar diff antes de aplicar
oraculo fix-types --show-diff

# Dry-run
oraculo fix-types --dry-run

# Validar sintaxe após correção
oraculo fix-types --validate-only

# Focar em tipo específico
oraculo fix-types --tipo any
oraculo fix-types --tipo unknown
```

### Exemplos

```bash
# Correção segura e interativa
oraculo fix-types --interactive --show-diff

# Correção automática de 'any'
oraculo fix-types --tipo any --auto-fix --dry-run

# Validação pós-correção
oraculo fix-types --validate-only
```

---

## reestruturar

Reorganização de estrutura do projeto com plano de moves.

### Uso Básico

```bash
# Ver plano sem aplicar
oraculo reestruturar --somente-plano

# Aplicar reestruturação
oraculo reestruturar --auto
```

### Opções

```bash
# Organização por domains
oraculo reestruturar --domains

# Organização flat
oraculo reestruturar --flat

# Usar preset específico
oraculo reestruturar --preset oraculo
oraculo reestruturar --preset node-community
oraculo reestruturar --preset ts-lib

# Override de categoria
oraculo reestruturar --categoria controller=handlers

# Filtros
oraculo reestruturar --include "src/**" --exclude "**/*.test.*"
```

### Exemplos

```bash
# Preview de reestruturação
oraculo reestruturar --somente-plano --verbose

# Aplicar com preset
oraculo reestruturar --preset oraculo --auto

# Reestruturar apenas uma pasta
oraculo reestruturar --include "src/old-module/**" --auto
```

---

## formatar

Aplica formatação de código com Prettier ou motor interno.

### Uso Básico

```bash
# Verificar formatação
oraculo formatar --check

# Aplicar formatação
oraculo formatar --write
```

### Opções

```bash
# Escolher motor
oraculo formatar --engine auto      # padrão (tenta Prettier, fallback interno)
oraculo formatar --engine prettier  # força Prettier
oraculo formatar --engine interno   # usa motor interno

# Filtros de arquivos
oraculo formatar --include "src/**/*.ts"
oraculo formatar --exclude "**/*.generated.*"
```

### Arquivos Suportados

- JavaScript/TypeScript: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`
- Markup: `.html`, `.xml`
- Estilos: `.css`
- Dados: `.json`, `.yaml`, `.yml`
- Documentação: `.md`, `.markdown`
- Outros: `.py`, `.php`

### Exemplos

```bash
# Verificar tudo antes de commit
oraculo formatar --check

# Formatar apenas arquivos TypeScript
oraculo formatar --write --include "**/*.ts"

# CI: verificar formatação
oraculo formatar --check || exit 1
```

---

## otimizar-svg

Otimiza arquivos SVG usando otimizador interno (compatível com svgo).

### Uso Básico

```bash
# Preview sem modificar
oraculo otimizar-svg --dry

# Aplicar otimizações
oraculo otimizar-svg --write
```

### Opções

```bash
# Diretório específico
oraculo otimizar-svg --dir assets/icons

# Filtros
oraculo otimizar-svg --include "**/*.svg"
oraculo otimizar-svg --exclude "**/node_modules/**"
```

### Exemplos

```bash
# Analisar potencial de otimização
oraculo otimizar-svg --dry --verbose

# Otimizar pasta de ícones
oraculo otimizar-svg --dir src/assets/icons --write

# Otimizar SVGs específicos
oraculo otimizar-svg --include "public/**/*.svg" --write
```

---

## atualizar

Atualiza o Oráculo com verificação de integridade prévia via Guardian.

### Uso Básico

```bash
# Atualização local
oraculo atualizar

# Atualização global
oraculo atualizar --global
```

### Fluxo de Execução

1. Executa análise do projeto
2. Verifica integridade via Guardian
3. Se OK, executa `npm install oraculo@latest`
4. Reporta sucesso/falha

### Exemplos

```bash
# Atualização segura
oraculo atualizar

# Se Guardian detectar alterações, primeiro aceite:
oraculo guardian --diff
oraculo guardian --accept-baseline
oraculo atualizar
```

---

## reverter

Gerencia o mapa de reversão para operações de reestruturação.

### Subcomandos

```bash
# Listar todos os moves registrados
oraculo reverter listar

# Reverter arquivo específico
oraculo reverter arquivo <caminho>

# Reverter move por ID
oraculo reverter move <id>

# Limpar histórico de reversão
oraculo reverter limpar
oraculo reverter limpar --force
```

### Exemplos

```bash
# Ver histórico de moves
oraculo reverter listar

# Reverter um arquivo movido
oraculo reverter arquivo src/new-location/file.ts

# Reverter move específico
oraculo reverter move abc123def

# Limpar tudo (cuidado!)
oraculo reverter limpar --force
```

---

## histórico

Utilitários globais para gerenciar o histórico de interações do Oráculo.

### Flags

```bash
oraculo --historico         # Exibe resumo do histórico
oraculo --limpar-historico  # Limpa o histórico persistido
```

O histórico é persistido em `~/.oraculo/history.json`. Cada execução do CLI registra os argumentos usados.

## 🌍 Variáveis de Ambiente Globais

Aplicam-se a todos os comandos:

```bash
# Performance
export WORKER_POOL_MAX_WORKERS=4
export WORKER_POOL_BATCH_SIZE=10
export WORKER_POOL_TIMEOUT_MS=30000

# Logs
export LOG_ESTRUTURADO=true
export REPORT_SILENCE_LOGS=true
export LOG_LEVEL=info

# Segurança
export SAFE_MODE=true
export ALLOW_PLUGINS=false
export ALLOW_EXEC=false

# Pontuação
export PONTUACAO_MODO=conservador
export PONTUACAO_FATOR_ESCALA=2.0
```

---

## 🎯 Workflows Comuns

### Workflow de Desenvolvimento

```bash
# 1. Análise inicial
oraculo diagnosticar --verbose

# 2. Correção de tipos
oraculo fix-types --interactive

# 3. Verificação de integridade
oraculo guardian --diff

# 4. Limpeza de órfãos
oraculo podar --dry-run
oraculo podar

# 5. Análise final
oraculo diagnosticar --full --export relatorio-final.md
```

### Workflow de CI/CD

```bash
# 1. Build e análise
npm run build
oraculo diagnosticar --json --silence > diagnostico.json

# 2. Verificação de integridade
oraculo guardian --diff --json > guardian.json

# 3. Métricas
oraculo metricas --json > metricas.json

# 4. Análise de performance
oraculo perf compare --baseline --json > perf.json
```

### Workflow de Refatoração

```bash
# 1. Snapshot antes
oraculo perf snapshot --name "antes-refactor"
oraculo guardian

# 2. Fazer mudanças...

# 3. Análise após mudanças
oraculo diagnosticar --full
oraculo guardian --diff

# 4. Performance comparison
oraculo perf compare antes-refactor --json

# 5. Aceitar se OK
oraculo guardian --accept
```

---

## 🔧 Troubleshooting

### Erro: "Comando não encontrado"

```bash
# Recompilar
npm run build

# Usar caminho completo
node dist/bin/index.js diagnosticar

# Instalar globalmente
npm install -g .
```

### Erro: "Timeout de análise"

```bash
# Aumentar timeout
oraculo diagnosticar --timeout 120

# Via variável
export ORACULO_ANALISE_TIMEOUT_POR_ANALISTA_MS=120000
oraculo diagnosticar
```

### Performance Lenta

```bash
# Reduzir workers
export WORKER_POOL_MAX_WORKERS=1
oraculo diagnosticar

# Restringir escopo
oraculo diagnosticar --include "src/**" --exclude "**/*.test.*"
```

---

## 📖 Referências

- [README Principal](../README.md)
- [Sistema de Type Safety](TYPE-SAFETY-SYSTEM.md)
- [Filtros Include/Exclude](GUIA_FILTROS_ORACULO.md)
- [Configuração Local](CONFIGURAR-ORACULO-LOCAL.md)

---

**Última atualização:** 15 de janeiro de 2026
**Versão:** 0.3.0
