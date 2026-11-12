# Imagine SEO — RC38: handoff original GSC até o Portal

Base: [RC37 #127](https://github.com/rafhael100/imagine-seo-engine/pull/127), head `872261657d9fc9aa62a6316942709025dae5abd6`.

## Entrega adicionada

[SEO-F88 #128](https://github.com/rafhael100/imagine-seo-engine/pull/128) introduz o contrato `seo-portal-original-gsc-handoff-offline-v1`:

- As duas janelas GSC devem ser fornecidas como **linhas originais** e revalidadas pela F86: formatos, CTR, datas, arrays, campos inesperados e consultas duplicadas.
- A comparação é recalculada da mesma evidência, sem receber `trend`, `summary`, autorização ou métrica editorial pré-calculada pelo chamador.
- F87 elimina métricas e recomendações orgânicas quando qualquer consulta é redacted; ações técnicas de auditoria do site permanecem no briefing e no handoff.
- Envelopes de cliente e publicação continuam sem autorização; CPF, e-mail, URL e mensagens privadas não são emitidos.
- CLI local com arquivo regular até 10 MiB, UTF-8 estrito, sem link simbólico final nem argumento extra, diagnósticos sem dados privados.

O CI de F88 já passou em Node 22 e 24 ([#43128615485](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43128615485)). A RC38 exige uma **nova execução consolidada** para confirmar o SHA de release.

## Integrações

A revisão do Portal [Lote F #416](https://github.com/rafhael100/imagine-portal/pull/416) testa a compatibilidade de F88 com PHP 8.3/8.4 e Node 22/24 em cenário completo, redacted e autorização adulterada, utilizando o SHA da F88 `56d7fa79904903f9af0c88646a59c0fa07546594`. A integração é exclusivamente sintética; CI e revisão devem ser concluídos antes de qualquer promoção.

O Comercial [#238](https://github.com/rafhael100/imagine-comercial/pull/238) confirmou RC37 versus RC36 para auditoria estática e privacidade do handoff. Sua candidata de auditor estático permanece pinada na **RC36**, não há atualização automática para RC38.

## Gates

Esta é uma candidata de **código offline**. A RC38 não implementa login, MFA, vault OAuth, prova de propriedade, grants de tenant, controle de retenção, banco de produção ou acesso Google. Os valores `propertyFingerprint` e `sourceRevision` no escopo continuam auto-declarados, não assinam evidências.

**NO-GO** até revisão independente AppSec/LGPD/SEO/DBA, homologação autenticada em staging, rollback ensaiado e aprovação explícita de liberação. Sem merge `main/dev`, deploy, DNS/301, dados de clientes, publicação ou cobrança.
