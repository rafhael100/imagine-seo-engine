# SEO-F21 — CI reprodutível e seguro
Os workflows de SEO Engine utilizavam `actions/checkout@v4`, `actions/setup-node@v4` e `ubuntu-latest`. Foram adotados SHAs imutáveis de checkout/setup-node v7, já validados no Imagine Comercial, mantendo Node 22/24 para compatibilidade.

O checkout não mantém credenciais de Git. O workflow tem permissões somente `contents: read`, sem `id-token` ou `pull_request_target`.

Novos testes de contrato reprovam ações mutáveis e alterações triviais que aumentem a superfície do CI. O pin de `ubuntu-24.04` fixa a imagem major, não os pacotes do runner a cada execução; homologação de produção continua separada.
