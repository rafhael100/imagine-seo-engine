# SEO F185 — rascunho privado de redirecionamentos 301 baseado em GSC e HTML Astro real

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Resultado funcional

A F183 já prioriza a auditoria de URLs antigas com impressões e cliques. A F185 acrescenta a capacidade de **criar um inventário privado de candidatos 301 seguros**, usando apenas duas fontes mantidas pelo operador autorizado:

1. Arquivo original de linhas Search Console `page`, com domínio, datas, cliques, impressões, status de paginação e URLs (não comitado).
2. Diretório de **HTML Astro já compilado e auditado** para a origem canônica HTTPS sem `www`. As rotas de destino vêm do build real, nunca de um catálogo inventado.

`node scripts/propose-private-gsc-astro-redirects.mjs /privado/gsc-page.json /privado/comercial-dist /privado/301-candidatos.json`

A saída de terminal é exclusivamente um relatório sanitizado. A terceira entrada é o **destino de um arquivo NOVO**, escrito com permissão `0600` em diretório privado `0700`; o arquivo contém os URLs originais e, portanto, **nunca deve ser enviado ao GitHub, CI artifact, Portal público, ferramenta de analytics ou relatório visível a clientes**.

## Algoritmo conservador

- Reexecuta F131 (URLs PAGE e privacidade), F127 (origem, inventário e candidatos) e F183 (priorização) a partir das entradas originais.
- Propõe somente `301` que alterem **protocolo ou host** com **o mesmo caminho** já existente no build. Exemplo lógico: HTTP/www de uma página para seu equivalente HTTPS sem www de caminho idêntico.
- Não inventa equivalência editorial ou destino de páginas antigas `/en-us/`, `/es-es/`, páginas removidas, rotas inexistentes, caminhos codificados suspeitos ou outros subdomínios. Essas linhas permanecem em revisão manual.
- Se houver URL com query/hash privado, **nenhum manifesto é criado**, e as métricas/ordem de revisão são integralmente ocultadas.
- Se houver paginação `hasMore=true`, informa que o conjunto observado é incompleto.
- Mesmo os 301 triviais são **propostas**, não comandos executáveis de Cloudflare/Nginx; exigem inspeção de HTTP real, equivalência de conteúdo, canonical, hreflang, backups e rollback.

## Prova em CI

Os testes Node 22/24 exercitam páginas históricas, destinos inexistentes, alias linguístico, paginação, redaction global e origem adulterada. A CI F167 foi estendida para, depois de compilar o **Comercial F336 real fixado por SHA**, gerar um candidato 301 de laboratório a partir de uma linha GSC sintética, conferir a presença da homepage real e verificar a permissão privada do manifesto. O teste exige que `publicationAuthorized=false` e `liveHttpRedirectsVerified=false`.

## Separação operacional

O OpenSEO tem acesso à propriedade Imagine, mas **essa conexão não configura OAuth, MFA ou autorização multiempresa no SEO Engine**. Dados reais GSC precisam ser obtidos de forma consentida pelo operador e tratados somente no ambiente privado. A revisão de conteúdo local original, IBGE oficial, staging isolado Leaseweb, AppSec/LGPD, backup/restauração, rollback e autorização humana continuam como gates.

O CLI encerra com status de revisão pendente mesmo quando escreve um manifesto. **Nenhuma regra 301, DNS, deploy ou indexação é aplicada.**
