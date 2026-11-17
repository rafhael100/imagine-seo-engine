# Imagine SEO RC75 — Nginx real F348 e dois modos de isolamento Docker

**CANDIDATA DRAFT / NO-GO / NO-MERGE / NO-DEPLOY / NO-DNS / NO-INDEX.**

## Base consolidada verificada

A [RC74 #295](https://github.com/rafhael100/imagine-seo-engine/pull/295), SHA `a8551a2adf58c2257e190c4f0b30dca4c01e4d9d`, concluiu **65/65 workflows SUCCESS**. Ela mantém:
- cadastro territorial IBGE DTB/Áreas 2025 auditado, bloqueios editoriais por município e gates de originalidade;
- GSC PAGE/SEO com dados privados e autorização tenant em HOLD, proteção contra export incompleto e escrita sob Git;
- F186/F187 e versões Comercial F336/F344/F346/F348, Chromium PT/EN/ES, canonical/hreflang/robots e avisos de checkout público não disponível;
- segurança de Nginx, Compose e inventário Docker privados, diffs cumulativos com exclusões/renomeações, revisão de runtime e rollback em laboratórios.

## Novas entregas sobre esta candidata

- [F197 #296](https://github.com/rafhael100/imagine-seo-engine/pull/296) — aprovada **2/2 workflows**: compile Comercial **F348 SHA `5ec2f92fd0b16b8ef4ea2d582cfbb69c0cd15444`** real; aplica a geração privada F145/F149 de Nginx e Docker Compose com runtime F151; inicia Nginx real em runner CI com uma porta publicada **somente em 127.0.0.1**; confere com F143 2 HTTP HEAD 301 e 3 GET HTML **idênticos byte a byte** ao build Astro PT/EN/ES. Os GSC PAGE de laboratório continuam **sintéticos**, sem OAuth/cliente.
- [F198 #297](https://github.com/rafhael100/imagine-seo-engine/pull/297) — aprovada **2/2 workflows**: complemento Docker `internal:true` sem **nenhuma porta publicada**. O daemon cria rede bridge privada, sem attachability/IPv6, de um único Nginx. `docker network inspect` e `docker inspect` verificam estado real; `docker exec wget` lê os três HTMLs do mesmo F348 e compara os bytes locais. Nenhum dado de rede/IP/ID é divulgado.

## Compatibilidade descoberta e preservação do contrato de segurança

O primeiro ensaio F198 mostrou que Docker `internal:true` **não preserva a publicação da porta loopback no host**: `NetworkSettings.Ports` não forneceu binding e a prova HEAD por `127.0.0.1` falhou. **Não foi removido o gate F151.** O F149 original e as provas F150/F197 foram restaurados para a forma já aprovada; o isolamento interno tornou-se um **segundo modo sem porta publicada**, com validador próprio. As duas modalidades têm finalidades diferentes e não se substituem.

| Revisão | Modo | Rede | Acesso | Evidência |
|---|---|---|---|---|
| F197 | Teste HTTP local | Bridge privada nomeada | 1 porta host 127.0.0.1 | HEAD 301, GET HTML 3 línguas, F151 |
| F198 | Teste sem publicação | Bridge `internal:true` | 0 portas host | Docker inspect + GET dentro do Nginx |

A execução real F198 demonstrou a rede interna no Docker do **runner**, mas **não** mediu pacotes de saída, firewall ou TLS de produção.

## Gate CI da RC75

Executar a suíte cumulativa **na própria HEAD desta PR**, sem usar apenas as 2/2 CIs dos recortes. Exigir todos os workflows concluídos com SUCCESS: F149/F150/F151/F152, F197/F198, F186/F187 HTTP, F190/F192/F195 navegador e builds, IBGE oficial, F183/F185/F193 privacidade, F188 diff e F189/F194/F196 arquivos privados. Se houver falha ou workflow pendente, HOLD.

## Bloqueadores operacionais de release

- **OAuth GSC por tenant** no backend Portal/Engine com `webmasters.readonly`, MFA, consentimento, cofre, escopos, propriedade exata, revogação e auditoria. Portal F418/F117 continuam apenas laboratórios; OpenSEO é conexão externa separada.
- Revisão independente AppSec/DBA/LGPD de identidade, redirecionamentos, dados privados, supply chain e diffs cumulativos; revisões editoriais, serviços locais comprovados e fontes originais.
- **Staging Leaseweb autorizado** com inventário real e atualizado, isolamento CRM, TLS, firewall, backups, restauração, rollback e resposta HTTP 301/canonical/hreflang efetivamente observados.
- Decisão humana GO separada por merge, deploy, alteração DNS, indexação e cobrança.

**Nenhum merge, deploy, DNS, publicação, gasto com fornecedor, Google API de cliente ou alteração VPS foi executado nesta RC75.**
