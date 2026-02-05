> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT).

# Templates de Discussions (PT-BR)

Este diretório contém modelos (forms) sugeridos para o recurso **Discussions** do GitHub, traduzidos e adaptados para o público em Português (Brasil).

Como usar

- Os arquivos `*.yml` aqui definem formulários que aparecem quando alguém cria uma nova _discussion_.
- Cada `category` deve corresponder a uma **categoria de Discussion** existente em Settings → Discussions (crie-as se necessário):
  - `Perguntas` (Q&A)
  - `Ideias` (Ideas)
  - `Feedback`
  - `Show and tell`
  - `Geral`

Boas práticas

- Oriente os contribuidores a preencher todos os campos obrigatórios.
- Labels usadas pelos templates devem existir no repositório (ex.: `discussão`, `ideia`, `feedback`).

Personalização

- Ajuste `category` caso você use nomes diferentes.
- Edite `labels` para combinar com seu fluxo de triagem.

Validação local

- Verifique sintaxe YAML antes de abrir PRs: `yq eval . .github/ISSUE_TEMPLATE/*.yml` (instale `yq`).

Se quiser, eu abro um PR com esses arquivos, adiciono/atualizo as categorias no repositório (instruções) e crio labels recomendadas.
