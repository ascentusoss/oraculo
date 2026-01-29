> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Scripts Abandonados (Legado)

> Movidos em 2025-09-09 para referência histórica. Não usados mais nos npm scripts.

## Lista de Scripts

### Scripts de Testes e Cobertura (2025-09-09)

- `test-smart.mjs` – heurística antiga de fallback para execução sequencial.
- `run-tests-sequential.mjs` – runner por diretório com merge incremental de cobertura.
- `coverage-summary.mjs` – sumarizador simplificado do `coverage-final.json`.
- `coverage-per-dir.mjs` – agregado de cobertura por domínio para inspeção manual.
- `coverage-priority.js` – ordena arquivos por menor % de linhas cobertas (ajuda a priorizar micro-testes).
- `debug-e2e-rewrite.(js|cjs)` – utilitário pontual para validar reescritas em ambiente temporário.
- `check-coverage-per-domain.mjs` – gate por domínio (descontinuado em 2025-09-09 para simplificar; mantido caso se queira reativar thresholds granulares).

### Scripts de Validação de Sistema (2025-09-14)

- `validacao-inteligencia.mjs` – Script complexo de validação automatizada (252 linhas) específico para validar melhorias do sistema inteligente
- `validacao-manual.mjs` – Validação manual de falsos positivos (144 linhas) para comparar antes/depois das melhorias
- `validacao-simples.mjs` – Script de validação simplificada (198 linhas) para testar funcionamento sem supressão
- `demonstracao-validacao.mjs` – Demonstração final (153 linhas) provando redução de 11→1 falso positivo

### Scripts de Transformação de Código (2025-09-14)

- `fix-test-imports.mjs` – Correção de imports relativos para `../../src/` (obsoleto, substituído por `rewrite-tests-to-aliases.mjs`)

### Scripts Migrados para src/ (2025-11-02)

Scripts funcionais que foram **migrados** para o código principal do Oráculo, com tipagem TypeScript e integração completa:

| Script Original               | Novo Local                                      | Funcionalidade                                              |
| ----------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| `scan-markdown.mjs`           | `src/analistas/detectores/detector-markdown.ts` | Detector de compliance em Markdown (licenças, proveniência) |
| `analisar-async-patterns.mjs` | `src/relatorios/analise-async-patterns.ts`      | Pós-processador de análise async/await                      |
| `fix-alias-imports.mjs`       | `src/zeladores/zelador-imports.ts`              | Correção automática de imports com aliases                  |
| `fix-tipos-imports.mjs`       | `src/zeladores/zelador-imports.ts`              | Unificado com fix-alias-imports                             |
| `perf-baseline.mjs`           | `src/cli/commands/comando-perf.ts`              | Já implementado de forma superior no CLI                    |

**Benefícios da Migração:**

- ✅ Tipagem TypeScript estrita
- ✅ Tipos centralizados em `src/tipos/`
- ✅ Integração com CLI do Oráculo
- ✅ Helpers centralizados (`lerEstado/salvarEstado`)
- ✅ Incluídos em build e testes

**Como Usar:**

```bash
# Detector Markdown
oraculo diagnosticar --include "*.md"

# Performance Baseline
oraculo perf baseline
oraculo perf compare

# Zelador de Imports (programático)
import { corrigirImports } from '/zelador-imports.js';
await corrigirImports(['src', 'tests']);
```

## Motivos da Descontinuação

### Primeira Onda (2025-09-09)

1. Redução de complexidade operacional (um único fluxo: `vitest run`).
2. Evitar divergência de lógica de cobertura/gates (apenas `check-coverage-final.js` fica ativo).
3. Menos scripts em hooks locais = menor tempo de manutenção.
4. Problemas de estabilidade no Windows mitigados com abordagem direta.

### Segunda Onda (2025-09-14)

1. **Scripts de Validação**: Específicos para validação de melhorias já concluídas (redução de falsos positivos). Substituídos por `resumo-validacao.mjs` mais conciso.
2. **Scripts de Fix**: `fix-test-imports.mjs` obsoleto em favor do `rewrite-tests-to-aliases.mjs` mais moderno que usa aliases `/`.

## Ideias Reaproveitáveis

- Merge incremental de cobertura (útil para cenários monorepo gigantes).
- Geração de ranking de arquivos mais críticos (`coverage-priority.js`).
- Gate progressivo por domínio com thresholds que só sobem (`check-coverage-per-domain.mjs`).
- Execução sequencial controlada para depuração de flakiness.

## Histórico

- 2025-09-09: Migração inicial dos runners custom e ferramentas auxiliares de cobertura / domínio para esta pasta.
- 2025-09-09: Gate de domínio removido do hook `pre-push`; script arquivado.

Nada aqui é carregado automaticamente — apenas consulta manual.
