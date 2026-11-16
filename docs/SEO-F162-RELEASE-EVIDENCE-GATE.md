# SEO F162 — gate documental para homologação operacional

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY**. Continuação das auditorias F159–F161, sem acesso à VPS ou dados de clientes.

## Propósito

Antes de uma decisão de publicação, exigir inventário privado dos seguintes nove gates:
1. revisão independente de código;
2. autenticação oficial da origem IBGE e sua edição;
3. revisão editorial municipal;
4. autorização GSC por propriedade e tenant;
5. consentimento e integração Portal/CRM;
6. segurança de staging Leaseweb;
7. teste real de backup/restauração;
8. exercício de rollback;
9. decisão humana formal de lançamento.

O motor verifica **somente completude e formato dos recibos declarados**. Não verifica assinaturas ou autenticidade desses recibos; até quando todos são fornecidos, o resultado continua `HOLD_INDEPENDENT_EVIDENCE_AUTHENTICATION` e **nunca** autoriza merge, deploy ou indexação.

## Entrada privada

JSON com `candidateSha` (40 hex) e `evidence` (lista de registros estritos com `gate`, `candidateSha`, `evidenceDigest` SHA-256, `sourceClass` e `reviewed:true`). Recibos devem apontar para a **mesma SHA candidata**. O programa recusa campos extras e relatos sintéticos como classe de origem.

O CLI `node scripts/review-release-evidence-offline.mjs /CAMINHO-PRIVADO/inventory.json` exige arquivo regular com permissão `0600` em sistemas POSIX, sem symlink e de até 64 KiB. Não publica os hashes/paths; a saída contém apenas contagens, nomes de gates pendentes e o status HOLD. O CLI termina com código não-zero **deliberadamente**, pois não implementa promoção de release.

## Próximas ações

O operador autorizado precisa obter provas independentes de IBGE/DTB, credenciais consentidas GSC por tenant, autorização de staging, relatórios de backup/restore, rollback e revisão editorial. A verificação real deve ocorrer fora deste contrato documental, com revisão humana antes de qualquer decisão GO. Nenhuma credencial, arquivo territorial bruto, identificação de cliente ou comprovante privado deve ser anexado a PR pública.
