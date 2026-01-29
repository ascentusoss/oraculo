> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Pasta `src/analistas`

Este diretório concentra as técnicas de análise ("analistas") executadas pelo Oráculo durante o comando `diagnosticar`.

## O que é um Analista?

- Um analista é uma função (ou objeto com metadados) que inspeciona arquivos e produz ocorrências.
- Implementa o contrato definido em `/types` (default: `src/types/`, configurável via `conventions.typesDirectory`).
- Não modifica arquivos (somente leitura). Correções vivem em `src/zeladores/`.

## Analistas Registrados (v0.3.0)

O registro central fica em `src/analistas/registry/registry.ts`. Categorias atuais:

### Detectores Core

| Analista                          | Descrição                                     |
| --------------------------------- | --------------------------------------------- |
| `detector-dependencias`           | Heurísticas de dependências e sinais de stack |
| `detector-estrutura`              | Extração de sinais estruturais globais        |
| `detector-arquitetura`            | Padrões arquiteturais (MVC, hexagonal, etc)   |
| `detector-codigo-fragil`          | Código propenso a bugs e difícil de manter    |
| `detector-construcoes-sintaticas` | Construções sintáticas problemáticas          |
| `detector-duplicacoes`            | Código duplicado que pode ser extraído        |
| `detector-tipos-inseguros`        | Uso de any/unknown com análise contextual     |
| `detector-interfaces-inline`      | Tipos inline que deveriam ser interfaces      |
| `detector-seguranca`              | Problemas de segurança e segredos hardcoded   |

### Analistas JS/TS

| Analista                  | Descrição                       |
| ------------------------- | ------------------------------- |
| `analista-funcoes-longas` | Funções extensas/complexas      |
| `analista-padroes-uso`    | Padrões de uso agregados        |
| `analista-comandos-cli`   | Boas práticas para comandos CLI |
| `analista-todo-comments`  | Comentários TODO pendentes      |

### Plugins Multi-linguagem

| Plugin                  | Linguagens/Frameworks      |
| ----------------------- | -------------------------- |
| `analista-react`        | Componentes React, padrões |
| `analista-react-hooks`  | Regras de hooks            |
| `analista-tailwind`     | Classes Tailwind           |
| `analista-css`          | CSS puro                   |
| `analista-css-in-js`    | styled-components, emotion |
| `analista-html`         | HTML semântico             |
| `analista-xml`          | Estrutura XML              |
| `analista-svg`          | Otimização de SVGs         |
| `analista-python`       | Análise heurística Python  |
| `detector-markdown`     | Documentação Markdown      |
| `detector-documentacao` | Qualidade de JSDoc/TSDoc   |

### Destaque: Sistema de Type Safety

O `detector-tipos-inseguros` é um dos analistas mais sofisticados, com:

- **Análise contextual inteligente** - categoriza automaticamente se uso de `unknown` é legítimo
- **Sistema de confiança** (0-100%) - casos com confiança ≥95% são pulados automaticamente
- **15+ padrões legítimos detectados** - type guards, catch blocks, serialização, etc
- **Sugestões contextuais** - recomendações específicas baseadas no uso
- **Auto-fix inteligente** - correções automáticas quando solicitado

Ver documentação completa: [Sistema de Type Safety](../../docs/arquitetura/TYPE-SAFETY.md)

Observação: a detecção de arquétipos (biblioteca de estruturas) é orquestrada pelo CLI via `detector-arquetipos.ts` e não faz parte do array de técnicas, pois consolida sinais de múltiplos arquivos e gera `planoSugestao`.

Escopo de arquivos: os analistas respeitam exatamente o conjunto de arquivos fornecido pelo scanner/CLI conforme `--include`/`--exclude`. Evite impor filtros rígidos de caminho dentro do `test()`; prefira apenas filtrar por extensões, ignorar testes/specs e auto-exclusões, delegando o escopo ao scanner.

## Arquivos típicos nesta pasta

- `*-test.ts` e `*.extra.test.ts`: testes do analista (contrato, branches e exemplos extra)
- `registry.ts`: ponto único de registro das técnicas executadas
- `operario-estrutura.ts`: orquestra planejamento/aplicação de reestruturações de pasta

## Convenções e boas práticas

- ESM puro (imports/exports), sem `require`.
- Tipos importados de `/types` (default: `src/types/`, configurável via `conventions.typesDirectory`); evite duplicar contratos.
- Preferir funções puras; efeitos colaterais devem ser documentados e isolados.
- Logs: use o `log` central. Para molduras, gere o bloco com `log.bloco`/`imprimirBloco` (não prefixe com `log.info`).
- Persistência: nunca use `fs.*` direto — utilize `lerEstado`/`salvarEstado` de `/persistence/persistencia.js`.

### Nota sobre testes e mocks

- Ao escrever testes com Vitest, evite fábricas de `vi.mock` que façam throws síncronos ou dependam de variáveis de runtime (TDZ). Use fábricas hoisted-safe (retorne exports simples) ou a forma `async (importOriginal) => ({ ... })` quando for necessário usar `importOriginal`.
- Se encontrar mocks que falham no import, verifique `tests/` para padrões de `vi.mock('../analistas/registry.js', ...)` — alguns testes do projeto foram adaptados para garantir compatibilidade com o runner.

## Executando e listando analistas

- Listar catálogo atual e exportar documentação:
  - `node dist/bin/index.js analistas --json`
  - `node dist/bin/index.js analistas --doc docs/ANALISTAS.md`
- Para depuração rápida durante o diagnóstico:
  - `node dist/bin/index.js diagnosticar --listar-analistas`

## Evolução

- Novos analistas devem ser adicionados ao `registroAnalistas` e cobertos por ao menos dois testes (`.test.ts` e `.extra.test.ts`).
- Caso precise de execução global (sem por-arquivo), avalie marcar o analista como global e validar o contrato no `executor`.
- Se um analista crescer muito, extraia helpers em `src/shared/` para reuso e testabilidade.
