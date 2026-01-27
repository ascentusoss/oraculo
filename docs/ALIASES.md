Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).

Arquivo gerado/atualizado automaticamente via `scripts/add-disclaimer-md.js`.

# Sistema de Aliases do Oráculo

> **ARQUIVO GERADO AUTOMATICAMENTE**  
> Use `npm run sync-aliases` para atualizar

## Visão Geral

O Oráculo utiliza um sistema centralizado de aliases TypeScript para simplificar imports e manter consistência em todo o projeto.

## Aliases Disponíveis

## Como Usar

### Em Arquivos TypeScript

```typescript
// ✅ Correto - usar aliases
import { executar } from "@nucleo/executor";
import { analisarPadroes } from "@analistas/javascript-typescript/analista-padroes-uso";
import { salvarEstado } from "@shared/persistence/persistencia";

// ❌ Incorreto - imports relativos longos
import { executar } from "../../../nucleo/executor";
```

### Em Testes

```typescript
// ✅ Correto - mesmos aliases funcionam nos testes
import { describe, it, expect } from "vitest";
import { JavaPlugin } from "@shared/plugins/java/java-plugin";
```

## Configuração Automática

O sistema sincroniza automaticamente:

- ✅ `src/tsconfig.json` - Paths para desenvolvimento
- ✅ `tsconfig.eslint.json` - Paths para ESLint
- ✅ `src/node.loader.mjs` - Loader ESM para src/
- ✅ `tests/node.loader.mjs` - Loader ESM para testes
- ✅ `vitest.config.ts` - Aliases para Vitest

## Adicionando Novos Aliases

1. Edite `src/shared/alias-config.ts`
2. Execute `npm run sync-aliases`
3. Os arquivos de configuração serão atualizados automaticamente

### Exemplo:

```typescript
// Em src/shared/alias-config.ts
export const ALIASES: AliasConfig[] = [
  // ...aliases existentes...
  {
    alias: "@novo-modulo/",
    srcPath: "novo-modulo/",
    description: "Descrição do novo módulo",
  },
];
```

## Scripts Disponíveis

- `npm run sync-aliases` - Sincronizar configuração de aliases
- `npm run validate-aliases` - Validar consistência dos aliases

## Troubleshooting

### Erro "Cannot resolve module"

1. Verifique se executou `npm run sync-aliases`
2. Reinicie o TypeScript server (VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server")
3. Verifique se o alias está definido em `alias-config.ts`

### Imports não funcionam em testes

1. Certifique-se de que `tests/node.loader.mjs` foi atualizado
2. Execute testes com `--loader` flag se necessário
3. Verifique se `TESTS_LOADER_BASE` está configurado corretamente
