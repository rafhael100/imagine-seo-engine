# Imagine SEO RC79 — auditor e consumo pelo Comercial

## Objetivo desta candidata

A RC79 continua a RC78, preservando o auditor offline e as verificações HTTP
restritas ao laboratório. Ela fecha três omissões de indexação reproduzidas
e valida a evolução F348 → F354 do site comercial com o código atual.

| Entrega | Resultado |
| --- | --- |
| [F206 #309](https://github.com/rafhael100/imagine-seo-engine/pull/309) | Textos literais não encerram prematuramente a leitura de HEAD/BODY. |
| [F207 #310](https://github.com/rafhael100/imagine-seo-engine/pull/310) | Cabeçalhos HTTP restritivos bloqueiam a revisão mesmo quando o HTML é idêntico. |
| [F209 #311](https://github.com/rafhael100/imagine-seo-engine/pull/311) | Diretivas robots no BODY e marcadores privados entram na auditoria. |
| [F208](SEO-F208-COMERCIAL-F354-PARITY.md) | Auditor atual, SSR PT/EN/ES, rotas e laboratório Nginx/Chromium sobre o Comercial F354. |

## Evidência reproduzível

A suíte local cumulativa em Node 24.22.1 aprovou **935/935 testes**, com zero
falhas, cancelamentos ou testes ignorados. São **54 testes novos** sobre a
RC78: dez da F206, vinte da F207 e vinte e quatro da F209. As regressões foram
executadas antes das correções, demonstrando as omissões; os registros e o
escopo de cada reprodução estão nos documentos das entregas.

Os builds reais independentes do Comercial são:

- F348: `5ec2f92fd0b16b8ef4ea2d582cfbb69c0cd15444`.
- F354: `9a91afe119fbc5166e9ae94b3e85496e393c38db`.

Cada build gera 64 páginas incluindo a 404. A F354 passou pelo auditor atual
em modo estrito com **63 páginas públicas, zero erros e zero avisos**. A
comparação não encontrou rotas adicionadas, removidas ou sem correspondência.
As três listas iniciais de serviços foram conferidas no HTML renderizado, e
nove alterações em memória foram recusadas. A inversão das revisões Git é
recusada antes de validar a candidata.

O workflow F208 exige, em Node 22 e 24, a mesma auditoria, os contratos nativos
do Comercial, Nginx real isolado e Chromium. Resultados de CI somente valem
para a SHA efetivamente executada; a PR da candidata registra os links e o
resultado final. Uma revisão de código por outro agente não substitui o GO
humano nem comprova operação em produção.

## Uso do auditor no Comercial

O workflow principal do Comercial F354 ainda partia do auditor F103, SHA
`0d849f0b30813da1a64cbb50748138765f144151`. A promoção deve fixar uma SHA
imutável da candidata validada e atualizar as duas expectativas de pin
existentes nos testes do Comercial. O consumidor executa a suíte do Engine e
a auditoria do próprio build, mantendo as quatro opções estritas:

```sh
node .qa/seo-engine/scripts/audit-dist.mjs dist https://imaginecomunicacao.com.br/ --fail-on-warnings --strict-public-head --multilingual --check-hreflang
```

A PR dessa promoção preserva a referência histórica e não altera páginas,
preços, autenticação, Portal ou infraestrutura. Sua CI é a comprovação do
consumo real do auditor atualizado; a prova F208 é uma verificação adicional
entre fontes e builds identificados.

## Limites de liberação

A [conexão GSC do OpenSEO](https://github.com/rafhael100/imagine-seo-engine/issues/14#issuecomment-6921270517)
é independente da [conexão própria do Portal/Engine](https://github.com/rafhael100/imagine-portal/issues/810).
Permanecem necessários identidade/MFA, consentimento por empresa/propriedade,
callback HTTPS, credenciais em cofre e validação real de troca, renovação e
revogação OAuth. Dados ou tokens de outra aplicação não são transferidos.

Também permanecem a homologação privada com TLS/301, isolamento,
backup/restauração/rollback e as revisões operacionais e editoriais previstas
na [issue #190](https://github.com/rafhael100/imagine-seo-engine/issues/190).
A consulta HTTPS oficial IBGE tem workflow condicional próprio; aprovação de
seus testes offline ou de fontes DTB/Áreas não comprova execução dessa consulta.
O resultado desse passo deve ser identificado separadamente na PR de release.

O parser HTML é lexical e limitado; exige seções explícitas e não reconstrói
todo o DOM nem executa JavaScript. As verificações HTTP não prometem indexação,
ranking, tráfego ou identidade TLS pública. Esta candidata permanece
**DRAFT / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX**.
