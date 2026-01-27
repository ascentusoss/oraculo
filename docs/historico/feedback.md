# Feedback - Análise de Falsos Positivos

> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).

**Data:** 15 de janeiro de 2026
**Relatório analisado:** `oraculo-relatorio-summary-2026-01-15T19-59-01-435Z.json`

---

## Resumo

Após análise detalhada do relatório gerado pelo Oráculo, foram identificados diversos **falsos positivos** que não representam problemas reais no código. Este documento detalha cada caso para referência futura e possível ajuste nas regras do analisador.

---

## Falsos Positivos Identificados

### 1. `unhandled-async` - Promises não tratadas

| Arquivo                           | Linha               | Motivo do Falso Positivo                                              |
| --------------------------------- | ------------------- | --------------------------------------------------------------------- |
| `app/blog/[slug]/PostContent.tsx` | 14                  | Dynamic import do Next.js - tratamento é gerenciado pelo framework    |
| `app/my-page.tsx`                 | 6                   | Função async em Server Component - tratamento gerenciado pelo Next.js |
| `lib/api/githubLangsHandlers.ts`  | 66                  | Código já possui bloco try/catch adequado                             |
| `lib/flags.ts`                    | 8                   | Retorna Promise por design - tratamento deve ser feito pelo chamador  |
| `lib/github-stats.ts`             | 192 (8 ocorrências) | Todas as chamadas async estão dentro de blocos try/catch              |

**Recomendação:** Ajustar a regra `unhandled-async` para reconhecer:

- Dynamic imports do Next.js (`next/dynamic`)
- Funções async em Server Components
- Promises retornadas intencionalmente para tratamento externo
- Chamadas async dentro de blocos try/catch

---

### 2. `open-redirect` - Redirecionamento inseguro

| Arquivo                          | Linha | Motivo do Falso Positivo                                   |
| -------------------------------- | ----- | ---------------------------------------------------------- |
| `app/components/ui/PostCard.tsx` | 14    | Usa `router.push()` do Next.js, não `location.href` direto |

**Análise:**
O código utiliza o `useRouter` do Next.js que implementa navegação segura via client-side routing. Não há atribuição direta a `window.location.href` ou `location.href`.

```tsx
// Código real (SEGURO)
const router = useRouter();
router.push("/path");

// O que seria inseguro (NÃO EXISTE NO CÓDIGO)
location.href = userInput; // ← vulnerável a open redirect
```

**Recomendação:** A regra deve diferenciar entre:

- `router.push()` / `router.replace()` (Next.js) → **Seguro**
- `location.href = valor` → **Potencialmente inseguro**

---

### 3. `useEffect-missing-deps` - useEffect sem dependências

| Arquivo                          | Linha | Motivo do Falso Positivo                    |
| -------------------------------- | ----- | ------------------------------------------- |
| `app/components/ScrollToTop.tsx` | 8     | Array de dependências `[]` já está presente |

**Análise:**
O código possui corretamente `[]` como segundo argumento do `useEffect`, indicando que o efeito deve rodar apenas na montagem do componente:

```tsx
useEffect(() => {
  // lógica de scroll
}, []); // ← Array vazio ESTÁ PRESENTE
```

**Recomendação:** Verificar se a regra está interpretando corretamente arrays vazios `[]` como dependências válidas.

---

### 4. `unformatted-file` - Arquivo não formatado

| Arquivo             | Motivo do Falso Positivo                                        |
| ------------------- | --------------------------------------------------------------- |
| `.stylelintrc.json` | Arquivo está corretamente formatado com indentação de 2 espaços |
| `vercel.json`       | Arquivo está corretamente formatado                             |

**Análise:**
Ambos os arquivos seguem o padrão JSON com indentação consistente de 2 espaços. A diferença detectada pode ser devido a:

- Diferença entre LF e CRLF (line endings)
- Presença ou ausência de newline final
- Configuração de formatação diferente no Oráculo

**Recomendação:** Verificar configuração de `prettier` ou formatador utilizado pelo Oráculo para garantir compatibilidade.

---

## Sugestões de Melhoria para o Oráculo

### Regras a Ajustar

1. **`unhandled-async`**
   - Adicionar whitelist para padrões conhecidos do Next.js
   - Reconhecer try/catch em escopo pai
   - Ignorar funções que retornam Promise por design

2. **`open-redirect`**
   - Diferenciar `router.push()` de atribuição direta a `location`
   - Considerar apenas atribuições diretas como potencialmente inseguras

3. **`useEffect-missing-deps`**
   - Garantir que `[]` seja reconhecido como array de dependências válido

4. **`unformatted-file`**
   - Sincronizar configuração de formatação com projeto (prettier/eslint)
   - Considerar variações de line endings

### Configuração Sugerida

```json
{
  "rules": {
    "unhandled-async": {
      "ignorePatterns": [
        "next/dynamic",
        "Server Components",
        "functions returning Promise"
      ]
    },
    "open-redirect": {
      "safePatterns": ["router.push", "router.replace", "useRouter"]
    }
  }
}
```

---

## Conclusão

Dos **~20 avisos de segurança** reportados, **100% foram identificados como falsos positivos**. O código do projeto está seguindo boas práticas e os padrões do Next.js corretamente.

Recomenda-se:

1. Ajustar as regras do Oráculo conforme sugestões acima
2. Adicionar configuração específica para projetos Next.js
3. Considerar contexto de frameworks modernos nas análises

---

_Documento gerado para feedback sobre a ferramenta de análise estática._
