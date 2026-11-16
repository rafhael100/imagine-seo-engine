# SEO F163 — proteção contra permissões YAML compactas

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Endurece a auditoria F161, preservando a revisão dos workflows reais.

## Problema resolvido
Uma auditoria baseada apenas nas formas YAML expandidas pode ignorar eventos privilegiados como `on: [pull_request_target]`, permissões como `permissions: {contents: write}` e workflows que omitam por completo a definição explícita de permissões.

## Alterações
- Inspeção adicional de eventos privilegiados em lista YAML compacta.
- Detecção de permissões `write` em mapas inline.
- Sinalização de workflows sem declaração explícita de `permissions` (sem presumir configuração padrão segura).
- Suporte a referências `uses` com aspas, mantendo exigência do hash imutável de actions de terceiros.
- Testes adversariais garantem bloqueio e evitam aprovação automática.

## Limitações
Trata-se de verificação estática conservadora, não de parser YAML completo ou revisão de segurança independente. O gate continua HOLD até análise de comportamentos shell, workflows de terceiros, segredos, CI e ambiente operacional. O resultado não concede GO de merge ou deploy.
