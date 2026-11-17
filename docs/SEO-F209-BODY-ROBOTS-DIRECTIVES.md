# SEO F209 — diretivas de indexação no BODY

## Problema e fonte

O auditor consultava `robots` e `googlebot` somente no HEAD. Uma página com
HEAD público correto e `<meta name="googlebot" content="noindex">` efetiva
no BODY podia receber aprovação indevida.

A [documentação oficial do Google sobre robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
confirma que o Google também respeita essas metas no BODY e combina as
restrições aplicáveis. A F209 incorpora essa observação ao auditor offline;
não representa consulta ao Google ou comprovação de indexação real.

## Comportamento

- Metas efetivas `robots` e `googlebot` no BODY participam das verificações
  existentes de `noindex`, `none` e `nofollow`, em modo comum e estrito.
- Uma declaração permissiva não apaga uma restrição encontrada no HEAD ou
  em outra meta. Os diagnósticos existentes de indexação são reutilizados.
- O marcador privado `imagine:editorial-preview` também bloqueia uma build
  pública quando aparece no BODY.
- O percurso lexical e o leitor de atributos da F205 continuam protegendo
  contra atributos duplicados e codificações críticas não suportadas.
  A ambiguidade de uma meta candidata no BODY produz apenas o diagnóstico
  sanitizado `ambiguous_body_robots_meta`, com revisão de indexação de alta
  prioridade no resumo. Um nome com codificação não interpretável, ou uma
  meta inválida antes de seu nome ser lido, exige revisão conservadora.
- Comentários, templates, scripts, estilos, RCDATA e pseudo-metas dentro de
  atributos entre aspas não constituem novas diretivas.
- Descrição, canonical, Open Graph e a meta robots exigida pelo modo estrito
  continuam dependendo do HEAD. Metadados no BODY não suprem essas faltas.

Não há inferência de DOM, execução de JavaScript ou cobertura geral de todas
as diretivas possíveis. Os limites de bytes, tokens e achados são preservados.

## Validação

`tests/body-robots-directives.test.mjs` acrescenta 24 testes. Antes da
correção, Node 24 registrou **10 aprovados e 14 falhas esperadas**. Após a
correção, a execução conjunta F205/F206/F209 aprovou **58/58 testes**, sem
falhas, cancelamentos ou testes ignorados:

```sh
node --test tests/body-robots-directives.test.mjs tests/head-document-boundaries.test.mjs tests/head-metadata-ambiguity.test.mjs
```

Os controles abrangem diretivas inertes, preservação dos requisitos de HEAD,
restrições nas duas regiões e ausência de conteúdo privado no resumo.
Também passaram **112/112 testes existentes** de auditoria estática, resumo
executivo e detecção de vazamento de prévias editoriais privadas.
Validação cumulativa Node 22/24 e CI permanecem necessárias na SHA da PR.

Sem merge, implantação, alteração de DNS/VPS ou consulta GSC nesta entrega.
