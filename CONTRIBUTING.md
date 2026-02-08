> **Proveniência e Autoria**: Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# 🤝 Guia de Contribuição para o Projeto Oráculo

**Agradecemos seu interesse em contribuir para o Oráculo!** 🎉

O Oráculo é uma ferramenta de análise de código estático desenvolvida para ajudar desenvolvedores a manterem código de alta qualidade. Valorizamos todas as formas de contribuição, desde correções de bugs e novas funcionalidades até melhorias na documentação e relatórios de issues.

Este guia visa facilitar sua participação no projeto, garantindo que suas contribuições sejam eficazes e alinhadas com nossos padrões de qualidade.

---

## 📋 Pré-requisitos

Antes de começar a contribuir, certifique-se de que possui:

- **Node.js 25+** (recomendamos usar [nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm) ou [volta](https://volta.sh/))
- **Git** para controle de versão
- **Conta no GitHub** para submeter pull requests
- Conhecimento básico de **TypeScript** e **desenvolvimento de CLI**

---

## 🚀 Configuração do Ambiente de Desenvolvimento

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub (botão "Fork" no canto superior direito)

# Clone seu fork (substitua SEU-USUARIO pelo seu nome de usuário)
git clone https://github.com/SEU-USUARIO/oraculo.git
cd oraculo

# Adicione o repositório upstream como remote
git remote add upstream https://github.com/ascentusoss/oraculo.git
```

### 2. Instalação de Dependências

```bash
# Instale a versão correta do Node.js
nvm install 25 && nvm use 25

# Instale as dependências
npm install
```

### 3. Verificação da Instalação

```bash
# Compile o projeto
npm run build

# Execute os testes para garantir que tudo está funcionando
npm test

# Verifique se não há problemas de linting
npm run lint
```

### 4. Crie uma Branch para sua Contribuição

```bash
# Sempre crie uma branch a partir de main
git checkout main
git pull upstream main
git checkout -b feature/sua-contribuicao-descritiva
```

---

## 🎯 Áreas de Contribuição

### 🐛 Correção de Bugs

- Issues com label [`bug`](https://github.com/ascentusoss/oraculo/labels/bug)
- Issues com label [`good-first-issue`](https://github.com/ascentusoss/oraculo/labels/good-first-issue)
- Priorize bugs críticos e regressions

### ✨ Novas Funcionalidades

- Analistas de código adicionais
- Suporte para novas linguagens/frameworks
- Integrações com ferramentas de CI/CD
- Melhorias na interface da linha de comando
- Relatórios customizados e formatos de saída

### 📚 Documentação

- Melhorias no README e guias
- Traduções para outros idiomas
- Tutoriais e exemplos práticos
- Documentação da API
- Guias de migração

### 🧪 Testes e Qualidade

- Aumento da cobertura de testes
- Testes de integração e E2E
- Testes de performance
- Validação em diferentes plataformas (Windows/Linux/macOS)

### 🔧 Manutenção

- Atualização de dependências
- Refatoração de código
- Melhorias de performance
- Correções de segurança

---

## 📝 Processo de Contribuição

### 1. Planejamento

- **Verifique issues existentes**: Procure se o problema/feature já foi reportado
- **Crie uma issue**: Se não existir, descreva claramente o problema ou proposta
- **Aguarde feedback**: Discuta a abordagem com os mantenedores antes de investir tempo significativo

### 2. Desenvolvimento

```bash
# Mantenha sua branch atualizada
git fetch upstream
git rebase upstream/main

# Desenvolva incrementalmente
# Faça commits pequenos e descritivos
git add .
git commit -m "feat: descrição clara da mudança"
```

### 3. Testes e Qualidade

```bash
# Execute todos os testes
npm test

# Verifique cobertura
npm run coverage

# Execute linting e formatação
npm run lint
npm run format:fix

# Verifique tipos TypeScript
npm run typecheck
```

### 4. Documentação

- Atualize a documentação quando necessário
- Adicione comentários no código para lógica complexa
- Inclua exemplos de uso quando apropriado

---

## 📏 Padrões de Código

### TypeScript

- **Sem `any`**: Use tipos específicos sempre que possível
- **Interfaces explícitas**: Prefira interfaces a tipos inline para objetos complexos
- **Tipos utilitários**: Use tipos built-in como `Record<K, V>`, `Partial<T>`, etc.
- **Generics**: Use generics para código reutilizável

### Estrutura de Imports

```typescript
// 1. Imports de bibliotecas externas
import { Command } from "commander";
import chalk from "chalk";

// 2. Imports internos com aliases
import { Analisador } from "@analistas/core";
import { Logger } from "@shared/logger";

// 3. Imports de tipos
import type { Configuracao } from "@types/config";
```

### Convenções de Nomenclatura

- **Classes**: PascalCase (`AnalisadorDeCodigo`)
- **Interfaces**: PascalCase com prefixo I opcional (`IAnalisador`)
- **Funções/Métodos**: camelCase (`analisarArquivo`)
- **Constantes**: SCREAMING_SNAKE_CASE (`MAX_TENTATIVAS`)
- **Arquivos**: kebab-case (`analisador-codigo.ts`)

---

## 📝 Padrões de Commit

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/) para manter um histórico claro e automatizar releases:

```bash
# Formato básico
tipo(escopo): descrição breve

# Exemplos
feat(analistas): adiciona detector de vulnerabilidades XSS
fix(cli): corrige parsing de argumentos com espaços
docs(readme): atualiza exemplos de configuração
test(core): adiciona testes para analisador de imports
refactor(shared): simplifica lógica de validação
chore(deps): atualiza dependências para Node.js 25
```

### Tipos Permitidos

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `test`: Adição ou correção de testes
- `refactor`: Refatoração sem mudança funcional
- `chore`: Tarefas de manutenção
- `perf`: Melhorias de performance
- `ci`: Mudanças na configuração de CI
- `build`: Mudanças no sistema de build

### Regras Importantes

- Use imperativo no presente: "adiciona", não "adicionado"
- Mantenha a linha de assunto com menos de 72 caracteres
- Use corpo do commit para explicações detalhadas quando necessário
- Referencie issues: `fix: corrige bug (#123)`

---

## 🔍 Pull Request

### Antes de Submeter

- [ ] Todos os testes passam (`npm test`)
- [ ] Cobertura de testes não regrediu (`npm run coverage`)
- [ ] Código segue os padrões (`npm run lint`)
- [ ] Tipos TypeScript estão corretos (`npm run typecheck`)
- [ ] Documentação foi atualizada quando necessário
- [ ] Branch está atualizada com `upstream/main`
- [ ] Commits seguem conventional commits
- [ ] Não há logs de debug ou código comentado

### Template de PR

Use o template padrão do repositório e inclua:

- **Descrição clara** do que foi implementado
- **Motivação** da mudança
- **Como testar** a funcionalidade
- **Screenshots** se aplicável (para mudanças na UI)
- **Breaking changes** se houver

### Processo de Revisão

1. **Abertura**: PR é criado e recebe labels apropriadas
2. **Revisão**: Mantenedores analisam código, testes e documentação
3. **Feedback**: Comentários e sugestões são fornecidos
4. **Iteração**: Autor implementa mudanças solicitadas
5. **Aprovação**: PR é aprovado e mergeado
6. **Release**: Mudanças são incluídas no próximo release

---

## 🤝 Comunicação

### Canais Oficiais

- **GitHub Issues**: Para bugs, features e discussões técnicas
- **GitHub Discussions**: Para perguntas gerais e ideias
- **Pull Request Comments**: Para revisão específica de código

### Boas Práticas

- Seja respeitoso e construtivo
- Forneça contexto suficiente para suas questões
- Use português brasileiro ou inglês
- Mantenha discussões focadas no projeto

---

## 📚 Recursos Adicionais

- [Documentação Completa](docs/README.md)
- [Guia de Comandos](docs/guias/GUIA-COMANDOS.md)
- [Guia de Configuração](docs/guias/GUIA-CONFIGURACAO.md)
- [Código de Conduta](CODE_OF_CONDUCT.md)
- [Política de Segurança](SECURITY.md)
- [Arquitetura do Sistema](docs/arquitetura/)

---

## 🙏 Reconhecimento

Contribuições são essenciais para o crescimento do projeto! Reconhecemos nossos colaboradores através de:

- Lista de contribuidores no GitHub
- Menções em release notes
- Créditos especiais para contribuições significativas

---

## 📄 Licença

Ao contribuir para este projeto, você concorda que suas contribuições serão licenciadas sob a **MIT License**, conforme especificado no arquivo LICENSE deste repositório.

---

**Obrigado por contribuir para o Oráculo!**
