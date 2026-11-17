# SEO F208 — auditor atual sobre Comercial F354, de Astro a Nginx

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Por que esta integração existe

O Comercial evoluiu da F348 para a [F354 #443](https://github.com/rafhael100/imagine-comercial/pull/443): o resumo anônimo passou a mostrar os serviços selecionados antes do contato, com conteúdo inicial renderizado no HTML e atualização pelo navegador em PT/EN/ES. As integrações históricas do Engine continuavam corretamente fixadas na F348. Elas não comprovavam o comportamento do novo build com as correções mais recentes do auditor.

A F208 acrescenta uma prova sobre **fontes e builds reais**, sem substituir as SHAs ou os resultados históricos:

| Fonte | SHA imutável |
| --- | --- |
| Comercial F348, referência anterior | `5ec2f92fd0b16b8ef4ea2d582cfbb69c0cd15444` |
| Comercial F354, candidata examinada | `9a91afe119fbc5166e9ae94b3e85496e393c38db` |

## Aceitação em Node 22 e 24

O workflow `seo-f208-comercial-f354-ci.yml` compila os dois checkouts independentes, confere suas revisões Git e aplica o auditor atual do Engine à F354 com `--fail-on-warnings --strict-public-head --multilingual --check-hreflang`. Além dessa auditoria, a comparação existente cobre canonical, indexação, sitemap, robots, idiomas, hreflang e inventário de rotas entre as duas versões, sem autorizar publicação.

O novo verificador lê o HTML realmente compilado para `/`, `/en/` e `/es/`. Exige uma lista inicial de serviços com exatamente o Onepage, no idioma correspondente, antes de executar JavaScript. Confere também que a informação sobre a indisponibilidade do checkout público permanece no HTML. Na referência F348, a lista nova ainda não deve existir.

Nove controles negativos alteram apenas strings em memória, removendo a lista, trocando o serviço ou duplicando a lista em cada idioma. Todas essas alterações devem ser recusadas. A inversão dos checkouts também deve falhar pela identidade Git. Os arquivos compilados permanecem intactos.

O workflow executa os contratos e o Chromium nativos da própria F354, incluindo alteração e remoção de serviços no resumo. A CI nativa anterior do Comercial, sozinha, não substitui esta prova com o auditor atual: aquela versão do workflow ainda fixava o Engine na F103.

## Mesmo build servido por Nginx

O runner F197 foi extraído para uma função reutilizável que só recebe o diretório do build e a SHA esperada. Sua interface CLI anterior continua fixada na F348 e conserva seu contrato de relatório. A F208 usa um wrapper com a SHA F354 fixa e um contrato separado.

As condições `CI=true`, `GITHUB_ACTIONS=true`, `APP_ENV=testing` e os opt-ins já existentes continuam obrigatórias. A função não permite configurar imagem, destino de rede, mounts, limites ou credenciais. Confere a revisão Git antes de iniciar Docker, usa a mesma imagem Nginx por digest, rede isolada, porta em `127.0.0.1`, mounts somente leitura e limpeza em `finally`.

Sobre o mesmo `dist` F354 auditado, a prova exige duas respostas HEAD 301, três corpos HTML idênticos aos arquivos compilados, identificação do build e correspondência integral de `robots.txt` e `sitemap.xml`. O relatório apresenta somente indicadores e contagens fixos. Nenhum dado de cliente ou export GSC real participa do ensaio.

## Verificação local desta implementação

Os dois builds reais foram compilados localmente a partir das SHAs acima. O verificador confirmou três idiomas e recusou as nove mutações e os checkouts invertidos. Com as correções F206/F209 do auditor, a candidata F354 passou a auditoria estrita de **63 páginas públicas, zero erros e zero avisos**; a comparação F348→F354 encontrou **zero rotas adicionadas ou removidas**, também sem erros ou avisos nas duas versões. O build inclui ainda a página 404, que não integra esse inventário público indexável.

A análise do novo workflow confirmou quatro referências de Actions fixadas por SHA e nenhum apontamento de supply chain. A reutilização do runner recusou ausência dos opt-ins e uma revisão que não fosse SHA antes de iniciar Docker. Nginx e Chromium sobre a candidata ficam condicionados ao resultado da CI; estes números locais não os declaram executados.

## Limites operacionais

Os resultados continuam condicionados à conclusão da CI da SHA entregue. Esta integração não conecta OAuth, não concede autorização por tenant, não habilita contratação, não testa TLS público e não modifica a Leaseweb. GSC próprio no Portal, revisão de URLs legadas e equivalência editorial, homologação privada, backup/restauração/rollback e decisão humana permanecem requisitos separados.

As provas históricas F194/F197 permanecem disponíveis para as revisões originais. Promover o pin do auditor no repositório Comercial é uma alteração independente, com sua própria PR e CI; esta documentação não declara essa promoção concluída.
