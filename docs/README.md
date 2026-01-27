# 📚 Documentação do Oráculo

> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).
> Última atualização: 15 de janeiro de 2026

---

## 📖 Guias para Usuários

| Documento                                            | Descrição                               |
| ---------------------------------------------------- | --------------------------------------- |
| [Guia de Início Rápido](guias/GUIA-INICIO-RAPIDO.md) | Instalação e primeiros passos           |
| [Guia de Comandos](guias/GUIA-COMANDOS.md)           | Referência completa de comandos CLI     |
| [Guia de Configuração](guias/GUIA-CONFIGURACAO.md)   | Arquivos de config, variáveis e filtros |

---

## 🏗️ Arquitetura (Para Desenvolvedores)

| Documento                                         | Descrição                              |
| ------------------------------------------------- | -------------------------------------- |
| [Type Safety](arquitetura/TYPE-SAFETY.md)         | Sistema de detecção de tipos inseguros |
| [Segurança](arquitetura/SEGURANCA.md)             | Modo seguro, proteções e robustez      |
| [Sistema de Erros](arquitetura/SISTEMA-ERROS.md)  | Stack traces e relatório de erros      |
| [Mensagens e Logs](arquitetura/MENSAGENS-LOGS.md) | Sistema centralizado de logging        |

---

## 📦 Releases e Planejamento

| Documento                                  | Descrição                                            |
| ------------------------------------------ | ---------------------------------------------------- |
| [v0.3.0 Release Notes](releases/v0.3.0.md) | Novos comandos, analistas multi-linguagem, melhorias |
| [v0.2.0 Release Notes](releases/v0.2.0.md) | Workers, Schema Versioning, Pontuação Adaptativa     |

---

## 📜 Histórico

| Documento                                             | Descrição                                |
| ----------------------------------------------------- | ---------------------------------------- |
| [Feedback Barqueiro](historico/FEEDBACK-BARQUEIRO.md) | Feedback do projeto Discord Bot          |
| [Migração Mensagens](historico/MIGRACAO-MENSAGENS.md) | Histórico da migração do sistema de logs |

---

## 🔗 Links Rápidos

- [README Principal](../README.md)
- [CHANGELOG](../CHANGELOG.md)
- [CONTRIBUTING](../CONTRIBUTING.md)
- [Código de Conduta](../CODE_OF_CONDUCT.md)

---

## 📂 Estrutura de Pastas

```
docs/
├── README.md                    # Este arquivo (índice)
├── guias/                       # Documentação para usuários
│   ├── GUIA-INICIO-RAPIDO.md   # Primeiros passos
│   ├── GUIA-COMANDOS.md        # Referência de comandos
│   └── GUIA-CONFIGURACAO.md    # Configuração completa
├── arquitetura/                 # Documentação técnica
│   ├── TYPE-SAFETY.md          # Sistema de tipos
│   ├── SEGURANCA.md            # Robustez e proteções
│   ├── SISTEMA-ERROS.md        # Stack traces
│   └── MENSAGENS-LOGS.md       # Sistema de logging
├── releases/                    # Release notes
│   ├── v0.3.0.md               # Release atual
│   └── v0.2.0.md               # Release anterior
└── historico/                   # Registros de trabalho
    ├── FEEDBACK-BARQUEIRO.md   # Feedback de uso real
    └── MIGRACAO-MENSAGENS.md   # ADR de migração
```

---

**Versão:** 0.3.5 | **Node.js:** >=25.0.0 | **Licença:** MIT
