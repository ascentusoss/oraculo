Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).

# Análise de Discrepâncias - Documentação vs Código Real

## Versão do Projeto

**Código Real (package.json):** 0.3.5
**Documentação:**

- README.md: 0.3.5
- docs/README.md: 0.3.5
- CHANGELOG.md: 0.3.4 (última entrada)

## Node.js Requirements

**Código Real (package.json):** >=25.0.0
**Documentação:**

- README.md: >=25.0.0
- docs/README.md: >=25.0.0

## Comandos CLI

**Comandos Reais (src/cli/comandos.ts):**

1. diagnosticar
2. guardian
3. formatar
4. otimizar-svg
5. podar
6. reestruturar
7. atualizar
8. analistas
9. metricas
10. fix-types
11. reverter
12. perf

**Documentação README.md (linha 504-517):**

- diagnosticar ✓
- guardian ✓
- podar ✓
- reestruturar ✓
- formatar ✓
- fix-types ✓
- analistas ✓
- metricas ✓
- perf ✓
- otimizar-svg ✓
- atualizar ✓
- reverter ✓

## Analistas Disponíveis

**Total de arquivos de analistas:** 67 arquivos TypeScript

**Categorias Principais:**

1. Arquitetos (5 arquivos)
2. Corrections (23 arquivos)
3. Detectores (13 arquivos)
4. Estrategistas (3 arquivos)
5. JS/TS (6 arquivos)
6. Plugins (16 arquivos)
7. Pontuadores (1 arquivo)

**Analistas Específicos Identificados:**

- detector-arquetipos
- detector-arquitetura
- detector-codigo-fragil
- detector-construcoes-sintaticas
- detector-contexto-inteligente
- detector-dependencias
- detector-duplicacoes
- detector-estrutura
- detector-fantasmas
- detector-interfaces-inline
- detector-performance
- detector-seguranca
- detector-tipos-inseguros
- analista-css
- analista-css-in-js
- analista-html
- analista-python
- analista-react
- analista-react-hooks
- analista-svg
- analista-tailwind
- analista-xml
- detector-documentacao
- detector-markdown
- detector-node
- detector-qualidade-testes
- analista-comandos-cli
- analista-funcoes-longas
- analista-padroes-uso
- analista-todo-comments

## Estrutura do Projeto

**Diretórios Principais no src/:**

- analistas/
  - arquitetos/
  - corrections/
  - detectores/
  - estrategistas/
  - js-ts/
  - plugins/
  - pontuadores/
  - registry/
- bin/
- cli/
  - commands/
  - diagnostico/
  - handlers/
  - helpers/
  - options/
  - processing/
- core/
  - config/
  - execution/
  - messages/
  - parsing/
  - registry/
  - schema/
  - utils/
  - workers/
- guardian/
- relatorios/
- shared/
  - data-processing/
  - helpers/
  - impar/
  - persistence/
  - plugins/
  - validation/
- types/
- zeladores/

## Scripts npm Disponíveis

**Scripts de Build:**

- prebuild, build, postbuild, prepare

**Scripts de Execução:**

- start, diagnosticar, formatar, diagnosticar:json, reestruturar, podar, fix-types, guardian

**Scripts de Qualidade:**

- typecheck, lint, format, format:fix, check:style

**Scripts de Testes:**

- test, test:ci, test:analistas, test:arquitetos, test:guardian, test:cli, test:nucleo, test:relatorios, test:tipos, test:zeladores, test:raiz, test:e2e

**Scripts de Cobertura:**

- coverage, coverage:gate, check

**Scripts de Performance:**

- perf:baseline, perf:compare, perf:gate

**Scripts de Manutenção:**

- sync-aliases, validate-aliases, licenses:_, headers:spdx, branch:protect_, md:_, security:_, cleanup:metricas, tests:aliases\*

## Discrepâncias Principais

1. **Versão sincronizada (resolvido):** Documentação atualizada para 0.3.4
2. **Requisitos Node.js atualizados (resolvido):** Guias atualizados para >=25.0.0
3. **CHANGELOG incompleto:** Não há entradas para 0.3.1, 0.3.2, 0.3.3, 0.3.4
4. **Tabela de analistas no README:** Lista apenas 20 analistas, mas existem mais de 30 implementados
5. **Descrição de funcionalidades:** Algumas features mencionadas podem não estar completas ou testadas
6. **Links de badges:** URLs podem estar incorretas (ossmoralus vs i-lopos)

## Próximos Passos

1. Atualizar versão em todos os documentos para 0.3.4 (concluído)
2. Corrigir requisitos do Node.js (concluído)
3. Adicionar entradas faltantes no CHANGELOG
4. Atualizar tabela de analistas com lista completa
5. Revisar e validar descrições de funcionalidades
6. Verificar e corrigir URLs dos badges
7. Atualizar documentação de configuração se necessário
