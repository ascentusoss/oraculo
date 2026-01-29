> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).

# Sistema de Mensagens Centralizado do Oráculo

Este diretório centraliza **TODAS** as mensagens, logs, ícones e sugestões do Oráculo.

## Arquitetura

1. **`ui/icons.ts`** - Ícones/tokens centralizados (sem emojis hard-coded)
2. **`ui/sugestoes-contextuais-messages.ts`** - Sugestões contextuais por comando
3. **`core/*-messages.ts`** - Mensagens core (fix-types, diagnóstico, etc.)
4. **`cli/*-messages.ts`** - Mensagens específicas por comando/handler CLI
5. **`log/*`** - Engine + helpers de logging adaptativo
6. **`relatorios/*`** - Mensagens/geradores de relatórios

## Sistema de Ícones

### Categorias Disponíveis

```typescript
import {
  ICONES_ACAO,
  ICONES_ARQUIVO,
  ICONES_COMANDO,
  ICONES_DIAGNOSTICO,
  ICONES_FEEDBACK,
  ICONES_NIVEL,
  ICONES_RELATORIO,
  ICONES_STATUS,
  ICONES_TIPOS,
} from "/messages";

// Exemplos (tokens/prefixos, sem emojis hard-coded)
ICONES_STATUS.ok; // [OK]
ICONES_STATUS.falha; // [FALHA]
ICONES_ACAO.analise; // [SCAN]
ICONES_COMANDO.fixTypes; // [FIX]
ICONES_ARQUIVO.diretorio; // [DIR]
ICONES_NIVEL.aviso; // (pode ter cor ANSI)
ICONES_TIPOS.any; // (pode ter cor ANSI)
ICONES_RELATORIO.resumo; // [SUMMARY]
ICONES_FEEDBACK.dica; // [DICA]
ICONES_DIAGNOSTICO.stats; // [STATS]
```

## Sistema de Sugestões

### Geração Contextual

```typescript
import { gerarSugestoesContextuais, formatarSugestoes } from "/messages";

const sugestoes = gerarSugestoesContextuais({
  comando: "diagnosticar",
  temProblemas: true,
  temErrosCriticos: false,
  arquivoExportado: "relatorio.json",
});

const formatted = formatarSugestoes(sugestoes, "Próximos Passos");
console.log(formatted);
```

### Sugestões por Comando

- **SUGESTOES_COMANDOS** - Dicas gerais de uso
- **SUGESTOES_DIAGNOSTICO** - Específicas para diagnóstico
- **SUGESTOES_AUTOFIX** - Segurança ao usar auto-fix
- **SUGESTOES_ARQUETIPOS** - Detecção de estrutura

## Mensagens de Correções

```typescript
import {
  MENSAGENS_FIX_TYPES,
  MENSAGENS_AUTOFIX,
  MENSAGENS_RELATORIOS_ANALISE,
} from "/messages";

// Fix-types
console.log(MENSAGENS_FIX_TYPES.MENSAGENS_INICIO.titulo);

// Auto-fix geral
console.log(MENSAGENS_AUTOFIX.inicio.scan);
```

## Sistema de Logging

### Log Engine (Adaptativo)

O log-engine ajusta verbosidade baseado no contexto:

```typescript
import { logEngine } from "/messages";

// Contextos: 'simples' | 'medio' | 'complexo' | 'ci'
logEngine.setContexto("medio");

logEngine.info("diagnostico.scan", {
  arquivos: 100,
  diretorios: 20,
});
// Output: [19:30:45] [SCAN] Varredura iniciada: 100 arquivos em 20 diretórios
```

### API de Log Padrão

```typescript
import { log } from "/messages";

// Níveis básicos
log.info("Mensagem informativa");
log.sucesso("Operação concluída!");
log.aviso("Atenção necessária");
log.erro("Erro crítico");

// Variantes especiais
log.infoSemSanitizar("Preserva tokens");
log.infoDestaque("Texto destacado");

// Blocos formatados
log.bloco("Título", ["Linha 1", "Linha 2"], { cor: chalk.cyan });

// Passos numerados
log.passo(1, "Primeiro passo");
log.passo(2, "Segundo passo");
```

## Uso Rápido

```typescript
import { ICONES_DIAGNOSTICO, ICONES_STATUS, log } from "/messages";

// Prefixos/tokens
log.info(`${ICONES_DIAGNOSTICO.inicio} Analisando...`);
log.sucesso(`${ICONES_STATUS.ok} Concluído!`);

// Sugestões contextuais
const dicas = gerarSugestoesContextuais({
  comando: "diagnosticar",
  temProblemas: true,
});
console.log(formatarSugestoes(dicas));

// Logging estruturado
logEngine.info("diagnostico.completo", {
  problemas: 42,
  tempo: "2.5s",
});
```

## Melhorias Recentes (Nov 2025)

### Consolidação de Mensagens

- Removidas duplicações (MENSAGENS_AUTOFIX unificado)
- 15+ arquivos migrados para sistema centralizado
- ~840 linhas de mensagens organizadas

### Sistema de Ícones Refinado

- 9 categorias bem definidas
- Suporte a modo ASCII para CI/CD
- Uso consistente de tokens (sem emojis hard-coded)

### Log Engine Otimizado

- Removido ícone duplicado no timestamp
- Mensagens já incluem ícones específicos
- Output mais limpo: `[19:30:45] [SCAN] Mensagem` (um prefixo por linha)

## Integração com Outros Sistemas

### Type Safety

```typescript
import { MENSAGENS_FIX_TYPES } from "/messages";

// Mensagens específicas para correção de tipos
console.log(MENSAGENS_FIX_TYPES.anyToProper.analise);
console.log(MENSAGENS_FIX_TYPES.unknownToSpecific.sugestao);
```

### Diagnóstico

```typescript
import { MENSAGENS_DIAGNOSTICO } from "/messages";

console.log(MENSAGENS_DIAGNOSTICO.modos.compact);
// Exemplo de output: "[i] Diagnóstico (modo compacto)"
```

### Guardian

```typescript
import { MENSAGENS_GUARDIAN } from "/messages";

console.log(MENSAGENS_GUARDIAN.baseline.criado);
// Exemplo de output: "[OK] Baseline criado com sucesso"
```

## Documentação Relacionada

- [Sistema de Type Safety](../../../docs/TYPE-SAFETY-SYSTEM.md)
- [Guia de Comandos](../../../docs/GUIA_COMANDOS.md)
- [README Principal](../../../README.md)

---

**Última atualização:** 29 de novembro de 2025
**Versão:** 1.0.0
