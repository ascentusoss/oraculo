> Proveniência e Autoria
>
> Este documento integra o projeto Oráculo (licença MIT).
> Nada aqui implica cessão de direitos morais/autorais.
> Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos.
> Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.

# Política de Segurança

A segurança é uma prioridade máxima para o projeto Oráculo. Valorizamos a comunidade de usuários e colaboradores que ajudam a identificar e corrigir vulnerabilidades. Este documento descreve como reportar vulnerabilidades de segurança de forma responsável.

## Relatando Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança no Oráculo, por favor, reporte-a de forma privada para evitar exposição pública antes da correção. Não crie issues públicas ou divulgue detalhes da vulnerabilidade.

### Métodos de Relato:

- **GitHub Security Advisories**: Use o [formulário de advisories do GitHub](https://github.com/ascentusoss/oraculo/security/advisories/new) para relatar vulnerabilidades de forma privada.
- **Issues Privadas**: Abra uma issue no repositório com o rótulo `security` e marque como privada, se possível. Evite incluir detalhes sensíveis no título ou descrição inicial.
- **E-mail**: Contate o mantenedor diretamente via e-mail (consulte o perfil do GitHub de [](https://github.com/ascentusoss) para obter o e-mail).

Forneça o máximo de detalhes possível, incluindo:

- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Versão afetada

## Política de Divulgação Responsável

- **Correção Prioritária**: Trabalharemos para corrigir a vulnerabilidade o mais rápido possível.
- **Divulgação**: Após a correção, divulgaremos publicamente a vulnerabilidade com detalhes, atribuindo crédito ao relator (se desejado).
- **Não Divulgue Antes**: Não divulgue a vulnerabilidade publicamente até que uma correção seja lançada e confirmada.

## Versões Suportadas

Apenas a versão mais recente e as versões ativas de manutenção recebem correções de segurança. Verifique o [CHANGELOG.md](CHANGELOG.md) para informações sobre versões suportadas.

## Boas Práticas de Segurança

- Não inclua segredos em código, histórico de git, issues ou PRs.
- Use `npm run security:deps` para verificar dependências vulneráveis.
- Acompanhe alertas de segurança no GitHub.
- Execute lint de segurança com `npm run security:lint`.

## Contato

Para questões relacionadas à segurança, entre em contato:

- **Mantenedor**: Italo C Lopes ([](https://github.com/ascentusoss))
- **Repositório**: [https://github.com/ascentusoss/oraculo](https://github.com/ascentusoss/oraculo)

Obrigado por ajudar a manter o Oráculo seguro!
