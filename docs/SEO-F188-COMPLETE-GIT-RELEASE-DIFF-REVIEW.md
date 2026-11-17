# SEO F188 — inventário cumulativo de release com exclusões e renomeações

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Falha identificada na F160

O script de inventário cumulativo F160 usava `git diff --name-only --diff-filter=ACMRT`. Este filtro **omite arquivos apagados (D)** e, quando o Git detecta uma renomeação, inclui apenas o **novo caminho**. Isso é uma lacuna para uma revisão independente: a remoção de um arquivo de autenticação, política de CI, rollback ou infraestrutura poderia não aparecer no inventário de caminhos críticos.

## Correção F188

A F188 preserva o classificador da F160 e substitui a coleta por `git diff --name-status -z --find-renames=50% --diff-filter=ACDMRT <SHA-base> HEAD`. O novo parser:
- Processa entradas com NUL, nomes UTF-8 válidos e status Git permitidos;
- Inclui **todos os arquivos removidos** e **ambos os nomes** de renomeações e cópias;
- Rejeita entradas truncadas, status inesperados, diretórios ascendentes, barras invertidas, nomes absolutos e metadados inseguros;
- Retém compatibilidade com os campos de resumo F160, acrescentando contagens por adição, deleção, modificação, renomeação, cópia e mudança de tipo;
- Classifica os caminhos em CI/cadeia de suprimentos, identidade/segurança, infraestrutura, território/editorial, integração, testes, documentação e outros;
- **Não publica nomes de arquivos** no relatório do console: apenas contagens e flags `HOLD`.

Os testes incluem um repositório Git temporário REAL em que um workflow de deploy é **apagado** e um arquivo de identidade é **renomeado**, comprovando que os três caminhos ficam no inventário de alto risco. O workflow F160 existente foi atualizado para executar os testes F160/F188 e a análise cumulativa da HEAD.

## Limites de confiança

A saída de uma auditoria de nomes e contagens **não inspeciona o conteúdo de cada alteração, histórico de commits, segredos ou integridade de identidades**. É uma fila de risco para revisão independente, não substitui AppSec/DBA/LGPD, verificação de branch protections ou homologação Leaseweb. A base SHA é explicitamente fixada e deve continuar ancestral do checkout; uma mudança de branch-base exige nova revisão e execução.

A [RC70 #280](https://github.com/rafhael100/imagine-seo-engine/pull/280) mantém o resultado de engenharia GSC→301→HTTP loopback→Astro real, e a F188 impede que o inventário do seu diff cumulativo ignore exclusões ou origens renomeadas. Nenhum merge, deploy, credencial, Google API ou DNS é acionado.
